CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_values TEXT,
    new_values TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);