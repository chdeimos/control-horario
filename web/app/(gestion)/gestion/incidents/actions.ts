'use server'

import { createClient } from '@/lib/supabase/server'

export async function getIncidents(params: {
    search?: string,
    from?: string,
    to?: string,
    department?: string,
    page?: number,
    pageSize?: number | 'all'
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, company_id, department_id')
        .eq('id', user.id)
        .single()

    if (!profile || !['super_admin', 'company_admin', 'manager'].includes(profile.role)) {
        return { error: 'No tienes permisos para ver incidencias.' }
    }

    const page = params.page || 1
    const pageSize = params.pageSize === 'all' ? 1000 : (params.pageSize || 25)
    const offset = (page - 1) * (pageSize as number)
    const limit = (pageSize as number) - 1

    let query = supabase
        .from('time_entries')
        .select(`
            id,
            clock_in,
            clock_out,
            correction_reason,
            incident_reason,
            is_manual_correction,
            is_incident,
            updated_at,
            profiles!inner (
                full_name, 
                department_id,
                departments:department_id (name)
            )
        `, { count: 'exact' })
        .eq('company_id', profile.company_id)
        .or('is_manual_correction.eq.true,is_incident.eq.true')
        .order('updated_at', { ascending: false })

    // If manager, filter by department
    if (profile.role === 'manager') {
        query = query.eq('profiles.department_id', profile.department_id)
    } else if (params.department) {
        // If admin/super_admin and department is selected
        query = query.eq('profiles.department_id', params.department)
    }

    // Filters
    if (params.search) {
        query = query.ilike('profiles.full_name', `%${params.search}%`)
    }
    if (params.from) {
        query = query.gte('updated_at', params.from)
    }
    if (params.to) {
        // Simple to date end of day
        query = query.lte('updated_at', `${params.to}T23:59:59`)
    }

    // Pagination
    if (params.pageSize !== 'all') {
        query = query.range(offset, offset + limit)
    }

    const { data: incidents, error, count } = await query

    if (error) return { error: error.message }

    return {
        incidents: incidents || [],
        count: count || 0
    }
}
