-- Migration: Add UDF columns to p6_activities table
-- Date: 2025-12-23
-- Purpose: Store P6 User Defined Field values directly in activities table

-- Add columns for commonly used UDF values
ALTER TABLE p6_activities ADD COLUMN IF NOT EXISTS total_quantity DECIMAL(15,4);
ALTER TABLE p6_activities ADD COLUMN IF NOT EXISTS uom VARCHAR(50);
ALTER TABLE p6_activities ADD COLUMN IF NOT EXISTS block_capacity DECIMAL(15,4);
ALTER TABLE p6_activities ADD COLUMN IF NOT EXISTS phase VARCHAR(255);
ALTER TABLE p6_activities ADD COLUMN IF NOT EXISTS spv_no VARCHAR(100);
ALTER TABLE p6_activities ADD COLUMN IF NOT EXISTS scope TEXT;
ALTER TABLE p6_activities ADD COLUMN IF NOT EXISTS hold VARCHAR(100);
ALTER TABLE p6_activities ADD COLUMN IF NOT EXISTS front VARCHAR(255);

-- Add indexes for frequently queried UDF columns
CREATE INDEX IF NOT EXISTS idx_p6_activities_phase ON p6_activities(phase);
CREATE INDEX IF NOT EXISTS idx_p6_activities_spv_no ON p6_activities(spv_no);
CREATE INDEX IF NOT EXISTS idx_p6_activities_hold ON p6_activities(hold);
