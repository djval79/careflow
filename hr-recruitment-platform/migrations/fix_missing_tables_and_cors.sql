-- Create company_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS company_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL DEFAULT 'Ringstead Care',
    company_address TEXT,
    company_email TEXT,
    company_phone TEXT,
    company_website TEXT,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#00D9FF',
    secondary_color TEXT DEFAULT '#0A1628',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for company_settings
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for company_settings (viewable by all authenticated users, editable by admins)
CREATE POLICY "Company settings viewable by all authenticated users" 
ON company_settings FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Company settings editable by admins" 
ON company_settings FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM users_profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
);

-- Insert default company settings if empty
INSERT INTO company_settings (company_name, company_email)
SELECT 'Ringstead Care', 'hr@ringsteadcare.com'
WHERE NOT EXISTS (SELECT 1 FROM company_settings);


-- Create automation_rules table if it doesn't exist
CREATE TABLE IF NOT EXISTS automation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    trigger_event TEXT NOT NULL,
    conditions JSONB DEFAULT '[]',
    actions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for automation_rules
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

-- Create policy for automation_rules
CREATE POLICY "Automation rules viewable by all authenticated users" 
ON automation_rules FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Automation rules editable by admins" 
ON automation_rules FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM users_profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
);

-- Create automation_execution_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS automation_execution_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id UUID REFERENCES automation_rules(id) ON DELETE SET NULL,
    trigger_event TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    execution_data JSONB,
    error_message TEXT,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for automation_execution_logs
ALTER TABLE automation_execution_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for automation_execution_logs
CREATE POLICY "Automation logs viewable by admins" 
ON automation_execution_logs FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM users_profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
);

CREATE POLICY "Automation logs insertable by service role" 
ON automation_execution_logs FOR INSERT 
TO service_role 
WITH CHECK (true);
