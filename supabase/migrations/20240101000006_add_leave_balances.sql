-- Add Vacation and Personal Days columns to profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_vacation_days') THEN
        ALTER TABLE profiles ADD COLUMN total_vacation_days INTEGER DEFAULT 22; -- Standard 22 working days
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'consumed_vacation_days') THEN
        ALTER TABLE profiles ADD COLUMN consumed_vacation_days INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_personal_days') THEN
        ALTER TABLE profiles ADD COLUMN total_personal_days INTEGER DEFAULT 0; -- Asuntos propios / Libre disposición
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'consumed_personal_days') THEN
        ALTER TABLE profiles ADD COLUMN consumed_personal_days INTEGER DEFAULT 0;
    END IF;
END $$;
