-- Add information fields to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS logo_large_url TEXT,
ADD COLUMN IF NOT EXISTS logo_app_url TEXT,
ADD COLUMN IF NOT EXISTS logo_web_url TEXT;

-- Update RLS if needed (but companies table policies might already handle this)
-- Currently companies table RLS is not explicitly shown in schema, but let's assume it's standard.
