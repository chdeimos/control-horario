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

    // Bypass Infalible: Next.js SSR Auth Route Handler
    // Dejamos de mandar a la gente al endppoint "/auth/v1/verify" de GoTrue que falla en Docker
    // Extraemos sus tokens y re-dirigimos a nuestro propio Next.js server-side /auth/callback
    const siteUrl = await getSiteUrl()
    let cleanActionLink = actionLink
    try {
        const urlObj = new URL(actionLink)
        const token = urlObj.searchParams.get('token')
        const typeStr = urlObj.searchParams.get('type') || 'recovery'

        if (token) {
            // Creamos nuestra propia URL blindada y la resolvemos en el Server FrontEnd
            cleanActionLink = `${siteUrl}/auth/callback?token_hash=${token}&type=${typeStr}&next=/set-password`
        }
    } catch (e) { console.error('Error parcheando actionLink', e) }

    // Si hay un customTemplate (del WYSIWYG) lo usamos, de lo contrario usamos el de fallback
    let mailContent = customTemplate || targetBase.content
    mailContent = mailContent.replace(/\{\{\s*\.ConfirmationURL\s*\}\}/g, cleanActionLink)

    const finalHtml = EMAIL_BASE_HTML(targetBase.title, mailContent, appName, logoUrl, legalText)

    return await sendEmailNotification(email, targetBase.title, finalHtml)
}
