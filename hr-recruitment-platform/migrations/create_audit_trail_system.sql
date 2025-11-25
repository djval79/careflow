-- ============================================
-- AUDIT TRAIL SYSTEM - CORRECTED VERSION
-- ============================================
-- Based on database inspection findings:
-- 1. users_profiles.user_id (not .id) references auth.users.id
-- 2. audit_logs table already exists with different schema
-- 3. Using uuid_generate_v4() for consistency with existing tables

-- Ensure pgcrypto extension is available (for gen_random_uuid if needed)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop existing audit_logs table if you want to recreate with new schema
-- WARNING: This will delete existing audit data!
-- Comment out if you want to keep existing data
DROP TABLE IF EXISTS public.audit_logs CASCADE;

-- Create audit_logs table with comprehensive tracking
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID, -- References auth.users.id
    user_email TEXT,
    action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'VIEW')),
    entity_type TEXT NOT NULL, -- 'tenant', 'form', 'application', 'user', 'training', 'dbs_check', etc.
    entity_id UUID,
    entity_name TEXT,
    changes JSONB, -- Before/after snapshot: { before: {...}, after: {...}, fields_changed: [...] }
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy 1: Users can see their own tenant's audit logs
DROP POLICY IF EXISTS users_read_tenant_audit_logs ON public.audit_logs;
CREATE POLICY users_read_tenant_audit_logs ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users_profiles up
            WHERE up.user_id = (SELECT auth.uid())
            AND up.tenant_id = public.audit_logs.tenant_id
        )
    );

-- RLS Policy 2: Super admins can see all audit logs
DROP POLICY IF EXISTS superadmins_read_all_audit_logs ON public.audit_logs;
CREATE POLICY superadmins_read_all_audit_logs ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users_profiles up
            WHERE up.user_id = (SELECT auth.uid())
            AND up.is_super_admin = true
        )
    );

-- RLS Policy 3: Service role can insert (backend logging)
-- Note: service_role bypasses RLS, but we define this for clarity
DROP POLICY IF EXISTS service_can_insert_audit_logs ON public.audit_logs;
CREATE POLICY service_can_insert_audit_logs ON public.audit_logs
    FOR INSERT
    TO authenticated, service_role
    WITH CHECK (true);

-- Add comments
COMMENT ON TABLE public.audit_logs IS 'Comprehensive audit trail for all important system actions';
COMMENT ON COLUMN public.audit_logs.changes IS 'JSONB containing before/after snapshots and list of changed fields';
COMMENT ON COLUMN public.audit_logs.entity_type IS 'Type of entity affected (tenant, form, application, user, etc.)';
COMMENT ON COLUMN public.audit_logs.tenant_id IS 'Tenant ID for multi-tenant isolation';
COMMENT ON COLUMN public.audit_logs.user_id IS 'User ID from auth.users who performed the action';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Audit trail system created successfully!';
    RAISE NOTICE 'Table: public.audit_logs';
    RAISE NOTICE 'RLS: Enabled with tenant isolation';
    RAISE NOTICE 'Policies: users_read_tenant_audit_logs, superadmins_read_all_audit_logs, service_can_insert_audit_logs';
END $$;
