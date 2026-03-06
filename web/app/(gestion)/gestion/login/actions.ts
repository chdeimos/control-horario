'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { shouldRequest2FA, verify2FAToken } from '@/lib/security'
import { createAdminClient } from '@/lib/supabase/admin'

export async function signIn(formData: FormData) {
    const email = String(formData.get('email'))
    const password = String(formData.get('password'))

    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        console.error('Login error:', error)
        return { error: 'Credenciales inválidas o error de conexión.' }
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        const is2FARequired = await shouldRequest2FA(user.id)

        if (is2FARequired) {
            return { requires2FA: true, userId: user.id }
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role === 'super_admin') {
            redirect('/d105')
        }

        const allowedRoles = ['company_admin', 'manager']
        if (allowedRoles.includes(profile?.role || '')) {
            redirect('/gestion')
        } else {
            redirect('/fichaje')
        }
    }

    return { error: 'Error desconocido al iniciar sesión.' }
}

export async function verify2FALogin(userId: string, token: string) {
    const supabaseAdmin = createAdminClient()
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('two_factor_secret, role')
        .eq('id', userId)
        .single()

    if (!profile?.two_factor_secret) {
        return { error: '2FA no configurado correctamente.' }
    }

    const isValid = await verify2FAToken(profile.two_factor_secret, token)

    if (isValid) {
        await supabaseAdmin
            .from('profiles')
            .update({ last_2fa_verification: new Date().toISOString() })
            .eq('id', userId)

        if (profile.role === 'super_admin') {
            redirect('/d105')
        } else if (['company_admin', 'manager'].includes(profile.role)) {
            redirect('/gestion')
        } else {
            redirect('/fichaje')
        }
    }

    return { error: 'Código 2FA incorrecto.' }
}
