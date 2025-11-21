-- Integration System Deployment - Complete Script
-- Run this in Supabase SQL Editor to deploy the complete integration system

-- Step 1: Create tables
-- Table: integrations
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_connected BOOLEAN DEFAULT false,
    config JSONB DEFAULT '{}',
    oauth_data JSONB,
    webhook_url TEXT,
    api_quota_limit INTEGER,
    api_quota_used INTEGER DEFAULT 0,
    quota_reset_at TIMESTAMPTZ,
    last_sync_at TIMESTAMPTZ,
    connection_error TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: integration_logs
CREATE TABLE IF NOT EXISTS integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    action TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending', 'retrying')),
    request_data JSONB,
    response_data JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    duration_ms NUMERIC,
    triggered_by UUID REFERENCES employees(id),
    related_entity_type TEXT,
    related_entity_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: notification_preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    channel TEXT NOT NULL,
    event_type TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    delivery_config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, channel, event_type)
);

-- Table: email_templates
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    variables JSONB DEFAULT '[]',
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_integrations_service ON integrations(service_name);
CREATE INDEX IF NOT EXISTS idx_integrations_active ON integrations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_integration_logs_service ON integration_logs(service_name);
CREATE INDEX IF NOT EXISTS idx_integration_logs_status ON integration_logs(status);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created ON integration_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_integration_logs_entity ON integration_logs(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_notification_prefs_employee ON notification_preferences(employee_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);

-- Step 3: Enable RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS Policies
CREATE POLICY "Admin users can manage integrations"
ON integrations FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM employees
        WHERE employees.id = auth.uid()
        AND employees.role IN ('admin', 'hr_manager')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM employees
        WHERE employees.id = auth.uid()
        AND employees.role IN ('admin', 'hr_manager')
    )
);

CREATE POLICY "Admin users can view all integration logs"
ON integration_logs FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM employees
        WHERE employees.id = auth.uid()
        AND employees.role IN ('admin', 'hr_manager')
    )
);

CREATE POLICY "Users can view logs they triggered"
ON integration_logs FOR SELECT TO authenticated
USING (triggered_by = auth.uid());

CREATE POLICY "Users can manage their own notification preferences"
ON notification_preferences FOR ALL TO authenticated
USING (employee_id = auth.uid())
WITH CHECK (employee_id = auth.uid());

CREATE POLICY "All authenticated users can view active email templates"
ON email_templates FOR SELECT TO authenticated
USING (is_active = true);

CREATE POLICY "Admin users can manage email templates"
ON email_templates FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM employees
        WHERE employees.id = auth.uid()
        AND employees.role IN ('admin', 'hr_manager')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM employees
        WHERE employees.id = auth.uid()
        AND employees.role IN ('admin', 'hr_manager')
    )
);

-- Service role policies
CREATE POLICY "Service role can insert integration logs"
ON integration_logs FOR INSERT TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update integrations"
ON integrations FOR UPDATE TO service_role
USING (true) WITH CHECK (true);

