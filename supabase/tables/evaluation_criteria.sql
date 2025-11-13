CREATE TABLE evaluation_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_posting_id UUID,
    criteria_name VARCHAR(255) NOT NULL,
    description TEXT,
    weight DECIMAL(5,2) DEFAULT 1.0,
    max_score INTEGER DEFAULT 10,
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);