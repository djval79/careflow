# CQC Compliance System - Implementation Plan

## Executive Summary

This plan ensures your recruitment platform fully complies with **Care Quality Commission (CQC)** regulations for care homes in England, specifically:
- **Regulation 19**: Fit and Proper Persons Employed
- **Regulation 18**: Staffing Requirements  
- **Regulation 5**: Fit and Proper Persons: Directors
- **13 Fundamental Standards** (especially Safety, Safeguarding, Good Governance)

---

## CQC Regulatory Requirements

### Critical Compliance Areas

#### 1. **Fit and Proper Persons (Regulation 19)**
All staff must be:
- ✅ Of good character
- ✅ Physically and mentally fit
- ✅ Suitably qualified, competent, skilled, and experienced
- ✅ Not barred from working with vulnerable adults

#### 2. **Mandatory Pre-Employment Checks**
- ✅ Enhanced DBS check with Adult Barred List
- ✅ Minimum 2 satisfactory references
- ✅ Employment history verification (gaps explained)
- ✅ Right to work in UK
- ✅ Professional qualifications verification
- ✅ Health declaration
- ✅ Proof of identity

#### 3. **Mandatory Training Records**
- ✅ Health and Safety
- ✅ Fire Safety
- ✅ Safeguarding Vulnerable Adults
- ✅ Infection Prevention and Control
- ✅ Manual Handling
- ✅ Medication Management
- ✅ Mental Capacity Act & DoLS
- ✅ Basic Life Support/First Aid
- ✅ Food Hygiene
- ✅ Equality, Diversity & Human Rights
- ✅ Record Keeping & GDPR

#### 4. **Ongoing Compliance**
- ✅ DBS renewal every 1-3 years
- ✅ Annual training refreshers
- ✅ Supervision records
- ✅ Appraisal documentation
- ✅ Continuous competence monitoring

---

## Proposed Changes

### Database Schema

#### [NEW] [migrations/create_cqc_compliance_system.sql](file:///Users/valentinechideme/Downloads/novumflow (uncle mike )/hr-recruitment-platform/migrations/create_cqc_compliance_system.sql)

