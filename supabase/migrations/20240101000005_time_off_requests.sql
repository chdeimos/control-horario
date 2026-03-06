-- Create Time Off Requests Table

CREATE TABLE IF NOT EXISTS time_off_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    request_type TEXT NOT NULL CHECK (request_type IN ('vacation', 'medical', 'personal', 'other')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reason TEXT,
    manager_note TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS is managed in consolidated migrations to prevent recursion.
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
