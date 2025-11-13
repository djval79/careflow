-- Migration: add_document_uploads_enhanced_tables
-- Created at: 1762967506

-- Enhanced Document Uploads table
CREATE TABLE IF NOT EXISTS document_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID,
    application_id UUID,
    upload_batch_id UUID,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    document_category VARCHAR(100),
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_extension VARCHAR(20),
    file_hash VARCHAR(255),
    upload_status VARCHAR(50) DEFAULT 'uploaded' CHECK (upload_status IN ('uploading', 'uploaded', 'processing', 'verified', 'rejected', 'quarantined')),
    virus_scan_status VARCHAR(50) DEFAULT 'pending' CHECK (virus_scan_status IN ('pending', 'scanning', 'clean', 'infected', 'suspicious')),
    virus_scan_timestamp TIMESTAMP,
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID,
    verified_at TIMESTAMP,
    verification_notes TEXT,
    expiry_date DATE,
    expiry_reminder_sent BOOLEAN DEFAULT false,
    is_current_version BOOLEAN DEFAULT true,
    version_number INTEGER DEFAULT 1,
    replaced_by UUID,
    previous_version_id UUID,
    tags TEXT,
    metadata TEXT,
    ocr_extracted_text TEXT,
    ocr_processed BOOLEAN DEFAULT false,
    auto_categorized BOOLEAN DEFAULT false,
    categorization_confidence DECIMAL(5,2),
    access_level VARCHAR(50) DEFAULT 'private' CHECK (access_level IN ('private', 'internal', 'confidential', 'public')),
    access_log_enabled BOOLEAN DEFAULT true,
    retention_policy VARCHAR(100),
    deletion_scheduled_date DATE,
    is_encrypted BOOLEAN DEFAULT false,
    encryption_method VARCHAR(100),
    thumbnail_url TEXT,
    preview_available BOOLEAN DEFAULT false,
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL,
    accessed_by UUID NOT NULL,
    access_type VARCHAR(50) CHECK (access_type IN ('view', 'download', 'edit', 'delete', 'share')),
    access_timestamp TIMESTAMP NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    access_granted BOOLEAN DEFAULT true,
    denial_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_batch_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_name VARCHAR(255),
    total_files INTEGER NOT NULL,
    uploaded_files INTEGER DEFAULT 0,
    failed_files INTEGER DEFAULT 0,
    total_size_bytes BIGINT DEFAULT 0,
    batch_status VARCHAR(50) DEFAULT 'in_progress' CHECK (batch_status IN ('in_progress', 'completed', 'partial', 'failed')),
    uploaded_by UUID NOT NULL,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    error_log TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_uploads_employee_id ON document_uploads(employee_id);
CREATE INDEX IF NOT EXISTS idx_document_uploads_application_id ON document_uploads(application_id);
CREATE INDEX IF NOT EXISTS idx_document_uploads_batch_id ON document_uploads(upload_batch_id);
CREATE INDEX IF NOT EXISTS idx_document_uploads_type ON document_uploads(document_type);
CREATE INDEX IF NOT EXISTS idx_document_uploads_status ON document_uploads(upload_status);
CREATE INDEX IF NOT EXISTS idx_document_uploads_expiry ON document_uploads(expiry_date);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_document_id ON document_access_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_accessed_by ON document_access_logs(accessed_by);
CREATE INDEX IF NOT EXISTS idx_document_batch_uploads_uploaded_by ON document_batch_uploads(uploaded_by);

ALTER TABLE document_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_batch_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users" ON document_uploads FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));
CREATE POLICY "Allow insert via edge function" ON document_uploads FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));
CREATE POLICY "Allow update via edge function" ON document_uploads FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));
CREATE POLICY "Allow delete for service role" ON document_uploads FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "Allow read for authenticated users" ON document_access_logs FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));
CREATE POLICY "Allow insert via edge function" ON document_access_logs FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow read for authenticated users" ON document_batch_uploads FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));
CREATE POLICY "Allow insert via edge function" ON document_batch_uploads FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));
CREATE POLICY "Allow update via edge function" ON document_batch_uploads FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));;