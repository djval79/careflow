-- Check what tables already exist in your database
SELECT 
    table_name,
    'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
    'employees',
    'biometric_enrollment',
    'biometric_attendance_logs',
    'biometric_security_events',
    'attendance_records',
    'leave_requests',
    'shifts',
    'employee_shifts',
    'documents'
)
ORDER BY table_name;

-- Check columns in employees table if it exists
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'employees'
ORDER BY ordinal_position;
