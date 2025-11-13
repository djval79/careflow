CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    notification_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link_url TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low',
    'normal',
    'high',
    'urgent')),
    created_at TIMESTAMP DEFAULT NOW()
);