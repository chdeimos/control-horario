const actionLink = "https://horario.pandorasoft.com.es/auth/v1/verify?token=9664572018dddfa68931fe3768223ca3da8ca0f8d1b9ef9a4ad4a312&type=recovery&redirect_to=http://localhost:3000";
const siteUrl = "https://horario.pandorasoft.com.es";
let cleanActionLink = actionLink;
try {
    const urlObj = new URL(actionLink)
    if (urlObj.searchParams.has('redirect_to')) {
        const currentRedirect = urlObj.searchParams.get('redirect_to') || ''
        if (currentRedirect.includes('localhost') || currentRedirect.includes('127.0.0.1')) {
            // Reemplazamos la ruta por defecto por nuestro siteUrl y el callback real
            urlObj.searchParams.set('redirect_to', siteUrl + '/auth/callback?next=/set-password')
            cleanActionLink = urlObj.toString()
        }
    }
} catch (e) { console.error(e) }
console.log(cleanActionLink);
