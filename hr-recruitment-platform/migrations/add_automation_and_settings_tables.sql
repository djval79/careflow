-- ============================================================================
-- ADD ALL MISSING TABLES FOR AUTOMATION AND SETTINGS
-- ============================================================================

-- 1. COMPANY_SETTINGS TABLE
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
    working_days INTEGER[] DEFAULT '{1,2,3,4,5}',
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

-- 2. AUTOMATION_RULES TABLE
CREATE TABLE IF NOT EXISTS automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name TEXT NOT NULL,
    rule_type TEXT DEFAULT 'workflow',
    trigger_event TEXT NOT NULL,
    trigger_data JSONB DEFAULT '{}',
    conditions JSONB DEFAULT '[]',
    actions JSONB DEFAULT '[]',
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    execution_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMPTZ,
    last_execution_status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AUTOMATION_EXECUTION_LOGS TABLE
CREATE TABLE IF NOT EXISTS automation_execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID,
    execution_timestamp TIMESTAMPTZ DEFAULT NOW(),
    trigger_event TEXT,
    trigger_data JSONB DEFAULT '{}',
    execution_status TEXT NOT NULL,
    execution_duration_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_company_settings_updated ON company_settings(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON automation_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_automation_rules_trigger ON automation_rules(trigger_event);
CREATE INDEX IF NOT EXISTS idx_automation_logs_rule ON automation_execution_logs(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_timestamp ON automation_execution_logs(execution_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_automation_logs_status ON automation_execution_logs(execution_status);

-- ENABLE RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_execution_logs ENABLE ROW LEVEL SECURITY;

-- CREATE POLICIES
DROP POLICY IF EXISTS "auth_all_company_settings" ON company_settings;
CREATE POLICY "auth_all_company_settings" ON company_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_all_automation_rules" ON automation_rules;
CREATE POLICY "auth_all_automation_rules" ON automation_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_all_automation_logs" ON automation_execution_logs;
CREATE POLICY "auth_all_automation_logs" ON automation_execution_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- GRANT PERMISSIONS
GRANT ALL ON company_settings TO service_role;
GRANT ALL ON automation_rules TO service_role;
GRANT ALL ON automation_execution_logs TO service_role;

-- INSERT DEFAULT DATA
INSERT INTO company_settings (company_name, company_email, company_phone)
SELECT 'Ringstead Care', 'info@ringsteadcare.com', '+44 1234 567890'
WHERE NOT EXISTS (SELECT 1 FROM company_settings);

-- VERIFICATION
SELECT '✅ All tables created successfully!' as status;
SELECT 'Company Settings: ' || COUNT(*)::text as result FROM company_settings;
SELECT 'Automation Rules: ' || COUNT(*)::text as result FROM automation_rules;
SELECT 'Automation Logs: ' || COUNT(*)::text as result FROM automation_execution_logs;
