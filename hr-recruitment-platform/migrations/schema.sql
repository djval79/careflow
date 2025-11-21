-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id),
  reviewer_id UUID REFERENCES employees(id),
  review_period_start DATE,
  review_period_end DATE,
  status TEXT,
  overall_rating NUMERIC,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id),
  title TEXT,
  description TEXT,
  status TEXT,
  progress INTEGER,
  due_date DATE,
  priority TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create kpi_values table (optional, for future use)
CREATE TABLE IF NOT EXISTS kpi_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id),
  metric_name TEXT,
  actual_value NUMERIC,
  target_value NUMERIC,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
