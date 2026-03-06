-- DEFINITIVE CORE SYSTEM CONSOLIDATION (v4)
-- Centralized RLS management for ALL tables to prevent recursion

-- 1. Helper Functions (Security Definer to bypass RLS)
-- These functions run as 'postgres' and bypass RLS on the tables they query.
CREATE OR REPLACE FUNCTION get_auth_role() RETURNS user_role AS $$
BEGIN
    RETURN (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_super_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_my_company_id() RETURNS UUID AS $$
BEGIN
    RETURN (SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_user_active(user_uuid UUID) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_uuid 
        AND status IN ('active', 'medical_leave')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. System Tables (Plans, Metrics, Invoices)
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    billing_type TEXT DEFAULT 'per_user', -- 'per_user', 'fixed'
    price_per_user DECIMAL(10, 2) DEFAULT 0,
    fixed_price DECIMAL(10, 2) DEFAULT 0,
    fixed_users_limit INTEGER DEFAULT 0,
    currency TEXT DEFAULT 'EUR',
    features JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS volume_discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
    min_users INTEGER NOT NULL,
    discount_percentage DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_monthly_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    peak_active_users INTEGER DEFAULT 0,
    current_active_users INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, month, year)
);

CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending',
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, month, year)
);

-- 3. Sync Existing Tables Schema
ALTER TABLE companies ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 10;

-- 4. CONSOLIDATED RLS POLICIES

-- 4. CLEAN RLS FOR PROFILES (No Recursion)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Base policy: You can see your own record.
DROP POLICY IF EXISTS "profiles_self_select" ON profiles;
CREATE POLICY "profiles_self_select" ON profiles FOR SELECT USING (id = auth.uid());

-- Super Admin: Full access to all profiles
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (is_super_admin());

-- Colleagues: Can see profiles in the same company
DROP POLICY IF EXISTS "profiles_company_select" ON profiles;
CREATE POLICY "profiles_company_select" ON profiles FOR SELECT 
USING (company_id IS NOT NULL AND company_id = get_my_company_id());

-- 4.1 COMPANIES RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Super Admin: Full access to all companies
DROP POLICY IF EXISTS "companies_admin_all" ON companies;
CREATE POLICY "companies_admin_all" ON companies FOR ALL USING (is_super_admin());

-- Company members: Can see their own company
DROP POLICY IF EXISTS "companies_member_select" ON companies;
CREATE POLICY "companies_member_select" ON companies FOR SELECT 
USING (id = get_my_company_id());

-- 4.2 TIME ENTRIES RLS
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Base policy: You can manage your own records.
DROP POLICY IF EXISTS "time_entries_self" ON time_entries;
CREATE POLICY "time_entries_self" ON time_entries FOR ALL USING (user_id = auth.uid());

-- Admin/Manager: Full access to company records
DROP POLICY IF EXISTS "time_entries_admin" ON time_entries;
CREATE POLICY "time_entries_admin" ON time_entries FOR ALL 
USING (is_super_admin() OR (company_id = get_my_company_id() AND get_auth_role() IN ('company_admin', 'manager')));

-- 4.3 DEVICES RLS
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- Read policy: Super Admin or company members
DROP POLICY IF EXISTS "devices_read_all" ON devices;
CREATE POLICY "devices_read_all" ON devices FOR SELECT 
USING (is_super_admin() OR company_id = get_my_company_id());

-- Admin policy: Super Admin or company admins/managers
DROP POLICY IF EXISTS "devices_admin_all" ON devices;
CREATE POLICY "devices_admin_all" ON devices FOR ALL 
USING (is_super_admin() OR (company_id = get_my_company_id() AND get_auth_role() IN ('company_admin', 'manager')));

-- TIME_OFF_REQUESTS
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "timeoff_self" ON time_off_requests;
CREATE POLICY "timeoff_self" ON time_off_requests FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "timeoff_admin" ON time_off_requests;
CREATE POLICY "timeoff_admin" ON time_off_requests FOR ALL 
USING (is_super_admin() OR (company_id = get_my_company_id() AND get_auth_role() IN ('company_admin', 'manager')));

-- DEPARTMENTS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dept_read" ON departments;
CREATE POLICY "dept_read" ON departments FOR SELECT 
USING (is_super_admin() OR company_id = get_my_company_id());
DROP POLICY IF EXISTS "dept_admin" ON departments;
CREATE POLICY "dept_admin" ON departments FOR ALL 
USING (is_super_admin() OR (company_id = get_my_company_id() AND get_auth_role() IN ('company_admin', 'manager')));

-- PLANS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "plans_read_all" ON plans;
CREATE POLICY "plans_read_all" ON plans FOR SELECT USING (true);
DROP POLICY IF EXISTS "plans_admin_all" ON plans;
CREATE POLICY "plans_admin_all" ON plans FOR ALL USING (is_super_admin());

ALTER TABLE volume_discounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "discounts_read_all" ON volume_discounts;
CREATE POLICY "discounts_read_all" ON volume_discounts FOR SELECT USING (true);
DROP POLICY IF EXISTS "discounts_admin_all" ON volume_discounts;
CREATE POLICY "discounts_admin_all" ON volume_discounts FOR ALL USING (is_super_admin());

-- INVOICES & METRICS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoices_read" ON invoices FOR SELECT USING (is_super_admin() OR company_id = get_my_company_id());
CREATE POLICY "invoices_admin" ON invoices FOR ALL USING (is_super_admin());

ALTER TABLE company_monthly_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "metrics_read" ON company_monthly_metrics FOR SELECT USING (is_super_admin() OR company_id = get_my_company_id());
CREATE POLICY "metrics_admin" ON company_monthly_metrics FOR ALL USING (is_super_admin());

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_admin_all" ON system_settings FOR ALL USING (is_super_admin());

-- 5. Seed Data
INSERT INTO plans (name, billing_type, price_per_user)
VALUES ('Standard', 'per_user', 5.00)
ON CONFLICT (name) DO NOTHING;


-- Seeding is handled via seed.sql
