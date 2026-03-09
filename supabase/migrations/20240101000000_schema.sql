-- Enable Extensions
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- Create Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'company_admin', 'manager', 'employee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE entry_type AS ENUM ('work', 'break', 'remote_work', 'training', 'medical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE entry_origin AS ENUM ('web', 'mobile_app', 'hardware_esp32', 'hardware_anviz', 'manual_correction');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Companies (Tenants)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    cif TEXT UNIQUE NOT NULL,
    subscription_plan TEXT DEFAULT 'basic',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles (Users) - Linked to auth.users
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    role user_role DEFAULT 'employee',
    full_name TEXT NOT NULL,
    nif TEXT,
    department TEXT,
    pin_code TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Devices (Hardware)
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('esp32', 'anviz', 'tablet_kiosk')),
    
    api_key TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    
    fixed_lat DOUBLE PRECISION,
    fixed_long DOUBLE PRECISION,

    is_active BOOLEAN DEFAULT true,
    last_seen TIMESTAMPTZ,
    config JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Time Entries (Fichajes)
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    company_id UUID REFERENCES companies(id) NOT NULL,
    
    clock_in TIMESTAMPTZ NOT NULL,
    clock_out TIMESTAMPTZ,
    
    entry_type entry_type DEFAULT 'work',
    origin entry_origin NOT NULL,
    
    -- Geolocation
    gps_lat DOUBLE PRECISION,
    gps_long DOUBLE PRECISION,
    gps_accuracy REAL,
    
    -- Hardware Reference
    device_id UUID REFERENCES devices(id),
    
    -- Correction Fields
    is_manual_correction BOOLEAN DEFAULT false,
    correction_reason TEXT,
    original_entry_id UUID REFERENCES time_entries(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraint: Web/App must have GPS, others can be null
    CONSTRAINT check_gps_required CHECK (
        (origin IN ('web', 'mobile_app') AND gps_lat IS NOT NULL AND gps_long IS NOT NULL) OR
        (origin NOT IN ('web', 'mobile_app'))
    )
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_time_entries_company_date ON time_entries (company_id, clock_in);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_date ON time_entries (user_id, clock_in);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- Base policies are now managed in consolidated migrations to prevent recursion.

-- Trigger: Prevent Overlap
CREATE OR REPLACE FUNCTION check_overlap()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM time_entries
        WHERE user_id = NEW.user_id
        AND clock_out IS NULL
        AND id != NEW.id
    ) THEN
        RAISE EXCEPTION 'El usuario ya tiene una entrada activa.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_check_overlap ON time_entries;
CREATE TRIGGER trigger_check_overlap
BEFORE INSERT ON time_entries
FOR EACH ROW
WHEN (NEW.clock_out IS NULL)
EXECUTE FUNCTION check_overlap();
