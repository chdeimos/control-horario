import { createAdminClient } from '@/lib/supabase/admin'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || '127.0.0.1',
    port: parseInt(process.env.SMTP_PORT || '54325'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    } : undefined,
    // Timeout más corto para evitar bloqueos largos si el servidor SMTP no responde
    connectionTimeout: 5000,
    greetingTimeout: 5000
})

export async function generateMonthlyInvoices(month: number, year: number) {
    // Usamos el cliente admin para saltarnos RLS y asegurar escritura
    const supabase = createAdminClient()
    console.log(`[Billing] Starting generation for ${month}/${year}`)

    // 0. Asegurar que existen mÃ©tricas para las empresas activas
    // Esto es vital para la simulaciÃ³n: si no hay mÃ©tricas grabadas, las creamos 
    // basadas en el nÃºmero actual de empleados de cada empresa que NO sean baja definitiva.
    const { data: companies } = await supabase.from('companies').select('id')
    if (companies) {
        for (const company of companies) {
            // Contamos usuarios que computan para facturaciÃ³n:
            // Activos, Bajas MÃ©dicas y Excedencias (Solo se excluye 'terminated')
            const { count } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', company.id)
                .in('status', ['active', 'medical_leave', 'unpaid_leave'])

            await supabase.from('company_monthly_metrics').upsert({
                company_id: company.id,
                month,
                year,
                peak_active_users: count || 1 // MÃnimo 1 para que se vea algo en la simulaciÃ³n
            }, { onConflict: 'company_id,month,year' })
        }
    }

    // 1. Obtener métricas (ahora ya existen seguro)
    const { data: metrics, error: metricsError } = await supabase
        .from('company_monthly_metrics')
        .select(`
            *,
            companies (
                id,
                name,
                plans (
                    id,
                    name,
                    billing_type,
                    price_per_user,
                    fixed_price,
                    fixed_users_limit,
                    volume_discounts (*)
                )
            )
        `)
        .eq('month', month)
        .eq('year', year)

    if (metricsError) {
        console.error('[Billing] Error fetching metrics:', metricsError)
        throw metricsError
    }

    console.log(`[Billing] Found ${metrics?.length || 0} metrics to process`)

    const results = []

    for (const metric of metrics) {
        console.log(`[Billing] Processing company: ${metric.companies?.name}`)
        const peakUsers = metric.peak_active_users
        let plan = metric.companies?.plans

        // FALLBACK PARA DEMO: Si no hay plan, asignamos uno estándar por defecto
        if (!plan) {
            console.log(`[Billing] No plan for ${metric.companies?.name}. Using Standard Demo Plan (5€/u)`)
            plan = {
                name: 'Standard (Demo)',
                billing_type: 'per_user',
                price_per_user: 5,
                volume_discounts: []
            }
        }

        let amount = 0
        let details: any = {
            peak_users: peakUsers,
            plan_name: plan.name,
            billing_type: plan.billing_type
        }

        if (plan.billing_type === 'fixed') {
            const basePrice = Number(plan.fixed_price) || 0
            const limit = plan.fixed_users_limit || 0
            const overagePrice = Number(plan.price_per_user) || 0

            amount = basePrice
            details.base_price = basePrice
            details.users_limit = limit

            if (peakUsers > limit) {
                const overageCharge = (peakUsers - limit) * overagePrice
                amount += overageCharge
                details.overage_users = peakUsers - limit
                details.overage_price_per_user = overagePrice
                details.overage_charge = overageCharge
            }
        } else {
            const price = Number(plan.price_per_user) || 0
            const discounts = plan.volume_discounts || []
            const applicableDiscount = discounts
                .filter((d: any) => peakUsers >= d.min_users)
                .sort((a: any, b: any) => b.min_users - a.min_users)[0]

            const discountPerc = applicableDiscount ? Number(applicableDiscount.discount_percentage) : 0
            amount = (peakUsers * price) * (1 - (discountPerc / 100))

            details.base_price = price
            details.discount_percentage = discountPerc
        }

        console.log(`[Billing] Calculated Amount: ${amount} for ${peakUsers} users (${plan.billing_type})`)

        // Borramos si ya existía para este mes (Simulación de Upsert manual)
        await supabase
            .from('invoices')
            .delete()
            .eq('company_id', metric.company_id)
            .eq('month', month)
            .eq('year', year)

        const { error: invoiceError } = await supabase
            .from('invoices')
            .insert({
                company_id: metric.company_id,
                month,
                year,
                amount,
                status: 'pending',
                details
            })

        if (invoiceError) {
            console.error(`[Billing] Error creating invoice for ${metric.companies?.name}:`, invoiceError)
        } else {
            console.log(`[Billing] Invoice created for ${metric.companies?.name}`)
            results.push({ name: metric.companies.name, amount })
        }
    }

    const { data: setting } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'billing_email')
        .single()

    const adminEmail = setting?.value || 'admin@example.com'

    // 3. Envío del Informe
    if (results.length > 0) {
        const total = results.reduce((acc, r) => acc + r.amount, 0).toFixed(2)

        try {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || '"Sistema de Facturación" <billing@tuapp.com>',
                to: adminEmail,
                subject: `Informe de Facturación Mensual - ${month}/${year}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
                        <h1 style="color: #4f46e5;">Resumen de Facturación ${month}/${year}</h1>
                        <p>Se han generado las siguientes facturas:</p>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #f8fafc;">
                                    <th style="text-align: left; padding: 10px; border-bottom: 2px solid #e2e8f0;">Empresa</th>
                                    <th style="text-align: right; padding: 10px; border-bottom: 2px solid #e2e8f0;">Importe</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${results.map(r => `
                                    <tr>
                                        <td style="padding: 10px; border-bottom: 1px solid #edf2f7;">${r.name}</td>
                                        <td style="padding: 10px; border-bottom: 1px solid #edf2f7; text-align: right;">${r.amount.toFixed(2)}€</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <div style="margin-top: 20px; padding: 15px; background: #f0fdf4; border-radius: 8px; text-align: right;">
                            <span style="font-size: 1.2rem; font-bold; color: #166534;">Total facturado: ${total}€</span>
                        </div>
                    </div>
                `
            })
            console.log(`Email enviado con éxito a ${adminEmail}`)
        } catch (emailError) {
            console.error('Error enviando email:', emailError)
        }
    }

    return results
}
