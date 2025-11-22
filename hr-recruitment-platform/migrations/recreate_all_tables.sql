-- ============================================================================
-- DROP AND RECREATE ALL MISSING TABLES
-- ============================================================================
-- WARNING: This will delete existing data in these tables!
-- Only run this if you're okay with losing data in these specific tables
-- ============================================================================

-- DROP EXISTING TABLES (in reverse dependency order)
DROP TABLE IF EXISTS employee_shifts CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS biometric_security_events CASCADE;
DROP TABLE IF EXISTS biometric_attendance_logs CASCADE;
DROP TABLE IF EXISTS biometric_enrollment CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS employees CASCADE;

-- ============================================================================
-- CREATE FRESH TABLES
-- ============================================================================

-- 1. EMPLOYEES
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    employee_number TEXT UNIQUE NOT NULL,
    department TEXT,
    position TEXT,
    employment_type TEXT DEFAULT 'full_time',
    date_of_birth DATE,
    date_hired DATE,
    salary NUMERIC,
    salary_grade TEXT,
    status TEXT DEFAULT 'active',
    role TEXT DEFAULT 'employee',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BIOMETRIC_ENROLLMENT
CREATE TABLE biometric_enrollment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID,
    biometric_type TEXT NOT NULL,
    template_data TEXT NOT NULL,
    quality_score NUMERIC,
    device_id TEXT,
    enrollment_status TEXT DEFAULT 'active',
    enrolled_by UUID,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    last_verified_at TIMESTAMPTZ,
    verification_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BIOMETRIC_ATTENDANCE_LOGS
CREATE TABLE biometric_attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID,
    biometric_type TEXT NOT NULL,
    log_type TEXT NOT NULL,
    log_timestamp TIMESTAMPTZ DEFAULT NOW(),
    device_id TEXT,
    location TEXT,
    verification_method TEXT,
    confidence_score NUMERIC,
    is_verified BOOLEAN DEFAULT true,
    verification_notes TEXT,
    geo_location JSONB,
    photo_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BIOMETRIC_SECURITY_EVENTS
CREATE TABLE biometric_security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    event_timestamp TIMESTAMPTZ DEFAULT NOW(),
    employee_id UUID,
    device_id TEXT,
    severity TEXT DEFAULT 'medium',
    description TEXT,
    action_taken TEXT,
    resolved BOOLEAN DEFAULT false,
    resolved_by UUID,
    resolved_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ATTENDANCE_RECORDS
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID,
    date DATE NOT NULL,
    status TEXT NOT NULL,
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    total_hours NUMERIC,
    overtime_hours NUMERIC DEFAULT 0,
    break_duration_minutes INTEGER DEFAULT 0,
    location TEXT,
    notes TEXT,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. LEAVE_REQUESTS
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID,
    leave_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending',
    reason TEXT,
    supporting_documents JSONB DEFAULT '[]',
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SHIFTS
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_name TEXT NOT NULL,
    description TEXT,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration_minutes INTEGER DEFAULT 0,
    days_of_week INTEGER[] DEFAULT '{1,2,3,4,5}',
    is_active BOOLEAN DEFAULT true,
    color_code TEXT,
    department TEXT,
    requires_approval BOOLEAN DEFAULT false,
    max_employees INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. EMPLOYEE_SHIFTS
CREATE TABLE employee_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID,
    shift_id UUID,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_primary BOOLEAN DEFAULT true,
    assigned_by UUID,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. DOCUMENTS
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID,
    document_type TEXT NOT NULL,
    document_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    version INTEGER DEFAULT 1,
    is_current_version BOOLEAN DEFAULT true,
    expiry_date DATE,
    uploaded_by UUID,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    verified_by UUID,
    verified_at TIMESTAMPTZ,
    verification_status TEXT DEFAULT 'pending',
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_biometric_enrollment_employee ON biometric_enrollment(employee_id);
CREATE INDEX idx_biometric_attendance_employee ON biometric_attendance_logs(employee_id);
CREATE INDEX idx_biometric_attendance_timestamp ON biometric_attendance_logs(log_timestamp DESC);
CREATE INDEX idx_attendance_date ON attendance_records(date DESC);
CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_shifts_active ON shifts(is_active) WHERE is_active = true;
CREATE INDEX idx_documents_employee ON documents(employee_id);
CREATE INDEX idx_documents_current ON documents(is_current_version) WHERE is_current_version = true;

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_enrollment ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE POLICIES
-- ============================================================================

-- Employees
CREATE POLICY "auth_all_employees" ON employees FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Biometric
CREATE POLICY "auth_all_biometric_enrollment" ON biometric_enrollment FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_biometric_attendance" ON biometric_attendance_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_security_events" ON biometric_security_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Attendance & Leave
CREATE POLICY "auth_all_attendance" ON attendance_records FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_leaves" ON leave_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Shifts
CREATE POLICY "auth_all_shifts" ON shifts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_employee_shifts" ON employee_shifts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Documents
CREATE POLICY "auth_all_documents" ON documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- INSERT DEFAULT DATA
-- ============================================================================

INSERT INTO shifts (shift_name, description, start_time, end_time, break_duration_minutes, days_of_week, is_active, color_code)
VALUES 
    ('Day Shift', 'Standard day shift', '09:00:00', '17:00:00', 60, '{1,2,3,4,5}', true, '#4CAF50'),
    ('Night Shift', 'Standard night shift', '21:00:00', '05:00:00', 60, '{1,2,3,4,5}', true, '#2196F3'),
    ('Morning Shift', 'Early morning shift', '06:00:00', '14:00:00', 60, '{1,2,3,4,5}', true, '#FF9800'),
    ('Evening Shift', 'Evening shift', '14:00:00', '22:00:00', 60, '{1,2,3,4,5}', true, '#9C27B0'),
    ('Weekend Shift', 'Weekend coverage', '09:00:00', '17:00:00', 60, '{0,6}', true, '#F44336');

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'SUCCESS! All tables created.' as status;
SELECT COUNT(*)::text || ' shifts created' as result FROM shifts;
