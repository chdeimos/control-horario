-- Create enum for employee status
DO $$ BEGIN
    CREATE TYPE employee_status AS ENUM ('active', 'terminated', 'medical_leave', 'unpaid_leave');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add status column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status employee_status DEFAULT 'active';

-- Migrate existing data based on is_active
UPDATE profiles SET status = 'active' WHERE is_active = true;
UPDATE profiles SET status = 'terminated' WHERE is_active = false;

-- Ensure status is not null
ALTER TABLE profiles ALTER COLUMN status SET NOT NULL;

-- Update RLS policies to respect status
-- (This might require dropping and recreating policies depending on complexity, 
-- but for now we just add the column. We will update specific RLS in a separate step or here)

-- is_user_active function is moved to consolidated migrations to prevent recursion.
