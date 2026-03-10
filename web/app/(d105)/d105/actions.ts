'use server'

import { createClient } from '@/lib/supabase/server'

export async function getGlobalStats() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    // Check Super Admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super_admin') return { error: 'No tienes permisos de Super Admin' }

    // 1. Companies Stats
    const { count: activeCompanies } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

    const { count: inactiveCompanies } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', false)

    // 2. Users Stats
    const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

    const { count: inactiveUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', false)

    // 3. Revenue Forecast (Live sync with profile counts and discounts)
    const { data: companiesRevenue } = await supabase
        .from('companies')
        .select(`
            id,
            plans(
                price_per_user, 
                fixed_price, 
                billing_type,
                volume_discounts (*)
            )
        `)
        .eq('is_active', true)

    const { data: activeProfilesList } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('is_active', true)

    // Index counts by company
    const countsMap: Record<string, number> = {}
    activeProfilesList?.forEach(p => {
        if (p.company_id) countsMap[p.company_id] = (countsMap[p.company_id] || 0) + 1
    })

    let totalForecast = 0
    companiesRevenue?.forEach((c: any) => {
        const userCount = countsMap[c.id] || 0
        const plan = c.plans

        if (!plan) return

        if (plan.billing_type === 'per_user') {
            const basePrice = Number(plan.price_per_user) || 0
            const discounts = plan.volume_discounts || []
            const applicableDiscount = discounts
                .filter((d: any) => userCount >= d.min_users)
                .sort((a: any, b: any) => b.min_users - a.min_users)[0]

            const discountPerc = applicableDiscount ? Number(applicableDiscount.discount_percentage) : 0
            totalForecast += (userCount * basePrice) * (1 - (discountPerc / 100))
        } else if (plan.billing_type === 'fixed') {
            totalForecast += Number(plan.fixed_price) || 0
        }
    })

    // 4. Historical Data (Last 12 months)
    const { data: invoices } = await supabase
        .from('invoices')
        .select('amount, month, year')
        .order('year', { ascending: true })
        .order('month', { ascending: true })
        .limit(100) // Get enough to extract last 12 months

    // Aggregate by month/year
    const historyMap: Record<string, number> = {}
    invoices?.forEach(inv => {
        const key = `${inv.year}-${String(inv.month).padStart(2, '0')}`
        historyMap[key] = (historyMap[key] || 0) + Number(inv.amount)
    })

    // Create the last 12 months array for the chart
    const history = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        history.push({
            label: d.toLocaleString('es-ES', { month: 'short' }).toUpperCase(),
            value: historyMap[key] || 0
        })
    }

    // 5. Real Audit Logs (from admin_access_logs)
    const { data: adminAccessLogs } = await supabase
        .from('admin_access_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

    const auditLogs = (adminAccessLogs || []).map(log => ({
        type: log.success ? 'ACCESO_ADM' : 'FALLO_ADM',
        message: log.success
            ? `Acceso exitoso: ${log.username}`
            : `Intento fallido: ${log.username} (${log.error_message || 'Credenciales inválidas'})`,
        time: log.created_at,
        status: log.success ? 'success' : 'warning'
    }))

    return {
        activeCompanies: activeCompanies || 0,
        inactiveCompanies: inactiveCompanies || 0,
        activeUsers: activeUsers || 0,
        inactiveUsers: inactiveUsers || 0,
        forecast: totalForecast,
        history,
        auditLogs
    }
}

export async function getSecuritySettings() {
    const supabase = await createClient()
    const { data } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', '2fa_session_duration_hours')
        .maybeSingle()

    return data?.value || '24'
}

export async function updateSecuritySettings(hours: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('system_settings')
        .upsert({
            key: '2fa_session_duration_hours',
            value: hours
        })

    if (error) return { error: error.message }
    return { success: true }
}
