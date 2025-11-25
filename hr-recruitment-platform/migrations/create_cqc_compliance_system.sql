-- ============================================
-- CQC COMPLIANCE SYSTEM - SECURE VERSION
-- ============================================
-- This migration creates all CQC compliance tables with proper RLS

-- Ensure pgcrypto extension exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- 1. DBS CHECKS TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS public.dbs_checks (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    applicant_name TEXT NOT NULL,
    applicant_email TEXT,
    dbs_number TEXT,
    check_type TEXT NOT NULL DEFAULT 'enhanced_barred' CHECK (check_type IN ('basic', 'standard', 'enhanced', 'enhanced_barred')),
    check_level TEXT DEFAULT 'adult' CHECK (check_level IN ('adult', 'child', 'both')),
    issue_date DATE NOT NULL,
    expiry_date DATE,
    renewal_period_months INTEGER DEFAULT 36,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'clear', 'disclosed', 'expired', 'renewal_due')),
    certificate_number TEXT,
    update_service_subscribed BOOLEAN DEFAULT false,
    disclosures JSONB,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    document_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. EMPLOYMENT REFERENCES
-- ============================================
CREATE TABLE IF NOT EXISTS public.employment_references (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    applicant_id UUID REFERENCES public.users_profiles(id),
    applicant_name TEXT NOT NULL,
    reference_number INTEGER NOT NULL,
    referee_name TEXT NOT NULL,
    referee_position TEXT,
    referee_organization TEXT NOT NULL,
    referee_email TEXT,
    referee_phone TEXT,
    relationship TEXT CHECK (relationship IN ('line_manager', 'colleague', 'hr', 'other')),
    employment_dates_from DATE,
    employment_dates_to DATE,
    reference_type TEXT DEFAULT 'employment' CHECK (reference_type IN ('employment', 'character', 'professional')),
    requested_date DATE DEFAULT CURRENT_DATE,
    received_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'satisfactory', 'unsatisfactory', 'unable_to_obtain')),
    reference_content TEXT,
    suitability_rating TEXT CHECK (suitability_rating IN ('excellent', 'good', 'satisfactory', 'concerns')),
    concerns_noted TEXT,
    verified_by UUID REFERENCES auth.users(id),
    document_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. TRAINING RECORDS
