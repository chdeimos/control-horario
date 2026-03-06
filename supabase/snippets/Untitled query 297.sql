CREATE OR REPLACE FUNCTION public.verify_2fa_token(token TEXT)
RETURNS JSON AS $$
DECLARE
    user_secret TEXT;
    is_enabled BOOLEAN;
    v_now TIMESTAMPTZ := NOW();
    v_timestamp BIGINT;
    v_secret_bytes BYTEA;
    v_hash BYTEA;
    v_offset INTEGER;
    v_code INTEGER;
    v_i INTEGER;
    v_token_val INTEGER;
    v_base32_alphabet TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    v_buffer BIGINT := 0;
    v_bits_left INTEGER := 0;
    v_char_val INTEGER;
    v_result_bytes BYTEA := '\x'::BYTEA;
BEGIN
    -- 1. Obtener secreto
    SELECT two_factor_secret, two_factor_enabled 
    INTO user_secret, is_enabled
    FROM public.profiles
    WHERE id = auth.uid();
    IF NOT is_enabled OR user_secret IS NULL THEN
        RETURN json_build_object('success', false, 'error', '2FA no habilitado');
    END IF;
    -- 2. Validar formato
    IF token !~ '^[0-9]{6}$' THEN
        RETURN json_build_object('success', false, 'error', 'Formato inválido');
    END IF;
    v_token_val := token::INTEGER;
    -- 3. Decodificar Base32 (Con casting a INTEGER para set_byte)
    FOR v_i IN 1..length(user_secret) LOOP
        v_char_val := strpos(v_base32_alphabet, upper(substring(user_secret from v_i for 1))) - 1;
        IF v_char_val >= 0 THEN
            v_buffer := (v_buffer << 5) | v_char_val;
            v_bits_left := v_bits_left + 5;
            IF v_bits_left >= 8 THEN
                -- AquÃ­ aplicamos ::INTEGER para solucionar el error de tipo de la captura
                v_result_bytes := v_result_bytes || set_byte('\x00'::BYTEA, 0, ((v_buffer >> (v_bits_left - 8)) & 255)::INTEGER);
                v_bits_left := v_bits_left - 8;
            END IF;
        END IF;
    END LOOP;
    v_secret_bytes := v_result_bytes;
    -- 4. Verificar ventana de tiempo
    FOR v_i IN -1..1 LOOP
        v_timestamp := floor(extract(epoch from v_now) / 30) + v_i;
        
        v_hash := hmac(
            decode(lpad(to_hex(v_timestamp), 16, '0'), 'hex'),
            v_secret_bytes,
            'sha1'
        );
        
        v_offset := get_byte(v_hash, 19) & 15;
        v_code := ((get_byte(v_hash, v_offset) & 127) << 24) |
                  ((get_byte(v_hash, v_offset + 1) & 255) << 16) |
                  ((get_byte(v_hash, v_offset + 2) & 255) << 8) |
                  (get_byte(v_hash, v_offset + 3) & 255);
        v_code := v_code % 1000000;
        IF v_code = v_token_val THEN
            UPDATE public.profiles 
            SET last_2fa_verification = v_now
            WHERE id = auth.uid();
            
            RETURN json_build_object('success', true);
        END IF;
    END LOOP;
    RETURN json_build_object('success', false, 'error', 'Código 2FA incorrecto');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Asegurar permisos
GRANT EXECUTE ON FUNCTION public.verify_2fa_token(TEXT) TO authenticated;
