'use server'

import { createClient } from '@/lib/supabase/server'

export async function getGlobalStats() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    // Check Super Admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super_admin') return { error: 'No tienes permisos de Super Admin' }

    // 1. Count Companies
    const { count: companiesCount, error: companiesError } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })

    if (companiesError) console.error('Error counting companies:', companiesError)

    // 2. Count Active Users
    const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

    if (usersError) console.error('Error counting users:', usersError)

    // 3. Estimate Revenue using new Plans table
    const { data: companiesRevenue } = await supabase
        .from('companies')
        .select('*, plans(price_per_user)')

    let totalRevenue = 0
    companiesRevenue?.forEach((c: any) => {
        // Here we estimate based on current active users * price per user
        // Or we could have another metric, but let's use peak users if available for current month
        // For simplicity, current active users * price per user is a good dashboard estimate
        totalRevenue += (c.active_users || 0) * (c.plans?.price_per_user || 0)
    })

    return {
        companies: companiesCount || 0,
        users: usersCount || 0,
        revenue: totalRevenue
    }
}
