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

export async function sendEmailNotification(to: string, subject: string, html: string) {
    // 1. Prioritize Resend if API Key is present
    if (resend) {
        try {
            const data = await resend.emails.send({
                from: 'Control Horario <onboarding@resend.dev>',
                to: [to],
                subject: subject,
                html: html,
            });
            return { success: true, data };
        } catch (error) {
            console.error('Resend Error:', error);
            // Fallback to SMTP if Resend fails? Optional.
        }
    }

    // 2. Fallback to Nodemailer (works with local SMTP at localhost:54324)
    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Control Horario" <no-reply@tudominio.com>',
            to: to,
            subject: subject,
            html: html,
        });
        console.log(`[SMTP EMAIL] To: ${to} | Subject: ${subject}`);
        return { success: true };
    } catch (error) {
        console.error('SMTP Error:', error);
        return { success: false, error };
    }
}
