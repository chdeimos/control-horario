-- Onboarding Function
CREATE OR REPLACE FUNCTION create_company_and_owner(
  company_name TEXT,
  company_cif TEXT,
  user_full_name TEXT,
  user_nif TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_company_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  INSERT INTO companies (name, cif, subscription_plan)
  VALUES (company_name, company_cif, 'basic')
  RETURNING id INTO new_company_id;

  INSERT INTO profiles (company_id, id, role, full_name, nif)
  VALUES (
    new_company_id,
    current_user_id,
    'company_admin',
    user_full_name,
    user_nif
  );

  RETURN new_company_id;
END;
$$;
