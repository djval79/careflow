CREATE TABLE onboarding_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    checklist_id UUID NOT NULL,
    task_id VARCHAR(100) NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    completed_by UUID,
    completed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);