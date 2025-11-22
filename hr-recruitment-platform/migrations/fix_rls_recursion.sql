-- Fix infinite recursion in RLS policies
-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Admins can do everything" ON users_profiles;

-- Recreate simple, non-recursive policies
DROP POLICY IF EXISTS "Users can view own profile" ON users_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON users_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON users_profiles;

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile" 
ON users_profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON users_profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" 
ON users_profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Grant admin access to specific emails (same as before)
DO $$
DECLARE
  target_email text;
  target_user_id uuid;
BEGIN
  -- 1. Grant for hr@ringsteadcare.com
  target_email := 'hr@ringsteadcare.com';
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;
  
  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.users_profiles (user_id, email, full_name, role, permissions, created_at, updated_at)
    VALUES (
      target_user_id, 
      target_email, 
      'HR Admin', 
      'Admin', 
      '["create_jobs", "manage_applications", "schedule_interviews", "manage_employees", "create_announcements", "manage_documents", "generate_letters", "access_reports", "manage_settings", "admin_access"]'::jsonb,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET 
      role = 'Admin',
      permissions = '["create_jobs", "manage_applications", "schedule_interviews", "manage_employees", "create_announcements", "manage_documents", "generate_letters", "access_reports", "manage_settings", "admin_access"]'::jsonb,
      updated_at = NOW();
  END IF;

  -- 2. Grant for mrsonirie@gmail.com
  target_email := 'mrsonirie@gmail.com';
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;
  
  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.users_profiles (user_id, email, full_name, role, permissions, created_at, updated_at)
    VALUES (
      target_user_id, 
      target_email, 
      'System Admin', 
      'Admin', 
      '["create_jobs", "manage_applications", "schedule_interviews", "manage_employees", "create_announcements", "manage_documents", "generate_letters", "access_reports", "manage_settings", "admin_access"]'::jsonb,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET 
      role = 'Admin',
      permissions = '["create_jobs", "manage_applications", "schedule_interviews", "manage_employees", "create_announcements", "manage_documents", "generate_letters", "access_reports", "manage_settings", "admin_access"]'::jsonb,
      updated_at = NOW();
  END IF;
END $$;
