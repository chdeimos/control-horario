'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

function validateCIF(cif: string) {
    // Basic Spanish CIF/NIF regex
    const regex = /^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$|^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
    return regex.test(cif.trim());
}

export async function getCompanies() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    // Check Super Admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super_admin') return { error: 'No tienes permisos' }

    // Fetch Companies with Plan Join
    const { data: companies, error } = await supabase
        .from('companies')
        .select('*, plans(*)')
        .order('created_at', { ascending: false })

    if (error) return { error: error.message }

    const companiesWithCounts = await Promise.all(companies.map(async (c: any) => {
        const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', c.id)
            .eq('is_active', true)

        return {
            ...c,
            active_users: count || 0
        }
    }))

    return { data: companiesWithCounts }
}

export async function createCompany(formData: FormData) {
    const supabase = await createClient()
    const name = String(formData.get('name'))
    const cif = String(formData.get('cif'))
    const planId = String(formData.get('plan_id'))

    if (!validateCIF(cif)) {
        return { error: 'El CIF proporcionado no tiene un formato válido.' }
    }

    const { data: company, error } = await supabase
        .from('companies')
        .insert({
            name,
            cif,
            plan_id: planId,
            is_active: true
        })
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath('/admin/companies')
    return { success: true, data: company }
}

export async function updateCompany(id: string, formData: FormData) {
    const supabase = await createClient()
    const name = String(formData.get('name'))
    const cif = String(formData.get('cif'))
    const planId = String(formData.get('plan_id'))
    const isActive = formData.get('is_active') === 'on'

    if (!validateCIF(cif)) {
        return { error: 'El CIF proporcionado no tiene un formato válido.' }
    }

    const { error } = await supabase
        .from('companies')
        .update({
            name,
            cif,
            plan_id: planId,
            is_active: isActive
        })
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/companies')
    revalidatePath('/admin')
    return { success: true }
}

export async function deleteCompany(id: string) {
    const supabase = await createClient()

    // Check for users
    const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', id)

    if (countError) return { error: countError.message }
    if (count && count > 0) {
        return { error: 'No se puede eliminar una empresa que tiene usuarios registrados. Elimina los usuarios primero.' }
    }

    const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/companies')
    return { success: true }
}

export async function createCompanyAdmin(companyId: string, formData: FormData) {
    const email = String(formData.get('email'))
    const fullName = String(formData.get('full_name'))

    if (!email || !fullName) return { error: 'Email y nombre son obligatorios' }

    const supabaseAdmin = createAdminClient()

    const { headers } = await import('next/headers')
    let h: any
    try { h = await headers() } catch { h = headers() }
    const host = h.get('host') || '127.0.0.1:3000'
    const protocol = h.get('x-forwarded-proto') || (host.includes('127.0.0.1') || host.includes('localhost') ? 'http' : 'https')
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`

    // 1. Invite User
    let inviteData = null
    const { data, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${siteUrl}/auth/callback?next=/set-password`
    })

    if (inviteError) {
        // If user already exists, we try to send a password reset as a "re-invite"
        if (inviteError.message.includes('already been registered')) {
            const supabase = await createClient()
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${siteUrl}/auth/callback?next=/set-password`
            })

            if (resetError) return { error: `El usuario ya existe pero no pudimos enviar el correo de recuperación: ${resetError.message}` }

            // Still need to fetch the existing user id to update the profile
            const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
            const existingUser = users.find(u => u.email === email)
            if (!existingUser) return { error: 'Error crítico: No se encuentra al usuario registrado.' }

            inviteData = { user: existingUser }
        } else {
            return { error: `Error invitando admin: ${inviteError.message}` }
        }
    } else {
        inviteData = data
    }

    if (!inviteData?.user) return { error: 'No se pudo obtener la información del usuario.' }

    // 2. Create or Update Profile as company_admin
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
        id: inviteData.user.id,
        company_id: companyId,
        role: 'company_admin',
        full_name: fullName,
        is_active: true
    }, { onConflict: 'id' })

    if (profileError) return { error: `Admin invitado pero error al gestionar perfil: ${profileError.message}` }

    revalidatePath('/admin/companies')
    return { success: true }
}
