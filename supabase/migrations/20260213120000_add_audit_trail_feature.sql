-- Add Audit Trail Feature to Time Entries
ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS is_audited BOOLEAN DEFAULT false;

-- Add index to speed up filtering of non-audited incidents
CREATE INDEX IF NOT EXISTS idx_time_entries_audited_incident ON public.time_entries (is_audited, is_manual_correction) WHERE is_manual_correction = true;
