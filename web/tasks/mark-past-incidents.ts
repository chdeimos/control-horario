import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
    console.log('--- Analizando fichajes históricos ---')

    // 1. Obtener todos los horarios
    const { data: schedules } = await supabase.from('work_schedules').select('*')

    // 2. Obtener todos los perfiles con tipo de horario
    const { data: profiles } = await supabase.from('profiles').select('id, schedule_type')

    // 3. Obtener todos los fichajes
    const { data: entries } = await supabase.from('time_entries').select('*')

    // 4. Obtener todas las empresas para sus configuraciones
    const { data: companies } = await supabase.from('companies').select('id, settings')

    if (!entries || !profiles || !schedules || !companies) return

    for (const entry of entries) {
        const profile = profiles.find(p => p.id === entry.user_id)
        if (!profile) continue

        const company = companies.find(c => c.id === entry.company_id)
        const settings = company?.settings || {}
        const marginMinutes = settings.incident_margin_minutes ?? 30
        const margin = marginMinutes * 60
        const autoClockOutHours = settings.auto_clock_out_hours ?? 12

        let isIncident = false
        let reason = ''

        // CHECK 1: Long entries (Forgotten clock-out)
        if (entry.clock_out) {
            const start = new Date(entry.clock_in).getTime()
            const end = new Date(entry.clock_out).getTime()
            const durationHours = (end - start) / (1000 * 60 * 60)

            if (durationHours > autoClockOutHours + 0.1) { // small buffer
                isIncident = true
                reason = `Incidencia: Registro excesivo (${durationHours.toFixed(1)}h). Posible olvido de salida.`
            }
        }

        // CHECK 2: Schedule violation (only if not already an incident and fixed schedule)
        if (!isIncident && profile.schedule_type === 'fixed') {
            const date = new Date(entry.clock_in)
            const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay()
            const schedule = schedules.find(s => s.profile_id === entry.user_id && s.day_of_week === dayOfWeek)

            if (!schedule) {
                isIncident = true
                reason = 'Incidencia: Fichaje realizado en día sin horario asignado'
            } else {
                // Check times
                const currentSeconds = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()
                const timeToSeconds = (timeStr: string) => {
                    const [h, m, s] = timeStr.split(':').map(Number)
                    return h * 3600 + (m || 0) * 60 + (s || 0)
                }

                const s1 = timeToSeconds(schedule.start_time)
                const s2 = schedule.start_time_2 ? timeToSeconds(schedule.start_time_2) : null

                const diff1 = Math.abs(currentSeconds - s1)
                const diff2 = s2 !== null ? Math.abs(currentSeconds - s2) : Infinity

                if (diff1 > margin && diff2 > margin) {
                    isIncident = true
                    reason = `Incidencia: Fuera de horario laboral (Margen: ${marginMinutes}m)`
                }
            }
        }

        if (isIncident && entry.incident_reason !== reason) {
            console.log(`Actualizando incidencia para ${entry.id} (Empresa: ${company?.id}): ${reason}`)
            await supabase.from('time_entries').update({
                is_incident: true,
                incident_reason: reason,
                is_audited: false // Mark as pending for review if updated
            }).eq('id', entry.id)
        }
    }

    console.log('--- Proceso finalizado ---')
}

run()
