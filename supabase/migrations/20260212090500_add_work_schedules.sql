-- Add Work Schedules System
CREATE TABLE IF NOT EXISTS work_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1: Lunes, 7: Domingo
    
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    start_time_2 TIME,
    end_time_2 TIME,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(profile_id, day_of_week)
);

-- Add schedule_type to profiles to distinguish between flexible (total hours) and fixed (specific times)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS schedule_type TEXT DEFAULT 'flexible' CHECK (schedule_type IN ('flexible', 'fixed'));

-- Enable RLS
ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;

-- Policies for work_schedules
DROP POLICY IF EXISTS "schedules_select" ON work_schedules;
CREATE POLICY "schedules_select" ON work_schedules FOR SELECT 
USING (
    profile_id = auth.uid() OR 
    is_super_admin() OR 
    (SELECT company_id FROM profiles WHERE id = work_schedules.profile_id) = get_my_company_id()
);

DROP POLICY IF EXISTS "schedules_admin_all" ON work_schedules;
CREATE POLICY "schedules_admin_all" ON work_schedules FOR ALL
USING (
    is_super_admin() OR 
    (
        (SELECT company_id FROM profiles WHERE id = work_schedules.profile_id) = get_my_company_id() AND 
        get_auth_role() IN ('company_admin', 'manager')
    )
);
