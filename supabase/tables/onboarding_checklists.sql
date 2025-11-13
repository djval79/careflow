CREATE TABLE onboarding_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_name VARCHAR(255) NOT NULL,
    description TEXT,
    tasks TEXT NOT NULL,
    department VARCHAR(100),
    position VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);