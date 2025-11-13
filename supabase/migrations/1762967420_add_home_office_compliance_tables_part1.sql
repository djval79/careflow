-- Migration: add_home_office_compliance_tables_part1
-- Created at: 1762967420

-- Visa Records table
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

CREATE INDEX IF NOT EXISTS idx_visa_records_employee_id ON visa_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_visa_records_expiry_date ON visa_records(expiry_date);
CREATE INDEX IF NOT EXISTS idx_visa_records_status ON visa_records(current_status);
CREATE INDEX IF NOT EXISTS idx_rtw_checks_employee_id ON right_to_work_checks(employee_id);
CREATE INDEX IF NOT EXISTS idx_rtw_checks_check_date ON right_to_work_checks(check_date);

ALTER TABLE visa_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE right_to_work_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users" ON visa_records FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));
CREATE POLICY "Allow insert via edge function" ON visa_records FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));
CREATE POLICY "Allow update via edge function" ON visa_records FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));
CREATE POLICY "Allow delete for service role" ON visa_records FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "Allow read for authenticated users" ON right_to_work_checks FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));
CREATE POLICY "Allow insert via edge function" ON right_to_work_checks FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));
CREATE POLICY "Allow update via edge function" ON right_to_work_checks FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));;