```sql
-- ============================================
-- CQC COMPLIANCE TABLES
-- ============================================

-- 1. DBS Checks Tracking
CREATE TABLE dbs_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES auth.users(id),
    applicant_name TEXT NOT NULL,
    dbs_number TEXT,
    check_type TEXT CHECK (check_type IN ('basic', 'standard', 'enhanced', 'enhanced_barred')),
    check_level TEXT CHECK (check_level IN ('adult', 'child', 'both')),
    issue_date DATE NOT NULL,
    expiry_date DATE, -- Calculated as issue_date + renewal_period
    renewal_period_months INTEGER DEFAULT 36, -- 3 years default
    status TEXT CHECK (status IN ('pending', 'clear', 'disclosed', 'expired', 'renewal_due')),
    certificate_number TEXT,
    update_service_subscribed BOOLEAN DEFAULT false,
    disclosures JSONB, -- Any disclosed information
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    document_url TEXT, -- Link to uploaded DBS certificate
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. References Tracking
CREATE TABLE employment_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    applicant_id UUID REFERENCES users_profiles(id),
    reference_number INTEGER, -- 1st, 2nd reference
    referee_name TEXT NOT NULL,
    referee_position TEXT,
    referee_organization TEXT NOT NULL,
    referee_email TEXT,
    referee_phone TEXT,
    relationship TEXT, -- 'line_manager', 'colleague', 'hr'
    employment_dates_from DATE,
    employment_dates_to DATE,
    reference_type TEXT CHECK (reference_type IN ('employment', 'character', 'professional')),
    requested_date DATE,
    received_date DATE,
    status TEXT CHECK (status IN ('pending', 'received', 'satisfactory', 'unsatisfactory', 'unable_to_obtain')),
    reference_content TEXT,
    suitability_rating TEXT CHECK (suitability_rating IN ('excellent', 'good', 'satisfactory', 'concerns')),
    concerns_noted TEXT,
    verified_by UUID REFERENCES auth.users(id),
    document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Training Records
CREATE TABLE training_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES auth.users(id),
    training_name TEXT NOT NULL,
    training_category TEXT, -- 'mandatory', 'role_specific', 'cpd'
    training_type TEXT CHECK (training_type IN (
        'health_safety', 'fire_safety', 'safeguarding', 'infection_control',
        'manual_handling', 'medication', 'mental_capacity_dols', 'first_aid',
        'food_hygiene', 'equality_diversity', 'record_keeping', 'care_certificate',
        'dementia_care', 'end_of_life', 'other'
    )),
    is_mandatory BOOLEAN DEFAULT false,
    completion_date DATE NOT NULL,
    expiry_date DATE, -- For certifications that expire
    renewal_period_months INTEGER, -- e.g., 12 for annual
    certificate_number TEXT,
    training_provider TEXT,
    training_hours DECIMAL(5,2),
    assessment_passed BOOLEAN,
    certificate_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Qualification Verification
CREATE TABLE qualifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES auth.users(id),
    qualification_name TEXT NOT NULL,
    qualification_type TEXT CHECK (qualification_type IN (
        'nvq_level_2', 'nvq_level_3', 'nvq_level_4', 'nvq_level_5',
        'degree', 'diploma', 'certificate', 'professional_registration', 'other'
    )),
    awarding_body TEXT,
    qualification_number TEXT,
    date_obtained DATE,
    expiry_date DATE, -- For registrations that expire
    verification_status TEXT CHECK (verification_status IN ('pending', 'verified', 'failed')),
    verified_by UUID REFERENCES auth.users(id),
    verified_date DATE,
    document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Right to Work Verification
CREATE TABLE right_to_work_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES auth.users(id),
    document_type TEXT CHECK (document_type IN (
        'passport_uk', 'passport_non_uk', 'biometric_residence_permit',
        'birth_certificate_ni_number', 'share_code', 'other'
    )),
    document_number TEXT,
    nationality TEXT,
    visa_type TEXT,
    visa_expiry DATE,
    share_code TEXT, -- For online right to work checks
    check_date DATE NOT NULL,
    next_check_date DATE, -- For time-limited permissions
    status TEXT CHECK (status IN ('verified', 'expired', 'renewal_required')),
    checked_by UUID REFERENCES auth.users(id),
    document_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Health Declarations
CREATE TABLE health_declarations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES auth.users(id),
    declaration_date DATE NOT NULL,
    fit_for_role BOOLEAN,
    reasonable_adjustments_needed BOOLEAN DEFAULT false,
    adjustments_details TEXT,
    occupational_health_referral BOOLEAN DEFAULT false,
    referral_outcome TEXT,
    approved_by UUID REFERENCES auth.users(id),
    document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Supervision & Appraisal Records
CREATE TABLE supervision_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES auth.users(id),
    supervisor_id UUID REFERENCES auth.users(id),
    supervision_date DATE NOT NULL,
    supervision_type TEXT CHECK (supervision_type IN ('formal', 'informal', 'group')),
    topics_discussed TEXT[],
    actions_agreed TEXT[],
    next_supervision_date DATE,
    notes TEXT,
    document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE appraisal_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES auth.users(id),
    appraiser_id UUID REFERENCES auth.users(id),
    appraisal_date DATE NOT NULL,
    appraisal_period_from DATE,
    appraisal_period_to DATE,
    performance_rating TEXT CHECK (performance_rating IN ('outstanding', 'good', 'satisfactory', 'needs_improvement')),
    objectives_met BOOLEAN,
    training_needs TEXT[],
    development_plan TEXT,
    next_appraisal_date DATE,
    document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Compliance Status Dashboard
CREATE TABLE staff_compliance_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES auth.users(id),
    dbs_status TEXT CHECK (dbs_status IN ('compliant', 'expiring_soon', 'expired', 'missing')),
    references_status TEXT CHECK (references_status IN ('compliant', 'incomplete', 'missing')),
    training_status TEXT CHECK (training_status IN ('compliant', 'overdue', 'missing')),
    rtw_status TEXT CHECK (rtw_status IN ('compliant', 'expiring_soon', 'expired', 'missing')),
    overall_compliance_score INTEGER, -- 0-100%
    cqc_ready BOOLEAN DEFAULT false, -- All checks complete
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_dbs_checks_user ON dbs_checks(user_id);
CREATE INDEX idx_dbs_checks_status ON dbs_checks(status);
CREATE INDEX idx_dbs_checks_expiry ON dbs_checks(expiry_date);
CREATE INDEX idx_training_user ON training_records(user_id);
CREATE INDEX idx_training_expiry ON training_records(expiry_date);
CREATE INDEX idx_compliance_status_tenant ON staff_compliance_status(tenant_id);

-- ============================================
-- AUTOMATED COMPLIANCE MONITORING
-- ============================================

-- Function to calculate DBS expiry
CREATE OR REPLACE FUNCTION calculate_dbs_expiry()
RETURNS TRIGGER AS $$
BEGIN
    NEW.expiry_date := NEW.issue_date + (NEW.renewal_period_months || ' months')::INTERVAL;
    
    -- Auto-update status based on expiry
    IF NEW.expiry_date < CURRENT_DATE THEN
        NEW.status := 'expired';
    ELSIF NEW.expiry_date < CURRENT_DATE + INTERVAL '3 months' THEN
        NEW.status := 'renewal_due';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_dbs_expiry
    BEFORE INSERT OR UPDATE ON dbs_checks
    FOR EACH ROW
    EXECUTE FUNCTION calculate_dbs_expiry();

-- Function to update compliance status
CREATE OR REPLACE FUNCTION update_compliance_status()
RETURNS TRIGGER AS $$
DECLARE
    compliance_score INTEGER := 0;
BEGIN
    -- Calculate compliance score (simplified)
    IF NEW.dbs_status = 'compliant' THEN compliance_score := compliance_score + 40; END IF;
    IF NEW.references_status = 'compliant' THEN compliance_score := compliance_score + 20; END IF;
    IF NEW.training_status = 'compliant' THEN compliance_score := compliance_score + 30; END IF;
    IF NEW.rtw_status = 'compliant' THEN compliance_score := compliance_score + 10; END IF;
    
    NEW.overall_compliance_score := compliance_score;
    NEW.cqc_ready := (compliance_score = 100);
    NEW.last_updated := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_compliance_status
    BEFORE INSERT OR UPDATE ON staff_compliance_status
    FOR EACH ROW
    EXECUTE FUNCTION update_compliance_status();
```

