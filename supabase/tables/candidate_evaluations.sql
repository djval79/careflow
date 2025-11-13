CREATE TABLE candidate_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL,
    criteria_id UUID NOT NULL,
    score INTEGER NOT NULL,
    comments TEXT,
    evaluated_by UUID NOT NULL,
    evaluated_at TIMESTAMP DEFAULT NOW()
);