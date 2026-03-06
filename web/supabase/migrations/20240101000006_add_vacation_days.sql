-- Add total_vacation_days column with default 30
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS total_vacation_days INTEGER DEFAULT 30;

-- Optionally, create a function to calculate days? Or user application logic.
-- Application logic is easier for now.
