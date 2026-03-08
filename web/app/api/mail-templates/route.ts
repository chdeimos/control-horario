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
        .in('key', ['app_name', 'saas_logo_web', `email_template_${type}`])

    const settingsMap = (globalSettings || []).reduce((acc: any, item: any) => {
        acc[item.key] = item.value
        return acc
    }, {})

    const appName = settingsMap.app_name || 'Control Horario'
    const logoUrl = settingsMap.saas_logo_web || ''
    const customTemplate = settingsMap[`email_template_${type}`]

    if (customTemplate) {
        // Enviar lo que el cliente redactó personalizado 
        // (Pero en la UI le habremos obligado a que se preprocese con el Footer legal)
        const response = new NextResponse(customTemplate)
        response.headers.set('Content-Type', 'text/html; charset=utf-8')
        return response
    }

    // Default Fallback Template si no hay ninguna configuración
    const mappedType = type as keyof typeof defaultTemplates
    const targetBase = defaultTemplates[mappedType] || defaultTemplates.invite

    const finalHtml = EMAIL_BASE_HTML(targetBase.title, targetBase.content, appName, logoUrl)

    const response = new NextResponse(finalHtml)
    response.headers.set('Content-Type', 'text/html; charset=utf-8')
    return response
}
