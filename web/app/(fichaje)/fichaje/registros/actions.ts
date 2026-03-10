'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfDay, endOfDay } from 'date-fns'

export async function getRegistryData(dateIso: string, departmentId?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    // 1. Obtener perfil con ID de empresa y departamento del usuario actual
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, company_id, department_id')
        .eq('id', user.id)
        .single()

    if (!profile || !['super_admin', 'company_admin', 'manager'].includes(profile.role)) {
        return { error: 'No tienes permisos para ver el registro general.' }
    }

    // Convert YYYY-MM-DD to proper UTC range representing the Madrid day
    const start = `${dateIso}T00:00:00+01:00`
    const end = `${dateIso}T23:59:59+01:00`
    const date = new Date(dateIso)

    // 2. Obtener Perfiles de la EMPRESA
    let profilesQuery = supabase
        .from('profiles')
        .select('id, full_name, scheduled_hours, status, department_id, schedule_type, departments(name)')
        .eq('company_id', profile.company_id)
        .neq('status', 'terminated')

    if (profile.role === 'manager' && profile.department_id) {
        profilesQuery = profilesQuery.eq('department_id', profile.department_id)
    } else if (departmentId && departmentId !== 'all') {
        profilesQuery = profilesQuery.eq('department_id', departmentId)
    }

    const { data: dbProfiles, error: fetchError } = await profilesQuery

    if (fetchError) {
        return { error: `Error al obtener empleados: ${fetchError.message}` }
    }

    // 3. Filtrar por horario (si es fijo y no tiene turno hoy, no se lista)
    const dayOfWeek = date.getUTCDay() === 0 ? 7 : date.getUTCDay()
    const { data: allSchedules } = await supabase
        .from('work_schedules')
        .select('*')
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)

    const scheduledProfileIds = new Set(allSchedules?.map(s => s.profile_id) || [])

    const employees = (dbProfiles || []).filter(emp => {
        // Si es flexible, siempre se lista
        if (emp.schedule_type === 'flexible') return true
        // Si es fijo, debe tener un horario activo hoy
        return scheduledProfileIds.has(emp.id)
    })

    const empIds = employees.map(e => e.id)
    if (empIds.length === 0) return { employees: [] }

    // 4. Obtener Fichajes de la EMPRESA para esa fecha
    // Forzamos el filtro de company_id para asegurar que entran por RLS de Manager
    const { data: entries, error: entriesError } = await supabase
        .from('time_entries')
        .select('*')
        .eq('company_id', profile.company_id)
        .gte('clock_in', start)
        .lte('clock_in', end)
        .order('clock_in', { ascending: true })

    if (entriesError) {
        console.error('[Registry] Error fetching entries:', entriesError)
    }

    return {
        employees: employees.map(emp => {
            const empEntries = entries?.filter(en => en.user_id === emp.id) || []
            let totalWorkedMs = 0

            empEntries.forEach(en => {
                const clockIn = new Date(en.clock_in).getTime()

                // Get today's date in Madrid
                const todayMadrid = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date())

                const clockOut = en.clock_out
                    ? new Date(en.clock_out).getTime()
                    : (todayMadrid === dateIso ? new Date().getTime() : new Date(`${dateIso}T23:59:59+01:00`).getTime())

                totalWorkedMs += Math.max(0, clockOut - clockIn)
            })

            const workedHours = totalWorkedMs / (1000 * 60 * 60)
            const sched = allSchedules?.find(s => s.profile_id === emp.id)

            // Calculate real hours from schedule if it's fixed
            let scheduledHours = Number(emp.scheduled_hours) || 8.0
            if (sched) {
                if (emp.schedule_type === 'fixed' && sched.start_time && sched.end_time) {
                    const timeToHours = (t: string) => {
                        const [h, m] = t.split(':').map(Number)
                        return h + (m || 0) / 60
                    }
                    let total = timeToHours(sched.end_time) - timeToHours(sched.start_time)
                    if (sched.start_time_2 && sched.end_time_2) {
                        total += timeToHours(sched.end_time_2) - timeToHours(sched.start_time_2)
                    }
                    scheduledHours = total > 0 ? total : scheduledHours
                }
            }

            return {
                id: emp.id,
                name: emp.full_name,
                dept_name: (emp as any).departments ? (Array.isArray((emp as any).departments) ? (emp as any).departments[0]?.name : (emp as any).departments?.name) : null,
                prog: scheduledHours,
                trab: workedHours,
                dif: workedHours - scheduledHours,
                schedule: allSchedules?.find(s => s.profile_id === emp.id) ?
                    (() => {
                        const s = allSchedules.find(s => s.profile_id === emp.id)!
                        let text = `${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)}`
                        if (s.start_time_2) text += ` / ${s.start_time_2.slice(0, 5)} - ${s.end_time_2?.slice(0, 5)}`
                        return text
                    })() : 'Sin horario',
                entries: empEntries
                    .filter(en => en.incident_reason !== 'Incidencia: Fichaje realizado en día sin horario asignado')
                    .map(en => ({
                        id: en.id,
                        start: en.clock_in,
                        end: en.clock_out,
                        type: en.entry_type,
                        is_manual_correction: en.is_manual_correction,
                        correction_reason: en.correction_reason,
                        is_incident: en.is_incident,
                        incident_reason: en.incident_reason
                    }))
            }
        })
    }
}

export async function updateTimeEntry(entryId: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, company_id, department_id')
        .eq('id', user.id)
        .single()

    if (!profile || !['company_admin', 'manager', 'super_admin'].includes(profile.role)) {
        return { error: 'No tienes permisos para modificar registros.' }
    }

    // Get entry to check company
    const { data: entry } = await supabase.from('time_entries').select('company_id, user_id').eq('id', entryId).single()
    if (!entry || entry.company_id !== profile.company_id) {
        return { error: 'Registro no encontrado.' }
    }

    // If manager, check department of the owner of the entry
    if (profile.role === 'manager') {
        const { data: targetProfile } = await supabase.from('profiles').select('department_id').eq('id', entry.user_id).single()
        if (targetProfile?.department_id !== profile.department_id) {
            return { error: 'No puedes editar registros de otros departamentos.' }
        }
    }

    const clockIn = String(formData.get('clock_in'))
    const clockOut = String(formData.get('clock_out')) || null
    const reason = String(formData.get('correction_reason'))

    if (!reason || reason.trim().length < 5) {
        return { error: 'Debes proporcionar un motivo válido para la modificación (mín. 5 caracteres).' }
    }

    const { error } = await supabase.from('time_entries').update({
        clock_in: clockIn,
        clock_out: clockOut,
        is_manual_correction: true,
        correction_reason: reason,
        updated_at: new Date().toISOString()
    }).eq('id', entryId)

    if (error) return { error: error.message }

    return { success: true }
}
