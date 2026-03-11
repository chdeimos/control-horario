import { createAdminClient } from './supabase/admin'
import { sendTemplatedEmail } from './send-custom-email'

export async function checkAndNotifyMissingClocks() {
    const supabase = createAdminClient()
    const now = new Date()

    // Madrid Time calculation
    const madridTime = new Intl.DateTimeFormat('es-ES', {
        timeZone: 'Europe/Madrid',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        weekday: 'long'
    }).format(now)

    // Day of week (1: Lunes, 7: Domingo)
    const daysMap: Record<string, number> = {
        'lunes': 1, 'martes': 2, 'miércoles': 3, 'jueves': 4, 'viernes': 5, 'sábado': 6, 'domingo': 7
    }
    const dayOfWeekStr = new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', weekday: 'long' }).format(now).toLowerCase()
    const dayOfWeek = daysMap[dayOfWeekStr] || now.getDay()

    // Extract the time part (HH:mm:ss) reliably
    const timeMatch = madridTime.match(/(\d{2}:\d{2}:\d{2})/);
    const currentTimeStr = timeMatch ? timeMatch[1] : '00:00:00';

    const auditResults: string[] = [] // Tracking result for the admin report

    const timeToSeconds = (t: string) => {
        const [h, m, s] = t.split(':').map(Number)
        return (h || 0) * 3600 + (m || 0) * 60 + (s || 0)
    }
    const currentSeconds = timeToSeconds(currentTimeStr)

    // Robust Madrid Date calculation for queries
    const madridDateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' })
    const todayStr = madridDateFormatter.format(now)
    const startOfMadridToday = `${todayStr}T00:00:00+01:00`
    const endOfMadridToday = `${todayStr}T23:59:59+01:00`

    // 1. Get all active profiles with assigned schedules and their company settings
    const { data: profiles } = await supabase
        .from('profiles')
        .select(`
            id, 
            full_name, 
            email, 
            company_id,
            schedule_type,
            companies (settings),
            work_schedules (*)
        `)
        .in('schedule_type', ['fixed', 'flexible']) // Include both types
        .eq('status', 'active')

    if (!profiles) return

    // --- 0. CLEANUP: Forgotten clocks from PREVIOUS days ---
    const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().split('T')[0]
    const { data: forgottenEntries } = await supabase
        .from('time_entries')
        .select('id, clock_in, profiles(id, full_name, email)')
        .is('clock_out', null)
        .lt('clock_in', startOfMadridToday) // Started before 00:00 today in Madrid

    if (forgottenEntries && forgottenEntries.length > 0) {
        for (const entry of forgottenEntries) {
            const clockInDate = new Date(entry.clock_in)
            const diffMs = now.getTime() - clockInDate.getTime()
            const diffHours = diffMs / (1000 * 60 * 60)

            // SAFETY THRESHOLD: If they started < 16 hours ago, they might be in a night shift
            // We ignore them for now and let the specific daily audit decide if they should close
            if (diffHours < 16) continue

            const autoOutDate = new Date(clockInDate)
            autoOutDate.setHours(23, 59, 59, 999)

            await supabase
                .from('time_entries')
                .update({
                    clock_out: autoOutDate.toISOString(),
                    is_incident: true,
                    incident_reason: 'Incidencia: Fichaje olvidado de día anterior. Cierre automático de seguridad.'
                })
                .eq('id', entry.id)

            const prof = entry.profiles as any
            auditResults.push(`Limpieza: Fichaje olvidado de <b>${prof?.full_name}</b> del día ${entry.clock_in.split('T')[0]} cerrado (excedió 16h).`)

            if (prof?.email) {
                await sendTemplatedEmail(
                    prof.email,
                    'forgotten_clock_closed',
                    {
                        FullName: prof.full_name,
                        Date: entry.clock_in.split('T')[0]
                    }
                )
            }
        }
    }

    for (const profile of profiles) {
        if (!profile.email) {
            auditResults.push(`⚠️ El perfil <b>${profile.full_name}</b> no tiene email configurado. No se pueden enviar avisos.`);
            continue
        }
        const companySettings = (profile.companies as any)?.settings || {}

        // 1. Margen para detectar incidencia (Ej: 30 min por defecto)
        const marginMinutes = companySettings.incident_margin_minutes ?? 30

        // 2. Margen para cierre automático tras fin de jornada (Olvido de salida)
        const autoOutMarginMinutes = 60

        // Skip if they don't have a schedule for today
        const todaySchedule = profile.work_schedules?.find((s: any) => s.day_of_week === dayOfWeek)
        if (!todaySchedule || !todaySchedule.is_active) continue

        // Check for vacations/absences today
        const todayStr = now.toISOString().split('T')[0]
        const { data: timeOff } = await supabase
            .from('time_off_requests')
            .select('id')
            .eq('user_id', profile.id)
            .eq('status', 'approved')
            .lte('start_date', todayStr)
            .gte('end_date', todayStr)
            .limit(1)
            .maybeSingle()

        if (timeOff) continue // User is on leave

        // Proactive Reminders (ONLY for Fixed Schedules)
        if (profile.schedule_type === 'fixed') {
            // Check Clock-In (start_time)
            await processClockEvent(
                supabase,
                profile,
                todaySchedule.start_time,
                'in_1',
                currentSeconds,
                todayStr,
                now,
                'entrada',
                marginMinutes,
                auditResults,
                startOfMadridToday,
                endOfMadridToday
            )

            // Check Clock-In 2 (optional)
            if (todaySchedule.start_time_2) {
                await processClockEvent(
                    supabase,
                    profile,
                    todaySchedule.start_time_2,
                    'in_2',
                    currentSeconds,
                    todayStr,
                    now,
                    'entrada (segundo turno)',
                    marginMinutes,
                    auditResults,
                    startOfMadridToday,
                    endOfMadridToday
                )
            }

            // Check Clock-Out (end_time)
            await processClockOutEvent(
                supabase,
                profile,
                todaySchedule.end_time,
                'out_1',
                currentSeconds,
                todayStr,
                now,
                autoOutMarginMinutes,
                auditResults
            )

            if (todaySchedule.end_time_2) {
                await processClockOutEvent(
                    supabase,
                    profile,
                    todaySchedule.end_time_2,
                    'out_2',
                    currentSeconds,
                    todayStr,
                    now,
                    autoOutMarginMinutes,
                    auditResults
                )
            }
        } else if (profile.schedule_type === 'flexible') {
            // Flexible Auto-Out logic: checks targets to allow night shifts
            await processFlexibleAutoClockOut(
                supabase,
                profile,
                todaySchedule,
                currentSeconds,
                todayStr,
                now,
                auditResults
            )
        }

        // End of day audit (For BOTH types)
        await processDailyAbsenceCheck(
            supabase,
            profile,
            todaySchedule,
            currentSeconds,
            todayStr,
            now,
            auditResults,
            startOfMadridToday,
            endOfMadridToday
        )
    }

    // --- TEMPORARY CRON REPORTING (FOR SUPER ADMIN) ---
    const { data: superAdmins } = await supabase.from('profiles').select('email').eq('role', 'super_admin')
    const adminEmail = superAdmins?.[0]?.email

    if (adminEmail) {
        const reportBody = auditResults.length > 0
            ? `<p>Resumen de acciones realizadas:</p><ul>${auditResults.map(r => `<li>${r}</li>`).join('')}</ul>`
            : '<p>No se han detectado incidencias ni se han requerido acciones automáticas en este ciclo.</p>'

        await sendTemplatedEmail(
            adminEmail,
            'cron_surveillance_report',
            {
                Time: madridTime,
                ReportBody: reportBody
            }
        )
    }
}