-- Step 5: Insert default email templates
INSERT INTO email_templates (template_name, display_name, subject, body_html, body_text, variables, category, is_active)
VALUES 
(
    'application_confirmation',
    'Application Confirmation',
    'Thank you for your application - {{role_title}}',
    '<html><body><h2>Thank you for applying!</h2><p>Dear {{candidate_name}},</p><p>We have received your application for the <strong>{{role_title}}</strong> position. We will review your application and get back to you within {{response_time}} business days.</p><p>Best regards,<br>{{company_name}} HR Team</p></body></html>',
    'Dear {{candidate_name}}, We have received your application for the {{role_title}} position. We will review your application and get back to you within {{response_time}} business days. Best regards, {{company_name}} HR Team',
    '["candidate_name", "role_title", "response_time", "company_name"]',
    'application',
    true
),
(
    'interview_invitation',
    'Interview Invitation',
    'Interview Invitation - {{role_title}}',
    '<html><body><h2>Interview Invitation</h2><p>Dear {{candidate_name}},</p><p>We are pleased to invite you to an interview for the <strong>{{role_title}}</strong> position.</p><p><strong>Date:</strong> {{interview_date}}<br><strong>Time:</strong> {{interview_time}}<br><strong>Duration:</strong> {{duration}} minutes<br><strong>Format:</strong> {{format}}</p><p>{{meeting_link}}</p><p>Please confirm your attendance by replying to this email.</p><p>Best regards,<br>{{interviewer_name}}</p></body></html>',
    'Dear {{candidate_name}}, We are pleased to invite you to an interview for the {{role_title}} position. Date: {{interview_date}}, Time: {{interview_time}}, Duration: {{duration}} minutes, Format: {{format}}. {{meeting_link}}. Please confirm your attendance. Best regards, {{interviewer_name}}',
    '["candidate_name", "role_title", "interview_date", "interview_time", "duration", "format", "meeting_link", "interviewer_name"]',
    'interview',
    true
),
(
    'offer_letter',
    'Job Offer',
    'Job Offer - {{role_title}} at {{company_name}}',
    '<html><body><h2>Job Offer</h2><p>Dear {{candidate_name}},</p><p>We are delighted to offer you the position of <strong>{{role_title}}</strong> at {{company_name}}.</p><p><strong>Start Date:</strong> {{start_date}}<br><strong>Salary:</strong> {{salary}}<br><strong>Benefits:</strong> {{benefits}}</p><p>Please review the attached offer letter and respond by {{response_deadline}}.</p><p>Congratulations!<br>{{hr_manager_name}}</p></body></html>',
    'Dear {{candidate_name}}, We are delighted to offer you the position of {{role_title}} at {{company_name}}. Start Date: {{start_date}}, Salary: {{salary}}, Benefits: {{benefits}}. Please respond by {{response_deadline}}. Congratulations! {{hr_manager_name}}',
    '["candidate_name", "role_title", "company_name", "start_date", "salary", "benefits", "response_deadline", "hr_manager_name"]',
    'offer',
    true
),
(
    'rejection_letter',
    'Application Update',
    'Update on your application - {{role_title}}',
    '<html><body><h2>Application Update</h2><p>Dear {{candidate_name}},</p><p>Thank you for your interest in the <strong>{{role_title}}</strong> position at {{company_name}}.</p><p>After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.</p><p>We appreciate the time you invested in the application process and wish you the best in your job search.</p><p>Sincerely,<br>{{company_name}} HR Team</p></body></html>',
    'Dear {{candidate_name}}, Thank you for your interest in the {{role_title}} position at {{company_name}}. After careful consideration, we have decided to move forward with other candidates. We appreciate your time and wish you the best. Sincerely, {{company_name}} HR Team',
    '["candidate_name", "role_title", "company_name"]',
    'rejection',
    true
)
ON CONFLICT (template_name) DO NOTHING;

-- Step 6: Register default integrations
INSERT INTO integrations (service_name, display_name, is_active, is_connected)
VALUES
  ('slack', 'Slack Workspace', true, false),
  ('zoom', 'Zoom Meetings', true, false),
  ('email', 'Email Service (SendGrid)', true, false),
  ('calendar', 'Google Calendar', false, false),
  ('storage', 'Google Drive', false, false)
ON CONFLICT (service_name) DO NOTHING;

-- Step 7: Verification queries
-- Check tables were created
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('integrations', 'integration_logs', 'notification_preferences', 'email_templates')
ORDER BY table_name;

-- Check data
SELECT 'Integration Services' as section, COUNT(*) as count FROM integrations
UNION ALL
SELECT 'Email Templates' as section, COUNT(*) as count FROM email_templates
UNION ALL
SELECT 'Integration Logs' as section, COUNT(*) as count FROM integration_logs;

-- Show what was created
SELECT * FROM integrations ORDER BY display_name;
SELECT template_name, category FROM email_templates ORDER BY category, template_name;

-- Deployment complete!
SELECT '✅ Integration system deployed successfully!' as status;
