-- Versión de máxima compatibilidad usando TEXT y castings internos
-- Esto evita errores de resolución de tipos entre JS y PostgREST

-- 1. Limpiar versiones anteriores
DROP FUNCTION IF EXISTS public.check_pin_exists_in_company(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.check_pin_exists_in_company(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS public.check_pin_exists_in_company(UUID, TEXT);

-- 2. Crear versión con parámetros de texto
CREATE OR REPLACE FUNCTION public.check_pin_exists_in_company(
    p_company_id TEXT,
    p_exclude_user_id TEXT,
    p_pin TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_company_id UUID;
    v_exclude_id UUID;
BEGIN
    -- Castings seguros
    BEGIN
        v_company_id := p_company_id::UUID;
    EXCEPTION WHEN OTHERS THEN
        RETURN FALSE;
    END;

    IF p_exclude_user_id IS NOT NULL AND p_exclude_user_id != '' THEN
        BEGIN
            v_exclude_id := p_exclude_user_id::UUID;
        EXCEPTION WHEN OTHERS THEN
            v_exclude_id := NULL;
        END;
    ELSE
        v_exclude_id := NULL;
    END IF;

    -- Si no hay PIN, no hay nada que comprobar
    IF p_pin IS NULL OR p_pin = '' THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1 
        FROM profiles p
        JOIN profiles_private pp ON p.id = pp.id
        WHERE p.company_id = v_company_id
        AND pp.pin_code_hash = crypt(p_pin, pp.pin_code_hash)
        AND (v_exclude_id IS NULL OR p.id != v_exclude_id)
    );
END;
$$;

-- 3. Asegurar permisos explícitos
GRANT EXECUTE ON FUNCTION public.check_pin_exists_in_company(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_pin_exists_in_company(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_pin_exists_in_company(TEXT, TEXT, TEXT) TO service_role;

NOTIFY pgrst, 'reload schema';
