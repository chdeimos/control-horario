-- RPC for 2FA Verification on Mobile/Client
-- Implements TOTP (RFC 6238) verification in PL/pgSQL using pgcrypto

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
    -- Base32 decoding variables
    v_base32_alphabet TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    v_buffer BIGINT := 0;
    v_bits_left INTEGER := 0;
    v_char_val INTEGER;
    v_result_bytes BYTEA := '\x'::BYTEA;
BEGIN
    -- 1. Get user secret and status
    SELECT two_factor_secret, two_factor_enabled 
    INTO user_secret, is_enabled
    FROM public.profiles
    WHERE id = auth.uid();

    IF NOT is_enabled OR user_secret IS NULL THEN
        RETURN json_build_object('success', false, 'error', '2FA is not enabled for this user');
    END IF;

    -- 2. Validate token format (6 digits)
    IF token !~ '^[0-9]{6}$' THEN
        RETURN json_build_object('success', false, 'error', 'Invalid token format');
    END IF;
    v_token_val := token::INTEGER;

    -- 3. Decode Base32 secret to bytes
    FOR v_i IN 1..length(user_secret) LOOP
        v_char_val := strpos(v_base32_alphabet, upper(substring(user_secret from v_i for 1))) - 1;
        IF v_char_val >= 0 THEN
            v_buffer := (v_buffer << 5) | v_char_val;
            v_bits_left := v_bits_left + 5;
            IF v_bits_left >= 8 THEN
                v_result_bytes := v_result_bytes || set_byte('\x00'::BYTEA, 0, (v_buffer >> (v_bits_left - 8)) & 255);
                v_bits_left := v_bits_left - 8;
            END IF;
        END IF;
    END LOOP;
    v_secret_bytes := v_result_bytes;

    -- 4. Check codes in a window (Current, -1, +1 to account for clock drift)
    FOR v_i IN -1..1 LOOP
        v_timestamp := floor(extract(epoch from v_now) / 30) + v_i;
        
        -- HMAC-SHA1(secret, timestamp_bytes)
        -- Timestamp must be 8-byte big-endian
        v_hash := hmac(
            decode(lpad(to_hex(v_timestamp), 16, '0'), 'hex'),
            v_secret_bytes,
            'sha1'
        );
        
        -- Dynamic truncation
        v_offset := get_byte(v_hash, 19) & 15;
        v_code := ((get_byte(v_hash, v_offset) & 127) << 24) |
                  ((get_byte(v_hash, v_offset + 1) & 255) << 16) |
                  ((get_byte(v_hash, v_offset + 2) & 255) << 8) |
                  (get_byte(v_hash, v_offset + 3) & 255);
        v_code := v_code % 1000000;

        IF v_code = v_token_val THEN
            -- Success! Update last verification
            UPDATE public.profiles 
            SET last_2fa_verification = v_now
            WHERE id = auth.uid();
            
            RETURN json_build_object('success', true);
        END IF;
    END LOOP;

    RETURN json_build_object('success', false, 'error', 'Invalid 2FA code');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.verify_2fa_token(TEXT) TO authenticated;
