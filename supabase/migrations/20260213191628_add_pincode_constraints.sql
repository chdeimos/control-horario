-- Clean up invalid PINs before applying constraints
-- 1. Remove PINs that are not exactly 4 digits
UPDATE profiles SET pin_code = NULL WHERE pin_code IS NOT NULL AND pin_code !~ '^\d{4}$';

-- 2. Handle duplicates within the same company by keeping only the newest record's PIN
WITH duplicates AS (
    SELECT id, 
           ROW_NUMBER() OVER(PARTITION BY company_id, pin_code ORDER BY created_at DESC) as rn
    FROM profiles
    WHERE pin_code IS NOT NULL
)
UPDATE profiles 
SET pin_code = NULL 
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Now apply the constraints
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS check_pin_code_length;

ALTER TABLE profiles
ADD CONSTRAINT check_pin_code_length 
CHECK (pin_code IS NULL OR pin_code ~ '^\d{4}$');

ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS unique_pin_code_per_company;

ALTER TABLE profiles
ADD CONSTRAINT unique_pin_code_per_company 
UNIQUE (company_id, pin_code);