---

### Backend Services

#### [NEW] `src/lib/services/ComplianceService.ts`

```typescript
interface ComplianceService {
    // DBS Management
    addDBSCheck(data: DBSCheckData): Promise<DBSCheck>;
    getDBSStatus(userId: string): Promise<DBSCheck | null>;
    getExpiringDBS(daysAhead: number): Promise<DBSCheck[]>;
    
    // References
    addReference(data: ReferenceData): Promise<Reference>;
    getReferences(applicantId: string): Promise<Reference[]>;
    checkReferencesComplete(applicantId: string): Promise<boolean>;
    
    // Training
    addTrainingRecord(data: TrainingData): Promise<TrainingRecord>;
    getUserTraining(userId: string): Promise<TrainingRecord[]>;
    getMandatoryTrainingStatus(userId: string): Promise<TrainingStatus>;
    getExpiringCertificates(daysAhead: number): Promise<TrainingRecord[]>;
    
    // Compliance Dashboard
    getStaffComplianceStatus(userId: string): Promise<ComplianceStatus>;
    getTenantComplianceReport(tenantId: string): Promise<ComplianceReport>;
    getNonCompliantStaff(tenantId: string): Promise<StaffMember[]>;
    
    // CQC Inspection Ready
    generateCQCReport(tenantId: string): Promise<CQCReport>;
    exportComplianceData(tenantId: string, format: 'pdf' | 'csv'): Promise<Blob>;
}
```

---

### Frontend Components

#### [NEW] `src/pages/ComplianceDashboardPage.tsx`

**Features:**
- Overview of all staff compliance status
- Color-coded indicators:
  - 🟢 Green: Fully compliant
  - 🟡 Yellow: Expiring soon (within 3 months)
  - 🔴 Red: Expired or missing
- Filters by compliance area (DBS, Training, References)
- Export CQC-ready reports

#### [NEW] `src/components/DBSCheckForm.tsx`

**Fields:**
- DBS certificate number
- Issue date
- Check type (Enhanced with Barred List)
- Upload certificate scan
- Update Service subscription status
- Auto-calculate expiry date

#### [NEW] `src/components/TrainingMatrix.tsx`

**Display:**
- Grid showing all staff vs all mandatory training
- Visual indicators for completion/expiry
- One-click access to add training records
- Bulk upload capability

#### [NEW] `src/components/ComplianceAlerts.tsx`

**Automated Alerts:**
- DBS expiring in 90 days
- Training certificates expiring in 30 days
- Missing mandatory training
- Incomplete references
- Right to work expiring

---

## Integration with Existing Features

### 1. **Recruitment Page Integration**

Add compliance checklist to application workflow:

```typescript
// When hiring a candidate
const complianceChecklist = [
    { item: 'DBS Check', status: 'pending', required: true },
    { item: 'Reference 1', status: 'pending', required: true },
    { item: 'Reference 2', status: 'pending', required: true },
    { item: 'Right to Work', status: 'pending', required: true },
    { item: 'Qualifications', status: 'pending', required: true },
    { item: 'Health Declaration', status: 'pending', required: true },
    { item: 'Induction Training', status: 'pending', required: false }
];
```

