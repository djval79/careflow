-- ============================================================================
-- MISSING HR TABLES MIGRATION - SAFE VERSION
-- ============================================================================
-- This migration adds all missing tables that the application is trying to access
-- Works independently without requiring the employees table to exist first
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- EMPLOYEES TABLE (Create if missing)
-- ============================================================================
-- Create the employees table first if it doesn't exist
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- Link to auth.users, but no FK constraint to avoid schema issues
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
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'terminated', 'suspended')),
    role TEXT DEFAULT 'employee',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);


-- Enable RLS on employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view employees" ON employees;
DROP POLICY IF EXISTS "Authenticated users can manage employees" ON employees;

-- Create policies for employees
CREATE POLICY "Authenticated users can view employees"
ON employees FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage employees"
ON employees FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- BIOMETRIC SYSTEM TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS biometric_enrollment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID, -- No FK constraint to avoid dependency issues
    biometric_type TEXT NOT NULL CHECK (biometric_type IN ('fingerprint', 'face', 'iris', 'voice')),
    template_data TEXT NOT NULL, -- Encrypted biometric template
    quality_score NUMERIC CHECK (quality_score >= 0 AND quality_score <= 100),
    device_id TEXT,
    enrollment_status TEXT DEFAULT 'active' CHECK (enrollment_status IN ('active', 'inactive', 'expired', 'revoked')),
    enrolled_by UUID,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    last_verified_at TIMESTAMPTZ,
    verification_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS biometric_attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID, -- No FK constraint
    biometric_type TEXT NOT NULL,
    log_type TEXT NOT NULL CHECK (log_type IN ('check_in', 'check_out', 'break_start', 'break_end')),
    log_timestamp TIMESTAMPTZ DEFAULT NOW(),
    device_id TEXT,
    location TEXT,
    verification_method TEXT,
    confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 100),
    is_verified BOOLEAN DEFAULT true,
    verification_notes TEXT,
    geo_location JSONB, -- {lat, lng, accuracy}
    photo_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS biometric_security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL CHECK (event_type IN ('failed_verification', 'unauthorized_access', 'tampering_detected', 'multiple_failures', 'device_offline', 'suspicious_activity')),
    event_timestamp TIMESTAMPTZ DEFAULT NOW(),
    employee_id UUID, -- No FK constraint
    device_id TEXT,
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT,
    action_taken TEXT,
    resolved BOOLEAN DEFAULT false,
    resolved_by UUID,
    resolved_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ATTENDANCE & LEAVE MANAGEMENT TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID, -- No FK constraint
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'half_day', 'on_leave', 'holiday', 'weekend')),
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

-- Create unique constraint without FK
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance_records(employee_id, date);

CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID, -- No FK constraint
    leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'personal', 'maternity', 'paternity', 'unpaid', 'bereavement', 'study', 'other')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    reason TEXT,
    supporting_documents JSONB DEFAULT '[]', -- Array of document URLs
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

CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_name TEXT NOT NULL,
    description TEXT,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration_minutes INTEGER DEFAULT 0,
    days_of_week INTEGER[] DEFAULT '{1,2,3,4,5}', -- 0=Sunday, 1=Monday, etc.
    is_active BOOLEAN DEFAULT true,
    color_code TEXT, -- For UI display
    department TEXT,
    requires_approval BOOLEAN DEFAULT false,
    max_employees INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID, -- No FK constraint
    shift_id UUID, -- No FK constraint
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_primary BOOLEAN DEFAULT true,
    assigned_by UUID,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DOCUMENTS TABLE (Enhanced)
