-- Add kiosk settings to companies and system_settings
-- Add hardware_tablet to entry_origin enum

-- 1. Alter entry_origin enum (using a DO block to be safe)
DO $$ BEGIN
    ALTER TYPE entry_origin ADD VALUE 'hardware_tablet';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add kiosk_image_url to companies settings via a helper (since it's JSONB, we just document it, but we can also ensure system_settings exists)
-- As companies.settings is JSONB, we don't need a migration for the schema, but we'll ensure system_settings has the reset config.

INSERT INTO system_settings (key, value)
VALUES ('kiosk_reset_seconds', '30')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value)
VALUES ('kiosk_idle_timeout_seconds', '10')
ON CONFLICT (key) DO NOTHING;

-- 3. Ensure devices policy allows identifying by api_key (publicly for kiosk if needed, but we'll use a Service Role action)
-- Current RLS on devices is already strict. Tablet will use a Server Action with Admin Client.
