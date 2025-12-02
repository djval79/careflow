-- ============================================
-- FIX: Reorder policies to prevent recursion
-- ============================================

-- The issue: Even with SECURITY DEFINER, if the admin policy is evaluated
-- BEFORE the "read own" policy, it can still cause a check loop.
-- Solution: Drop and recreate in the correct order (Postgres evaluates in creation order)

-- 1. Drop all policies
DROP POLICY IF EXISTS "allow_read_own_profile" ON public.users_profiles;
DROP POLICY IF EXISTS "allow_update_own_profile" ON public.users_profiles;
DROP POLICY IF EXISTS "allow_insert_own_profile" ON public.users_profiles;
DROP POLICY IF EXISTS "allow_admin_all_profiles" ON public.users_profiles;

-- 2. Recreate in PRIORITY ORDER (simple checks first, complex checks last)

-- PRIORITY 1: Allow users to read their OWN profile (no function calls, fastest)
CREATE POLICY "allow_read_own_profile" ON public.users_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- PRIORITY 2: Allow users to update their OWN profile
CREATE POLICY "allow_update_own_profile" ON public.users_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- PRIORITY 3: Allow users to insert their OWN profile
CREATE POLICY "allow_insert_own_profile" ON public.users_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- PRIORITY 4: Admin access (checked LAST, only if above policies don't match)
-- This is safe because is_admin() is SECURITY DEFINER
CREATE POLICY "allow_admin_all_profiles" ON public.users_profiles
    FOR ALL USING (public.is_admin());

-- 3. Verify the function is still SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users_profiles
    WHERE user_id = auth.uid()
    AND (role = 'admin' OR is_super_admin = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
