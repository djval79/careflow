-- ============================================
-- DIAGNOSTIC: Check Current State
-- ============================================

-- 1. Check if your profile exists
SELECT 'Profile Check:' as check_type, 
       CASE WHEN EXISTS (
           SELECT 1 FROM public.users_profiles 
           WHERE email = 'mrsonirie@gmail.com'
       ) THEN 'EXISTS' ELSE 'MISSING' END as status;

-- 2. Check current policies on users_profiles
SELECT 'Current Policies:' as check_type, policyname, cmd
FROM pg_policies 
WHERE tablename = 'users_profiles';

-- 3. Check if is_admin function exists and is SECURITY DEFINER
SELECT 'is_admin Function:' as check_type,
       proname as function_name,
       CASE WHEN prosecdef THEN 'SECURITY DEFINER' ELSE 'INVOKER' END as security_type
FROM pg_proc 
WHERE proname = 'is_admin';

-- 4. Check if get_my_tenants exists
SELECT 'get_my_tenants Function:' as check_type,
       proname as function_name,
       CASE WHEN prosecdef THEN 'SECURITY DEFINER' ELSE 'INVOKER' END as security_type
FROM pg_proc 
WHERE proname = 'get_my_tenants';

-- 5. Try to manually fetch your profile (as Super Admin)
SELECT 'Manual Profile Fetch:' as check_type, *
FROM public.users_profiles
WHERE email = 'mrsonirie@gmail.com';
