-- SECURITY HARDENING v1
-- Addresses audit findings: Backup restriction, PIN hashing, PII data isolation.

-- 1. Restrict Backup & Restore Functions
CREATE OR REPLACE FUNCTION public.get_system_backup()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    backup JSONB;
    table_data JSONB;
    table_list TEXT[] := ARRAY[
        'plans', 'volume_discounts', 'companies', 'departments', 
        'profiles', 'profiles_private', 'devices', 'time_entries', 'time_off_requests', 
        'company_monthly_metrics', 'invoices', 'system_settings', 'work_schedules',
        'access_logs', 'admin_access_logs', 'cron_logs', 'email_logs'
    ];
    current_table TEXT;
BEGIN
    IF NOT is_super_admin() THEN 
        RAISE EXCEPTION 'No autorizado: Solo el superadministrador puede generar backups.';
    END IF;

    backup = jsonb_build_object(
        'version', '4.0',
        'timestamp', now(),
        'auth_users', (SELECT COALESCE(jsonb_agg(u), '[]'::jsonb) FROM auth.users u),
        'auth_identities', (SELECT COALESCE(jsonb_agg(i), '[]'::jsonb) FROM auth.identities i)
    );
    
    FOREACH current_table IN ARRAY table_list
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = current_table) THEN
            EXECUTE format('SELECT COALESCE(jsonb_agg(t), ''[]''::jsonb) FROM public.%I t', current_table) INTO table_data;
            backup = backup || jsonb_build_object('public_' || current_table, table_data);
        END IF;
    END LOOP;
    
    RETURN backup;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_system_backup(backup_data JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    u JSONB;
    i JSONB;
    t JSONB;
    current_table TEXT;
    cols_list TEXT;
    delete_order TEXT[] := ARRAY[
        'access_logs', 'admin_access_logs', 'cron_logs', 'email_logs',
        'invoices', 'company_monthly_metrics', 'work_schedules', 'time_entries', 
        'time_off_requests', 'devices', 'profiles_private', 'profiles', 'departments', 
        'companies', 'volume_discounts', 'plans', 'system_settings'
    ];
    insert_order TEXT[] := ARRAY[
        'system_settings', 'plans', 'volume_discounts', 'companies', 
        'departments', 'profiles', 'profiles_private', 'devices', 'time_off_requests', 
        'time_entries', 'work_schedules', 'company_monthly_metrics', 'invoices',
        'access_logs', 'admin_access_logs', 'cron_logs', 'email_logs'
    ];
BEGIN
    IF NOT is_super_admin() THEN 
        RAISE EXCEPTION 'No autorizado: Solo el superadministrador puede restaurar backups.';
    END IF;

    -- 1. Delete existing data
    FOREACH current_table IN ARRAY delete_order
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = current_table) THEN
            EXECUTE format('DELETE FROM public.%I WHERE TRUE', current_table);
        END IF;
    END LOOP;
    
    -- 2. Delete Auth
    DELETE FROM auth.identities WHERE TRUE;
    DELETE FROM auth.users WHERE TRUE;

    -- 3. Restore Auth Users
    IF backup_data->'auth_users' IS NOT NULL AND jsonb_array_length(backup_data->'auth_users') > 0 THEN
        SELECT string_agg(quote_ident(column_name), ', ') INTO cols_list
        FROM information_schema.columns 
        WHERE table_schema = 'auth' AND table_name = 'users' 
        AND (is_generated = 'NEVER' OR is_generated IS NULL);

        FOR u IN SELECT * FROM jsonb_array_elements(backup_data->'auth_users')
        LOOP
            EXECUTE format('INSERT INTO auth.users (%s) SELECT %s FROM jsonb_populate_record(NULL::auth.users, $1)', cols_list, cols_list) USING u;
        END LOOP;
    END IF;

    -- 4. Restore Auth Identities
    IF backup_data->'auth_identities' IS NOT NULL AND jsonb_array_length(backup_data->'auth_identities') > 0 THEN
        SELECT string_agg(quote_ident(column_name), ', ') INTO cols_list
        FROM information_schema.columns 
        WHERE table_schema = 'auth' AND table_name = 'identities' 
        AND (is_generated = 'NEVER' OR is_generated IS NULL);

        FOR i IN SELECT * FROM jsonb_array_elements(backup_data->'auth_identities')
        LOOP
            EXECUTE format('INSERT INTO auth.identities (%s) SELECT %s FROM jsonb_populate_record(NULL::auth.identities, $1)', cols_list, cols_list) USING i;
        END LOOP;
    END IF;

    -- 5. Restore Public Tables
    FOREACH current_table IN ARRAY insert_order
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = current_table) THEN
            IF backup_data->('public_' || current_table) IS NOT NULL AND jsonb_array_length(backup_data->('public_' || current_table)) > 0 THEN
                SELECT string_agg(quote_ident(column_name), ', ') INTO cols_list
                FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = current_table 
                AND (is_generated = 'NEVER' OR is_generated IS NULL);

                FOR t IN SELECT * FROM jsonb_array_elements(backup_data->('public_' || current_table))
                LOOP
                    EXECUTE format('INSERT INTO public.%I (%s) SELECT %s FROM jsonb_populate_record(NULL::public.%I, $1)', current_table, cols_list, cols_list, current_table) USING t;
                END LOOP;
            END IF;
        END IF;
    END LOOP;
