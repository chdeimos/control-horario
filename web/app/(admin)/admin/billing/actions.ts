'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateMonthlyInvoices } from '@/lib/billing'
import { revalidatePath } from 'next/cache'

export async function getBillingData(month: number, year: number) {
    const supabase = await createClient()

    // 1. Obtener todas las empresas activas
    const { data: companies, error: compError } = await supabase
        .from('companies')
        .select(`
            id,
            name,
            plans (
                name,
                price_per_user,
                volume_discounts (*)
            )
        `)
        .eq('is_active', true)

    if (compError) return { error: compError.message }
    if (!companies) return { data: [] }

    // 2. Obtener mÃ©tricas persistidas
    const { data: snapshots } = await supabase
        .from('company_monthly_metrics')
        .select('*')
        .eq('month', month)
        .eq('year', year)

    const snapshotMap = new Map(snapshots?.map(s => [s.company_id, s]))

    // 3. Construir lista hÃbrida
    const finalMetrics = []

    for (const company of companies) {
        const snapshot: any = snapshotMap.get(company.id)

        if (snapshot) {
            finalMetrics.push({
                ...snapshot,
                companies: company
            })
        } else {
            // Fallback Live
            const { count } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', company.id)
                .in('status', ['active', 'medical_leave', 'unpaid_leave'])

            finalMetrics.push({
                company_id: company.id,
                peak_active_users: count || 0,
                companies: company,
                is_live: true
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
            companies (name)
        `)
        .order('year', { ascending: false })
        .order('month', { ascending: false })

    if (error) return { error: error.message }
    return { data }
}

export async function runMonthlySimulation(month: number, year: number) {
    try {
        const results = await generateMonthlyInvoices(month, year)
        revalidatePath('/admin/billing')
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
    revalidatePath('/admin/billing')
    return { success: true }
}

export async function deleteInvoice(invoiceId: string) {
    const supabase = createAdminClient()
    const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId)

    if (error) return { error: error.message }
    revalidatePath('/admin/billing')
    return { success: true }
}
