-- Reparación de la función verify_employee_pin_by_company para coincidir con la llamada de TypeScript
-- y asegurar la sincronización con PostgREST.

-- 1. Eliminar versiones anteriores
DROP FUNCTION IF EXISTS public.verify_employee_pin_by_company(UUID, TEXT);

-- 2. Crear versión con tipos TEXT de alta compatibilidad
CREATE OR REPLACE FUNCTION public.verify_employee_pin_by_company(
    p_company_id TEXT,
    p_pin TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_company_id UUID;
    v_profile_id UUID;
BEGIN
    -- Casting seguro de la empresa
    BEGIN
        v_company_id := p_company_id::UUID;
    EXCEPTION WHEN OTHERS THEN
        RETURN NULL;
    END;

    -- Si no hay PIN, no hay nada que comprobar
    IF p_pin IS NULL OR p_pin = '' THEN
        RETURN NULL;
    END IF;

    -- Buscar el empleado que coincida con la empresa y el hash del PIN
    SELECT p.id INTO v_profile_id
    FROM profiles p
    JOIN profiles_private pp ON p.id = pp.id
    WHERE p.company_id = v_company_id
    AND pp.pin_code_hash = crypt(p_pin, pp.pin_code_hash)
    LIMIT 1;

    RETURN v_profile_id;
END;
$$;

-- 3. Permisos explícitos para el Kiosko (que usa anon o authenticated)
GRANT EXECUTE ON FUNCTION public.verify_employee_pin_by_company(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_employee_pin_by_company(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_employee_pin_by_company(TEXT, TEXT) TO service_role;

-- 4. Notificar a PostgREST
NOTIFY pgrst, 'reload schema';