async function processClockEvent(supabase: any, profile: any, eventTimeStr: string, eventKeySuffix: string, currentSeconds: number, dateStr: string, now: Date, label: string, marginMinutes: number, auditResults: string[], startOfMadridToday: string, endOfMadridToday: string) {
    const timeToSeconds = (t: string) => {
        const [h, m, s] = t.split(':').map(Number)
        return h * 3600 + (m || 0) * 60 + (s || 0)
    }
    const eventSeconds = timeToSeconds(eventTimeStr)
    const diff = currentSeconds - eventSeconds
    const marginSeconds = marginMinutes * 60

    // Si llega mÃ¡s tarde que el margen de incidencia
    if (diff > marginSeconds && diff < 14400) { // Hasta 4h de retraso
        const eventKey = `${eventKeySuffix}_${dateStr}`

        // 1. Check if already notified
        const { data: log } = await supabase
            .from('notification_logs')
            .select('id')
            .eq('user_id', profile.id)
            .eq('event_key', eventKey)
            .maybeSingle()

        if (log) return // Already sent

        // 2. Check if they already ficharon
        const { data: entry } = await supabase
            .from('time_entries')
            .select('id')
            .eq('user_id', profile.id)
            .gte('clock_in', startOfMadridToday)
            .lte('clock_in', endOfMadridToday)
            .limit(1)
            .maybeSingle()

        if (!entry) {
            // Log the notification to avoid duplicates
            await supabase.from('notification_logs').insert({
                user_id: profile.id,
                notification_type: 'missing_clock_in_reminder',
                event_key: eventKey
            })

            auditResults.push(`Aviso enviado a <b>${profile.full_name}</b>: Entrada pendiente (${eventTimeStr})`)

            await sendTemplatedEmail(
                profile.email,
                'clock_in_reminder',
                {
                    FullName: profile.full_name,
                    Label: label,
                    EventTime: eventTimeStr,
                    Margin: String(marginMinutes)
                }
            )
        }
    }
}

