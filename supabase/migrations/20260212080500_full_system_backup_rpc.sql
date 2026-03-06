-- Super Backup & Restore Functions (REALLY ROBUST v3.4)
-- Improved Auth restoration by dynamically excluding generated columns.

-- 1. Backup Function
CREATE OR REPLACE FUNCTION public.get_system_backup()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    backup JSONB;
    table_rec RECORD;
    table_data JSONB;
    table_list TEXT[] := ARRAY[
        'plans', 'volume_discounts', 'companies', 'departments', 
        'profiles', 'devices', 'time_entries', 'time_off_requests', 
        'company_monthly_metrics', 'invoices', 'system_settings', 'work_schedules'
    ];
    current_table TEXT;
BEGIN
    backup = jsonb_build_object(
        'version', '3.4',
        'timestamp', now(),
        'auth_users', (SELECT COALESCE(jsonb_agg(u), '[]'::jsonb) FROM auth.users u),
        'auth_identities', (SELECT COALESCE(jsonb_agg(i), '[]'::jsonb) FROM auth.identities i)
    );
    
    FOREACH current_table IN ARRAY table_list
    LOOP
        -- Check if table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = current_table) THEN
            EXECUTE format('SELECT COALESCE(jsonb_agg(t), ''[]''::jsonb) FROM public.%I t', current_table) INTO table_data;
            backup = backup || jsonb_build_object('public_' || current_table, table_data);
        END IF;
    END LOOP;
    
    RETURN backup;
END;
$$;

-- 2. Restore Function
CREATE OR REPLACE FUNCTION public.restore_system_backup(backup_data JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    u JSONB;
    i JSONB;
    t JSONB;
    current_table TEXT;
    cols_list TEXT;
    -- Order is important for FKs: children first for delete, parents first for insert
    delete_order TEXT[] := ARRAY[
        'invoices', 'company_monthly_metrics', 'work_schedules', 'time_entries', 
        'time_off_requests', 'devices', 'profiles', 'departments', 
        'companies', 'volume_discounts', 'plans', 'system_settings'
    ];
    insert_order TEXT[] := ARRAY[
        'system_settings', 'plans', 'volume_discounts', 'companies', 
        'departments', 'profiles', 'devices', 'time_off_requests', 
        'time_entries', 'work_schedules', 'company_monthly_metrics', 'invoices'
    ];
BEGIN
    -- 1. Delete existing data (if tables exist)
    FOREACH current_table IN ARRAY delete_order
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = current_table) THEN
            EXECUTE format('DELETE FROM public.%I WHERE TRUE', current_table);
        END IF;
    END LOOP;
    
    -- 2. Delete Auth
    DELETE FROM auth.identities WHERE TRUE;
    DELETE FROM auth.users WHERE TRUE;

    -- 3. Restore Auth Users (Dynamics Column List to avoid generated columns)
    IF backup_data->'auth_users' IS NOT NULL AND jsonb_array_length(backup_data->'auth_users') > 0 THEN
        -- Get non-generated columns
        SELECT string_agg(quote_ident(column_name), ', ')
        INTO cols_list
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
        -- Get non-generated columns
        SELECT string_agg(quote_ident(column_name), ', ')
        INTO cols_list
        FROM information_schema.columns 
        WHERE table_schema = 'auth' AND table_name = 'identities' 
        AND (is_generated = 'NEVER' OR is_generated IS NULL);

        FOR i IN SELECT * FROM jsonb_array_elements(backup_data->'auth_identities')
        LOOP
            EXECUTE format('INSERT INTO auth.identities (%s) SELECT %s FROM jsonb_populate_record(NULL::auth.identities, $1)', cols_list, cols_list) USING i;
        END LOOP;
    END IF;

    -- 5. Restore Public Tables (in order)
    FOREACH current_table IN ARRAY insert_order
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = current_table) THEN
            IF backup_data->('public_' || current_table) IS NOT NULL AND jsonb_array_length(backup_data->('public_' || current_table)) > 0 THEN
                -- Also get non-generated columns for safety in public tables
                SELECT string_agg(quote_ident(column_name), ', ')
                INTO cols_list
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
