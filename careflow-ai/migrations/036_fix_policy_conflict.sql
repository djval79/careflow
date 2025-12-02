-- ============================================
-- FIX: Drop conflicting policies before creating
-- ============================================

-- 1. Drop the specific policies that caused the error
DROP POLICY IF EXISTS "allow_read_own_profile" ON public.users_profiles;
DROP POLICY IF EXISTS "allow_update_own_profile" ON public.users_profiles;
DROP POLICY IF EXISTS "allow_insert_own_profile" ON public.users_profiles;
DROP POLICY IF EXISTS "allow_admin_all" ON public.users_profiles;

-- 2. Drop the old policies too (just in case)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users_profiles;
DROP POLICY IF EXISTS "Admins can do everything" ON public.users_profiles;

-- 3. Re-apply Simple, Safe Policies
CREATE POLICY "allow_read_own_profile" ON public.users_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "allow_update_own_profile" ON public.users_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "allow_insert_own_profile" ON public.users_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_admin_all" ON public.users_profiles
    FOR ALL USING (public.is_admin());

-- 4. Ensure Admin Function is Safe
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- SECURITY DEFINER bypasses RLS, preventing the loop
  RETURN EXISTS (
    SELECT 1 FROM public.users_profiles
    WHERE user_id = auth.uid()
    AND (role = 'admin' OR is_super_admin = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
