-- Add p6_unit_of_measures lookup table
-- Date: 2026-01-08

-- Drop if exists
DROP TABLE IF EXISTS p6_unit_of_measures CASCADE;

-- Create UOM lookup table
CREATE TABLE p6_unit_of_measures (
    "objectId" BIGINT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "lastSyncAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_p6_uom_name ON p6_unit_of_measures("name");

-- Done
SELECT 'p6_unit_of_measures table created' as status;
