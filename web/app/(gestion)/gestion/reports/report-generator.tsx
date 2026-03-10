'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getMonthlyReportData } from './actions'
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
        if (selectedUserIds.length === filteredEmployees.length) {
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

            for (const userId of selectedUserIds) {
                const empName = employees.find(e => e.id === userId)?.full_name || 'Empleado'
                setStatusText(`Generando ${count + 1}/${total}: ${empName}`)

                const res = await getMonthlyReportData(userId, month, year)

                if (res.error) {
                    console.error(`Error generating for ${userId}: ${res.error}`)
                    folder?.file(`ERROR_${empName}.txt`, `Error: ${res.error}`)
                } else {
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
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="text-lg font-semibold">1. Seleccionar Mes</Label>
                    <Input type="month" value={monthYear} onChange={(e) => setMonthYear(e.target.value)} disabled={loading} />
                </div>

                <div className="space-y-2">
                    <Label className="text-lg font-semibold">2. Seleccionar Empleados ({selectedUserIds.length})</Label>

                    {isAdmin ? (
                        <div className="border rounded-md p-2 space-y-2">
                            <div className="flex flex-col gap-2 mb-2">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Buscar por nombre..."
                                            className="pl-8 h-9"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            disabled={loading}
                                        />
                                    </div>
                                    <Button variant="outline" size="sm" onClick={selectAll} disabled={loading}>
                                        {selectedUserIds.length === filteredEmployees.length && filteredEmployees.length > 0 ? 'Desmarcar' : 'Todos'}
                                    </Button>
                                </div>
                                <Select value={deptFilter} onValueChange={setDeptFilter} disabled={loading}>
                                    <SelectTrigger className="h-9 text-black">
                                        <SelectValue placeholder="Filtrar por departamento" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los departamentos</SelectItem>
                                        {departments.map(d => (
                                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <ScrollArea className="h-[300px] w-full border rounded-md p-2">
                                {filteredEmployees.length === 0 ? (
                                    <div className="text-center text-gray-400 py-4">No se encontraron empleados.</div>
                                ) : (
                                    <div className="space-y-1">
                                        {filteredEmployees.map(emp => (
                                            <div key={emp.id} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded">
                                                <Checkbox
                                                    id={emp.id}
                                                    checked={selectedUserIds.includes(emp.id)}
                                                    onCheckedChange={() => toggleUser(emp.id)}
                                                    disabled={loading}
                                                />
                                                <Label
                                                    htmlFor={emp.id}
                                                    className="text-sm cursor-pointer flex-1"
                                                >
                                                    {emp.full_name}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    ) : (
                        <div className="p-4 border rounded-md bg-gray-50">
                            <p className="text-sm text-gray-600">
                                Como empleado, solo puedes descargar tu propio informe.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-4 border-t">
                {loading && (
                    <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                            <span>{statusText}</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease' }}></div>
                        </div>
                    </div>
                )}

                <Button
                    onClick={handleGenerate}
                    disabled={loading || selectedUserIds.length === 0}
                    className="w-full h-12 text-lg"
                >
                    {loading ? 'Procesando...' : (selectedUserIds.length > 1 ? `Descargar ZIP (${selectedUserIds.length} informes)` : 'Descargar informe PDF')}
                </Button>
            </div>
        </div>
    )
}
