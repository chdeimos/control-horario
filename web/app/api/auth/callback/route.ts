import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { getSiteUrl } from '@/lib/get-site-url'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const siteUrl = await getSiteUrl()
    const code = searchParams.get('code')
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard'

    if (token_hash && type) {
        const supabase = await createClient()
        const { error } = await supabase.auth.verifyOtp({ type, token_hash })
        if (!error) {
            return NextResponse.redirect(`${siteUrl}${next}`)
        }
        return NextResponse.redirect(`${siteUrl}/login?error=invalid_token&message=${error.message}`)
    }

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return NextResponse.redirect(`${siteUrl}${next}`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${siteUrl}/login?error=auth_failed`)
}
