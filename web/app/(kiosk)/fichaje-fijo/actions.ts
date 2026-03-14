'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

/**
 * Validates a kiosk device by its API Key (token)
 */
export async function getKioskDevice(token: string) {
    const supabase = createAdminClient()
    const { data: device, error } = await supabase
        .from('devices')
        .select('*, companies(*, plans(*))')
        .eq('api_key', token)
        .eq('type', 'tablet_kiosk')
        .eq('is_active', true)
        .single()

    if (error || !device) return { error: 'Dispositivo no válido o inactivo' }
    return { data: device }
}

/**
 * Performs a clock-in/out operation for an employee via PIN in a specific kiosk
 */
export async function kioskClockAction(token: string, pin: string) {
    const supabase = createAdminClient()
    const now = new Date()

    // 1. Validate Device & Company
    const { data: device, error: devError } = await getKioskDevice(token)
    if (devError || !device) return { error: devError || 'Error de seguridad' }

    // 2. Validate Employee Profile (Search by company only first)
    const { data: employees, error: empError } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', device.company_id)

    if (empError || !employees || employees.length === 0) return { error: 'Error al buscar empleados' }

    // 2.1 Verify PIN using RPC for each potential match or find the one that matches
    // In our system, PINs are unique per company, so we can search for the profile that matches the PIN.
    const { data: isValidPin, error: pinError } = await supabase.rpc('verify_employee_pin_by_company', {
        p_company_id: device.company_id,
        p_pin: pin
    })

    if (pinError || !isValidPin) return { error: 'Código PIN no válido' }

    // 2.2 Get the specific employee that matched the PIN
    const { data: employee, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', device.company_id)
        .eq('id', isValidPin) // Note: I should update the RPC to return the ID or use a different flow
        .single()

    if (profileError || !employee) return { error: 'Error al recuperar perfil' }

    // 2.1 Check Account Status
    if (employee.status !== 'active') {
        const errorMsg = employee.status === 'medical_leave'
            ? 'No puedes fichar estando de baja médica.'
            : 'Tu cuenta está desactivada o en excedencia.'
        return { error: errorMsg }
    }

    // 2.2 Check Approved Time-Off (Holidays / Personal Days)
    const todayStr = new Date().toISOString().split('T')[0]
    const { data: leaveRequest } = await supabase
        .from('time_off_requests')
        .select('request_type')
        .eq('user_id', employee.id)
        .eq('status', 'approved')
        .lte('start_date', todayStr)
        .gte('end_date', todayStr)
        .maybeSingle()

    if (leaveRequest) {
        const labels: any = { vacation: 'vacaciones', personal: 'asuntos propios', medical: 'baja médica' }
        return { error: `No puedes fichar hoy. Estás disfrutando de ${labels[leaveRequest.request_type] || 'un día libre'}.` }
    }

    // 2.3 Check Work Schedule (Assigned Days)
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay()
    const { data: schedule } = await supabase
        .from('work_schedules')
        .select('is_active')
        .eq('profile_id', employee.id)
        .eq('day_of_week', dayOfWeek)
        .maybeSingle()

    if (!schedule || !schedule.is_active) {
        return { error: 'Hoy no es un día laboral asignado en tu calendario.' }
    }

    // 3. Determine if Clock-In or Clock-Out
    // We check if there's an open entry for this user
    const { data: openEntry } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', employee.id)
        .is('clock_out', null)
        .order('clock_in', { ascending: false })
        .limit(1)
        .maybeSingle()

    let type: 'in' | 'out' = openEntry ? 'out' : 'in'

    if (type === 'in') {
        const { error: clockError } = await supabase.from('time_entries').insert({
            user_id: employee.id,
            company_id: device.company_id,
            clock_in: now.toISOString(),
            origin: 'hardware_tablet',
            device_id: device.id,
            entry_type: 'work'
        })
        if (clockError) return { error: `Error al registrar entrada: ${clockError.message}` }
    } else {
        const { error: clockError } = await supabase
            .from('time_entries')
            .update({ clock_out: now.toISOString() })
            .eq('id', openEntry!.id)

        if (clockError) return { error: `Error al registrar salida: ${clockError.message}` }
    }

    return {
        success: true,
        type,
        time: now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        fullName: employee.full_name
    }
}

/**
 * Gets global kiosk settings (SuperAdmin)
 */
export async function getKioskSettings() {
    const supabase = createAdminClient()
    const { data: settings } = await supabase
        .from('system_settings')
        .select('*')
        .in('key', ['kiosk_reset_seconds', 'kiosk_idle_timeout_seconds', 'kiosk_default_image'])

    return {
        reset: settings?.find(s => s.key === 'kiosk_reset_seconds')?.value || '30',
        idle: settings?.find(s => s.key === 'kiosk_idle_timeout_seconds')?.value || '10',
        defaultImage: settings?.find(s => s.key === 'kiosk_default_image')?.value || null
    }
}
