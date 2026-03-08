'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { getSiteUrl } from '@/lib/get-site-url'
import { sendCustomAuthEmail } from '@/lib/send-custom-email'

export async function getGlobalUsers() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    // Check Super Admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super_admin') return { error: 'No tienes permisos' }

    // Fetch all profiles with their associated company name
    const { data: users, error } = await supabase
        .from('profiles')
        .select('*, companies(name)')
        .order('created_at', { ascending: false })

    if (error) return { error: error.message }

    // Fetch Auth data for these users to get emails (profiles table might not have email)
    const supabaseAdmin = createAdminClient()
    const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers()

    // Map email from Auth to the profile data
    const combinedUsers = users.map((u: any) => {
        const authUser = authUsers.find(au => au.id === u.id)
        return {
            ...u,
            email: authUser?.email || 'N/A'
        }
    })

    return { data: combinedUsers }
}

export async function sendUserResetEmail(email: string) {
    const supabase = await createClient()

    const siteUrl = await getSiteUrl()

    const supabaseAdmin = createAdminClient()
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
            redirectTo: `${siteUrl}/auth/callback?next=/set-password`
        }
    })

    if (error) return { error: error.message }

    if (data?.properties?.action_link) {
        const emailResult = await sendCustomAuthEmail(email, 'recovery', data.properties.action_link)
        if (emailResult && emailResult.error) {
            return { error: 'Error al enviar el correo: ' + emailResult.error }
        }
    }

    return { success: true }
}

export async function toggleUserStatus(userId: string, currentStatus: boolean) {
    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId)

    if (error) return { error: error.message }

    revalidatePath('/d105/users')
    return { success: true }
}
