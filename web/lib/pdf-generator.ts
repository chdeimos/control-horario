import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'

export function generatePDF(company: any, employee: any, entries: any[], month: number, year: number): jsPDF {
    const doc = new jsPDF()

    // Header Compacto
    doc.setFontSize(14)
    doc.text("Registro de Jornada Mensual", 105, 12, { align: "center" })

    doc.setFontSize(9)
    // Línea 1: Empresa y Trabajador
    doc.setFont("helvetica", "bold")
    doc.text("EMPRESA:", 14, 20)
    doc.setFont("helvetica", "normal")
    doc.text(`${company.name} (CIF: ${company.cif})`, 33, 20)

    doc.setFont("helvetica", "bold")
    doc.text("TRABAJADOR:", 110, 20)
    doc.setFont("helvetica", "normal")
    doc.text(`${employee.full_name}`, 135, 20)

    // Línea 2: NIF y Mes
    doc.setFont("helvetica", "bold")
    doc.text("NIF:", 110, 24)
    doc.setFont("helvetica", "normal")
    doc.text(`${employee.nif || '(Sin NIF)'}`, 118, 24)

    doc.setFont("helvetica", "bold")
    doc.text("MES/AÑO:", 160, 24)
    doc.setFont("helvetica", "normal")
    doc.text(`${month}/${year}`, 178, 24)

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

        const modTag = entry.is_manual_correction ? '*' : ''

        const currentStart = dailyRecords[dateStr].start
        const currentEnd = dailyRecords[dateStr].end

        dailyRecords[dateStr].start = currentStart ? `${currentStart}, ${inTime}${modTag}` : `${inTime}${modTag}`
        dailyRecords[dateStr].end = currentEnd ? `${currentEnd}, ${outTime}` : outTime

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
            format(new Date(date), 'dd/MM/yyyy'),
            rec.start || '-',
            rec.end || '-',
            formatDuration(rec.total)
        ]
    })

    tableBody.push(['TOTAL MENSUAL', '', '', formatDuration(totalMonthlyHours)])

    autoTable(doc, {
        startY: 30,
        head: [['Fecha', 'Entradas', 'Salidas', 'Horas']],
        body: tableBody,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1, rowHeight: 4 },
        headStyles: { fillColor: [66, 66, 66], fontSize: 8, fontStyle: 'bold' },
        columnStyles: {
            0: { cellWidth: 25 },
            3: { cellWidth: 20, halign: 'right' }
        },
        margin: { left: 14, right: 14 }
    })

    const incidents = entries.filter(e => e.is_manual_correction)
    let finalY = (doc as any).lastAutoTable.finalY + 8

    if (incidents.length > 0) {
        if (finalY > 230) {
            doc.addPage()
            finalY = 15
        }
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.text("Incidencias y Modificaciones", 14, finalY)

        const incidentBody = incidents.map(inc => [
            format(new Date(inc.clock_in), 'dd/MM/yyyy'),
            `${format(new Date(inc.clock_in), 'HH:mm')} - ${inc.clock_out ? format(new Date(inc.clock_out), 'HH:mm') : '??'}`,
            inc.correction_reason || 'Sin motivo'
        ])

        autoTable(doc, {
            startY: finalY + 2,
            head: [['Fecha', 'Horario', 'Motivo']],
            body: incidentBody,
            theme: 'striped',
            headStyles: { fillColor: [150, 150, 150] },
            styles: { fontSize: 7, cellPadding: 1 }
        })

        finalY = (doc as any).lastAutoTable.finalY + 8
    } else {
        finalY += 2
    }

    // Pie de página con firmas (Compacto)
    if (finalY > 260) {
        doc.addPage()
        finalY = 15
    }

    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.text("FIRMA EMPRESA", 14, finalY)
    doc.text("FIRMA TRABAJADOR", 110, finalY)

    doc.rect(14, finalY + 2, 80, 20) // Caja de firma reducida
    doc.rect(110, finalY + 2, 80, 20)

    doc.setFontSize(7)
    doc.setFont("helvetica", "normal")
    doc.text("(*) Los registros marcados con asterisco han sido objeto de corrección manual autorizada.", 14, finalY + 26)

    return doc
}

export function generateBillingPDF(data: any[], month: number, year: number) {
    const doc = new jsPDF()
    const title = `Informe de Facturacion - ${month}/${year}`

    // Header
    doc.setFontSize(20)
    doc.setTextColor(79, 70, 229) // Indigo color
    doc.text('Control Horario SaaS', 14, 22)

    doc.setFontSize(12)
    doc.setTextColor(100)
    doc.text(title, 14, 32)
    doc.text(`Fecha de generacion: ${new Date().toLocaleDateString()}`, 14, 38)

    // Table
    const tableData = data.map(m => {
        const peakUsers = m.peak_active_users
        const plan = m.companies?.plans
        let total = 0
        let displayPrice = ''

        if (plan?.billing_type === 'fixed') {
            const base = Number(plan.fixed_price) || 0
            const limit = plan.fixed_users_limit || 0
            const overagePrice = Number(plan.price_per_user) || 0
            total = base
            if (peakUsers > limit) {
                total += (peakUsers - limit) * overagePrice
            }
            displayPrice = `${base}€ (fijo)`
        } else {
            const price = Number(plan?.price_per_user) || 0
            const discounts = plan?.volume_discounts || []
            const applicableDiscount = discounts
                .filter((d: any) => peakUsers >= d.min_users)
                .sort((a: any, b: any) => b.min_users - a.min_users)[0]
            const discountPerc = applicableDiscount ? Number(applicableDiscount.discount_percentage) : 0
            total = (peakUsers * price) * (1 - (discountPerc / 100))
            displayPrice = `${price}€/u`
        }

        const discountStr = plan?.billing_type === 'fixed' ? '-' : (data[0].discount_percentage || '0') + '%'

        return [
            m.companies?.name || 'N/A',
            m.companies?.plans?.name || 'Standard',
            peakUsers.toString(),
            displayPrice,
            discountStr,
            `${total.toFixed(2)}€`
        ]
    })

    const totalInvoiced = data.reduce((acc, m) => {
        const peakUsers = m.peak_active_users
        const plan = m.companies?.plans
        if (plan?.billing_type === 'fixed') {
            const base = Number(plan.fixed_price) || 0
            const limit = plan.fixed_users_limit || 0
            const overagePrice = Number(plan.price_per_user) || 0
            let t = base
            if (peakUsers > limit) t += (peakUsers - limit) * overagePrice
            return acc + t
        } else {
            const price = Number(plan?.price_per_user) || 0
            const discounts = plan?.volume_discounts || []
            const applicableDiscount = discounts.filter((d: any) => peakUsers >= d.min_users).sort((a: any, b: any) => b.min_users - a.min_users)[0]
            const discountPerc = applicableDiscount ? Number(applicableDiscount.discount_percentage) : 0
            return acc + ((peakUsers * price) * (1 - (discountPerc / 100)))
        }
    }, 0)

    autoTable(doc, {
        startY: 45,
        head: [['Empresa', 'Plan', 'Usuarios Pico', 'Precio/U', 'Dto.', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        foot: [['', '', '', '', 'TOTAL', `${totalInvoiced.toFixed(2)}€`]],
        footStyles: { fillColor: [248, 250, 252], textColor: [79, 70, 229], fontStyle: 'bold' }
    })

    doc.save(`facturacion_${month}_${year}.pdf`)
}
