-- ============================================================================
-- ADD RECRUITMENT TABLES
-- ============================================================================

-- 1. JOB POSTINGS
CREATE TABLE IF NOT EXISTS job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_title TEXT NOT NULL,
    department TEXT NOT NULL,
    employment_type TEXT NOT NULL CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'internship', 'temporary')),
    description TEXT,
    location TEXT DEFAULT 'Remote',
    salary_range TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'cancelled')),
    application_deadline TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. APPLICATIONS
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_posting_id UUID REFERENCES job_postings(id) ON DELETE SET NULL,
    applicant_first_name TEXT NOT NULL,
    applicant_last_name TEXT NOT NULL,
    applicant_email TEXT NOT NULL,
    applicant_phone TEXT,
    cv_url TEXT,
    cover_letter TEXT,
    portfolio_url TEXT,
    linkedin_url TEXT,
    status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'screening', 'shortlisted', 'interview_scheduled', 'interviewed', 'offer_extended', 'hired', 'rejected', 'ref_1_pending', 'ref_1_completed', 'ref_2_pending', 'ref_2_completed', 'dbs_pending', 'dbs_completed')),
    pipeline_stage TEXT DEFAULT 'screening',
    score NUMERIC,
    notes TEXT,
    source TEXT DEFAULT 'direct',
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated_by UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INTERVIEWS
CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    interview_type TEXT NOT NULL CHECK (interview_type IN ('screening', 'technical', 'cultural', 'final', 'manager_review')),
    scheduled_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show')),
    rating NUMERIC CHECK (rating >= 0 AND rating <= 5),
    notes TEXT,
    interviewer_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(applicant_email);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_interviews_application ON interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_date ON interviews(scheduled_date);

-- RLS
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- POLICIES
-- Job Postings
DROP POLICY IF EXISTS "auth_read_jobs" ON job_postings;
CREATE POLICY "auth_read_jobs" ON job_postings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_manage_jobs" ON job_postings;
CREATE POLICY "auth_manage_jobs" ON job_postings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Applications
DROP POLICY IF EXISTS "auth_read_applications" ON applications;
CREATE POLICY "auth_read_applications" ON applications FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_manage_applications" ON applications;
CREATE POLICY "auth_manage_applications" ON applications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Interviews
DROP POLICY IF EXISTS "auth_read_interviews" ON interviews;
CREATE POLICY "auth_read_interviews" ON interviews FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_manage_interviews" ON interviews;
CREATE POLICY "auth_manage_interviews" ON interviews FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- GRANT PERMISSIONS
GRANT ALL ON job_postings TO service_role;
GRANT ALL ON applications TO service_role;
GRANT ALL ON interviews TO service_role;

-- VERIFICATION
SELECT 'SUCCESS! Recruitment tables created.' as status;
