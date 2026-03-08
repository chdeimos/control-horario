import { Mail } from "lucide-react"

// Plantilla Base común con el Footer Legal
export const EMAIL_BASE_HTML = (title: string, content: string, appName: string, logoUrl: string, legalText?: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 40px 20px;">
    
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <tr>
            <td style="background-color: #0f172a; padding: 40px 30px; text-align: center;">
                ${logoUrl
        ? `<img src="${logoUrl}" alt="${appName}" style="max-height: 50px; width: auto;" />`
        : `<h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">${appName}</h1>`
    }
            </td>
        </tr>
        
        <!-- Body Content -->
        <tr>
            <td style="padding: 40px 30px; line-height: 1.6; font-size: 16px; color: #334155;">
                <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">${title}</h2>
                ${content}
            </td>
        </tr>
        
        <!-- Footer Legal Text -->
        <tr>
            <td style="background-color: #f1f5f9; padding: 30px; font-size: 10px; line-height: 1.4; color: #64748b; border-top: 1px solid #e2e8f0;">
                <p style="margin-top: 0; font-weight: bold; text-transform: uppercase;">Aviso de Privacidad y Confidencialidad</p>
                <div style="text-align: justify; margin-bottom: 0;">
                    ${legalText ?
        `<p style="white-space: pre-wrap;">${legalText}</p>` :
        `<p style="margin-bottom: 15px;">Le informamos que su dirección de correo electrónico, así como el resto de los datos de carácter personal que nos ha facilitado, serán objeto de tratamiento en nuestros registros de actividades con la finalidad de gestionar el contenido de esta comunicación... Usted tiene derecho a obtener confirmación sobre si en PANDORA SOFT SL estamos tratando sus datos personales...</p>
                         <p style="font-weight: bold; text-transform: uppercase;">Confidentiality Notice</p>
                         <p>We inform you that your email address and the personal data that you have given us, will be at disposal of our company to manage the content of this communication...</p>
                        `
    }
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
`

export const defaultTemplates = {
    invite: {
        title: "Invitación al Sistema",
        content: `
            <p>Hola,</p>
            <p>Has sido invitado a unirte a la plataforma de Control Horario. Puedes configurar tu contraseña y acceder al sistema haciendo clic en el siguiente enlace:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ .ConfirmationURL }}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Aceptar Invitación</a>
            </div>
            <p style="font-size: 14px; color: #64748b;">Si no esperabas esta invitación, puedes ignorar este correo de forma segura.</p>
        `
    },
    confirmation: {
        title: "Confirma tu Cuenta",
        content: `
            <p>Hola,</p>
            <p>Por favor, para activar tu acceso y verificar tu identidad, haz clic en el siguiente botón:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ .ConfirmationURL }}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Confirmar Correo</a>
            </div>
            <p style="font-size: 14px; color: #64748b;">Este enlace expirará en 24 horas.</p>
        `
    },
    recovery: {
        title: "Recuperación de Contraseña",
        content: `
            <p>Hola,</p>
            <p>Hemos recibido una solicitud para cambiar tu contraseña en la plataforma. Puedes establecer una nueva mediante el siguiente botón:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ .ConfirmationURL }}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Restablecer Contraseña</a>
            </div>
            <p style="font-size: 14px; color: #ef4444; font-weight: bold;">Si no has solicitado este cambio, contacta con tu administrador inmediatamente.</p>
        `
    },
    magic_link: {
        title: "Tu Acceso Seguro",
        content: `
            <p>Hola,</p>
            <p>Utiliza este enlace mágico para acceder de forma instantánea al sistema, sin necesidad de recordar contraseñas:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ .ConfirmationURL }}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Inciar Sesión Automáticamente</a>
            </div>
            <p style="font-size: 14px; color: #64748b;">Este enlace proporciona acceso directo a tu cuenta y solo puede usarse una vez. No lo compartas con nadie.</p>
        `
    },
    email_change: {
        title: "Actualización de Correo Electrónico",
        content: `
            <p>Hola,</p>
            <p>Estás recibiendo este correo porque se ha solicitado un cambio de dirección de correo electrónico a <strong>{{ .Email }}</strong>. Para confirmar y aplicar este cambio, utiliza el siguiente enlace:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ .ConfirmationURL }}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Confirmar Nuevo Correo</a>
            </div>
            <p style="font-size: 14px; color: #64748b;">Si tú no iniciaste esta solicitud, ignora este mensaje.</p>
        `
    }
}
