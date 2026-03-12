'use server'

import { createClient } from '@/lib/supabase/server'

export async function getIncidents(params: {
    search?: string,
    from?: string,
    to?: string,
    department?: string,
    audited?: string,
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
            is_audited,
            updated_at,
            profiles!inner (
                full_name, 
                department_id,
                schedule_type,
                work_schedules (
                    day_of_week,
                    start_time,
                    end_time,
                    start_time_2,
                    end_time_2,
                    is_active
                ),
                departments:department_id (name)
            )
        `, { count: 'exact' })
        .eq('company_id', profile.company_id)
        .or('is_manual_correction.eq.true,is_incident.eq.true')

    // Audited Filter
    if (params.audited === 'yes') {
        query = query.eq('is_audited', true)
    } else if (params.audited === 'no') {
        query = query.eq('is_audited', false)
    }

    query = query
        .order('is_audited', { ascending: true }) // Not audited first (false < true)
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

    // Normalizar datos para aplanar joins que Supabase puede devolver como arrays
    const cleanedIncidents = (incidents || []).map((inc: any) => {
        const profile = Array.isArray(inc.profiles) ? inc.profiles[0] : inc.profiles
        if (!profile) return inc

        return {
            ...inc,
            profiles: {
                ...profile,
                departments: Array.isArray(profile.departments) ? profile.departments[0] : profile.departments
            }
        }
    })

    // Global count of pending incidents for the header flashcard
    let pendingQuery = supabase
        .from('time_entries')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', profile.company_id)
        .or('is_manual_correction.eq.true,is_incident.eq.true')
        .eq('is_audited', false)

    if (profile.role === 'manager') {
        const { data: deptProfiles } = await supabase
            .from('profiles')
            .select('id')
            .eq('department_id', profile.department_id)

        const deptUserIds = deptProfiles?.map(p => p.id) || []
        pendingQuery = pendingQuery.in('user_id', deptUserIds)
    }

    const { count: pendingCount } = await pendingQuery

    return {
        incidents: cleanedIncidents as any[],
        count: count || 0,
        pendingCount: pendingCount || 0
    }
}

export async function createManualIncident(data: {
    userId: string,
    clockIn: string,
    clockOut: string | null,
    reason: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, company_id')
        .eq('id', user.id)
        .single()

    if (!profile || !['super_admin', 'company_admin', 'manager'].includes(profile.role)) {
        return { error: 'No tienes permisos para crear incidencias.' }
    }

    const { error } = await supabase
        .from('time_entries')
        .insert({
            user_id: data.userId,
            company_id: profile.company_id,
            clock_in: data.clockIn,
            clock_out: data.clockOut,
            is_manual_correction: true,
            origin: 'manual_correction',
            is_incident: true,
            is_audited: false,
            correction_reason: data.reason,
            entry_type: 'work'
        })

    if (error) return { error: error.message }
    return { success: true }
}

export async function getEmployeesForIncidents() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, department_id, role')
        .eq('id', user.id)
        .single()

    if (!profile) return []

    let query = supabase
        .from('profiles')
        .select('id, full_name')
        .eq('company_id', profile.company_id)
        .eq('status', 'active')
        .order('full_name')

    if (profile.role === 'manager') {
        query = query.eq('department_id', profile.department_id)
    }

    const { data } = await query
    return data || []
}
