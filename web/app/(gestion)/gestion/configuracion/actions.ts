'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createDepartment(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }
    const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', user.id).single()
    if (!profile || !['company_admin', 'manager'].includes(profile.role)) return { error: 'No tienes permisos' }

    const name = String(formData.get('name'))
    if (!name || name.trim().length === 0) return { error: 'El nombre es obligatorio' }

    const { error } = await supabase.from('departments').insert({
        company_id: profile.company_id,
        name: name
    })

    if (error) return { error: error.message }

    revalidatePath('/gestion/configuracion')
    return { success: true }
}

export async function deleteDepartment(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['company_admin', 'manager'].includes(profile.role)) return { error: 'No tienes permisos' }

    const { error } = await supabase.from('departments').delete().eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/gestion/configuracion')
    return { success: true }
}

export async function updateDepartment(id: string, name: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['company_admin', 'manager'].includes(profile.role)) return { error: 'No tienes permisos' }

    if (!name || name.trim().length === 0) return { error: 'El nombre es obligatorio' }

    const { error } = await supabase.from('departments').update({ name }).eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/gestion/configuracion')
    return { success: true }
}

export async function updateCompanySettings(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }
    const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', user.id).single()
    if (!profile || profile.role !== 'company_admin') return { error: 'No tienes permisos' }

    // Company Information
    const name = String(formData.get('name'))
    const cif = String(formData.get('cif'))
    const address = String(formData.get('address'))
    const email = String(formData.get('email'))
    const phone = String(formData.get('phone'))

    // Branding
    const logoLarge = String(formData.get('logo_large_url'))
    const logoApp = String(formData.get('logo_app_url'))
    const logoWeb = String(formData.get('logo_web_url'))
    const logoKiosk = String(formData.get('logo_kiosk_url'))

    // HR Settings
    const rawVacation = parseInt(String(formData.get('default_vacation_days')))
    const defaultVacation = isNaN(rawVacation) ? 22 : rawVacation

    const rawPersonal = parseInt(String(formData.get('default_personal_days')))
    const defaultPersonal = isNaN(rawPersonal) ? 0 : rawPersonal

    const rawMargin = parseInt(String(formData.get('incident_margin_minutes')))
    const incidentMargin = isNaN(rawMargin) ? 30 : rawMargin

    const rawAutoClockOut = parseInt(String(formData.get('auto_clock_out_hours')))
    const autoClockOut = isNaN(rawAutoClockOut) ? 12 : rawAutoClockOut

    // Fetch current settings to merge
    const { data: company } = await supabase.from('companies').select('settings').eq('id', profile.company_id).single()

    const newSettings = {
        ...(company?.settings || {}),
        default_vacation_days: defaultVacation,
        default_personal_days: defaultPersonal,
        incident_margin_minutes: incidentMargin,
        auto_clock_out_hours: autoClockOut,
        kiosk_image_url: logoKiosk
    }

    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin.from('companies').update({
        name,
        cif,
        address,
        email,
        phone,
        logo_large_url: logoLarge,
        logo_app_url: logoApp,
        logo_web_url: logoWeb,
        settings: newSettings,
        updated_at: new Date().toISOString()
    }).eq('id', profile.company_id)

    if (error) return { error: error.message }

    revalidatePath('/gestion/configuracion')
    return { success: true }
}

export async function start2FAActivation() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    // Use dynamic import to ensure it only runs on server
    const { generate2FASecret } = await import('@/lib/security')
    return await generate2FASecret(user.id, user.email!)
}

export async function complete2FAActivation(secret: string, token: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { verifyAndEnable2FA } = await import('@/lib/security')
    const success = await verifyAndEnable2FA(user.id, secret, token)

    if (success) {
        revalidatePath('/gestion/configuracion')
        revalidatePath('/gestion/perfil')
        return { success: true }
    }
    return { error: 'Token inválido' }
}

export async function getCompanyKioskData() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null

        const supabaseAdmin = createAdminClient()
        const { data: profile } = await supabaseAdmin.from('profiles').select('company_id').eq('id', user.id).single()
        if (!profile?.company_id) return null

        const { data: devices, error } = await supabaseAdmin
            .from('devices')
            .select('*')
            .eq('company_id', profile.company_id)
            .eq('type', 'tablet_kiosk')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)

        if (error) {
            console.error('Error fetching kiosk data:', error)
            return null
        }

        return devices?.[0] || null
    } catch (e) {
        console.error('Unexpected error in getCompanyKioskData:', e)
        return null
    }
}

export async function createCompanyKioskToken() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'No autenticado' }

        const supabaseAdmin = createAdminClient()
        const { data: profile } = await supabaseAdmin.from('profiles').select('company_id, role').eq('id', user.id).single()

        if (!profile || profile.role !== 'company_admin') {
            return { error: 'No tienes permisos de administrador' }
        }

        // Check if one already exists to avoid duplicates
        const existingKiosk = await getCompanyKioskData()
        if (existingKiosk) return { data: existingKiosk.api_key }

        const { data: device, error } = await supabaseAdmin.from('devices').insert({
            company_id: profile.company_id,
            name: 'Terminal Tablet Principal',
            type: 'tablet_kiosk',
            is_active: true
        }).select('api_key').single()

        if (error) {
            console.error('Error creating kiosk token:', error)
            return { error: `Error de base de datos: ${error.message}` }
        }

        revalidatePath('/gestion/configuracion')
        return { data: device.api_key }
    } catch (e: any) {
        console.error('Unexpected error in createCompanyKioskToken:', e)
        return { error: e.message || 'Error inesperado' }
    }
}

export async function toggleKioskStatus(deviceId: string, currentStatus: boolean) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'No autenticado' }

        const supabaseAdmin = createAdminClient()
        const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
        if (!profile || profile.role !== 'company_admin') return { error: 'No tienes permisos' }

        const { error } = await supabaseAdmin
            .from('devices')
            .update({ is_active: !currentStatus })
            .eq('id', deviceId)

        if (error) return { error: error.message }

        revalidatePath('/gestion/configuracion')
        return { success: true }
    } catch (e: any) {
        return { error: e.message }
    }
}

export async function deleteKioskToken() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'No autenticado' }

        const supabaseAdmin = createAdminClient()
        const { data: profile } = await supabaseAdmin.from('profiles').select('company_id, role').eq('id', user.id).single()
        if (!profile || profile.role !== 'company_admin') return { error: 'No tienes permisos' }

        const { error } = await supabaseAdmin
            .from('devices')
            .update({
                is_active: false,
            })
            .eq('company_id', profile.company_id)
            .eq('type', 'tablet_kiosk')

        if (error) return { error: error.message }

        revalidatePath('/gestion/configuracion')
        return { success: true }
    } catch (e: any) {
        return { error: e.message }
    }
}
