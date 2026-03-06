'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

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

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://127.0.0.1:3000'}/set-password`
    })

    if (error) return { error: error.message }

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
