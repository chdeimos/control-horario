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
import { format } from 'date-fns'

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

            // We iterate strictly sequentially to avoid blasting the server
            for (const userId of selectedUserIds) {
                const empName = employees.find(e => e.id === userId)?.full_name || 'Empleado'
                setStatusText(`Generando ${count + 1}/${total}: ${empName}`)

                // Fetch Data
                const res = await getMonthlyReportData(userId, month, year)

                if (res.error) {
                    console.error(`Error generating for ${userId}: ${res.error}`)
                    // Add error note to zip? or skip? 
                    // Let's create a txt file with error log
                    folder?.file(`ERROR_${empName}.txt`, `Error: ${res.error}`)
                } else {
                    // Generate PDF Blob
                    const pdfBlob = generatePDFBlob(res.company, res.employee, res.entries || [], month, year)
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

    function generatePDFBlob(company: any, employee: any, entries: any[], month: number, year: number): Blob {
        const doc = new jsPDF()

        // Header
        doc.setFontSize(18)
        doc.text("Registro de Jornada Mensual", 105, 15, { align: "center" })

        doc.setFontSize(10)
        doc.text(`Empresa: ${company.name}`, 14, 30)
        doc.text(`CIF: ${company.cif}`, 14, 35)

        doc.text(`Trabajador: ${employee.full_name}`, 14, 45)
        doc.text(`NIF: ${employee.nif || '(Sin NIF)'}`, 14, 50)
        doc.text(`Mes: ${month}/${year}`, 150, 45)

        // Process Entries
        const dailyRecords: Record<string, { start: string, end: string, total: number }> = {}
        const daysInMonth = new Date(year, month, 0).getDate()

        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`
            dailyRecords[dateStr] = { start: '', end: '', total: 0 }
        }

        let totalMonthlyHours = 0

        entries.forEach((entry: any) => {
            const dateStr = entry.clock_in.split('T')[0]
            if (!dailyRecords[dateStr]) return

            const inTime = new Date(entry.clock_in).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
            const outTime = entry.clock_out ? new Date(entry.clock_out).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''

            // Highlight if modified in daily view
            const modTag = entry.is_manual_correction ? ' (*)' : ''

            const currentStart = dailyRecords[dateStr].start
            const currentEnd = dailyRecords[dateStr].end

            dailyRecords[dateStr].start = currentStart ? `${currentStart}\n${inTime}${modTag}` : `${inTime}${modTag}`
            dailyRecords[dateStr].end = currentEnd ? `${currentEnd}\n${outTime}` : outTime

            if (entry.clock_out) {
                const diff = (new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()) / (1000 * 60 * 60)
                dailyRecords[dateStr].total += diff
                totalMonthlyHours += diff
            }
        })

        // Helper to format decimal hours to HH:MM
        function formatDuration(totalHours: number) {
            if (!totalHours) return '-'
            const sign = totalHours < 0 ? "-" : ""
            const absHours = Math.abs(totalHours)
            const h = Math.floor(absHours)
            const m = Math.round((absHours - h) * 60)
            return `${sign}${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
        }

        const tableBody = Object.keys(dailyRecords).map(date => {
            const rec = dailyRecords[date]
            return [
                date,
                rec.start,
                rec.end,
                formatDuration(rec.total)
            ]
        })

        tableBody.push(['TOTAL', '', '', formatDuration(totalMonthlyHours)])

        autoTable(doc, {
            startY: 60,
            head: [['Fecha', 'Hora Entrada', 'Hora Salida', 'Total Horas']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [66, 66, 66] },
        })

        // Add Incidents Section if any
        const incidents = entries.filter(e => e.is_manual_correction)
        let finalY = (doc as any).lastAutoTable.finalY + 15

        if (incidents.length > 0) {
            doc.setFontSize(14)
            doc.text("Anexo: Correcciones Manuales e Incidencias", 14, finalY)

            const incidentBody = incidents.map(inc => [
                format(new Date(inc.clock_in), 'dd/MM/yyyy'),
                `${format(new Date(inc.clock_in), 'HH:mm')} - ${inc.clock_out ? format(new Date(inc.clock_out), 'HH:mm') : '??'}`,
                inc.correction_reason || 'Sin motivo especificado'
            ])

            autoTable(doc, {
                startY: finalY + 5,
                head: [['Fecha', 'Horario', 'Motivo de la Modificación']],
                body: incidentBody,
                theme: 'striped',
                headStyles: { fillColor: [180, 130, 0] }, // Amber/Gold color for incidents
                styles: { fontSize: 8 }
            })

            finalY = (doc as any).lastAutoTable.finalY + 15
        } else {
            finalY += 5
        }

        // Signatures
        if (finalY > 240) { // New page if no space
            doc.addPage()
            finalY = 20
        }

        doc.setFontSize(10)
        doc.text("Firma de la Empresa:", 14, finalY)
        doc.text("Firma del Trabajador:", 120, finalY)

        doc.rect(14, finalY + 5, 60, 30) // Box 1
        doc.rect(120, finalY + 5, 60, 30) // Box 2

        doc.setFontSize(8)
        doc.text("(*) El asterisco indica que el registro ha sido objeto de una corrección manual autorizada.", 14, finalY + 42)

        return doc.output('blob')
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
