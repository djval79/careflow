-- Integration Management Schema
-- Stores third-party service configurations and activity logs

-- Table: integrations
-- Stores integration configurations and OAuth credentials
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name TEXT NOT NULL UNIQUE, -- 'slack', 'zoom', 'email', 'calendar', 'storage'
    display_name TEXT NOT NULL, -- User-friendly name: 'Slack Workspace', 'Zoom Meetings', etc.
    is_active BOOLEAN DEFAULT true,
    is_connected BOOLEAN DEFAULT false,
    config JSONB DEFAULT '{}', -- Service-specific settings (channel IDs, templates, etc.)
    oauth_data JSONB, -- OAuth tokens (encrypted), refresh tokens, expiry
    webhook_url TEXT, -- For incoming webhooks
    api_quota_limit INTEGER, -- Rate limiting
    api_quota_used INTEGER DEFAULT 0,
    quota_reset_at TIMESTAMPTZ,
    last_sync_at TIMESTAMPTZ,
    connection_error TEXT, -- Last error message if connection failed
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: integration_logs
-- Audit trail for all integration activities
CREATE TABLE IF NOT EXISTS integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    action TEXT NOT NULL, -- 'send_message', 'create_meeting', 'send_email', etc.
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending', 'retrying')),
    request_data JSONB, -- Request payload (sanitized, no sensitive data)
    response_data JSONB, -- API response
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    duration_ms NUMERIC, -- Time taken for API call
    triggered_by UUID REFERENCES employees(id), -- Who triggered this action
    related_entity_type TEXT, -- 'candidate', 'interview', 'application', etc.
    related_entity_id UUID, -- ID of the related entity
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: notification_preferences
-- User preferences for which notifications to receive
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    channel TEXT NOT NULL, -- 'slack', 'email', 'in_app'
    event_type TEXT NOT NULL, -- 'new_application', 'interview_scheduled', 'offer_sent', etc.
    is_enabled BOOLEAN DEFAULT true,
    delivery_config JSONB DEFAULT '{}', -- Channel-specific config (Slack channel ID, email template, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, channel, event_type)
);

-- Table: email_templates
-- Reusable email templates for candidate communications
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT, -- Plain text fallback
    variables JSONB DEFAULT '[]', -- List of available variables: ['{{candidate_name}}', '{{role_title}}']
    category TEXT, -- 'application', 'interview', 'offer', 'rejection', 'onboarding'
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_integrations_service ON integrations(service_name);
CREATE INDEX IF NOT EXISTS idx_integrations_active ON integrations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_integration_logs_service ON integration_logs(service_name);
CREATE INDEX IF NOT EXISTS idx_integration_logs_status ON integration_logs(status);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created ON integration_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_integration_logs_entity ON integration_logs(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_notification_prefs_employee ON notification_preferences(employee_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);

-- Enable Row Level Security
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for integrations (admin only)
CREATE POLICY "Admin users can manage integrations"
ON integrations
FOR ALL
TO authenticated
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

-- RLS Policies for integration_logs (admin can view all, users see their own)
CREATE POLICY "Admin users can view all integration logs"
ON integration_logs
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM employees
        WHERE employees.id = auth.uid()
        AND employees.role IN ('admin', 'hr_manager')
    )
);

CREATE POLICY "Users can view logs they triggered"
ON integration_logs
FOR SELECT
TO authenticated
USING (triggered_by = auth.uid());

-- RLS Policies for notification_preferences (users manage their own)
CREATE POLICY "Users can manage their own notification preferences"
ON notification_preferences
FOR ALL
TO authenticated
USING (employee_id = auth.uid())
WITH CHECK (employee_id = auth.uid());

-- RLS Policies for email_templates (admin can manage, all can view active)
CREATE POLICY "All authenticated users can view active email templates"
ON email_templates
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admin users can manage email templates"
ON email_templates
FOR ALL
TO authenticated
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

-- Insert default email templates
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
