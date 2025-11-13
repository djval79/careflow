CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    date DATE NOT NULL,
    clock_in TIMESTAMP,
    clock_out TIMESTAMP,
    total_hours DECIMAL(5,2),
    status VARCHAR(50) CHECK (status IN ('present',
    'absent',
    'late',
    'half_day',
    'on_leave')),
    notes TEXT,
    approved_by UUID,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);