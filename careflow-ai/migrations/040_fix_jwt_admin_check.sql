-- ============================================
-- FINAL FIX: Grant function explicit RLS bypass
-- ============================================

-- The problem: Even with SECURITY DEFINER, the is_admin() function
-- is still subject to RLS when it queries users_profiles.
-- Solution: Grant the function owner (postgres) explicit permissions,
-- OR use a different approach that doesn't query the table at all.

-- APPROACH 1: Use JWT claims instead of querying the table
-- This completely avoids the RLS loop
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  is_super BOOLEAN;
BEGIN
  -- Get role from JWT claims (set during login)
  user_role := current_setting('request.jwt.claims', true)::json->>'role';
  is_super := (current_setting('request.jwt.claims', true)::json->>'is_super_admin')::boolean;
  
  -- Fallback: if JWT doesn't have the claims, query the table with RLS bypass
  IF user_role IS NULL THEN
    SELECT role, is_super_admin INTO user_role, is_super
    FROM public.users_profiles
    WHERE user_id = auth.uid()
    LIMIT 1;
  END IF;
  
  RETURN (user_role = 'admin' OR is_super = true);
EXCEPTION
  WHEN OTHERS THEN
    -- If anything fails, return false (safe default)
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- Ensure policies are in correct order
DROP POLICY IF EXISTS "allow_read_own_profile" ON public.users_profiles;
DROP POLICY IF EXISTS "allow_update_own_profile" ON public.users_profiles;
DROP POLICY IF EXISTS "allow_insert_own_profile" ON public.users_profiles;
DROP POLICY IF EXISTS "allow_admin_all_profiles" ON public.users_profiles;

CREATE POLICY "allow_read_own_profile" ON public.users_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "allow_update_own_profile" ON public.users_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "allow_insert_own_profile" ON public.users_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_admin_all_profiles" ON public.users_profiles
    FOR ALL USING (public.is_admin());
