CREATE TABLE recruitment_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_name VARCHAR(255) NOT NULL,
    job_posting_id UUID,
    stages TEXT NOT NULL,
    default_stages TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);