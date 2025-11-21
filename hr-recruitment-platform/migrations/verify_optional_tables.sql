-- Quick verification and data insertion for optional tables

-- Step 1: Verify tables exist
SELECT 
    'performance_review_types' as table_name,
    COUNT(*) as row_count 
FROM performance_review_types
UNION ALL
SELECT 
    'kpi_definitions' as table_name,
    COUNT(*) as row_count 
FROM kpi_definitions;

-- Step 2: If counts are 0, run these INSERT statements:
-- (If you already have data, skip this part)

INSERT INTO performance_review_types (name, description, frequency, auto_schedule, requires_self_assessment, requires_manager_review)
VALUES 
  ('Annual Performance Review', 'Comprehensive yearly review of employee performance', 'annual', true, true, true),
  ('Quarterly Check-in', 'Quarterly progress review and goal alignment', 'quarterly', true, false, true),
  ('Probation Review', 'End of probation period assessment', 'on_demand', false, false, true),
  ('360 Degree Review', 'Multi-source feedback including peers and direct reports', 'annual', false, true, true)
ON CONFLICT DO NOTHING;

INSERT INTO kpi_definitions (name, description, category, unit_of_measure, target_value)
VALUES 
  ('Customer Satisfaction Score', 'Average customer satisfaction rating', 'Quality', 'score (1-5)', 4.5),
  ('Sales Target Achievement', 'Percentage of sales quota achieved', 'Sales', '%', 100),
  ('Project Delivery On Time', 'Percentage of projects delivered by deadline', 'Efficiency', '%', 95),
  ('Code Review Completion', 'Percentage of code reviews completed within SLA', 'Quality', '%', 90),
  ('Employee Retention Rate', 'Percentage of employees retained year-over-year', 'HR', '%', 85)
ON CONFLICT DO NOTHING;

-- Step 3: Verify data was inserted
SELECT * FROM performance_review_types ORDER BY name;
SELECT * FROM kpi_definitions ORDER BY category, name;
