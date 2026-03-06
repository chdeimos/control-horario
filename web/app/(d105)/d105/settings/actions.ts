'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function getSettings() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('system_settings')
        .select('*')

    if (error) return { error: error.message }

    // Map to object
    const settings = data.reduce((acc: any, item: any) => {
        acc[item.key] = item.value
        return acc
    }, {})

    return { data: settings }
}

export async function updateBulkSettings(settings: Record<string, string>) {
    const supabase = await createClient()
    const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString()
    }))

    const { error } = await supabase
        .from('system_settings')
        .upsert(updates)

    if (error) return { error: error.message }
    revalidatePath('/d105/settings')
    return { success: true }
}

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    const fullName = String(formData.get('full_name'))
    const password = String(formData.get('password'))
    const newEmail = String(formData.get('email'))

    // 1. Update public profile
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id)

    if (profileError) return { error: profileError.message }

    // 2. Handle Email Change
    if (newEmail && newEmail !== user.email) {
        // Send OTP to OLD email using signInWithOtp (it's very reliable for sending codes)
        const { error: otpError } = await supabase.auth.signInWithOtp({
            email: user.email!,
            options: {
                shouldCreateUser: false
            }
        })

        if (otpError) return { error: `Error al enviar código: ${otpError.message}` }

        return {
            success: true,
            emailChangePending: true,
            newEmail,
            oldEmail: user.email,
            message: 'Se ha enviado un código de acceso a tu email ACTUAL para autorizar el cambio.'
        }
    }

    // 3. Update password if provided
    if (password && password.length >= 6) {
        const supabaseAdmin = createAdminClient()
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            { password }
        )
        if (authError) return { error: authError.message }
    }

    revalidatePath('/d105/settings')
    return { success: true }
}

export async function finalizeEmailChange(newEmail: string, token: string) {
    const supabaseAdmin = createAdminClient()

    // 1. Get current user safely
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    // 2. Verify the OTP (OLD email)
    // The type for signInWithOtp is 'email'
    const { error: verifyError } = await supabaseAdmin.auth.verifyOtp({
        email: user.email!,
        token: token,
        type: 'email'
    })

    if (verifyError) {
        return { error: `El código no es correcto o ha caducado: ${verifyError.message}` }
    }

    // 3. Now update the email directly
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { email: newEmail, email_confirm: true }
    )

    if (error) return { error: `Error al actualizar el correo: ${error.message}` }

    revalidatePath('/d105/settings')
    return { success: true }
}

export async function createBackup() {
    const supabase = createAdminClient()

    // Use the new RPC to get a full system snapshot including auth
    const { data, error } = await supabase.rpc('get_system_backup')

    if (error) {
        console.error('Error in createBackup RPC:', error)
        throw new Error(error.message)
    }

    return data
}

export async function restoreBackup(backupData: any) {
    const supabase = createAdminClient()

    if (!backupData || !backupData.auth_users) {
        return { error: 'Datos de copia de seguridad no válidos o incompletos' }
    }

    try {
        // Use the new RPC to restore everything in one transaction
        const { error } = await supabase.rpc('restore_system_backup', {
            backup_data: backupData
        })

        if (error) {
            console.error('Error in restoreBackup RPC:', error)
            return { error: error.message }
        }

        revalidatePath('/')
        return { success: true }
    } catch (err: any) {
        console.error('Critical error during restore:', err)
        return { error: err.message }
    }
}

export async function getSecuritySettings() {
    const supabase = await createClient()
    const { data } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', '2fa_session_duration_hours')
        .maybeSingle()

    return data?.value || '24'
}

export async function updateSecuritySettings(hours: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('system_settings')
        .upsert({
            key: '2fa_session_duration_hours',
            value: hours
        })

    if (error) return { error: error.message }
    revalidatePath('/d105/settings')
    return { success: true }
}

export async function startPersonal2FA() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { generate2FASecret } = await import('@/lib/security')
    return await generate2FASecret(user.id, user.email!)
}

export async function completePersonal2FA(secret: string, token: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { verifyAndEnable2FA } = await import('@/lib/security')
    const success = await verifyAndEnable2FA(user.id, secret, token)

    if (success) {
        revalidatePath('/d105/settings')
        return { success: true }
    }
    return { error: 'Token inválido' }
}
