-- Migration to add audit tracking fields to dpr_supervisor_entries
-- These fields track who performed each action and when

-- Add submitted_by field
ALTER TABLE dpr_supervisor_entries 
ADD COLUMN IF NOT EXISTS submitted_by INTEGER REFERENCES users(user_id);

-- Add PM review fields
ALTER TABLE dpr_supervisor_entries 
ADD COLUMN IF NOT EXISTS pm_reviewed_at TIMESTAMP;

ALTER TABLE dpr_supervisor_entries 
ADD COLUMN IF NOT EXISTS pm_reviewed_by INTEGER REFERENCES users(user_id);

-- Add rejection reason field (if not exists)
ALTER TABLE dpr_supervisor_entries 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add PMAG push fields
ALTER TABLE dpr_supervisor_entries 
ADD COLUMN IF NOT EXISTS pushed_at TIMESTAMP;

ALTER TABLE dpr_supervisor_entries 
ADD COLUMN IF NOT EXISTS pushed_by INTEGER REFERENCES users(user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_dpr_entries_submitted_by ON dpr_supervisor_entries(submitted_by);
CREATE INDEX IF NOT EXISTS idx_dpr_entries_pm_reviewed_by ON dpr_supervisor_entries(pm_reviewed_by);
CREATE INDEX IF NOT EXISTS idx_dpr_entries_pushed_by ON dpr_supervisor_entries(pushed_by);

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'dpr_supervisor_entries' 
ORDER BY ordinal_position;
