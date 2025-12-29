-- P6 Clean Sync Database Schema
-- Run this to create/update tables for clean P6 data sync

-- Projects table (may already exist)
CREATE TABLE IF NOT EXISTS p6_projects (
    id SERIAL PRIMARY KEY,
    object_id INTEGER UNIQUE NOT NULL,
    project_id VARCHAR(100),
    name VARCHAR(500),
    status VARCHAR(100),
    start_date TIMESTAMP,
    finish_date TIMESTAMP,
    planned_start_date TIMESTAMP,
    planned_finish_date TIMESTAMP,
    actual_start_date TIMESTAMP,
    actual_finish_date TIMESTAMP,
    percent_complete DECIMAL(10,2),
    description TEXT,
    last_sync_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Activities table (clean version)
CREATE TABLE IF NOT EXISTS p6_activities (
    id SERIAL PRIMARY KEY,
    object_id INTEGER UNIQUE NOT NULL,
    activity_id VARCHAR(100),
    name TEXT,
    status VARCHAR(100),
    percent_complete DECIMAL(10,2),
    
    -- Dates
    planned_start_date TIMESTAMP,
    planned_finish_date TIMESTAMP,
    actual_start_date TIMESTAMP,
    actual_finish_date TIMESTAMP,
    baseline_start_date TIMESTAMP,
    baseline_finish_date TIMESTAMP,
    
    -- Quantity/Duration fields (from P6)
    planned_non_labor_units DECIMAL(15,4),  -- Total Quantity
    actual_non_labor_units DECIMAL(15,4),
    remaining_non_labor_units DECIMAL(15,4),
    duration DECIMAL(10,2),
    actual_duration DECIMAL(10,2),
    remaining_duration DECIMAL(10,2),
    
    -- References
    wbs_object_id INTEGER,
    project_object_id INTEGER NOT NULL,
    
    -- Metadata
    last_sync_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Activity Code Types (e.g., "Priority", "Plot", "Block")
DROP TABLE IF EXISTS p6_activity_code_assignments CASCADE;
DROP TABLE IF EXISTS p6_activity_codes CASCADE;
DROP TABLE IF EXISTS p6_activity_code_types CASCADE;
DROP TABLE IF EXISTS p6_udf_values CASCADE;

CREATE TABLE IF NOT EXISTS p6_activity_code_types (
    id SERIAL PRIMARY KEY,
    object_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(255),
    sequence_number INTEGER,
    project_object_id INTEGER
);

-- Activity Codes (actual values like "High", "Low", "A-06")
CREATE TABLE IF NOT EXISTS p6_activity_codes (
    id SERIAL PRIMARY KEY,
    object_id INTEGER UNIQUE NOT NULL,
    code_value VARCHAR(255),
    description TEXT,
    code_type_object_id INTEGER REFERENCES p6_activity_code_types(object_id),
    color VARCHAR(50),
    sequence_number INTEGER
);

-- Activity Code Assignments (links activities to code values)
CREATE TABLE IF NOT EXISTS p6_activity_code_assignments (
    id SERIAL PRIMARY KEY,
    activity_object_id INTEGER NOT NULL,
    activity_code_object_id INTEGER NOT NULL,
    UNIQUE(activity_object_id, activity_code_object_id)
);

-- UDF Values (User Defined Fields for activities)
CREATE TABLE IF NOT EXISTS p6_udf_values (
    id SERIAL PRIMARY KEY,
    foreign_object_id INTEGER NOT NULL,  -- Activity ObjectId
    udf_type_title VARCHAR(255) NOT NULL,
    text_value TEXT,
    double_value DECIMAL(20,6),
    integer_value INTEGER,
    cost_value DECIMAL(20,2),
    start_date TIMESTAMP,
    finish_date TIMESTAMP,
    code_value VARCHAR(255),
    description TEXT,
    UNIQUE(foreign_object_id, udf_type_title)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_project ON p6_activities(project_object_id);
CREATE INDEX IF NOT EXISTS idx_activities_wbs ON p6_activities(wbs_object_id);
CREATE INDEX IF NOT EXISTS idx_code_assignments_activity ON p6_activity_code_assignments(activity_object_id);
CREATE INDEX IF NOT EXISTS idx_udf_foreign ON p6_udf_values(foreign_object_id);

-- Done
SELECT 'P6 Clean Sync Schema Created Successfully' as status;
