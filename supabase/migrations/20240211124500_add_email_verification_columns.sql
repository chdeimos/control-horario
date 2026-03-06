ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_change_code TEXT,
ADD COLUMN IF NOT EXISTS email_change_temp TEXT;
