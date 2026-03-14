-- Limpieza profunda y redefinición única para evitar conflictos de sobrecarga
-- 1. Eliminar todas las posibles versiones de la función para limpiar la caché
DROP FUNCTION IF EXISTS public.check_pin_exists_in_company(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS public.check_pin_exists_in_company(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.check_pin_exists_in_company(UUID, TEXT);

-- 2. Crear la función con parámetros en orden ALFABÉTICO (recomendado para PostgREST)
-- p_company_id, p_exclude_user_id, p_pin
CREATE OR REPLACE FUNCTION public.check_pin_exists_in_company(
    p_company_id UUID,
    p_exclude_user_id UUID,
    p_pin TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    -- Si no hay PIN, no hay nada que comprobar
    IF p_pin IS NULL OR p_pin = '' THEN
        RETURN FALSE;
    END IF;

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

-- 3. Forzar refresco de caché de PostgREST si está disponible
NOTIFY pgrst, 'reload schema';
