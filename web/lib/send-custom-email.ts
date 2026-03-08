import { createAdminClient } from "@/lib/supabase/admin"
import { EMAIL_BASE_HTML, defaultTemplates } from "@/lib/email-templates"
import { sendEmailNotification } from "@/lib/email"
import { getSiteUrl } from "@/lib/get-site-url"

export async function sendCustomAuthEmail(email: string, type: 'invite' | 'recovery' | 'magic_link' | 'signup', actionLink: string) {
    const supabaseAdmin = createAdminClient()

    const { data: globalSettings } = await supabaseAdmin
        .from('system_settings')
        .select('key, value')
        .in('key', ['app_name', 'saas_logo_web', 'saas_legal_text', `email_template_${type}`])

    const settingsMap = (globalSettings || []).reduce((acc: any, item: any) => {
        acc[item.key] = item.value
        return acc
    }, {})

    const appName = settingsMap.app_name || 'Control Horario'
    const logoUrl = settingsMap.saas_logo_web || ''
    const legalText = settingsMap.saas_legal_text || '' // Opcional
    const customTemplate = settingsMap[`email_template_${type}`]

    // Default Fallback Template
    const mappedType = type as keyof typeof defaultTemplates
    const targetBase = defaultTemplates[mappedType] || defaultTemplates.invite

    // Parche de seguridad: Supabase a veces inyecta localhost si su .env interno no está bien configurado
    const siteUrl = await getSiteUrl()
    let cleanActionLink = actionLink

    try {
        const urlObj = new URL(actionLink)
        if (urlObj.searchParams.has('redirect_to')) {
            const currentRedirect = urlObj.searchParams.get('redirect_to') || ''
            if (currentRedirect.includes('localhost') || currentRedirect.includes('127.0.0.1')) {
                // Reemplazamos la ruta por defecto por nuestro siteUrl y el callback real
                urlObj.searchParams.set('redirect_to', `${siteUrl}/auth/callback?next=/set-password`)
                cleanActionLink = urlObj.toString()
            }
        }
    } catch (e) { /* ignore parse error */ }

    // Si hay un customTemplate (del WYSIWYG) lo usamos, de lo contrario usamos el de fallback
    let mailContent = customTemplate || targetBase.content
    mailContent = mailContent.replace(/\{\{\s*\.ConfirmationURL\s*\}\}/g, cleanActionLink)

    const finalHtml = EMAIL_BASE_HTML(targetBase.title, mailContent, appName, logoUrl, legalText)

    return await sendEmailNotification(email, targetBase.title, finalHtml)
}
