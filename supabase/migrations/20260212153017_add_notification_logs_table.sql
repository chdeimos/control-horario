-- Add Notification Logs to track sent alerts and avoid spam
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL, -- e.g., 'missing_clock_in', 'missing_clock_out'
    event_key TEXT NOT NULL,      -- e.g., 'in_1_2026-02-12'
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, event_key)
);

-- RLS
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_all_access" ON notification_logs FOR ALL 
USING (is_super_admin());

CREATE POLICY "user_view_own" ON notification_logs FOR SELECT
USING (user_id = auth.uid());
