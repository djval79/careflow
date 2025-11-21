-- Create optional performance module tables for Settings and KPI management

-- Performance Review Types (for Settings tab)
CREATE TABLE IF NOT EXISTS performance_review_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT, -- e.g., 'annual', 'quarterly', 'monthly'
  auto_schedule BOOLEAN DEFAULT false,
  requires_self_assessment BOOLEAN DEFAULT false,
  requires_manager_review BOOLEAN DEFAULT true,
  requires_peer_review BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- KPI Definitions (for KPIs tab)
CREATE TABLE IF NOT EXISTS kpi_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- e.g., 'Sales', 'Quality', 'Efficiency'
  unit_of_measure TEXT, -- e.g., '%', 'count', 'days'
  target_value NUMERIC,
  calculation_method TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE performance_review_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_definitions ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users full access to performance_review_types" 
ON performance_review_types 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to kpi_definitions" 
ON kpi_definitions 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Insert some default review types
INSERT INTO performance_review_types (name, description, frequency, auto_schedule, requires_self_assessment, requires_manager_review)
VALUES 
  ('Annual Performance Review', 'Comprehensive yearly review of employee performance', 'annual', true, true, true),
  ('Quarterly Check-in', 'Quarterly progress review and goal alignment', 'quarterly', true, false, true),
  ('Probation Review', 'End of probation period assessment', 'on_demand', false, false, true),
  ('360 Degree Review', 'Multi-source feedback including peers and direct reports', 'annual', false, true, true)
ON CONFLICT DO NOTHING;

-- Insert some default KPI definitions
INSERT INTO kpi_definitions (name, description, category, unit_of_measure, target_value)
VALUES 
  ('Customer Satisfaction Score', 'Average customer satisfaction rating', 'Quality', 'score (1-5)', 4.5),
  ('Sales Target Achievement', 'Percentage of sales quota achieved', 'Sales', '%', 100),
  ('Project Delivery On Time', 'Percentage of projects delivered by deadline', 'Efficiency', '%', 95),
  ('Code Review Completion', 'Percentage of code reviews completed within SLA', 'Quality', '%', 90),
  ('Employee Retention Rate', 'Percentage of employees retained year-over-year', 'HR', '%', 85)
ON CONFLICT DO NOTHING;
