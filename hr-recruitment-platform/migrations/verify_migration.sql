-- ============================================================================
-- VERIFY MIGRATION SUCCESS
-- ============================================================================
-- Run this query after running the main migration to verify everything worked
-- ============================================================================

-- Check if all tables exist
SELECT 
    'employees' as table_name,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'employees'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 'biometric_enrollment',
    CASE WHEN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'biometric_enrollment'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'biometric_attendance_logs',
    CASE WHEN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'biometric_attendance_logs'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'biometric_security_events',
    CASE WHEN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'biometric_security_events'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'attendance_records',
    CASE WHEN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'attendance_records'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'leave_requests',
    CASE WHEN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'leave_requests'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'shifts',
    CASE WHEN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'shifts'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'employee_shifts',
    CASE WHEN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'employee_shifts'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'documents',
    CASE WHEN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'documents'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END;

-- Show row counts
SELECT 
    'Row Counts' as section,
    '---' as table_name,
    '---' as count
UNION ALL
SELECT '',
    'Employees',
    COUNT(*)::text
FROM employees
UNION ALL
SELECT '',
    'Shifts',
    COUNT(*)::text
FROM shifts
UNION ALL
SELECT '',
    'Biometric Enrollment',
    COUNT(*)::text
FROM biometric_enrollment
UNION ALL
SELECT '',
    'Attendance Records',
    COUNT(*)::text
FROM attendance_records
UNION ALL
SELECT '',
    'Leave Requests',
    COUNT(*)::text
FROM leave_requests
UNION ALL
SELECT '',
    'Documents',
    COUNT(*)::text
FROM documents;
