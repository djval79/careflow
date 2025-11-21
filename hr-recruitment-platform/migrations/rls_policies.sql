-- Enable Row Level Security on performance tables
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_values ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for authenticated users
-- Reviews table policies
CREATE POLICY "Allow authenticated users full access to reviews" 
ON reviews 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Goals table policies
CREATE POLICY "Allow authenticated users full access to goals" 
ON goals 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- KPI Values table policies
CREATE POLICY "Allow authenticated users full access to kpi_values" 
ON kpi_values 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Allow service role (for Edge Functions) to bypass RLS
-- This is already enabled by default for service role, but documenting here for clarity
-- Service role key operations will bypass these policies automatically