### 2. **Audit Trail Integration**

Log all compliance actions:
- DBS check added/updated
- Reference received
- Training completed
- Compliance status changed

### 3. **Automated Notifications**

Email/SMS alerts for:
- DBS renewal due
- Training expiry approaching
- Missing compliance items
- CQC inspection preparation

---

## CQC Inspection Readiness

### Automated Reports

#### 1. **Staff Files Report**
- List of all staff with compliance status
- Highlight any gaps or expired items
- Export to PDF for CQC inspector

#### 2. **Training Matrix Report**
- All staff vs all mandatory training
- Completion dates and expiry dates
- Percentage compliance per training type

#### 3. **DBS Register**
- All current DBS checks
- Issue and expiry dates
- Update Service status

#### 4. **Recruitment Records**
- Complete audit trail for each hire
- All pre-employment checks documented
- Interview notes and selection rationale

---

## Compliance Monitoring Dashboard

### Key Metrics

```
┌─────────────────────────────────────┐
│  COMPLIANCE OVERVIEW                │
├─────────────────────────────────────┤
│  Total Staff: 45                    │
│  Fully Compliant: 38 (84%)          │
│  Action Required: 7 (16%)           │
│                                     │
│  DBS Checks:                        │
│    ✅ Valid: 42                     │
│    ⚠️  Expiring (90 days): 3        │
│    ❌ Expired: 0                    │
│                                     │
│  Mandatory Training:                │
│    ✅ Up to date: 40                │
│    ⚠️  Due soon: 3                  │
│    ❌ Overdue: 2                    │
│                                     │
│  References:                        │
│    ✅ Complete: 45                  │
│    ⚠️  Pending: 0                   │
│                                     │
│  CQC Ready: ✅ YES                  │
└─────────────────────────────────────┘
```

---

## Data Retention & GDPR

### Retention Periods (CQC Guidance)

- **DBS Checks**: 6 months after employment ends
- **References**: Duration of employment + 6 years
- **Training Records**: Duration of employment + 6 years
- **Recruitment Records**: 6 months (unsuccessful), 6 years (successful)
- **Supervision Records**: 6 years
- **Appraisal Records**: 6 years

### GDPR Compliance

- Encrypted storage of sensitive data
- Access controls (only HR and managers)
- Right to access (staff can view their own records)
- Right to rectification (update incorrect data)
- Automated deletion after retention period

---

## Verification Plan

### Manual Testing

1. **Add DBS Check**
   - Enter DBS details
   - Upload certificate
   - Verify expiry auto-calculated
   - Check status updates

2. **Track Training**
   - Add mandatory training record
   - Verify appears in training matrix
   - Check expiry alerts trigger

3. **Compliance Dashboard**
   - View overall compliance status
   - Filter by non-compliant staff
   - Export CQC report

4. **Automated Alerts**
   - Set DBS to expire in 89 days
   - Verify alert appears
   - Check email notification sent

### CQC Mock Inspection

Simulate CQC inspection request:
1. Generate staff files report
2. Export training matrix
3. Produce DBS register
4. Show audit trail for recent hire
5. Demonstrate compliance dashboard

---

## Benefits

### For Care Home Managers
✅ One-click CQC inspection readiness  
✅ Automated compliance monitoring  
✅ No more spreadsheets  
✅ Proactive alerts prevent lapses  

### For CQC Inspectors
✅ All records digitally accessible  
✅ Clear audit trail  
✅ Easy to verify compliance  
✅ Exportable reports  

### For Staff
✅ View own compliance status  
✅ Know when renewals due  
✅ Upload certificates easily  
✅ Track training progress  

---

## Implementation Timeline

**Phase 1** (Week 1-2): Database schema and core tables  
**Phase 2** (Week 3-4): ComplianceService and basic CRUD  
**Phase 3** (Week 5-6): Compliance dashboard UI  
**Phase 4** (Week 7-8): Automated alerts and monitoring  
**Phase 5** (Week 9-10): CQC reports and export functionality  
**Phase 6** (Week 11-12): Testing and CQC mock inspection  

**Total: 12 weeks to full CQC compliance**

---

## Cost-Benefit Analysis

### Costs
- Development time: 12 weeks
- Testing and refinement: 2 weeks
- Training staff on new system: 1 week

### Benefits
- **Avoid CQC fines**: £10,000 - £50,000 per breach
- **Prevent closure**: Non-compliance can lead to registration cancellation
- **Reduce admin time**: 10-15 hours/week saved
- **Improve CQC rating**: Better ratings attract more residents
- **Peace of mind**: Always inspection-ready

**ROI: Significant cost avoidance and operational efficiency**