async function processClockOutEvent(supabase: any, profile: any, eventTimeStr: string, eventKeySuffix: string, currentSeconds: number, dateStr: string, now: Date, autoOutMarginMinutes: number, auditResults: string[]) {
    const timeToSeconds = (t: string) => {
        const [h, m, s] = t.split(':').map(Number)
        return h * 3600 + (m || 0) * 60 + (s || 0)
    }
    const eventSeconds = timeToSeconds(eventTimeStr)
    const diff = currentSeconds - eventSeconds
    const marginSeconds = autoOutMarginMinutes * 60

    if (diff > marginSeconds && diff < 43200) { // Ampliamos hasta 12h de retraso para el cierre automÃ¡tico
        const eventKey = `${eventKeySuffix}_${dateStr}`

        // Check if there's an open entry
        const { data: activeEntry } = await supabase
            .from('time_entries')
            .select('id')
            .eq('user_id', profile.id)
            .is('clock_out', null)
            .maybeSingle()

        if (activeEntry) {
            // AUTO CLOCK-OUT: Siempre cerramos si ha pasado el margen de 1h
            const [hours, minutes] = eventTimeStr.split(':').map(Number)
            const autoOutDate = new Date(now)
            autoOutDate.setHours(hours, minutes, 0, 0)

            await supabase
                .from('time_entries')
                .update({
                    clock_out: autoOutDate.toISOString(),
                    is_incident: true,
                    incident_reason: `Incidencia: Salida no registrada. Cierre automÃ¡tico del sistema (Margen ${autoOutMarginMinutes} min tras salida prog. ${eventTimeStr}).`
                })
                .eq('id', activeEntry.id)

            auditResults.push(`Cierre AutomÃ¡tico (Fijo): <b>${profile.full_name}</b> se quedÃ³ abierto desde las ${activeEntry.clock_in}.`)

            // Check if already notified
            const { data: log } = await supabase
                .from('notification_logs')
                .select('id')
                .eq('user_id', profile.id)
                .eq('event_key', eventKey)
                .maybeSingle()

            if (!log) {
                await supabase.from('notification_logs').insert({
                    user_id: profile.id,
                    notification_type: 'missing_clock_out',
                    event_key: eventKey
                })

                await sendTemplatedEmail(
                    profile.email,
                    'clock_out_auto_closed',
                    {
                        FullName: profile.full_name,
                        EventTime: eventTimeStr
                    }
                )
            }
        }
    }
}
async function processFlexibleAutoClockOut(supabase: any, profile: any, schedule: any, currentSeconds: number, dateStr: string, now: Date, auditResults: string[]) {
    // 1. Check for open entry
    const { data: activeEntry } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', profile.id)
        .is('clock_out', null)
        .maybeSingle()

    if (activeEntry) {
        const clockInDate = new Date(activeEntry.clock_in)
        const diffMs = now.getTime() - clockInDate.getTime()
        const workedHours = diffMs / (1000 * 60 * 60)

        // Target hours for this user today (from our new column)
        const targetHours = schedule.target_total_hours || 8.0

        // AUTO-OUT CRITERIA (Flexible):
        // Only close if:
        // a) They have worked more than they were supposed to + a safety margin (e.g. Target + 5 hours)
        // b) AND they have been working for more than a reasonable continuous shift (e.g. 14 hours)
        // This ensures if they start at 23h and need 8h, they can work until 07h-09h without system interruption.

        const safetyMargin = 5.0
        const maxShiftDuration = 14.0

        if (workedHours > (targetHours + safetyMargin) || workedHours > maxShiftDuration) {
            const eventKey = `auto_out_flex_${dateStr}_${activeEntry.id}`
            const { data: log } = await supabase.from('notification_logs').select('id').eq('event_key', eventKey).maybeSingle()
            if (log) return

            // Close at current time (since flexible doesn't have a fixed exit)
            await supabase
                .from('time_entries')
                .update({
                    clock_out: now.toISOString(),
                    is_incident: true,
                    incident_reason: `Incidencia: Cierre automático por exceso de jornada flexible (${workedHours.toFixed(1)}h trabajadas sobre objetivo de ${targetHours}h).`
                })
                .eq('id', activeEntry.id)

            await supabase.from('notification_logs').insert({
                user_id: profile.id,
                notification_type: 'missing_clock_out',
                event_key: eventKey
            })

            auditResults.push(`Cierre Automático (FLEX): <b>${profile.full_name}</b> cerrado tras ${workedHours.toFixed(1)}h de trabajo.`)

            await sendTemplatedEmail(
                profile.email,
                'flexible_clock_out_auto_closed',
                {
                    FullName: profile.full_name,
                    WorkedHours: workedHours.toFixed(1),
                    TargetHours: String(targetHours)
                }
            )
        }
    }
}