-- ============================================
CREATE TABLE IF NOT EXISTS public.training_records (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    staff_name TEXT NOT NULL,
    training_name TEXT NOT NULL,
    training_category TEXT DEFAULT 'mandatory' CHECK (training_category IN ('mandatory', 'role_specific', 'cpd', 'induction')),
    training_type TEXT CHECK (training_type IN (
        'health_safety', 'fire_safety', 'safeguarding', 'infection_control',
        'manual_handling', 'medication', 'mental_capacity_dols', 'first_aid',
        'food_hygiene', 'equality_diversity', 'record_keeping', 'care_certificate',
        'dementia_care', 'end_of_life', 'other'
    )),
    is_mandatory BOOLEAN DEFAULT false,
    completion_date DATE NOT NULL,
    expiry_date DATE,
    renewal_period_months INTEGER,
    certificate_number TEXT,
    training_provider TEXT,
    training_hours DECIMAL(5,2),
    assessment_passed BOOLEAN DEFAULT true,
    certificate_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. QUALIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.qualifications (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    staff_name TEXT NOT NULL,
    qualification_name TEXT NOT NULL,
    qualification_type TEXT CHECK (qualification_type IN (
        'nvq_level_2', 'nvq_level_3', 'nvq_level_4', 'nvq_level_5',
        'degree', 'diploma', 'certificate', 'professional_registration', 'other'
    )),
    awarding_body TEXT,
    qualification_number TEXT,
    date_obtained DATE,
    expiry_date DATE,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
    verified_by UUID REFERENCES auth.users(id),
    verified_date DATE,
    document_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. RIGHT TO WORK CHECKS
-- ============================================
CREATE TABLE IF NOT EXISTS public.right_to_work_checks (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    staff_name TEXT NOT NULL,
    document_type TEXT CHECK (document_type IN (
        'passport_uk', 'passport_non_uk', 'biometric_residence_permit',
        'birth_certificate_ni_number', 'share_code', 'other'
    )),
    document_number TEXT,
    nationality TEXT,
    visa_type TEXT,
    visa_expiry DATE,
    share_code TEXT,
    check_date DATE NOT NULL DEFAULT CURRENT_DATE,
    next_check_date DATE,
    status TEXT DEFAULT 'verified' CHECK (status IN ('verified', 'expired', 'renewal_required')),
    checked_by UUID REFERENCES auth.users(id),
    document_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. STAFF COMPLIANCE STATUS
-- ============================================
CREATE TABLE IF NOT EXISTS public.staff_compliance_status (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    staff_name TEXT NOT NULL,
    dbs_status TEXT DEFAULT 'missing' CHECK (dbs_status IN ('compliant', 'expiring_soon', 'expired', 'missing')),
    references_status TEXT DEFAULT 'missing' CHECK (references_status IN ('compliant', 'incomplete', 'missing')),
    training_status TEXT DEFAULT 'missing' CHECK (training_status IN ('compliant', 'overdue', 'missing')),
    rtw_status TEXT DEFAULT 'missing' CHECK (rtw_status IN ('compliant', 'expiring_soon', 'expired', 'missing')),
    overall_compliance_score INTEGER DEFAULT 0,
    cqc_ready BOOLEAN DEFAULT false,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, user_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_dbs_checks_tenant ON public.dbs_checks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dbs_checks_user ON public.dbs_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_dbs_checks_status ON public.dbs_checks(status);
CREATE INDEX IF NOT EXISTS idx_dbs_checks_expiry ON public.dbs_checks(expiry_date);

CREATE INDEX IF NOT EXISTS idx_references_tenant ON public.employment_references(tenant_id);
CREATE INDEX IF NOT EXISTS idx_references_applicant ON public.employment_references(applicant_id);
CREATE INDEX IF NOT EXISTS idx_references_status ON public.employment_references(status);

CREATE INDEX IF NOT EXISTS idx_training_tenant ON public.training_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_training_user ON public.training_records(user_id);
CREATE INDEX IF NOT EXISTS idx_training_expiry ON public.training_records(expiry_date);
CREATE INDEX IF NOT EXISTS idx_training_type ON public.training_records(training_type);

CREATE INDEX IF NOT EXISTS idx_qualifications_tenant ON public.qualifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_qualifications_user ON public.qualifications(user_id);

CREATE INDEX IF NOT EXISTS idx_rtw_tenant ON public.right_to_work_checks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rtw_user ON public.right_to_work_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_rtw_expiry ON public.right_to_work_checks(next_check_date);

CREATE INDEX IF NOT EXISTS idx_compliance_status_tenant ON public.staff_compliance_status(tenant_id);
CREATE INDEX IF NOT EXISTS idx_compliance_status_user ON public.staff_compliance_status(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_status_cqc_ready ON public.staff_compliance_status(cqc_ready);

-- ============================================
-- AUTOMATED TRIGGERS
-- ============================================

-- DBS expiry calculation
CREATE OR REPLACE FUNCTION calculate_dbs_expiry()
RETURNS TRIGGER AS $$
BEGIN
    NEW.expiry_date := NEW.issue_date + (NEW.renewal_period_months || ' months')::INTERVAL;
    
    IF NEW.expiry_date < CURRENT_DATE THEN
        NEW.status := 'expired';
    ELSIF NEW.expiry_date < CURRENT_DATE + INTERVAL '3 months' THEN
        NEW.status := 'renewal_due';
    ELSIF NEW.status = 'pending' THEN
        NEW.status := 'clear';
    END IF;
    
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_dbs_expiry ON public.dbs_checks;
CREATE TRIGGER trigger_calculate_dbs_expiry
    BEFORE INSERT OR UPDATE ON public.dbs_checks
    FOR EACH ROW
    EXECUTE FUNCTION calculate_dbs_expiry();

-- Compliance score calculation
CREATE OR REPLACE FUNCTION update_compliance_status()
RETURNS TRIGGER AS $$
DECLARE
    compliance_score INTEGER := 0;
BEGIN
    IF NEW.dbs_status = 'compliant' THEN 
        compliance_score := compliance_score + 40; 
    ELSIF NEW.dbs_status = 'expiring_soon' THEN 
        compliance_score := compliance_score + 30;
    END IF;
    
    IF NEW.references_status = 'compliant' THEN 
        compliance_score := compliance_score + 20; 
    ELSIF NEW.references_status = 'incomplete' THEN 
        compliance_score := compliance_score + 10;
    END IF;
    
    IF NEW.training_status = 'compliant' THEN 
        compliance_score := compliance_score + 30; 
    ELSIF NEW.training_status = 'overdue' THEN 
        compliance_score := compliance_score + 10;
    END IF;
    
    IF NEW.rtw_status = 'compliant' THEN 
        compliance_score := compliance_score + 10; 
    ELSIF NEW.rtw_status = 'expiring_soon' THEN 
        compliance_score := compliance_score + 5;
    END IF;
    
    NEW.overall_compliance_score := compliance_score;
    NEW.cqc_ready := (compliance_score >= 90);
    NEW.last_updated := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_compliance_status ON public.staff_compliance_status;
CREATE TRIGGER trigger_update_compliance_status
    BEFORE INSERT OR UPDATE ON public.staff_compliance_status
    FOR EACH ROW
    EXECUTE FUNCTION update_compliance_status();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.dbs_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employment_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.right_to_work_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_compliance_status ENABLE ROW LEVEL SECURITY;

-- Tenant-based policies (using helper function from audit trail)
CREATE POLICY tenant_access_dbs_checks ON public.dbs_checks
    FOR ALL TO authenticated
    USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY tenant_access_references ON public.employment_references
    FOR ALL TO authenticated
    USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY tenant_access_training ON public.training_records
    FOR ALL TO authenticated
    USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY tenant_access_qualifications ON public.qualifications
    FOR ALL TO authenticated
    USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY tenant_access_rtw ON public.right_to_work_checks
    FOR ALL TO authenticated
    USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY tenant_access_compliance ON public.staff_compliance_status
    FOR ALL TO authenticated
    USING (tenant_id = public.get_user_tenant_id());

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.dbs_checks IS 'CQC Regulation 19: DBS checks tracking';
COMMENT ON TABLE public.employment_references IS 'CQC Regulation 19: Employment references';
COMMENT ON TABLE public.training_records IS 'CQC Regulation 18: Mandatory training records';
COMMENT ON TABLE public.qualifications IS 'CQC Regulation 19: Qualifications verification';
COMMENT ON TABLE public.right_to_work_checks IS 'UK Immigration: Right to work verification';
COMMENT ON TABLE public.staff_compliance_status IS 'CQC inspection readiness dashboard';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ CQC Compliance System created successfully!';
    RAISE NOTICE 'Tables: dbs_checks, employment_references, training_records, qualifications, right_to_work_checks, staff_compliance_status';
    RAISE NOTICE 'Triggers: Auto-expiry calculation, compliance scoring';
    RAISE NOTICE 'RLS: Enabled with tenant isolation';
END $$;
