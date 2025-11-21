# Optional Tables Deployment Guide

## Overview
This guide walks you through deploying the optional Performance module tables that enable the Settings and KPIs tabs.

## What Gets Deployed

### Tables Created
1. **`performance_review_types`** - Review type configurations
   - Annual Reviews
   - Quarterly Check-ins  
   - Probation Reviews
   - 360° Reviews

2. **`kpi_definitions`** - KPI metric definitions
   - Customer Satisfaction Score
   - Sales Target Achievement
   - Project Delivery On Time
   - Code Review Completion
   - Employee Retention Rate

### Security
- Row Level Security (RLS) enabled on both tables
- Authenticated users have full access
- Service role can bypass RLS

## Deployment Steps

### 1. Access Supabase SQL Editor
1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project: `niikshfoecitimepiifo`
3. Click **SQL Editor** in the sidebar

### 2. Run Migration
1. Click **New Query**
2. Copy the contents of `migrations/optional_tables.sql`
3. Paste into the SQL editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### 3. Verify Deployment
```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('performance_review_types', 'kpi_definitions');

-- Check sample data loaded
SELECT COUNT(*) FROM performance_review_types; -- Should return 4
SELECT COUNT(*) FROM kpi_definitions; -- Should return 5
```

### 4. Test in UI
1. Navigate to `http://localhost:5173/performance`
2. Click **Settings** tab
   - ✅ Should display 4 review types
   - ✅ No 404 errors in console
3. Click **KPIs** tab
   - ✅ Should display 5 KPI definitions
   - ✅ No 404 errors in console

## Troubleshooting

### "Table already exists" Error
**Cause**: Tables already deployed  
**Solution**: This is fine, the migration uses `CREATE TABLE IF NOT EXISTS`

### Tables Empty
**Cause**: INSERT statements failed due to conflicts  
**Solution**: Run the INSERT statements manually:
```sql
INSERT INTO performance_review_types (name, description, frequency, auto_schedule, requires_self_assessment, requires_manager_review)
VALUES 
  ('Annual Performance Review', 'Comprehensive yearly review of employee performance', 'annual', true, true, true),
  ('Quarterly Check-in', 'Quarterly progress review and goal alignment', 'quarterly', true, false, true),
  ('Probation Review', 'End of probation period assessment', 'on_demand', false, false, true),
  ('360 Degree Review', 'Multi-source feedback including peers and direct reports', 'annual', false, true, true)
ON CONFLICT DO NOTHING;
```

### Still Getting 404 Errors 
**Cause**: Browser cache  
**Solution**: Hard refresh (Cmd/Ctrl + Shift + R)

## rollback (If Needed)

If you need to remove these tables:
```sql
DROP TABLE IF EXISTS performance_review_types CASCADE;
DROP TABLE IF EXISTS kpi_definitions CASCADE;
```

> [!WARNING]
> Dropping tables will permanently delete all data. This cannot be undone.

## Next Steps

After successful deployment:
1. Configure your own review types in Settings tab
2. Define custom KPIs in KPIs tab
3. Link reviews to specific review types
4. Track KPI values for employees
