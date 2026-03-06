-- Add scheduled_hours to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS scheduled_hours DECIMAL(4,2) DEFAULT 8.0;