async function processDailyAbsenceCheck(supabase: any, profile: any, schedule: any, currentSeconds: number, dateStr: string, now: Date, auditResults: string[], startOfMadridToday: string, endOfMadridToday: string) {
    const timeToSeconds = (t: string) => {
        if (!t) return 0
        const [h, m] = t.split(':').map(Number)
        return h * 3600 + (m || 0) * 60
    }

    // Determine the last end time of the day for this user
    let lastEndTime = '18:00' // Default fallback
    if (profile.schedule_type === 'fixed') {
        const endTimes = [schedule.end_time, schedule.end_time_2].filter(Boolean) as string[]
        lastEndTime = endTimes.sort().reverse()[0] || '18:00'
    } else {
        // For flexible users, we audit them at the very end of the day (00:00 / 23:45)
        lastEndTime = '23:45'
    }

    const lastEndSeconds = timeToSeconds(lastEndTime)
    const marginForAbsence = profile.schedule_type === 'flexible' ? 0 : 1800 // No margin for flex, already at end of day

    // If day is practically over for them (Fixed: End + 30m, Flexible: after 23:45)
    if (currentSeconds > lastEndSeconds + marginForAbsence) {
        const eventKey = `daily_absence_${dateStr}`

        // 1. Check if already processed
        const { data: log } = await supabase
            .from('notification_logs')
            .select('id')
            .eq('user_id', profile.id)
            .eq('event_key', eventKey)
            .maybeSingle()

        if (log) return

        // 2. Check if they have ANY entry for today
        const { data: anyEntry } = await supabase
            .from('time_entries')
            .select('id')
            .eq('user_id', profile.id)
            .gte('clock_in', startOfMadridToday)
            .lte('clock_in', endOfMadridToday)
            .limit(1)
            .maybeSingle()

        if (!anyEntry) {
            // It's a total absence for a scheduled workday
            await supabase.from('notification_logs').insert({
                user_id: profile.id,
                notification_type: 'daily_absence',
                event_key: eventKey
            })

            // Record as a technical incident entry (0 duration)
            const startTimeStr = schedule.start_time || '09:00'
            const [h, m] = startTimeStr.split(':').map(Number)
            const incidentTime = new Date(now)
            incidentTime.setHours(h, m, 0, 0)

            await supabase.from('time_entries').insert({
                user_id: profile.id,
                company_id: profile.company_id,
                clock_in: incidentTime.toISOString(),
                clock_out: incidentTime.toISOString(),
                is_incident: true,
                incident_reason: 'Horario laboral sin fichar',
                origin: 'system',
                entry_type: 'work'
            })

            auditResults.push(`Falta de Asistencia: <b>${profile.full_name}</b> no ha fichado hoy. Incidencia creada.`)

            await sendTemplatedEmail(
                profile.email,
                'daily_absence_incident',
                {
                    FullName: profile.full_name,
                    Date: dateStr
                }
            )
        }
    }
}
