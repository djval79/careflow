-- Migration: add_automation_engine_tables
-- Created at: 1762967482

-- Automation Rules table
CREATE TABLE IF NOT EXISTS automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(100) NOT NULL CHECK (rule_type IN ('compliance_check', 'workflow_routing', 'notification', 'document_generation', 'data_validation', 'scheduled_task')),
    trigger_event VARCHAR(100) NOT NULL,
    trigger_conditions TEXT NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    action_config TEXT NOT NULL,
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    is_active BOOLEAN DEFAULT true,
    execution_order INTEGER DEFAULT 1,
    failure_action VARCHAR(100) DEFAULT 'log' CHECK (failure_action IN ('log', 'retry', 'alert', 'escalate', 'skip')),
    max_retries INTEGER DEFAULT 3,
    retry_delay_seconds INTEGER DEFAULT 300,
    last_executed_at TIMESTAMP,
    last_execution_status VARCHAR(50),
    execution_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL,
    execution_timestamp TIMESTAMP NOT NULL,
    trigger_event VARCHAR(100) NOT NULL,
    trigger_data TEXT,
    execution_status VARCHAR(50) CHECK (execution_status IN ('success', 'failed', 'partial', 'skipped', 'retrying')),
    execution_duration_ms INTEGER,
    actions_performed TEXT,
    output_data TEXT,
    error_message TEXT,
    error_stack TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    push_notifications BOOLEAN DEFAULT true,
    compliance_alerts BOOLEAN DEFAULT true,
    workflow_updates BOOLEAN DEFAULT true,
    document_notifications BOOLEAN DEFAULT true,
    system_alerts BOOLEAN DEFAULT true,
    daily_digest BOOLEAN DEFAULT false,
    weekly_report BOOLEAN DEFAULT true,
    notification_frequency VARCHAR(50) DEFAULT 'immediate' CHECK (notification_frequency IN ('immediate', 'hourly', 'daily', 'weekly')),
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scheduled_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_name VARCHAR(255) NOT NULL,
    task_type VARCHAR(100) NOT NULL CHECK (task_type IN ('compliance_check', 'data_cleanup', 'report_generation', 'reminder_notification', 'data_sync', 'backup')),
    schedule_pattern VARCHAR(100) NOT NULL,
    schedule_config TEXT,
    next_execution_time TIMESTAMP NOT NULL,
    last_execution_time TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    execution_status VARCHAR(50) DEFAULT 'pending',
    task_config TEXT NOT NULL,
    execution_history TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_processing_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL,
    processing_type VARCHAR(100) NOT NULL CHECK (processing_type IN ('ocr', 'validation', 'classification', 'extraction', 'virus_scan', 'compression')),
    queue_status VARCHAR(50) DEFAULT 'pending' CHECK (queue_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    queued_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    processing_duration_ms INTEGER,
    processing_result TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_trigger_event ON automation_rules(trigger_event);
CREATE INDEX IF NOT EXISTS idx_automation_rules_is_active ON automation_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_automation_execution_logs_rule_id ON automation_execution_logs(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_execution_logs_timestamp ON automation_execution_logs(execution_timestamp);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_next_execution ON scheduled_tasks(next_execution_time);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_is_active ON scheduled_tasks(is_active);
CREATE INDEX IF NOT EXISTS idx_document_processing_queue_status ON document_processing_queue(queue_status);

ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_processing_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users" ON automation_rules FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));
CREATE POLICY "Allow insert via edge function" ON automation_rules FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));
CREATE POLICY "Allow update via edge function" ON automation_rules FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));
CREATE POLICY "Allow delete for service role" ON automation_rules FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "Allow read for authenticated users" ON automation_execution_logs FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));
CREATE POLICY "Allow insert via edge function" ON automation_execution_logs FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow read for authenticated users" ON notification_preferences FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));
CREATE POLICY "Allow insert via edge function" ON notification_preferences FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));
CREATE POLICY "Allow update via edge function" ON notification_preferences FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow read for authenticated users" ON scheduled_tasks FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));
CREATE POLICY "Allow insert via edge function" ON scheduled_tasks FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));
CREATE POLICY "Allow update via edge function" ON scheduled_tasks FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow read for authenticated users" ON document_processing_queue FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));
CREATE POLICY "Allow insert via edge function" ON document_processing_queue FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));
CREATE POLICY "Allow update via edge function" ON document_processing_queue FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));;