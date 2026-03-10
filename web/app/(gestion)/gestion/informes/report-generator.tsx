'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getMonthlyReportData } from './actions'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { Search } from "lucide-react"
import { generatePDF } from '@/lib/pdf-generator'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function ReportGenerator({
    employees,
    departments = [],
    currentUserId,
    isAdmin
}: {
    employees: any[],
    departments?: any[],
    currentUserId: string,
    isAdmin: boolean
}) {
    // State for selection
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>(isAdmin ? [] : [currentUserId])
    const [monthYear, setMonthYear] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState(0) // 0 to 100
    const [statusText, setStatusText] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [deptFilter, setDeptFilter] = useState('all')

    // Filter employees for search and department
    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = emp.full_name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesDept = deptFilter === 'all' || emp.department_id === deptFilter
        return matchesSearch && matchesDept
    })

    // Toggle Selection
    function toggleUser(id: string) {
        if (selectedUserIds.includes(id)) {
            setSelectedUserIds(selectedUserIds.filter(uid => uid !== id))
        } else {
            setSelectedUserIds([...selectedUserIds, id])
        }
    }

    function selectAll() {
        if (selectedUserIds.length === filteredEmployees.length && filteredEmployees.length > 0) {
            setSelectedUserIds([])
        } else {
            setSelectedUserIds(filteredEmployees.map(e => e.id))
        }
    }

    async function handleGenerate() {
        if (selectedUserIds.length === 0) return
        setLoading(true)
        setProgress(0)
        setStatusText('Iniciando...')

        const [yearStr, monthStr] = monthYear.split('-')
        const year = parseInt(yearStr)
        const month = parseInt(monthStr)

        try {
            const zip = new JSZip()
            const folderName = `Informes_${year}_${month}`
            const folder = zip.folder(folderName)

            let count = 0
            const total = selectedUserIds.length

            // We iterate strictly sequentially to avoid blasting the server
            for (const userId of selectedUserIds) {
                const empName = employees.find(e => e.id === userId)?.full_name || 'Empleado'
                setStatusText(`Generando ${count + 1}/${total}: ${empName}`)

                // Fetch Data
                const res = await getMonthlyReportData(userId, month, year)

                if (res.error) {
                    console.error(`Error generating for ${userId}: ${res.error}`)
                    folder?.file(`ERROR_${empName}.txt`, `Error: ${res.error}`)
                } else {
                    // Generate PDF using shared generator
                    const doc = generatePDF(res.company, res.employee, res.entries || [], month, year)
                    const pdfBlob = doc.output('blob')
                    const filename = `Registro_${empName.replace(/[^a-z0-9]/gi, '_')}_${month}_${year}.pdf`
                    folder?.file(filename, pdfBlob)
                }

                count++
                setProgress(Math.round((count / total) * 100))
            }

            setStatusText('Comprimiendo ZIP...')
            const zipBlob = await zip.generateAsync({ type: 'blob' })
            saveAs(zipBlob, `${folderName}.zip`)

            setStatusText('¡Completado!')
        } catch (err) {
            console.error(err)
            alert("Ocurrió un error general durante la exportación.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Config Sidebar */}
            <div className="lg:col-span-4 space-y-8">
                <div className="bg-white rounded-lg border border-slate-100 shadow-xl shadow-slate-900/5 space-y-0 transition-all overflow-hidden">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="h-6 w-1 bg-[#3b60c1] rounded-lg"></div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Configuración</h3>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        <div className="space-y-6">
                            <div className="grid gap-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Seleccionar Mes</Label>
                                <Input
                                    type="month"
                                    value={monthYear}
                                    onChange={(e) => setMonthYear(e.target.value)}
                                    disabled={loading}
                                    className="h-12 bg-slate-50 border-slate-100 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 focus:border-[#3b60c1] transition-all shadow-sm"
                                />
                            </div>

                            <div className="p-6 bg-blue-50/50 rounded-lg border border-blue-100/50">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#3b60c1] mb-2">Resumen de Generación</h4>
                                <div className="flex items-baseline justify-between">
                                    <span className="text-sm font-bold text-slate-600">Total Seleccionado:</span>
                                    <span className="text-2xl font-black text-slate-900 tracking-tighter">{selectedUserIds.length}</span>
                                </div>
                                <p className="text-[10px] font-medium text-slate-400 mt-2 leading-relaxed uppercase tracking-wider">
                                    Se generará un ZIP con carpetas individuales auditadas para cada empleado seleccionado.
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 space-y-6">
                            {loading && (
                                <div className="space-y-4 p-5 bg-slate-50 rounded-lg border border-slate-100 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-[#3b60c1] truncate mr-4">{statusText}</span>
                                        <span className="text-slate-900 tabular-nums">{progress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden shadow-inner">
                                        <div className="bg-primary h-full rounded-full transition-all duration-500 ease-out shadow-lg shadow-primary/20" style={{ width: `${progress}%` }}></div>
                                    </div>
                                </div>
                            )}

                            <Button
                                onClick={handleGenerate}
                                disabled={loading || selectedUserIds.length === 0}
                                className="w-full h-12 bg-primary hover:bg-[#2d4a94] text-white rounded-lg font-bold uppercase tracking-widest text-xs shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-3">
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Generando...
                                    </div>
                                ) : (
                                    <>
                                        <span>Descargar {selectedUserIds.length > 1 ? 'ZIP (Lote)' : 'Informe PDF'}</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Employee Selection Area */}
            <div className="lg:col-span-8 space-y-8">
                <div className="bg-white rounded-lg border border-slate-100 shadow-2xl shadow-slate-900/5 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-3">
                                <div className="h-6 w-1 bg-amber-500 rounded-lg"></div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Selección de Plantilla</h3>
                            </div>
                            {isAdmin && (
                                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <span>Acción en Lote:</span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={selectAll}
                                        disabled={loading}
                                        className={`h-10 px-6 rounded-lg font-black uppercase tracking-widest text-[9px] transition-all shadow-sm active:scale-95 flex items-center gap-2 ${selectedUserIds.length === filteredEmployees.length && filteredEmployees.length > 0
                                            ? 'bg-[#3b60c1] border-[#3b60c1] text-white hover:bg-[#2d4a94] shadow-blue-200'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-[#3b60c1] hover:text-[#3b60c1]'
                                            }`}
                                    >
                                        <div className={`h-2 w-2 rounded-full ${selectedUserIds.length === filteredEmployees.length && filteredEmployees.length > 0 ? 'bg-white animate-pulse' : 'bg-slate-200'}`}></div>
                                        {selectedUserIds.length === filteredEmployees.length && filteredEmployees.length > 0 ? 'Deseleccionar Todo' : 'Seleccionar Todos'}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {isAdmin && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                                <div className="grid gap-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Filtro de Nombre</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            placeholder="Buscar empleado..."
                                            className="pl-10 h-12 bg-white border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 focus:border-[#3b60c1] transition-all shadow-sm"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Departamento</Label>
                                    <Select value={deptFilter} onValueChange={setDeptFilter} disabled={loading}>
                                        <SelectTrigger className="h-12 bg-white border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-[#3b60c1]/20 focus:border-[#3b60c1] shadow-sm text-slate-900 flex items-center">
                                            <SelectValue placeholder="Departamento" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg border-slate-100 shadow-xl">
                                            <SelectItem value="all" className="font-bold">Todos los dptos.</SelectItem>
                                            {departments.map(d => (
                                                <SelectItem key={d.id} value={d.id} className="font-bold">{d.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </div>

                    <ScrollArea className="h-[500px] w-full bg-white">
                        {isAdmin ? (
                            <div className="divide-y divide-slate-50">
                                {filteredEmployees.length === 0 ? (
                                    <div className="p-32 text-center">
                                        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 mb-6 mx-auto">
                                            <Search className="h-8 w-8 text-slate-300" />
                                        </div>
                                        <p className="text-slate-400 font-black uppercase tracking-widest text-[11px]">No se encontraron resultados</p>
                                    </div>
                                ) : (
                                    filteredEmployees.map(emp => (
                                        <div
                                            key={emp.id}
                                            className={`flex items-center justify-between p-7 transition-all group hover:bg-blue-50/40 cursor-pointer ${selectedUserIds.includes(emp.id) ? 'bg-blue-50/20' : ''}`}
                                            onClick={() => !loading && toggleUser(emp.id)}
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className={`h-6 w-6 rounded-lg border-2 transition-all flex items-center justify-center ${selectedUserIds.includes(emp.id) ? 'bg-[#3b60c1] border-[#3b60c1] shadow-lg shadow-blue-200' : 'bg-white border-slate-200'}`}>
                                                    {selectedUserIds.includes(emp.id) && <div className="h-2 w-2 bg-white rounded-full animate-in zoom-in-50 duration-200" />}
                                                </div>
                                                <div className="grid gap-1">
                                                    <span className="text-[15px] font-black text-slate-900 tracking-tight group-hover:text-[#3b60c1] transition-colors uppercase">{emp.full_name}</span>
                                                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 group-hover:text-slate-500 transition-colors">
                                                        Empleado ID: {emp.id.split('-')[0]}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 pr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-[#3b60c1] bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                                                    {selectedUserIds.includes(emp.id) ? 'Seleccionado' : 'Seleccionar'}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="p-32 text-center">
                                <div className="p-10 bg-slate-50 rounded-lg border border-slate-100 max-w-sm mx-auto shadow-inner">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Restricción de Acceso</p>
                                    <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                                        Solo puedes descargar tu propio registro mensual obligatorio en cumplimiento con la normativa actual.
                                    </p>
                                </div>
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </div>
        </div>
    )
}
