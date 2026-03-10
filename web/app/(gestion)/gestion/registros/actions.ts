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

    const date = new Date(dateIso)
    const start = startOfDay(date).toISOString()
    const end = endOfDay(date).toISOString()

    // 2. Obtener Perfiles de la EMPRESA
    let profilesQuery = supabase
        .from('profiles')
        .select('id, full_name, scheduled_hours, status, department_id, schedule_type, departments(name), companies(settings)')
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

    // 3. Obtener Fichajes de la EMPRESA para esa fecha
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

    // 4. Filtrar por horario
    const dayOfWeek = date.getUTCDay() === 0 ? 7 : date.getUTCDay()
    const { data: allSchedulesToday } = await supabase
        .from('work_schedules')
        .select('*')
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)

    // Obtener si tienen ALGÚN horario en cualquier día (para filtrar flexible ruidoso)
    const { data: hasAnySchedule } = await supabase
        .from('work_schedules')
        .select('profile_id')
        .eq('is_active', true)

    const scheduledTodayIds = new Set(allSchedulesToday?.map(s => s.profile_id) || [])
    const anyScheduledIds = new Set(hasAnySchedule?.map(s => s.profile_id) || [])

    const employees = (dbProfiles || []).filter(emp => {
        // Siempre listar si tiene actividad hoy
        const hasActivity = entries?.some(en => en.user_id === emp.id)
        if (hasActivity) return true

        // Si es flexible
        if (emp.schedule_type === 'flexible') {
            // Si tiene horarios definidos para otros días pero no para hoy, lo ocultamos
            if (anyScheduledIds.has(emp.id) && !scheduledTodayIds.has(emp.id)) return false
            return true
        }

        // Si es fijo, debe tener un horario hoy
        return scheduledTodayIds.has(emp.id)
    })

    const todayMadrid = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date())
    const isToday = todayMadrid === dateIso

    return {
        employees: employees.map(emp => {
            const empEntries = entries?.filter(en => en.user_id === emp.id) || []
            let totalWorkedMs = 0

            empEntries.forEach(en => {
                const clockIn = new Date(en.clock_in).getTime()
                const clockOut = en.clock_out
                    ? new Date(en.clock_out).getTime()
                    : (isToday ? new Date().getTime() : new Date(en.clock_in).setHours(23, 59, 59, 999))

                totalWorkedMs += Math.max(0, clockOut - clockIn)
            })

            const workedHours = totalWorkedMs / (1000 * 60 * 60)
            const sched = allSchedulesToday?.find(s => s.profile_id === emp.id)

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
                    scheduledHours = total > 0 ? total : (sched.target_total_hours || scheduledHours)
                } else {
                    scheduledHours = sched.target_total_hours || scheduledHours
                }
            }

            // Incidencia en tiempo real por falta de fichaje inicial
            if (isToday && empEntries.length === 0 && sched && emp.schedule_type === 'fixed') {
                const nowMadrid = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" }))
                const currentSecs = nowMadrid.getHours() * 3600 + nowMadrid.getMinutes() * 60
                const [h, m] = sched.start_time.split(':').map(Number)
                const startSecs = h * 3600 + m * 60
                const margin = (emp.companies as any)?.settings?.incident_margin_minutes || 30

                if (currentSecs > (startSecs + margin * 60)) {
                    empEntries.push({
                        id: 'virtual-late',
                        clock_in: `${dateIso}T${sched.start_time}`,
                        clock_out: `${dateIso}T${sched.start_time}`,
                        is_incident: true,
                        incident_reason: 'Ausencia detectada: No se ha registrado la entrada todavía',
                        entry_type: 'work'
                    } as any)
                }
            }

            return {
                id: emp.id,
                name: emp.full_name,
                dept_name: (emp as any).departments ? (Array.isArray((emp as any).departments) ? (emp as any).departments[0]?.name : (emp as any).departments?.name) : null,
                prog: scheduledHours,
                trab: workedHours,
                dif: workedHours - scheduledHours,
                schedule: allSchedulesToday?.find(s => s.profile_id === emp.id) ?
                    (() => {
                        const s = allSchedulesToday.find(s => s.profile_id === emp.id)!
                        let text = `${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)}`
                        if (s.start_time_2) text += ` / ${s.start_time_2.slice(0, 5)} - ${s.end_time_2?.slice(0, 5)}`
                        return text
                    })() : 'Sin horario',
                rawSchedule: allSchedulesToday?.find(s => s.profile_id === emp.id) || null,
                scheduleType: emp.schedule_type,
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
