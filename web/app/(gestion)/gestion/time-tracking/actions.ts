'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendEmailNotification } from '@/lib/email'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getLastEntry() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Buscar la última entrada que NO tenga clock_out (sesión activa)
    const { data: activeEntry } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .is('clock_out', null)
        .single()

    return activeEntry
}

async function checkScheduleRestriction(userId: string, isClockIn: boolean) {
    const supabase = await createClient()
    const now = new Date()
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay()

    const { data: profile } = await supabase
        .from('profiles')
        .select('schedule_type')
        .eq('id', userId)
        .single()

    if (!profile || profile.schedule_type === 'flexible') {
        return { isIncident: false }
    }

    const { data: schedule } = await supabase
        .from('work_schedules')
        .select('*')
        .eq('profile_id', userId)
        .eq('day_of_week', dayOfWeek)
        .single()

    if (!schedule) {
        return { error: 'No tienes un horario asignado para el día de hoy.' }
    }

    const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
    const timeToSeconds = (timeStr: string) => {
        const [h, m, s] = timeStr.split(':').map(Number)
        return h * 3600 + (m || 0) * 60 + (s || 0)
    }

    const margin = 30 * 60 // 30 mins
    let isIncident = false

    if (isClockIn) {
        const s1 = timeToSeconds(schedule.start_time)
        const s2 = schedule.start_time_2 ? timeToSeconds(schedule.start_time_2) : null
        const diff1 = Math.abs(currentSeconds - s1)
        const diff2 = s2 !== null ? Math.abs(currentSeconds - s2) : Infinity
        if (diff1 > margin && diff2 > margin) isIncident = true
    } else {
        const e1 = timeToSeconds(schedule.end_time)
        const e2 = schedule.end_time_2 ? timeToSeconds(schedule.end_time_2) : null
        const diff1 = Math.abs(currentSeconds - e1)
        const diff2 = e2 !== null ? Math.abs(currentSeconds - e2) : Infinity
        if (diff1 > margin && diff2 > margin) isIncident = true
    }

    return { isIncident }
}

export async function clockIn(lat: number, lng: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    // Restricción de horario
    const restriction = await checkScheduleRestriction(user.id, true)
    if (restriction.error) return { error: restriction.error }

    // Obtener company_id del usuario
    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, status')
        .eq('id', user.id)
        .single()

    if (!profile) return { error: 'Perfil no encontrado' }

    if (profile.status !== 'active') {
        const errorMsg = profile.status === 'medical_leave'
            ? 'No puedes fichar estando de baja médica.'
            : 'Tu cuenta está desactivada o en excedencia.'
        return { error: errorMsg }
    }

    const { error } = await supabase.from('time_entries').insert({
        user_id: user.id,
        company_id: profile.company_id,
        clock_in: new Date().toISOString(),
        origin: 'web',
        gps_lat: lat,
        gps_long: lng,
        is_incident: restriction.isIncident,
        incident_reason: restriction.isIncident ? 'Incidencia generada automáticamente por el sistema, Fuera de horario laboral' : null
    })

    if (error) {
        console.error('Clock In Error:', error)
        return { error: error.message }
    }

    // Notify if incident
    if (restriction.isIncident && user.email) {
        try {
            const { data: prof } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
            await sendEmailNotification(
                user.email,
                'Aviso de Incidencia en Fichaje ⚠️',
                `
                <p>Hola ${prof?.full_name || 'Empleado'},</p>
                <p>Se ha detectado una <strong>incidencia automática</strong> en tu fichaje de entrada hoy a las ${new Date().toLocaleTimeString()}.</p>
                <p><strong>Motivo:</strong> El registro se ha realizado fuera del margen permitido de tu horario asignado.</p>
                <p>Por favor, revisa tu registro y justifica la incidencia si es necesario.</p>
                `
            )
        } catch (err) { console.error('Incident email failed:', err) }
    }

    revalidatePath('/dashboard')
    revalidatePath('/time-entries')
    return { success: true }
}

export async function clockOut(lat: number, lng: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    // Restricción de horario (incidencia al salir)
    const restriction = await checkScheduleRestriction(user.id, false)
    // No bloqueamos la salida aunque no haya horario (por seguridad), pero marcamos incidencia si existe

    // Buscar la entrada activa
    const { data: activeEntry } = await supabase
        .from('time_entries')
        .select('id, is_incident')
        .eq('user_id', user.id)
        .is('clock_out', null)
        .single()

    if (!activeEntry) return { error: 'No tienes una sesión activa para cerrar.' }

    // Si ya era incidencia al entrar, mantenemos el flag. Si no, vemos si lo es al salir.
    const willBeIncident = activeEntry.is_incident || restriction.isIncident

    const { error } = await supabase
        .from('time_entries')
        .update({
            clock_out: new Date().toISOString(),
            is_incident: willBeIncident,
            incident_reason: placeholderIncidentReason(!!activeEntry.is_incident, !!restriction.isIncident)
        })
        .eq('id', activeEntry.id)

    if (error) {
        console.error('Clock Out Error:', error)
        return { error: error.message }
    }

    // Notify if the clock-out triggered a NEW incident
    if (restriction.isIncident && user.email) {
        try {
            const { data: prof } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
            await sendEmailNotification(
                user.email,
                'Aviso de Incidencia en Salida ⚠️',
                `
                <p>Hola ${prof?.full_name || 'Empleado'},</p>
                <p>Se ha detectado una <strong>incidencia automática</strong> al cerrar tu jornada hoy a las ${new Date().toLocaleTimeString()}.</p>
                <p><strong>Motivo:</strong> La salida se ha registrado fuera del margen de tu horario asignado.</p>
                <p>Por favor, revisa tu registro y justifica la incidencia si es necesario.</p>
                `
            )
        } catch (err) { console.error('Incident email failed:', err) }
    }

    revalidatePath('/dashboard')
    revalidatePath('/time-entries')
    return { success: true }
}

function placeholderIncidentReason(inInc: boolean, outInc: boolean) {
    if (inInc || outInc) return 'Incidencia generada automáticamente por el sistema, Fuera de horario laboral'
    return null
}