-- ============================================================================

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID, -- No FK constraint
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
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')),
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Biometric indexes
CREATE INDEX IF NOT EXISTS idx_biometric_enrollment_employee ON biometric_enrollment(employee_id);
CREATE INDEX IF NOT EXISTS idx_biometric_enrollment_status ON biometric_enrollment(enrollment_status) WHERE enrollment_status = 'active';
CREATE INDEX IF NOT EXISTS idx_biometric_attendance_employee ON biometric_attendance_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_biometric_attendance_timestamp ON biometric_attendance_logs(log_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_biometric_security_timestamp ON biometric_security_events(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_biometric_security_severity ON biometric_security_events(severity) WHERE resolved = false;

-- Attendance & Leave indexes
-- Note: idx_attendance_employee_date already created as unique index above
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance_records(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- Shifts indexes
CREATE INDEX IF NOT EXISTS idx_shifts_active ON shifts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_employee_shifts_employee ON employee_shifts(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_shift ON employee_shifts(shift_id);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_dates ON employee_shifts(effective_from, effective_to);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_employee ON documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_documents_current_version ON documents(is_current_version) WHERE is_current_version = true;
CREATE INDEX IF NOT EXISTS idx_documents_expiry ON documents(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_verification ON documents(verification_status);


-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE biometric_enrollment ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Biometric Enrollment Policies
DROP POLICY IF EXISTS "Authenticated users can view biometric enrollment" ON biometric_enrollment;
DROP POLICY IF EXISTS "Authenticated users can manage biometric enrollment" ON biometric_enrollment;

CREATE POLICY "Authenticated users can view biometric enrollment"
ON biometric_enrollment FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage biometric enrollment"
ON biometric_enrollment FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Biometric Attendance Logs Policies
DROP POLICY IF EXISTS "Authenticated users can view attendance logs" ON biometric_attendance_logs;
DROP POLICY IF EXISTS "Authenticated users can insert attendance logs" ON biometric_attendance_logs;

CREATE POLICY "Authenticated users can view attendance logs"
ON biometric_attendance_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert attendance logs"
ON biometric_attendance_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Biometric Security Events Policies
DROP POLICY IF EXISTS "Authenticated users can view security events" ON biometric_security_events;
DROP POLICY IF EXISTS "Authenticated users can manage security events" ON biometric_security_events;

CREATE POLICY "Authenticated users can view security events"
ON biometric_security_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage security events"
ON biometric_security_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Attendance Records Policies
DROP POLICY IF EXISTS "Authenticated users can view attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Authenticated users can manage attendance records" ON attendance_records;

CREATE POLICY "Authenticated users can view attendance records"
ON attendance_records FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage attendance records"
ON attendance_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Leave Requests Policies
DROP POLICY IF EXISTS "Authenticated users can view leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Authenticated users can manage leave requests" ON leave_requests;

CREATE POLICY "Authenticated users can view leave requests"
ON leave_requests FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage leave requests"
ON leave_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Shifts Policies
DROP POLICY IF EXISTS "Authenticated users can view shifts" ON shifts;
DROP POLICY IF EXISTS "Authenticated users can manage shifts" ON shifts;

CREATE POLICY "Authenticated users can view shifts"
ON shifts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage shifts"
ON shifts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Employee Shifts Policies
DROP POLICY IF EXISTS "Authenticated users can view employee shifts" ON employee_shifts;
DROP POLICY IF EXISTS "Authenticated users can manage employee shifts" ON employee_shifts;

CREATE POLICY "Authenticated users can view employee shifts"
ON employee_shifts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage employee shifts"
ON employee_shifts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Documents Policies
DROP POLICY IF EXISTS "Authenticated users can view documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users can manage documents" ON documents;

CREATE POLICY "Authenticated users can view documents"
ON documents FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage documents"
ON documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- GRANT PERMISSIONS TO SERVICE ROLE
-- ============================================================================

GRANT ALL ON employees TO service_role;
GRANT ALL ON biometric_enrollment TO service_role;
GRANT ALL ON biometric_attendance_logs TO service_role;
GRANT ALL ON biometric_security_events TO service_role;
GRANT ALL ON attendance_records TO service_role;
GRANT ALL ON leave_requests TO service_role;
GRANT ALL ON shifts TO service_role;
GRANT ALL ON employee_shifts TO service_role;
GRANT ALL ON documents TO service_role;


-- ============================================================================
-- INSERT SAMPLE DATA
-- ============================================================================

-- Insert default shifts
INSERT INTO shifts (shift_name, description, start_time, end_time, break_duration_minutes, days_of_week, is_active, color_code)
VALUES 
    ('Day Shift', 'Standard day shift', '09:00:00', '17:00:00', 60, '{1,2,3,4,5}', true, '#4CAF50'),
    ('Night Shift', 'Standard night shift', '21:00:00', '05:00:00', 60, '{1,2,3,4,5}', true, '#2196F3'),
    ('Morning Shift', 'Early morning shift', '06:00:00', '14:00:00', 60, '{1,2,3,4,5}', true, '#FF9800'),
    ('Evening Shift', 'Evening shift', '14:00:00', '22:00:00', 60, '{1,2,3,4,5}', true, '#9C27B0'),
    ('Weekend Shift', 'Weekend coverage', '09:00:00', '17:00:00', 60, '{0,6}', true, '#F44336')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

SELECT '✅ All missing HR tables created successfully!' as status;

-- Show table counts
SELECT 'Biometric Enrollment' as table_name, COUNT(*) as count FROM biometric_enrollment
UNION ALL
SELECT 'Biometric Attendance Logs', COUNT(*) FROM biometric_attendance_logs
UNION ALL
SELECT 'Biometric Security Events', COUNT(*) FROM biometric_security_events
UNION ALL
SELECT 'Attendance Records', COUNT(*) FROM attendance_records
UNION ALL
SELECT 'Leave Requests', COUNT(*) FROM leave_requests
UNION ALL
SELECT 'Shifts', COUNT(*) FROM shifts
UNION ALL
SELECT 'Employee Shifts', COUNT(*) FROM employee_shifts
UNION ALL
SELECT 'Documents', COUNT(*) FROM documents;
