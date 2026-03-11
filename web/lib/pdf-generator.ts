import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'

export function generatePDF(
    company: any, 
    employee: any, 
    entries: any[], 
    month: number, 
    year: number, 
    branding?: any, 
    schedules: any[] = [], 
    timeOff: any[] = []
): jsPDF {
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
    const dailyRecords: Record<string, { 
        slots: { in: string, out: string, mod: string }[], 
        total: number, 
        expected: number, 
        note: string 
    }> = {}
    const daysInMonth = new Date(year, month, 0).getDate()

    for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month - 1, i)
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`
        
        // Calculate Expected Hours
        const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay()
        const schedule = schedules.find(s => s.day_of_week === dayOfWeek)
        
        let expected = 0
        if (schedule && schedule.is_active) {
            if (employee.schedule_type === 'fixed' && schedule.start_time && schedule.end_time) {
                const timeToHours = (t: string) => {
                    const [h, m] = t.split(':').map(Number)
                    return h + (m || 0) / 60
                }
                expected = timeToHours(schedule.end_time) - timeToHours(schedule.start_time)
                if (schedule.start_time_2 && schedule.end_time_2) {
                    expected += timeToHours(schedule.end_time_2) - timeToHours(schedule.start_time_2)
                }
                if (expected <= 0) expected = schedule.target_total_hours || Number(employee.scheduled_hours) || 8.0
            } else {
                expected = schedule.target_total_hours || Number(employee.scheduled_hours) || 8.0
            }
        }

        // Check for Absence / Time Off
        let note = ''
        const leave = timeOff.find(t => {
            const start = new Date(t.start_date)
            const end = new Date(t.end_date)
            const current = new Date(dateStr)
            return current >= start && current <= end
        })

        if (leave) {
            const typeLabels: Record<string, string> = {
                'vacation': 'VACACIONES',
                'sick_leave': 'BAJA MÉDICA',
                'personal_days': 'ASUNTOS PROPIOS',
                'other': 'AUSENCIA JUSTIF.'
            }
            note = typeLabels[leave.type] || 'AUSENCIA'
            expected = 0
        }

        dailyRecords[dateStr] = { slots: [], total: 0, expected, note }
    }

    let totalMonthlyWorked = 0
    let totalMonthlyExpected = 0

    entries.forEach((entry: any) => {
        const dateStr = entry.clock_in.split('T')[0]
        if (!dailyRecords[dateStr]) return

        const inTime = new Date(entry.clock_in).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        const outTime = entry.clock_out ? new Date(entry.clock_out).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''
        const modTag = entry.is_manual_correction ? '*' : ''

        dailyRecords[dateStr].slots.push({ in: inTime, out: outTime, mod: modTag })

        if (entry.clock_out) {
            const diff = (new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()) / (1000 * 60 * 60)
            dailyRecords[dateStr].total += diff
            totalMonthlyWorked += diff
        }
    })

    function formatDuration(totalHours: number) {
        if (totalHours === 0) return '00:00'
        const sign = totalHours < 0 ? "-" : ""
        const absHours = Math.abs(totalHours)
        const h = Math.floor(absHours)
        const m = Math.round((absHours - h) * 60)
        return `${sign}${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
    }

    const tableBody = Object.keys(dailyRecords).map(date => {
        const rec = dailyRecords[date]
        const diff = rec.total - rec.expected
        
        let workedDisplay = formatDuration(rec.total)
        let diffDisplay = formatDuration(diff)

        if (rec.slots.length === 0 && rec.note) workedDisplay = rec.note
        if (rec.expected > 0) totalMonthlyExpected += rec.expected

        const row: any[] = [
            format(new Date(date), 'dd/MM/yyyy'),
            rec.expected > 0 ? formatDuration(rec.expected) : '-',
            diffDisplay
        ]

        // Add 3 pairs of in/out
        for (let j = 0; j < 3; j++) {
            const slot = rec.slots[j]
            row.push(slot ? `${slot.in}${slot.mod}` : '-')
            row.push(slot ? slot.out || '-' : '-')
        }

        // Add "Otras" column
        if (rec.slots.length > 3) {
            const others = rec.slots.slice(3).map(s => `${s.in}${s.mod}-${s.out || '?'}`).join(', ')
            row.push(others)
        } else {
            row.push('-')
        }

        row.push(workedDisplay)

        return row
    })

    const totalDiff = totalMonthlyWorked - totalMonthlyExpected
    tableBody.push(['TOTAL MENSUAL', formatDuration(totalMonthlyExpected), formatDuration(totalDiff), '', '', '', '', '', '', '', formatDuration(totalMonthlyWorked)])

    autoTable(doc, {
        startY: 30,
        head: [['Fecha', 'Prev.', 'Dif.', 'E1', 'S1', 'E2', 'S2', 'E3', 'S3', 'Otras', 'Trab.']],
        body: tableBody,
        theme: 'grid',
        styles: { fontSize: 6.5, cellPadding: 0.5 },
        headStyles: { fillColor: [66, 66, 66], fontSize: 6.5, fontStyle: 'bold', halign: 'center' },
        columnStyles: {
            0: { cellWidth: 16 },
            1: { cellWidth: 11, halign: 'center' },
            2: { cellWidth: 11, halign: 'center' },
            3: { cellWidth: 10, halign: 'center' },
            4: { cellWidth: 10, halign: 'center' },
            5: { cellWidth: 10, halign: 'center' },
            6: { cellWidth: 10, halign: 'center' },
            7: { cellWidth: 10, halign: 'center' },
            8: { cellWidth: 10, halign: 'center' },
            9: { cellWidth: 'auto', fontSize: 5 },
            10: { cellWidth: 12, halign: 'right' }
        },
        margin: { left: 10, right: 10 },
        didParseCell: function (data) {
            if (data.section === 'body') {
                // Highlight negative differences in red (Index 2 now)
                if (data.column.index === 2) {
                    const val = data.cell.text[0]
                    if (val && val.startsWith('-') && val !== '00:00') {
                        data.cell.styles.textColor = [220, 38, 38] // Red
                        data.cell.styles.fontStyle = 'bold'
                    }
                }
                // Highlight Total Row
                if (data.row.index === tableBody.length - 1) {
                    data.cell.styles.fillColor = [245, 245, 245]
                    data.cell.styles.fontStyle = 'bold'
                }
                // Highlight note in Worked column if it's an absence
                if (data.column.index === 10) {
                    const val = data.cell.text[0]
                    if (val && ['VACACIONES', 'BAJA MÉDICA', 'ASUNTOS PROPIOS', 'AUSENCIA JUSTIF.'].includes(val)) {
                        data.cell.styles.textColor = [59, 130, 246] // Blue
                        data.cell.styles.fontSize = 5.5
                        data.cell.styles.fontStyle = 'bold'
                    }
                }
            }
        }
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

    // Branding & Watermark (SaaS)
    if (branding && Object.keys(branding).length > 0) {
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);

            // 1. Watermark (Translucent Logo)
            if (branding.saas_logo_pdf) {
                try {
                    // Use GState for transparency if available
                    // @ts-ignore
                    if (typeof doc.GState === 'function' || (doc as any).internal.processContext) {
                        const gs = new (doc as any).GState({ opacity: 0.1 });
                        doc.saveGraphicsState();
                        doc.setGState(gs);
                        doc.addImage(branding.saas_logo_pdf, 'PNG', 55, 100, 100, 100, undefined, 'FAST');
                        doc.restoreGraphicsState();
                    } else {
                        // Fallback simple add
                        doc.addImage(branding.saas_logo_pdf, 'PNG', 55, 100, 100, 100, undefined, 'FAST');
                    }
                } catch (e) {
                    console.warn("Could not add branding logo to PDF:", e);
                }
            }

            // 2. Footer SaaS Data
            doc.setFontSize(6);
            doc.setTextColor(180);
            const footerParts = [
                branding.saas_name,
                branding.saas_cif ? `CIF: ${branding.saas_cif}` : null,
                branding.saas_address,
                branding.saas_website
            ].filter(Boolean);

            const footerText = footerParts.join(' | ');
            doc.text(footerText, 105, 292, { align: "center" });
        }
    }

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
