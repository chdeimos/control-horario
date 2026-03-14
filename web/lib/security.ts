import { generateSecret, generateURI, verify } from 'otplib';
import QRCode from 'qrcode';
import { createAdminClient } from './supabase/admin';

export async function generate2FASecret(userId: string, email: string) {
    const secret = generateSecret({ length: 20 });
    const otpauth = generateURI({
        secret,
        label: email,
        issuer: 'ControlHorarioPro'
    });
    const qrCodeUrl = await QRCode.toDataURL(otpauth);

    return { secret, qrCodeUrl };
}

export async function verifyAndEnable2FA(userId: string, secret: string, token: string) {
    const isValid = await verify({ token, secret });

    if (isValid) {
        const supabase = createAdminClient();
        
        // Update enabled status and last verification on public profile
        const { error: profError } = await supabase
            .from('profiles')
            .update({
                two_factor_enabled: true,
                last_2fa_verification: new Date().toISOString()
            })
            .eq('id', userId);

        if (profError) throw profError;

        // Update secret in private table via RPC or direct insert
        const { error: secretError } = await supabase.rpc('update_2fa_secret', {
            p_user_id: userId,
            p_secret: secret
        });

        if (secretError) throw secretError;
        
        return true;
    }

    return false;
}

export async function verify2FAToken(secret: string, token: string) {
    return await verify({ token, secret });
}

export async function shouldRequest2FA(userId: string) {
    const supabase = createAdminClient();
    const { data: profile } = await supabase
        .from('profiles')
        .select('two_factor_enabled, last_2fa_verification')
        .eq('id', userId)
        .single();

    if (!profile?.two_factor_enabled) return false;

    // Check TTL from settings
    const { data: setting } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', '2fa_session_duration_hours')
        .maybeSingle();

    const ttlHours = parseInt(setting?.value || '24');

    if (!profile.last_2fa_verification) return true;

    const lastVerification = new Date(profile.last_2fa_verification).getTime();
    const now = new Date().getTime();
    const diffHours = (now - lastVerification) / (1000 * 3600);

    // Grace period of 1 minute (1/60 hours) to avoid race conditions/loops if TTL is 0
    if (diffHours < (1 / 60)) return false;

    return diffHours > ttlHours;
}
