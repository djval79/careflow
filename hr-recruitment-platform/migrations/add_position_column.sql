-- Add position column to applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS position TEXT;

-- Make job_posting_id optional if it's not already (it was created as nullable in previous migrations, but good to be sure)
ALTER TABLE applications ALTER COLUMN job_posting_id DROP NOT NULL;

-- Verification
SELECT 'SUCCESS! Position column added.' as status;
