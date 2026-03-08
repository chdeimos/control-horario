export async function getSiteUrl() {
    // 1. Direct environment variable explicitly set
    if (process.env.NEXT_PUBLIC_SITE_URL) {
        return process.env.NEXT_PUBLIC_SITE_URL
    }

    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL
    }

    // 2. Derive from Supabase URL if it's a production URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    if (supabaseUrl && !supabaseUrl.includes('127.0.0.1') && !supabaseUrl.includes('localhost')) {
        // En producción el Supabase URL es https://horario.pandorasoft.com.es y el FrontEnd corre ahí mismo
        return supabaseUrl
    }

    // 3. Fallback a los headers (considerando Nginx x-forwarded)
    const { headers } = await import('next/headers')
    let h: any
    try { h = await headers() } catch { h = headers() }

    // Si corre desde un script Node (ej npm run cli) no tendrá headers validos
    if (!h || typeof h.get !== 'function') {
        return 'http://127.0.0.1:3000'
    }

    const host = h.get('x-forwarded-host') || h.get('host') || '127.0.0.1:3000'
    const protocol = h.get('x-forwarded-proto') || (host.includes('127.0.0.1') || host.includes('localhost') ? 'http' : 'https')
    return `${protocol}://${host}`
}