END;
$$;

-- 2. Harden Devices RLS (Hide API Keys from Employees)
DROP POLICY IF EXISTS "devices_read_all" ON devices;
CREATE POLICY "devices_read_all" ON devices FOR SELECT 
USING (
    is_super_admin() OR 
    (company_id = get_my_company_id() AND get_auth_role() IN ('company_admin', 'manager'))
);

-- Note: Device tablet kiosks will use a security definer RPC or the API key directly via a bypass if needed, 
-- but they shouldn't be browsable by all employees.

-- 3. PIN Hashing and Secret Separation
CREATE TABLE IF NOT EXISTS public.profiles_private (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    pin_code_hash TEXT,
    two_factor_secret_encrypted TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrate existing PINs to hashes and secrets to private table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'pin_code') THEN
        INSERT INTO public.profiles_private (id, pin_code_hash)
        SELECT id, crypt(pin_code, gen_salt('bf', 8)) 
        FROM public.profiles 
        WHERE pin_code IS NOT NULL
        ON CONFLICT (id) DO UPDATE SET pin_code_hash = EXCLUDED.pin_code_hash;

        -- Remove sensitive columns from public profiles table
        ALTER TABLE public.profiles DROP COLUMN pin_code;
    END IF;

    -- Note: 2FA is handled similarly if the column exists in profiles
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'two_factor_secret') THEN
        UPDATE public.profiles_private p
        SET two_factor_secret_encrypted = pr.two_factor_secret
        FROM public.profiles pr
        WHERE p.id = pr.id;

        ALTER TABLE public.profiles DROP COLUMN two_factor_secret;
    END IF;
END $$;

-- 4. Enable RLS for profiles_private
ALTER TABLE public.profiles_private ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_private_self" ON public.profiles_private
FOR ALL USING (id = auth.uid() OR is_super_admin());

-- 5. Helper functions for PIN verification (Security Definer)
CREATE OR REPLACE FUNCTION verify_employee_pin(p_user_id UUID, p_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles_private
        WHERE id = p_user_id
        AND pin_code_hash = crypt(p_pin, pin_code_hash)
    );
END;
$$;

CREATE OR REPLACE FUNCTION verify_employee_pin_by_company(p_company_id UUID, p_pin TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_profile_id UUID;
BEGIN
    SELECT p.id INTO v_profile_id
    FROM profiles p
    JOIN profiles_private pp ON p.id = pp.id
    WHERE p.company_id = p_company_id
    AND pp.pin_code_hash = crypt(p_pin, pp.pin_code_hash)
    LIMIT 1;

    RETURN v_profile_id;
END;
$$;

CREATE OR REPLACE FUNCTION check_pin_exists_in_company(p_company_id UUID, p_pin TEXT, p_exclude_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM profiles p
        JOIN profiles_private pp ON p.id = pp.id
        WHERE p.company_id = p_company_id
        AND pp.pin_code_hash = crypt(p_pin, pp.pin_code_hash)
        AND (p_exclude_user_id IS NULL OR p.id != p_exclude_user_id)
    );
END;
$$;

CREATE OR REPLACE FUNCTION update_employee_pin(p_user_id UUID, p_new_pin TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_admin_id UUID;
    v_admin_role user_role;
    v_admin_company UUID;
    v_target_company UUID;
BEGIN
    v_admin_id := auth.uid();
    
    -- Get target company
    SELECT company_id INTO v_target_company FROM profiles WHERE id = p_user_id;

    -- If not self, check if requester is company_admin/manager of the same company
    IF v_admin_id != p_user_id THEN
        SELECT role, company_id INTO v_admin_role, v_admin_company FROM profiles WHERE id = v_admin_id;
        
        IF NOT (v_admin_role IN ('super_admin', 'company_admin', 'manager') AND (v_admin_role = 'super_admin' OR v_admin_company = v_target_company)) THEN
            RAISE EXCEPTION 'No autorizado para cambiar el PIN.';
        END IF;
    END IF;

    -- Insert or update hash
    INSERT INTO profiles_private (id, pin_code_hash)
    VALUES (p_user_id, crypt(p_new_pin, gen_salt('bf', 8)))
    ON CONFLICT (id) DO UPDATE SET 
        pin_code_hash = EXCLUDED.pin_code_hash,
        updated_at = NOW();
END;
$$;

-- 6. Stop logging passwords in admin_access_logs
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'admin_access_logs' AND column_name = 'password_attempted') THEN
        ALTER TABLE public.admin_access_logs DROP COLUMN password_attempted;
    END IF;
END $$;
