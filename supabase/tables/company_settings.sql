CREATE TABLE company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    company_logo_url TEXT,
    company_address TEXT,
    company_phone VARCHAR(50),
    company_email VARCHAR(255),
    company_website VARCHAR(255),
    working_hours_start TIME,
    working_hours_end TIME,
    timezone VARCHAR(100) DEFAULT 'UTC',
    date_format VARCHAR(50) DEFAULT 'YYYY-MM-DD',
    currency VARCHAR(10) DEFAULT 'USD',
    annual_leave_days INTEGER DEFAULT 20,
    sick_leave_days INTEGER DEFAULT 10,
    public_holidays TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);