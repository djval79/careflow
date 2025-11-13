-- References table for applicant reference management
CREATE TABLE IF NOT EXISTS applicant_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL,
    ref_name VARCHAR(255) NOT NULL,
    ref_email VARCHAR(255) NOT NULL,
    ref_phone VARCHAR(50),
    ref_company VARCHAR(255),
    ref_position VARCHAR(255),
    ref_relationship VARCHAR(100) NOT NULL,
    verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'requested', 'received', 'verified', 'failed', 'expired')),
    verification_request_sent_at TIMESTAMP,
    verification_received_at TIMESTAMP,
    ref_response TEXT,
    ref_score INTEGER CHECK (ref_score >= 0 AND ref_score <= 10),
    ref_rating VARCHAR(50) CHECK (ref_rating IN ('excellent', 'good', 'satisfactory', 'poor', 'not_recommended')),
    would_rehire BOOLEAN,
    verification_notes TEXT,
    verified_by UUID,
    verified_at TIMESTAMP,
    reminder_count INTEGER DEFAULT 0,
    last_reminder_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_applicant_references_application_id ON applicant_references(application_id);
CREATE INDEX IF NOT EXISTS idx_applicant_references_verification_status ON applicant_references(verification_status);
CREATE INDEX IF NOT EXISTS idx_applicant_references_email ON applicant_references(ref_email);

-- Enable RLS
ALTER TABLE applicant_references ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow read for authenticated users" ON applicant_references
    FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));

CREATE POLICY "Allow insert via edge function" ON applicant_references
    FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow update via edge function" ON applicant_references
    FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow delete for service role" ON applicant_references
    FOR DELETE USING (auth.role() = 'service_role');
