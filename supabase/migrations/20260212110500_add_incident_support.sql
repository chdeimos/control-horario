-- Add Incident Support to Time Entries
ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS is_incident BOOLEAN DEFAULT false;
ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS incident_reason TEXT;

-- Update RLS for new columns (usually inherited from table-level RLS, but just in case)
-- No changes needed as table-level RLS handles it.
