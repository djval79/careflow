-- ============================================
-- Fix RLS Policies for users_profiles
-- ============================================

-- 1. Allow users to view their own profile (Critical for login)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users_profiles;
CREATE POLICY "Users can view own profile" ON public.users_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- 2. Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.users_profiles;
CREATE POLICY "Users can update own profile" ON public.users_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- 3. Allow users to insert their own profile (Critical for signup/auto-create)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users_profiles;
CREATE POLICY "Users can insert own profile" ON public.users_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Ensure Admins can still do everything
DROP POLICY IF EXISTS "Admins can do everything" ON public.users_profiles;
CREATE POLICY "Admins can do everything" ON public.users_profiles
    FOR ALL USING (public.is_admin());
