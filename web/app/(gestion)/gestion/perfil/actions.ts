'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    const fullName = String(formData.get('full_name'))
    const phone = String(formData.get('phone'))

    if (!fullName || fullName.trim().length === 0) {
        return { error: 'El nombre completo es obligatorio' }
    }

    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin
        .from('profiles')
        .update({
            full_name: fullName,
            phone: phone,
            updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/gestion/perfil')
    return { success: true }
}
