import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { EMAIL_BASE_HTML, defaultTemplates } from "@/lib/email-templates"

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'invite'

    const supabase = createAdminClient()

    // Rescatar preferencias del admin (Logo y Nombre App)
    const { data: globalSettings } = await supabase
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

    // Si hay un customTemplate (del WYSIWYG) lo usamos, de lo contrario usamos el de fallback
    const mailContent = customTemplate || targetBase.content
    const finalHtml = EMAIL_BASE_HTML(targetBase.title, mailContent, appName, logoUrl, legalText)

    const response = new NextResponse(finalHtml)
    response.headers.set('Content-Type', 'text/html; charset=utf-8')
    return response
}
