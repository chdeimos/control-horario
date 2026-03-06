-- 1. Add 2FA and security session columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
ADD COLUMN IF NOT EXISTS last_2fa_verification TIMESTAMPTZ;

-- 2. Add 2FA Duration Setting to system_settings
-- This allows the superadmin to control how many hours a 2FA session lasts
INSERT INTO public.system_settings (key, value)
VALUES ('2fa_session_duration_hours', '24')
ON CONFLICT (key) DO NOTHING;

-- 3. Ensure we have a way to track the current portal/app a user is in if needed
-- (Optional, but useful for audit logs)
ALTER TABLE public.time_entries 
ADD COLUMN IF NOT EXISTS portal_origin TEXT CHECK (portal_origin IN ('fichaje', 'gestion', 'd105'));

COMMENT ON COLUMN public.profiles.last_2fa_verification IS 'Timestamp of the last successful 2FA verification for secure portal access.';
