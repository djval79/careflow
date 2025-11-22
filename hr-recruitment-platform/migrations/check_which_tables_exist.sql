-- Check which of the HR tables already exist
SELECT 
    table_name,
    'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
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
