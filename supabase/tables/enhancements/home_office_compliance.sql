-- Visa Records table for immigration status tracking
CREATE TABLE IF NOT EXISTS visa_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    visa_type VARCHAR(100) NOT NULL,
    visa_subtype VARCHAR(100),
    visa_number VARCHAR(100) UNIQUE,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    issuing_country VARCHAR(100) NOT NULL,
    current_status VARCHAR(50) DEFAULT 'active' CHECK (current_status IN ('active', 'expired', 'renewed', 'cancelled', 'pending_renewal')),
    biometric_residence_permit_number VARCHAR(100),
    brp_expiry_date DATE,
    sponsor_licence_number VARCHAR(100),
    cos_number VARCHAR(100),
    cos_issue_date DATE,
    immigration_status VARCHAR(100),
    right_to_work_status VARCHAR(50) CHECK (right_to_work_status IN ('full', 'restricted', 'temporary', 'expired', 'pending')),
    work_restrictions TEXT,
    hours_per_week_limit INTEGER,
    allowed_occupations TEXT,
    no_recourse_public_funds BOOLEAN DEFAULT false,
    document_url TEXT,
    verification_date DATE,
    verified_by UUID,
    renewal_reminder_30_days BOOLEAN DEFAULT false,
    renewal_reminder_60_days BOOLEAN DEFAULT false,
    renewal_reminder_90_days BOOLEAN DEFAULT false,
    compliance_notes TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Right to Work Checks table
CREATE TABLE IF NOT EXISTS right_to_work_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    check_type VARCHAR(100) NOT NULL CHECK (check_type IN ('pre_employment', 'periodic', 'follow_up', 'sponsor_licence_audit')),
    check_date DATE NOT NULL,
    check_method VARCHAR(100) CHECK (check_method IN ('manual', 'online_service', 'idsp', 'employer_checking_service')),
    document_types_checked TEXT,
    check_result VARCHAR(50) CHECK (check_result IN ('pass', 'fail', 'refer', 'pending')),
    right_to_work_confirmed BOOLEAN DEFAULT false,
    time_limited BOOLEAN DEFAULT false,
    follow_up_date DATE,
    statutory_excuse_obtained BOOLEAN DEFAULT false,
    copies_retained BOOLEAN DEFAULT false,
    checking_service_reference VARCHAR(100),
    notes TEXT,
    checked_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Compliance Alerts table
CREATE TABLE IF NOT EXISTS compliance_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    alert_type VARCHAR(100) NOT NULL CHECK (alert_type IN ('visa_expiry', 'brp_expiry', 'rtw_check_due', 'dbs_expiry', 'document_expiry', 'sponsor_duty', 'compliance_breach')),
    alert_priority VARCHAR(50) DEFAULT 'medium' CHECK (alert_priority IN ('low', 'medium', 'high', 'critical', 'urgent')),
    alert_title VARCHAR(255) NOT NULL,
    alert_message TEXT NOT NULL,
    alert_date DATE NOT NULL,
    due_date DATE,
    days_until_due INTEGER,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed', 'escalated')),
    acknowledged_by UUID,
    acknowledged_at TIMESTAMP,
    resolved_by UUID,
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    notification_sent BOOLEAN DEFAULT false,
    notification_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Audit Packs table for Home Office compliance reporting
CREATE TABLE IF NOT EXISTS audit_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pack_name VARCHAR(255) NOT NULL,
    pack_type VARCHAR(100) CHECK (pack_type IN ('sponsor_licence_audit', 'right_to_work_audit', 'compliance_review', 'custom')),
    employee_ids TEXT,
    date_range_start DATE,
    date_range_end DATE,
    generated_date DATE DEFAULT CURRENT_DATE,
    generated_by UUID NOT NULL,
    pack_status VARCHAR(50) DEFAULT 'draft' CHECK (pack_status IN ('draft', 'finalized', 'submitted', 'archived')),
    document_url TEXT,
    includes_visa_records BOOLEAN DEFAULT true,
    includes_rtw_checks BOOLEAN DEFAULT true,
    includes_dbs_certificates BOOLEAN DEFAULT false,
    includes_compliance_history BOOLEAN DEFAULT true,
    summary_statistics TEXT,
    compliance_score INTEGER CHECK (compliance_score >= 0 AND compliance_score <= 100),
    issues_identified TEXT,
    recommendations TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Home Office Forms table
CREATE TABLE IF NOT EXISTS home_office_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_type VARCHAR(100) NOT NULL,
    form_reference VARCHAR(100),
    employee_id UUID NOT NULL,
    form_data TEXT NOT NULL,
    form_status VARCHAR(50) DEFAULT 'draft' CHECK (form_status IN ('draft', 'pending_review', 'approved', 'submitted', 'rejected')),
    generated_date DATE DEFAULT CURRENT_DATE,
    submitted_date DATE,
    approved_by UUID,
    approved_at TIMESTAMP,
    form_url TEXT,
    notes TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_visa_records_employee_id ON visa_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_visa_records_expiry_date ON visa_records(expiry_date);
CREATE INDEX IF NOT EXISTS idx_visa_records_status ON visa_records(current_status);
CREATE INDEX IF NOT EXISTS idx_rtw_checks_employee_id ON right_to_work_checks(employee_id);
CREATE INDEX IF NOT EXISTS idx_rtw_checks_check_date ON right_to_work_checks(check_date);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_employee_id ON compliance_alerts(employee_id);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_status ON compliance_alerts(status);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_due_date ON compliance_alerts(due_date);
CREATE INDEX IF NOT EXISTS idx_audit_packs_generated_date ON audit_packs(generated_date);
CREATE INDEX IF NOT EXISTS idx_home_office_forms_employee_id ON home_office_forms(employee_id);

-- Enable RLS
ALTER TABLE visa_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE right_to_work_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_office_forms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for visa_records
CREATE POLICY "Allow read for authenticated users" ON visa_records
    FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));

CREATE POLICY "Allow insert via edge function" ON visa_records
    FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow update via edge function" ON visa_records
    FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow delete for service role" ON visa_records
    FOR DELETE USING (auth.role() = 'service_role');

-- RLS Policies for right_to_work_checks
CREATE POLICY "Allow read for authenticated users" ON right_to_work_checks
    FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));

CREATE POLICY "Allow insert via edge function" ON right_to_work_checks
    FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow update via edge function" ON right_to_work_checks
    FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));

-- RLS Policies for compliance_alerts
CREATE POLICY "Allow read for authenticated users" ON compliance_alerts
    FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));

CREATE POLICY "Allow insert via edge function" ON compliance_alerts
    FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow update via edge function" ON compliance_alerts
    FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow delete for service role" ON compliance_alerts
    FOR DELETE USING (auth.role() = 'service_role');

-- RLS Policies for audit_packs
CREATE POLICY "Allow read for authenticated users" ON audit_packs
    FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));

CREATE POLICY "Allow insert via edge function" ON audit_packs
    FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow update via edge function" ON audit_packs
    FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));

-- RLS Policies for home_office_forms
CREATE POLICY "Allow read for authenticated users" ON home_office_forms
    FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));

CREATE POLICY "Allow insert via edge function" ON home_office_forms
    FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow update via edge function" ON home_office_forms
    FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));
