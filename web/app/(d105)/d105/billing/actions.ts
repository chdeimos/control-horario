'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateMonthlyInvoices } from '@/lib/billing'
import { revalidatePath } from 'next/cache'

export async function getBillingData(month: number, year: number) {
    const supabase = await createClient()

    // 1. Obtener todas las empresas activas que deberían ser facturadas
    const { data: companies, error: compError } = await supabase
        .from('companies')
        .select(`
            id,
            name,
            plans (
                name,
                billing_type,
                price_per_user,
                fixed_price,
                fixed_users_limit,
                volume_discounts (*)
            )
        `)
        .eq('is_active', true)

    if (compError) return { error: compError.message }
    if (!companies) return { data: [] }

    // 2. Obtener TODAS las métricas persistidas para este mes
    const { data: snapshots } = await supabase
        .from('company_monthly_metrics')
        .select('*')
        .eq('month', month)
        .eq('year', year)

    const snapshotMap = new Map(snapshots?.map(s => [s.company_id, s]))

    // 3. Construir lista híbrida
    const finalMetrics = []

    for (const company of companies) {
        const snapshot: any = snapshotMap.get(company.id)

        if (snapshot) {
            // Usar dato archivado
            finalMetrics.push({
                id: snapshot.id,
                peak_active_users: snapshot.peak_active_users,
                companies: company
            })
        } else {
            // Fallback Live: empresa nueva o mes en curso sin snapshot
            const { count } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', company.id)
                .in('status', ['active', 'medical_leave', 'unpaid_leave'])

            finalMetrics.push({
                id: `live-${company.id}`,
                peak_active_users: count || 0,
                companies: company
            })
        }
    }

    return { data: finalMetrics }
}

export async function getInvoices() {
    // Usamos el cliente admin para asegurar que el Super Admin vea todo
    const supabase = createAdminClient()
    const { data, error } = await supabase
        .from('invoices')
        .select(`
            *,
            companies (name, email, phone, cif)
        `)
        .order('year', { ascending: false })
        .order('month', { ascending: false })

    if (error) return { error: error.message }
    return { data }
}

export async function runMonthlySimulation(month: number, year: number) {
    try {
        const results = await generateMonthlyInvoices(month, year)
        revalidatePath('/d105/billing')
        return { success: true, count: results.length }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function updateInvoiceStatus(invoiceId: string, status: string) {
    const supabase = createAdminClient()
    const { error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', invoiceId)

    if (error) return { error: error.message }
    revalidatePath('/d105/billing')
    return { success: true }
}

export async function deleteInvoice(invoiceId: string) {
    const supabase = createAdminClient()
    const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId)

    if (error) return { error: error.message }
    revalidatePath('/d105/billing')
    return { success: true }
}
