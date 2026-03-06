'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createDepartment(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Auth & Permission Check
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

    revalidatePath('/settings')
    return { success: true }
}

export async function deleteDepartment(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Auth & Permission Check
    if (!user) return { error: 'No autenticado' }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['company_admin', 'manager'].includes(profile.role)) return { error: 'No tienes permisos' }

    const { error } = await supabase.from('departments').delete().eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/settings')
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

    // HR Settings
    const rawVacation = parseInt(String(formData.get('default_vacation_days')))
    const defaultVacation = isNaN(rawVacation) ? 22 : rawVacation

    const rawPersonal = parseInt(String(formData.get('default_personal_days')))
    const defaultPersonal = isNaN(rawPersonal) ? 0 : rawPersonal

    // Fetch current settings to merge
    const { data: company } = await supabase.from('companies').select('settings').eq('id', profile.company_id).single()

    const newSettings = {
        ...(company?.settings || {}),
        default_vacation_days: defaultVacation,
        default_personal_days: defaultPersonal
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

    revalidatePath('/settings')
    return { success: true }
}
