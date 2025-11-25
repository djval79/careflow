-- ============================================
-- UPDATE AUDIT TRAIL RLS POLICIES
-- ============================================
-- Run this AFTER users_profiles has tenant_id column
-- This updates the RLS policies to use proper tenant isolation

-- Drop simple policies
DROP POLICY IF EXISTS "Authenticated users can read audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Service role can insert audit logs" ON audit_logs;

-- Add proper tenant-based policies
CREATE POLICY "Users see own tenant audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users_profiles up
            WHERE up.id = auth.uid()
            AND up.tenant_id = audit_logs.tenant_id
        )
    );

CREATE POLICY "Super admins see all audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users_profiles
            WHERE users_profiles.id = auth.uid()
            AND users_profiles.is_super_admin = true
        )
    );

-- Service role can still insert
CREATE POLICY "Service role can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- Add foreign key constraint now that tenants table exists
ALTER TABLE audit_logs 
    DROP CONSTRAINT IF EXISTS audit_logs_tenant_id_fkey;

ALTER TABLE audit_logs 
    ADD CONSTRAINT audit_logs_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Audit trail RLS policies updated successfully!';
END $$;
