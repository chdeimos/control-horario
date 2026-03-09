import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    // Update request cookies and headers for immediate use in middleware
                    request.cookies.set({ name, value, ...options })

                    // Crucial: Update the existing response instead of creating a new one
                    // to avoid losing other cookies (e.g., refresh token) being set in the same tick.
                    response.cookies.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options })
                    response.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )

    // 1. Get User
    const { data: { user } } = await supabase.auth.getUser()
    const path = request.nextUrl.pathname

    // PRESERVE COOKIES HELPER
    const redirect = (targetPath: string) => {
        // Absolute check to avoid loops to same path
        if (request.nextUrl.pathname === targetPath || (request.nextUrl.pathname.includes('login') && targetPath.includes('login'))) {
            return response
        }
        const url = new URL(targetPath, request.url)
        const redirectResponse = NextResponse.redirect(url)
        // Copy cookies from Supabase response
        response.cookies.getAll().forEach((cookie) => {
            redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
        })
        return redirectResponse
    }

    // 2. Common 2FA check function
    const needs2FAChallenge = async (userId: string) => {
        const { data: profile } = await supabase
            .from('profiles')
            .select('two_factor_enabled, last_2fa_verification')
            .eq('id', userId)
            .single()

        if (!profile?.two_factor_enabled) return false

        // Fetch TTL
        const { data: setting } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', '2fa_session_duration_hours')
            .maybeSingle()

        const ttlHours = parseInt(setting?.value || '24')
        if (!profile.last_2fa_verification) return true

        const lastVerif = new Date(profile.last_2fa_verification).getTime()
        const now = Date.now()
        const diffHours = (now - lastVerif) / (1000 * 3600)

        // Grace period of 5 seconds to avoid micro-loops
        if (diffHours < (5 / 3600)) return false

        return diffHours > ttlHours
    }

    // --- ROUTE PROTECTION LOGIC ---

    // A. SuperAdmin Portal (d105)
    if (path.startsWith('/d105')) {
        if (path === '/d105/login') {
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
                if (profile?.role === 'super_admin') return redirect('/d105')
                // Si ya está logueado pero no es superadmin, no debería estar aquí
                return redirect('/fichaje')
            }
            return response
        }

        if (!user) return redirect('/d105/login')

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'super_admin') return redirect('/d105/login')
        if (await needs2FAChallenge(user.id)) return redirect('/d105/login?requires2fa=true')
    }

    // B. Management Portal (gestion)
    if (path.startsWith('/gestion')) {
        // We use the root /login for everything now as per user instruction
        if (!path.includes('/api/')) {
            if (!user) return redirect('/login')

            const { data: profile } = await supabase
                .from('profiles')
                .select('role, is_active, companies(is_active)')
                .eq('id', user.id)
                .single()

            const company = Array.isArray(profile?.companies) ? profile?.companies[0] : profile?.companies

            if (profile && profile.role !== 'super_admin') {
                if (!profile.is_active || (company && !company.is_active)) {
                    if (path !== '/blocked') return redirect('/blocked')
                }
            }

            const allowedRoles = ['company_admin', 'manager', 'super_admin']
            if (!allowedRoles.includes(profile?.role || '')) return redirect('/fichaje')
            if (await needs2FAChallenge(user.id)) return redirect('/login?requires2fa=true')
        }
    }

    // C. Clocking/Employee Portal (fichaje)
    if (path.startsWith('/fichaje')) {
        if (path.startsWith('/fichaje-fijo')) return response
        if (!user) return redirect('/login')

        const { data: profile } = await supabase
            .from('profiles')
            .select('role, is_active, companies(is_active)')
            .eq('id', user.id)
            .single()

        const company = Array.isArray(profile?.companies) ? profile?.companies[0] : profile?.companies

        if (profile && profile.role !== 'super_admin') {
            if (!profile.is_active || (company && !company.is_active)) {
                if (path !== '/blocked') return redirect('/blocked')
            }
        }
    }

    // D. Legacy & Root Redirects
    if (path === '/' || path === '/dashboard' || path === '/time-tracking') {
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile?.role === 'super_admin') return redirect('/d105')
            if (['company_admin', 'manager'].includes(profile?.role || '')) return redirect('/gestion')
            return redirect('/fichaje')
        }
        return redirect('/login')
    }

    // E. Login Redirection (Avoid double login)
    if (path === '/login') {
        if (user) {
            if (!(await needs2FAChallenge(user.id))) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                if (profile?.role === 'super_admin') return redirect('/d105')
                if (['company_admin', 'manager'].includes(profile?.role || '')) return redirect('/gestion')
                return redirect('/fichaje')
            }
        }
    }

    // F. Legacy/Specific Redirects cleanup
    if (path === '/gestion/login') {
        return redirect('/login')
    }

    if (path.startsWith('/admin')) {
        return redirect(path.replace('/admin', '/d105'))
    }

    return response
}
