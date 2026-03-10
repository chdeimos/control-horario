import { Resend } from 'resend';
import nodemailer from 'nodemailer';

// NodeMailer for local/standard SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || '127.0.0.1',
    port: parseInt(process.env.SMTP_PORT || '54325'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    } : undefined,
    connectionTimeout: 5000,
    greetingTimeout: 5000
})

// Resend for production (Optional)
const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

export async function sendEmailNotification(
    to: string,
    subject: string,
    html: string,
    attachments?: { filename: string, content: Buffer | string | Uint8Array }[]
) {
    // Helper to ensure buffer for Resend
    const resendAttachments = attachments?.map(a => ({
        filename: a.filename,
        content: Buffer.isBuffer(a.content) ? a.content : Buffer.from(a.content)
    }));

    // Helper for Nodemailer (supports string/Buffer/Stream)
    const nodemailerAttachments = attachments?.map(a => ({
        filename: a.filename,
        content: (typeof a.content === 'string' || Buffer.isBuffer(a.content)) ? a.content : Buffer.from(a.content)
    }));

    // 1. Prioritize Resend if API Key is present
    if (resend) {
        try {
            const data = await resend.emails.send({
                from: process.env.SMTP_FROM || 'Control Horario <onboarding@resend.dev>',
                to: [to],
                subject: subject,
                html: html,
                attachments: resendAttachments
            });
            const { logEmail } = await import('./logs')
            await logEmail({ recipient: to, subject, status: 'sent', providerResponse: data })
            return { success: true, data };
        } catch (error: any) {
            console.error('Resend Error:', error);
            const { logEmail } = await import('./logs')
            await logEmail({ recipient: to, subject, status: 'error', errorMessage: error.message })
        }
    }

    // 2. Fallback to Nodemailer
    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Control Horario" <no-reply@tudominio.com>',
            to: to,
            subject: subject,
            html: html,
            attachments: nodemailerAttachments
        });
        console.log(`[SMTP EMAIL] To: ${to} | Subject: ${subject} | Attachments: ${attachments?.length || 0}`);
        const { logEmail } = await import('./logs')
        await logEmail({ recipient: to, subject, status: 'sent' })
        return { success: true };
    } catch (error: any) {
        console.error('SMTP Error:', error);
        const { logEmail } = await import('./logs')
        await logEmail({ recipient: to, subject, status: 'error', errorMessage: error.message })
        return { success: false, error };
    }
}
