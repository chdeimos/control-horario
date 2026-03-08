import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { EMAIL_BASE_HTML, defaultTemplates } from "@/lib/email-templates"
import nodemailer from "nodemailer"
import * as fs from "fs"
import * as path from "path"

export async function POST(request: NextRequest) {
    try {
        const { type, testEmail } = await request.json()

        // 1. Obtencion de Credenciales SMTP desde el docker .env original
        const envPath = path.resolve(process.cwd(), '../../supabase-docker-repo/docker/.env')
        let smtpHost = ''
        let smtpPort = 587
        let smtpUser = ''
        let smtpPass = ''
        let smtpAdminEmail = 'no-reply@empresa.com'

        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8')
            const lines = content.split('\n')
            lines.forEach(line => {
                if (line.startsWith('GOTRUE_SMTP_HOST=')) smtpHost = line.split('=')[1].trim()
                if (line.startsWith('GOTRUE_SMTP_PORT=')) smtpPort = parseInt(line.split('=')[1].trim())
                if (line.startsWith('GOTRUE_SMTP_USER=')) smtpUser = line.split('=')[1].trim()
                if (line.startsWith('GOTRUE_SMTP_PASS=')) smtpPass = line.split('=')[1].trim()
                if (line.startsWith('GOTRUE_SMTP_ADMIN_EMAIL=')) smtpAdminEmail = line.split('=')[1].trim()
            })
        }

        if (!smtpHost || !smtpUser || !smtpPass) {
            return NextResponse.json({ error: "No se encontraron credenciales SMTP en el entorno docker raíz. Revisa supabase-docker-repo/.env" }, { status: 400 })
        }

        // 2. Transporter
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465, // true for 465, false for other ports
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        })

        // 3. Generar cuerpo del correo
        const supabase = createAdminClient()
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

        const mappedType = type as keyof typeof defaultTemplates
        const targetBase = defaultTemplates[mappedType] || defaultTemplates.invite

        // El customTemplate ahora solo contiene el texto WYSIWYG, le inyectamos la cabecera e info de base de nuestro builder
        const mailContent = customTemplate || targetBase.content
        let finalHtml = EMAIL_BASE_HTML(targetBase.title, mailContent, appName, logoUrl, legalText)

        // Reemplazar sintaxis GoTemplate para que sea bonita en la previsualizacion
        finalHtml = finalHtml.replace(/\{\{ \.ConfirmationURL \}\}/g, 'https://tu-dominio.com/verify?token=xxxxxxxx')
        finalHtml = finalHtml.replace(/\{\{ \.Token \}\}/g, '123456')
        finalHtml = finalHtml.replace(/\{\{ \.Email \}\}/g, testEmail)

        await transporter.sendMail({
            from: `"${appName}" <${smtpAdminEmail}>`,
            to: testEmail,
            subject: `[PRUEBA SISTEMA] - Plantilla de ${type}`,
            html: finalHtml,
        })

        return NextResponse.json({ success: true, message: `Correo de prueba SMTP enviado correctamente a ${testEmail}` })

    } catch (error: any) {
        console.error('Error enviando mail de prueba SMTP:', error)
        return NextResponse.json({ error: error.message || 'Fallo desconocido enviando mail' }, { status: 500 })
    }
}
