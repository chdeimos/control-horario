-- Add target_total_hours to work_schedules for flexible targets per day
ALTER TABLE work_schedules ADD COLUMN IF NOT EXISTS target_total_hours DECIMAL(4,2) DEFAULT 8.0;
