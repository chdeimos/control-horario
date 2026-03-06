'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { startOfWeek, endOfWeek } from 'date-fns'

export async function getDashboardStats() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { activeEmployees: 0, weeklyHours: 0 }

    // 1. Empleados activos ahora mismo (clock_out IS NULL) en mi empresa
    // Si soy manager, solo de mi departamento
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, company_id, department_id')
        .eq('id', user.id)
        .single()

    if (!profile) return { activeEmployees: 0, weeklyHours: 0 }

    let activeQuery = supabase
        .from('time_entries')
        .select('*, profiles!inner(department_id)', { count: 'exact', head: true })
        .eq('company_id', profile.company_id)
        .is('clock_out', null)

    if (profile.role === 'manager' && profile.department_id) {
        activeQuery = activeQuery.eq('profiles.department_id', profile.department_id)
    }

    const { count: activeEmployees } = await activeQuery

    // 2. Mis horas trabajadas esta semana
    const start = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString()
    const end = endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString()

    const { data: weeklyEntries } = await supabase
        .from('time_entries')
        .select('clock_in, clock_out')
        .eq('user_id', user.id)
        .gte('clock_in', start)
        .lte('clock_in', end)

    let totalMilliseconds = 0
    weeklyEntries?.forEach(entry => {
        const entryStart = new Date(entry.clock_in).getTime()
        const entryEnd = entry.clock_out ? new Date(entry.clock_out).getTime() : new Date().getTime()
        totalMilliseconds += (entryEnd - entryStart)
    })

    const weeklyHours = Math.round((totalMilliseconds / (1000 * 60 * 60)) * 10) / 10 // Redondear a 1 decimal

    return {
        activeEmployees: activeEmployees || 0,
        weeklyHours: weeklyHours || 0
    }
}

export async function updateTimeEntry(entryId: string, data: { clockIn: string, clockOut: string | null, reason: string }) {
    const supabase = await createClient()

    // Validar que el usuario sea dueño o admin (RLS se encarga, pero validamos reason)
    if (!data.reason || data.reason.trim().length < 3) {
        return { error: 'Debes indicar un motivo para la corrección.' }
    }

    const { error } = await supabase
        .from('time_entries')
        .update({
            clock_in: data.clockIn,
            clock_out: data.clockOut,
            is_manual_correction: true,
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
