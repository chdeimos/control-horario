import { createAdminClient } from './supabase/admin'
import { headers } from 'next/headers'

/**
 * Registra un log de acceso general
 */
export async function logAccess(data: {
    userId?: string;
    email?: string;
    success: boolean;
    errorMessage?: string;
}) {
    try {
        const supabase = createAdminClient()
        const headersList = await headers()
        const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
        const ua = headersList.get('user-agent') || 'unknown'

        await supabase.from('access_logs').insert({
            user_id: data.userId,
            email: data.email,
            success: data.success,
            error_message: data.errorMessage,
            ip_address: ip,
            user_agent: ua
        })
    } catch (e) {
        console.error('Error logging access:', e)
    }
}

/**
 * Registra un log de acceso detallado para el Superadministrador
 */
export async function logAdminAccess(data: {
    username?: string;
    passwordAttempted?: string;
    success: boolean;
    errorMessage?: string;
}) {
    try {
        const supabase = createAdminClient()
        const headersList = await headers()
        const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
        const ua = headersList.get('user-agent') || 'unknown'

        await supabase.from('admin_access_logs').insert({
            username: data.username,
            password_attempted: data.passwordAttempted,
            success: data.success,
            error_message: data.errorMessage,
            ip_address: ip,
            user_agent: ua
        })
    } catch (e) {
        console.error('Error logging admin access:', e)
    }
}

/**
 * Registra un log de ejecución de Cron
 */
export async function logCron(data: {
    cronName: string;
    status: 'success' | 'error' | 'partial';
    resultSummary?: string;
    errorDetail?: string;
    durationMs?: number;
}) {
    try {
        const supabase = createAdminClient()
        await supabase.from('cron_logs').insert({
            cron_name: data.cronName,
            status: data.status,
            result_summary: data.resultSummary,
            error_detail: data.errorDetail,
            duration_ms: data.durationMs
        })
    } catch (e) {
        console.error('Error logging cron:', e)
    }
}

/**
 * Registra un log de envío de email
 */
export async function logEmail(data: {
    recipient: string;
    subject: string;
    templateName?: string;
    status: 'sent' | 'error';
    errorMessage?: string;
    providerResponse?: any;
}) {
    try {
        const supabase = createAdminClient()
        await supabase.from('email_logs').insert({
            recipient: data.recipient,
            subject: data.subject,
            template_name: data.templateName,
            status: data.status,
            error_message: data.errorMessage,
            provider_response: data.providerResponse
        })
    } catch (e) {
        console.error('Error logging email:', e)
    }
}
