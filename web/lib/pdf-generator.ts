import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'

export function generatePDF(company: any, employee: any, entries: any[], month: number, year: number): jsPDF {
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
            headStyles: { fillColor: [180, 130, 0] },
            styles: { fontSize: 8 }
        })

        finalY = (doc as any).lastAutoTable.finalY + 15
    } else {
        finalY += 5
    }

    if (finalY > 240) {
        doc.addPage()
        finalY = 20
    }

    doc.setFontSize(10)
    doc.text("Firma de la Empresa:", 14, finalY)
    doc.text("Firma del Trabajador:", 120, finalY)

    doc.rect(14, finalY + 5, 60, 30)
    doc.rect(120, finalY + 5, 60, 30)

    doc.setFontSize(8)
    doc.text("(*) El asterisco indica que el registro ha sido objeto de una corrección manual autorizada.", 14, finalY + 42)

    return doc
}
