import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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
            plan?.name || 'Standard',
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
