-- ============================================================================
-- CREATE COMPANY_SETTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL DEFAULT 'My Company',
    company_logo_url TEXT,
    company_address TEXT,
    company_phone TEXT,
    company_email TEXT,
    company_website TEXT,
    timezone TEXT DEFAULT 'UTC',
    date_format TEXT DEFAULT 'MM/dd/yyyy',
    currency TEXT DEFAULT 'USD',
    fiscal_year_start DATE,
    working_days INTEGER[] DEFAULT '{1,2,3,4,5}', -- Monday to Friday
    working_hours_start TIME DEFAULT '09:00:00',
    working_hours_end TIME DEFAULT '17:00:00',
    overtime_enabled BOOLEAN DEFAULT true,
    overtime_rate NUMERIC DEFAULT 1.5,
    leave_approval_required BOOLEAN DEFAULT true,
    attendance_tracking_enabled BOOLEAN DEFAULT true,
    biometric_enabled BOOLEAN DEFAULT false,
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_company_settings_updated ON company_settings(updated_at DESC);

-- Enable RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Create policy
DROP POLICY IF EXISTS "auth_all_company_settings" ON company_settings;
CREATE POLICY "auth_all_company_settings" ON company_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON company_settings TO service_role;

-- Insert default company settings (only if table is empty)
INSERT INTO company_settings (company_name, company_email)
SELECT 'Ringstead Care', 'info@ringsteadcare.com'
WHERE NOT EXISTS (SELECT 1 FROM company_settings);

-- Verification
SELECT 'Company settings table created successfully!' as status;
SELECT * FROM company_settings;
