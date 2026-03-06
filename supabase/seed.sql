-- 1. Create the Auth User (Password: admin123)
-- We use a fixed UUID for consistency across resets
DO $$
DECLARE
  admin_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Insert into auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@example.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, 
      raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at,
      last_sign_in_at, confirmation_token, recovery_token, email_change_token_new, email_change
    )
    VALUES (
      admin_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@example.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Super Admin"}',
      'authenticated',
      'authenticated',
      now(),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    -- Identity is mandatory for modern Supabase Auth login
    INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id)
    VALUES (
      admin_id,
      admin_id,
      format('{"sub":"%s","email":"%s"}', admin_id, 'admin@example.com')::jsonb,
      'email',
      now(),
      now(),
      now(),
      admin_id
    );
  END IF;

  -- 2. Create the Public Profile (Company-less Super Admin)
  INSERT INTO public.profiles (id, full_name, role, is_active)
  VALUES (admin_id, 'Super Admin', 'super_admin', true)
  ON CONFLICT (id) DO UPDATE SET role = 'super_admin', is_active = true;

END $$;
