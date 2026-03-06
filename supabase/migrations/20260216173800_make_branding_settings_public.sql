-- Allow public access to branding settings (App Name and Mobile Logo)
-- This is required for the login screen to display the platform identity.

DROP POLICY IF EXISTS "branding_settings_public_read" ON public.system_settings;

CREATE POLICY "branding_settings_public_read" ON public.system_settings
FOR SELECT
USING (key IN ('app_name', 'saas_logo_app'));
