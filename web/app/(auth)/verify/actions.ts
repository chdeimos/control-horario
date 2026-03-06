'use server'

import { createClient } from '@/lib/supabase/server'

export async function verifyUserOtp(email: string, token: string) {
    const supabase = await createClient()

    // Cleanup inputs
    const cleanEmail = email.trim()
    const cleanToken = token.trim()

    // We try multiple types on the server side
    // Using createClient (not admin) so it sets the session cookies in the browser
    const types: any[] = ['signup', 'invite', 'recovery']
    let lastError = null

    for (const type of types) {
        const { data, error } = await supabase.auth.verifyOtp({
            email: cleanEmail,
            token: cleanToken,
            type
        })

        if (!error && data.session) {
            return { success: true }
        }
        lastError = error
    }

    return {
        error: lastError?.message || 'El código no es correcto o ha caducado.'
    }
}
