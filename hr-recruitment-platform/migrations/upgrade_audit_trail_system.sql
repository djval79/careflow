-- ============================================
-- UPGRADE EXISTING AUDIT_LOGS TABLE
-- ============================================
-- This migration upgrades the existing public.audit_logs table
-- to support comprehensive audit tracking with tenant isolation

-- Add missing columns to existing audit_logs table
DO $$
BEGIN
    -- Add tenant_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);
    END IF;

    -- Add user_email if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'user_email'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN user_email TEXT;
    END IF;

    -- Add entity_name if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'entity_name'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN entity_name TEXT;
    END IF;

    -- Add changes JSONB if not exists (rename from details)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'changes'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN changes JSONB;
        -- Optionally migrate data from details to changes
        -- UPDATE public.audit_logs SET changes = jsonb_build_object('details', details) WHERE details IS NOT NULL;
    END IF;

    -- Add created_at as alias for timestamp (or rename)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'created_at'
    ) THEN
        -- Add as new column pointing to same data
        ALTER TABLE public.audit_logs ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        -- Copy existing timestamp values
        UPDATE public.audit_logs SET created_at = timestamp WHERE timestamp IS NOT NULL;
    END IF;
END $$;

-- Change entity_id from TEXT to UUID if needed
-- WARNING: This may fail if existing data isn't valid UUIDs
-- Comment out if you want to keep entity_id as TEXT
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'audit_logs' 
        AND column_name = 'entity_id'
        AND data_type = 'text'
    ) THEN
        -- Try to convert, will fail if data isn't UUID format
        ALTER TABLE public.audit_logs ALTER COLUMN entity_id TYPE UUID USING entity_id::uuid;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not convert entity_id to UUID - keeping as TEXT';
END $$;

-- Add additional indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- ============================================
-- SECURE TENANT-BASED RLS POLICIES
-- ============================================

-- Helper function: Get current user's tenant_id securely
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT tenant_id 
    FROM public.users_profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1;
$$;

-- Revoke public access to helper function
REVOKE EXECUTE ON FUNCTION public.get_user_tenant_id() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id() TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Authenticated users can read audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS users_read_tenant_audit_logs ON public.audit_logs;
DROP POLICY IF EXISTS superadmins_read_all_audit_logs ON public.audit_logs;
DROP POLICY IF EXISTS service_can_insert_audit_logs ON public.audit_logs;

-- Policy 1: Users can read their own logs OR logs for their tenant
DROP POLICY IF EXISTS user_or_tenant_select_audit_logs ON public.audit_logs;
CREATE POLICY user_or_tenant_select_audit_logs ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (
        -- User's own logs
        (user_id IS NOT NULL AND user_id = (SELECT auth.uid()))
        OR
        -- Tenant's logs
        (tenant_id IS NOT NULL AND tenant_id = public.get_user_tenant_id())
    );

-- Policy 2: Super admins can see all logs
DROP POLICY IF EXISTS superadmin_select_all_audit_logs ON public.audit_logs;
CREATE POLICY superadmin_select_all_audit_logs ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users_profiles up
            WHERE up.user_id = (SELECT auth.uid())
            AND up.is_super_admin = true
        )
    );

-- Policy 3: Authenticated users can insert only their own audit logs
DROP POLICY IF EXISTS auth_insert_own_audit_logs ON public.audit_logs;
CREATE POLICY auth_insert_own_audit_logs ON public.audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id IS NOT NULL 
        AND user_id = (SELECT auth.uid())
        -- Ensure tenant_id matches user's tenant
        AND (tenant_id IS NULL OR tenant_id = public.get_user_tenant_id())
    );

-- Note: service_role bypasses RLS and can insert any rows

-- Add comments
COMMENT ON TABLE public.audit_logs IS 'Comprehensive audit trail for all important system actions with tenant isolation';
COMMENT ON COLUMN public.audit_logs.changes IS 'JSONB containing before/after snapshots and list of changed fields';
COMMENT ON COLUMN public.audit_logs.tenant_id IS 'Tenant ID for multi-tenant isolation';
COMMENT ON COLUMN public.audit_logs.user_email IS 'Email of user who performed the action';
COMMENT ON FUNCTION public.get_user_tenant_id() IS 'SECURITY DEFINER helper to get current user tenant_id from users_profiles';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Audit trail system upgraded successfully!';
    RAISE NOTICE 'Table: public.audit_logs (upgraded with new columns)';
    RAISE NOTICE 'New columns: tenant_id, user_email, entity_name, changes, created_at';
    RAISE NOTICE 'RLS: Enabled with secure tenant isolation';
    RAISE NOTICE 'Policies: user_or_tenant_select, superadmin_select_all, auth_insert_own';
    RAISE NOTICE 'Helper: public.get_user_tenant_id() (SECURITY DEFINER)';
END $$;
