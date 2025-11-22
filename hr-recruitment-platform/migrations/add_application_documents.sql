-- ============================================================================
-- APPLICATION DOCUMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS application_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    document_url TEXT NOT NULL,
    document_name TEXT NOT NULL,
    category TEXT DEFAULT 'other', -- e.g., 'identity', 'right_to_work', 'qualification', 'reference', 'cv', 'cover_letter'
    compliance_tags TEXT[] DEFAULT '{}', -- e.g., ['home_office', 'recruitment']
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_app_docs_application ON application_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_app_docs_category ON application_documents(category);

-- RLS
ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;

-- POLICIES
DROP POLICY IF EXISTS "auth_read_app_docs" ON application_documents;
CREATE POLICY "auth_read_app_docs" ON application_documents FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_manage_app_docs" ON application_documents;
CREATE POLICY "auth_manage_app_docs" ON application_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- GRANT PERMISSIONS
GRANT ALL ON application_documents TO service_role;

-- VERIFICATION
SELECT 'SUCCESS! Application documents table created.' as status;
