-- ============================================
-- EMERGENCY FIX: Temporarily disable RLS to test
-- ============================================

-- This will help us confirm if RLS is the problem
-- WARNING: This makes the table publicly readable temporarily
-- We'll re-enable it with proper policies after testing

-- 1. Disable RLS on users_profiles
ALTER TABLE public.users_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Test if the app works now
-- If it does, we know RLS is the problem
-- Then we'll re-enable with a simpler policy structure

-- 3. After confirming the app works, run this to re-enable:
-- ALTER TABLE public.users_profiles ENABLE ROW LEVEL SECURITY;
-- 
-- Then create ONE simple policy:
-- CREATE POLICY "allow_all_authenticated" ON public.users_profiles
--     FOR ALL USING (true);
