-- Migration script to add rejection_reason column to dpr_supervisor_entries table
ALTER TABLE dpr_supervisor_entries 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;