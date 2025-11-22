-- ============================================================================
-- DYNAMIC FORM BUILDER TABLES
-- ============================================================================

-- 1. FORM TEMPLATES
CREATE TABLE IF NOT EXISTS form_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    schema JSONB NOT NULL DEFAULT '[]', -- Array of field definitions
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ADD CUSTOM DATA COLUMN TO APPLICATIONS
ALTER TABLE applications ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}';

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_form_templates_active ON form_templates(is_active);

-- RLS
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;

-- POLICIES
-- Form Templates
DROP POLICY IF EXISTS "auth_read_forms" ON form_templates;
CREATE POLICY "auth_read_forms" ON form_templates FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_manage_forms" ON form_templates;
CREATE POLICY "auth_manage_forms" ON form_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- GRANT PERMISSIONS
GRANT ALL ON form_templates TO service_role;

-- SEED DEFAULT APPLICATION FORM
INSERT INTO form_templates (name, description, schema, is_active)
VALUES (
    'Standard Job Application',
    'Default application form for all job postings',
    '[
        {
            "id": "resume_url",
            "type": "file",
            "label": "Resume / CV",
            "required": true,
            "accept": ".pdf,.doc,.docx"
        },
        {
            "id": "cover_letter",
            "type": "textarea",
            "label": "Cover Letter",
            "required": false,
            "placeholder": "Tell us why you are a good fit..."
        },
        {
            "id": "portfolio_url",
            "type": "text",
            "label": "Portfolio URL",
            "required": false,
            "placeholder": "https://"
        },
        {
            "id": "linkedin_url",
            "type": "text",
            "label": "LinkedIn Profile",
            "required": false,
            "placeholder": "https://linkedin.com/in/..."
        },
        {
            "id": "notice_period",
            "type": "select",
            "label": "Notice Period",
            "required": true,
            "options": ["Immediate", "1 Week", "2 Weeks", "1 Month", "More than 1 Month"]
        },
        {
            "id": "desired_salary",
            "type": "text",
            "label": "Desired Salary",
            "required": false
        }
    ]'::jsonb,
    true
);

-- VERIFICATION
SELECT 'SUCCESS! Form builder tables created.' as status;
