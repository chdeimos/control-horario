'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { startOfWeek, endOfWeek } from 'date-fns'

export async function getDashboardStats() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { totalUsers: 0, activeUsers: 0, totalIncidents: 0, usersOnLeave: 0, pendingLeaveRequests: 0 }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, company_id, department_id')
        .eq('id', user.id)
        .single()

    if (!profile) return { totalUsers: 0, activeUsers: 0, totalIncidents: 0, usersOnLeave: 0, pendingLeaveRequests: 0 }

    const today = new Date().toISOString().split('T')[0]

    // 1. Total Usuarios
    let usersQuery = supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile.company_id)

    if (profile.role === 'manager' && profile.department_id) {
        usersQuery = usersQuery.eq('department_id', profile.department_id)
    }
    const { count: totalUsers } = await usersQuery

    // 2. Usuarios Activos (Fichando ahora)
    let activeUsersQuery = supabase
        .from('time_entries')
        .select('*, profiles!inner(department_id)', { count: 'exact', head: true })
        .eq('company_id', profile.company_id)
        .is('clock_out', null)

    if (profile.role === 'manager' && profile.department_id) {
        activeUsersQuery = activeUsersQuery.eq('profiles.department_id', profile.department_id)
    }
    const { count: activeUsers } = await activeUsersQuery

    // 3. Total Incidencias (Abiertas/Pendientes)
    let incidentsQuery = supabase
        .from('time_entries')
        .select('*, profiles!inner(department_id)', { count: 'exact', head: true })
        .eq('company_id', profile.company_id)
        .eq('is_incident', true)
        .eq('is_audited', false)

    if (profile.role === 'manager' && profile.department_id) {
        incidentsQuery = incidentsQuery.eq('profiles.department_id', profile.department_id)
    }
    const { count: totalIncidents } = await incidentsQuery

    // 4. Usuarios de vacaciones / días libres hoy
    let leaveQuery = supabase
        .from('time_off_requests')
        .select('*, profiles!inner(department_id)', { count: 'exact', head: true })
        .eq('status', 'approved')
        .lte('start_date', today)
        .gte('end_date', today)

    if (profile.role === 'manager' && profile.department_id) {
        // Here we need a join or filter by profiles in that department
        // time_off_requests table should have user_id which links to profiles
        leaveQuery = leaveQuery.eq('profiles.department_id', profile.department_id)
    }
    const { count: usersOnLeave } = await leaveQuery

    // 5. Solicitudes de ausencia PENDIENTES
    let pendingLeaveQuery = supabase
        .from('time_off_requests')
        .select('*, profiles!inner(department_id)', { count: 'exact', head: true })
        .eq('status', 'pending')

    if (profile.role === 'manager' && profile.department_id) {
        pendingLeaveQuery = pendingLeaveQuery.eq('profiles.department_id', profile.department_id)
    }
    const { count: pendingLeaveRequests } = await pendingLeaveQuery

    return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalIncidents: totalIncidents || 0,
        usersOnLeave: usersOnLeave || 0,
        pendingLeaveRequests: pendingLeaveRequests || 0
    }
}

export async function updateTimeEntry(entryId: string, data: { clockIn: string, clockOut: string | null, reason: string }) {
    const supabase = await createClient()

    if (!data.reason || data.reason.trim().length < 3) {
        return { error: 'Debes indicar un motivo para la corrección.' }
    }

    const { error } = await supabase
        .from('time_entries')
        .update({
            clock_in: data.clockIn,
            clock_out: data.clockOut,
            is_manual_correction: true,
            is_audited: true,
            correction_reason: data.reason
        })
        .eq('id', entryId)

    if (error) {
        console.error('Update Entry Error:', error)
        return { error: error.message }
    }

    revalidatePath('/time-entries')
    return { success: true }
}
