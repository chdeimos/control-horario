-- Corrige la firma de la función para mejorar la compatibilidad con la caché de PostgREST
-- Re-define la función con parámetros en orden alfabético para evitar problemas de resolución

CREATE OR REPLACE FUNCTION public.check_pin_exists_in_company(
    p_company_id UUID, 
    p_exclude_user_id UUID DEFAULT NULL,
    p_pin TEXT DEFAULT NULL
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
