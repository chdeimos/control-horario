'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { shouldRequest2FA, verify2FAToken } from '@/lib/security'
import { createAdminClient } from '@/lib/supabase/admin'

export async function signInD105(formData: FormData) {
    const email = String(formData.get('email'))
    const password = String(formData.get('password'))

    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        console.error('Superadmin Login error:', error)
        const { logAdminAccess } = await import('@/lib/logs')
        await logAdminAccess({ username: email, success: false, errorMessage: error.message })
        return { error: 'Credenciales inválidas de administrador.' }
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'super_admin') {
            await supabase.auth.signOut()
            const { logAdminAccess } = await import('@/lib/logs')
            await logAdminAccess({ username: email, success: false, errorMessage: 'Intento de acceso d105 sin rol super_admin' })
            return { error: 'Acceso Denegado. Esta cuenta no tiene privilegios de Super Administrador.' }
        }

        const { logAdminAccess } = await import('@/lib/logs')
        await logAdminAccess({ username: email, success: true })

        const is2FARequired = await shouldRequest2FA(user.id)

        if (is2FARequired) {
            return { requires2FA: true, userId: user.id }
        }

        revalidatePath('/d105')
        redirect('/d105')
    }

    return { error: 'Error desconocido al iniciar sesión como administrador.' }
}

export async function verify2FALoginD105(userId: string, token: string) {
    const supabaseAdmin = createAdminClient()
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role, profiles_private(two_factor_secret_encrypted)')
        .eq('id', userId)
        .single()

    const secret = (profile?.profiles_private as any)?.two_factor_secret_encrypted

    if (profile?.role !== 'super_admin') {
        return { error: 'Acceso Denegado.' }
    }

    if (!secret) {
        return { error: '2FA no configurado correctamente.' }
    }

    const isValid = await verify2FAToken(secret, token)

    if (isValid) {
        await supabaseAdmin
            .from('profiles')
            .update({ last_2fa_verification: new Date().toISOString() })
            .eq('id', userId)

        revalidatePath('/d105')
        redirect('/d105')
    }

    return { error: 'Código 2FA incorrecto.' }
}
