-- ============================================================================
-- COMPLETE DATABASE MIGRATION - IDEMPOTENT VERSION
-- ============================================================================
-- This version safely handles existing tables and policies
-- Copy and paste this entire file into Supabase SQL Editor and click Run
-- ============================================================================

-- ============================================================================
-- STEP 1: Core Performance Schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id),
  reviewer_id UUID REFERENCES employees(id),
  review_period_start DATE,
  review_period_end DATE,
  status TEXT,
  overall_rating NUMERIC,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id),
  title TEXT,
  description TEXT,
  status TEXT,
  progress INTEGER,
  due_date DATE,
  priority TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kpi_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id),
  metric_name TEXT,
  actual_value NUMERIC,
  target_value NUMERIC,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: Optional Performance Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS performance_review_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT,
  auto_schedule BOOLEAN DEFAULT false,
  requires_self_assessment BOOLEAN DEFAULT false,
  requires_manager_review BOOLEAN DEFAULT true,
  requires_peer_review BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kpi_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  unit_of_measure TEXT,
  target_value NUMERIC,
  calculation_method TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE performance_review_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_definitions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Allow authenticated users full access to performance_review_types" ON performance_review_types;
DROP POLICY IF EXISTS "Allow authenticated users full access to kpi_definitions" ON kpi_definitions;

CREATE POLICY "Allow authenticated users full access to performance_review_types" 
ON performance_review_types FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to kpi_definitions" 
ON kpi_definitions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default data
INSERT INTO performance_review_types (name, description, frequency, auto_schedule, requires_self_assessment, requires_manager_review)
VALUES 
  ('Annual Performance Review', 'Comprehensive yearly review of employee performance', 'annual', true, true, true),
  ('Quarterly Check-in', 'Quarterly progress review and goal alignment', 'quarterly', true, false, true),
  ('Probation Review', 'End of probation period assessment', 'on_demand', false, false, true),
  ('360 Degree Review', 'Multi-source feedback including peers and direct reports', 'annual', false, true, true)
ON CONFLICT DO NOTHING;

INSERT INTO kpi_definitions (name, description, category, unit_of_measure, target_value)
VALUES 
  ('Customer Satisfaction Score', 'Average customer satisfaction rating', 'Quality', 'score (1-5)', 4.5),
  ('Sales Target Achievement', 'Percentage of sales quota achieved', 'Sales', '%', 100),
  ('Project Delivery On Time', 'Percentage of projects delivered by deadline', 'Efficiency', '%', 95),
  ('Code Review Completion', 'Percentage of code reviews completed within SLA', 'Quality', '%', 90),
  ('Employee Retention Rate', 'Percentage of employees retained year-over-year', 'HR', '%', 85)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 3: Integration Tables
-- ============================================================================

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
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
    triggered_by UUID,
    related_entity_type TEXT,
    related_entity_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID,
    channel TEXT NOT NULL,
    event_type TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    delivery_config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, channel, event_type)
);

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
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_integrations_service ON integrations(service_name);
CREATE INDEX IF NOT EXISTS idx_integrations_active ON integrations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_integration_logs_service ON integration_logs(service_name);
CREATE INDEX IF NOT EXISTS idx_integration_logs_status ON integration_logs(status);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created ON integration_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_integration_logs_entity ON integration_logs(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_notification_prefs_employee ON notification_preferences(employee_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);

-- Enable RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Authenticated users can manage integrations" ON integrations;
DROP POLICY IF EXISTS "Authenticated users can view integration logs" ON integration_logs;
DROP POLICY IF EXISTS "Service role can insert integration logs" ON integration_logs;
DROP POLICY IF EXISTS "Service role can update integration logs" ON integration_logs;
DROP POLICY IF EXISTS "Users can manage their own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "All authenticated users can view active email templates" ON email_templates;
DROP POLICY IF EXISTS "Authenticated users can manage email templates" ON email_templates;
DROP POLICY IF EXISTS "Service role can update integrations" ON integrations;

CREATE POLICY "Authenticated users can manage integrations"
ON integrations FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view integration logs"
ON integration_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can insert integration logs"
ON integration_logs FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role can update integration logs"
ON integration_logs FOR UPDATE TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can manage their own notification preferences"
ON notification_preferences FOR ALL TO authenticated
USING (employee_id = auth.uid()) WITH CHECK (employee_id = auth.uid());

CREATE POLICY "All authenticated users can view active email templates"
ON email_templates FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Authenticated users can manage email templates"
ON email_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Service role can update integrations"
ON integrations FOR UPDATE TO service_role USING (true) WITH CHECK (true);

-- Insert email templates
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

-- Insert integrations
INSERT INTO integrations (service_name, display_name, is_active, is_connected)
VALUES
  ('slack', 'Slack Workspace', true, false),
  ('zoom', 'Zoom Meetings', true, false),
  ('email', 'Email Service (SendGrid)', true, false),
  ('calendar', 'Google Calendar', false, false),
  ('storage', 'Google Drive', false, false)
ON CONFLICT (service_name) DO NOTHING;

-- ============================================================================
-- STEP 4: Performance RLS Policies
-- ============================================================================

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_values ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users full access to reviews" ON reviews;
DROP POLICY IF EXISTS "Allow authenticated users full access to goals" ON goals;
DROP POLICY IF EXISTS "Allow authenticated users full access to kpi_values" ON kpi_values;

CREATE POLICY "Allow authenticated users full access to reviews" 
ON reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to goals" 
ON goals FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to kpi_values" 
ON kpi_values FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- STEP 5: Grant Service Role Access
-- ============================================================================

GRANT ALL ON integrations TO service_role;
GRANT ALL ON integration_logs TO service_role;
GRANT ALL ON notification_preferences TO service_role;
GRANT ALL ON email_templates TO service_role;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT '✅ All tables deployed successfully!' as status;

-- Show table counts
SELECT 'Performance Review Types' as section, COUNT(*) as count FROM performance_review_types
UNION ALL
SELECT 'KPI Definitions' as section, COUNT(*) as count FROM kpi_definitions
UNION ALL
SELECT 'Email Templates' as section, COUNT(*) as count FROM email_templates
UNION ALL
SELECT 'Integrations' as section, COUNT(*) as count FROM integrations;
