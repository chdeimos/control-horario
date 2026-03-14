-- Reparación de la función update_employee_pin para coincidir con la llamada de TypeScript
-- y asegurar la sincronización con PostgREST.

-- 1. Eliminar versiones anteriores
DROP FUNCTION IF EXISTS public.update_employee_pin(UUID, TEXT);
DROP FUNCTION IF EXISTS public.update_employee_pin(TEXT, TEXT);

-- 2. Crear versión con tipos TEXT de alta compatibilidad
CREATE OR REPLACE FUNCTION public.update_employee_pin(
    p_user_id TEXT,
    p_new_pin TEXT
)
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
    v_target_user_id UUID;
BEGIN
    -- Casting seguro del usuario objetivo
    BEGIN
        v_target_user_id := p_user_id::UUID;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'ID de usuario inválido format: %', p_user_id;
    END;

    -- Obtener ID del admin que hace la petición (si existe sesión)
    v_admin_id := auth.uid();
    
    -- Obtener empresa del usuario objetivo
    SELECT company_id INTO v_target_company FROM profiles WHERE id = v_target_user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Perfil de usuario no encontrado: %', p_user_id;
    END IF;

    -- Si hay un usuario autenticado (llamada desde la Web/App)
    IF v_admin_id IS NOT NULL THEN
        -- Si no es el propio usuario, verificar permisos de admin/manager
        IF v_admin_id != v_target_user_id THEN
            SELECT role, company_id INTO v_admin_role, v_admin_company FROM profiles WHERE id = v_admin_id;
            
            IF v_admin_role IS NULL OR NOT (
                v_admin_role = 'super_admin' OR 
                (v_admin_role IN ('company_admin', 'manager') AND v_admin_company = v_target_company)
            ) THEN
                RAISE EXCEPTION 'No autorizado para cambiar el PIN de este usuario.';
            END IF;
        END IF;
    END IF;

    -- Insertar o actualizar el hash del PIN
    -- Se asocia a profiles_private para mayor seguridad
    INSERT INTO profiles_private (id, pin_code_hash)
    VALUES (v_target_user_id, crypt(p_new_pin, gen_salt('bf', 8)))
    ON CONFLICT (id) DO UPDATE SET 
        pin_code_hash = EXCLUDED.pin_code_hash,
        updated_at = NOW();
END;
$$;

-- 3. Permisos
GRANT EXECUTE ON FUNCTION public.update_employee_pin(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_employee_pin(TEXT, TEXT) TO service_role;

-- 4. Notificar a PostgREST
NOTIFY pgrst, 'reload schema';
