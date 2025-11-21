-- RLS Policies for Integration Tables
-- Run this after integrations_schema.sql

-- Additional policies for service role to bypass RLS for automated operations
-- This allows Edge Functions to write logs and update integration status

-- Grant service role access to integration tables
GRANT ALL ON integrations TO service_role;
GRANT ALL ON integration_logs TO service_role;
GRANT ALL ON notification_preferences TO service_role;
GRANT ALL ON email_templates TO service_role;

-- Create policy for service role to insert logs
CREATE POLICY "Service role can insert integration logs"
ON integration_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create policy for service role to update integrations
CREATE POLICY "Service role can update integrations"
ON integrations
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Create policy for service role to manage notification preferences
CREATE POLICY "Service role can manage notification preferences"
ON notification_preferences
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verification queries
-- Run these to verify the schema was created successfully

-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('integrations', 'integration_logs', 'notification_preferences', 'email_templates');

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('integrations', 'integration_logs', 'notification_preferences', 'email_templates');

-- Check email templates were inserted
SELECT template_name, category 
FROM email_templates 
ORDER BY category, template_name;
