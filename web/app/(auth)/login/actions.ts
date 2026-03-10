'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
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
        const { logAccess } = await import('@/lib/logs')
        await logAccess({ email, success: false, errorMessage: error.message })
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
            .select('role, status')
            .eq('id', user.id)
            .single()

        // RestricciÃ³n de acceso por estado (Solo para empleados)
        if (profile?.role === 'employee' && profile?.status !== 'active') {
            const statusMsgs: Record<string, string> = {
                'terminated': 'Tu cuenta ha sido dada de baja definitiva. Contacta con RRHH.',
                'medical_leave': 'No puedes acceder al sistema mientras estás de baja médica.',
                'unpaid_leave': 'No es posible fichar durante el periodo de excedencia.'
            }
            await supabase.auth.signOut()
            return { error: statusMsgs[profile.status] || 'Tu cuenta está desactivada temporalmente.' }
        }

        // Restricción de acceso para Super Administradores en login normal
        if (profile?.role === 'super_admin') {
            await supabase.auth.signOut()
            const { logAccess } = await import('@/lib/logs')
            await logAccess({ userId: user.id, email: user.email, success: false, errorMessage: 'Intento de acceso SuperAdmin por portal normal' })
            return { error: 'Error critico, contacte con su administrador.' }
        }

        const { logAccess } = await import('@/lib/logs')
        await logAccess({ userId: user.id, email: user.email, success: true })

        revalidatePath('/fichaje')
        redirect('/fichaje')
    }

    return { error: 'Error desconocido al iniciar sesión.' }
}

export async function verify2FALogin(userId: string, token: string) {
    const supabaseAdmin = createAdminClient()
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('two_factor_secret, role, status')
        .eq('id', userId)
        .single()

    if (!profile?.two_factor_secret) {
        return { error: '2FA no configurado correctamente.' }
    }

    const isValid = await verify2FAToken(profile.two_factor_secret, token)

    if (isValid) {
        // RestricciÃ³n de acceso por estado tras 2FA (Solo para empleados)
        if (profile.role === 'employee' && profile.status !== 'active') {
            const statusMsgs: Record<string, string> = {
                'terminated': 'Tu cuenta ha sido dada de baja definitiva. Contacta con RRHH.',
                'medical_leave': 'No puedes acceder al sistema mientras estás de baja médica.',
                'unpaid_leave': 'No es posible fichar durante el periodo de excedencia.'
            }
            return { error: statusMsgs[profile.status] || 'Tu cuenta está desactivada temporalmente.' }
        }

        await supabaseAdmin
            .from('profiles')
            .update({ last_2fa_verification: new Date().toISOString() })
            .eq('id', userId)

        if (profile.role === 'super_admin') {
            return { error: 'Error critico, contacte con su administrador.' }
        }

        revalidatePath('/fichaje')
        redirect('/fichaje')
    }

    return { error: 'Código 2FA incorrecto.' }
}

