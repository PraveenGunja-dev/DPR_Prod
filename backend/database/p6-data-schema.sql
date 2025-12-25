-- server/database/p6-data-schema.sql
-- Complete Oracle P6 Data Schema for UI Tables Integration
-- This schema supports all 6 supervisor dashboard tables

-- ============================================================================
-- WBS (Work Breakdown Structure) Table
-- Used for: Plots, Blocks, Sections in DP Block, DP Vendor Block, Manpower tables
-- ============================================================================
CREATE TABLE IF NOT EXISTS p6_wbs (
    id SERIAL PRIMARY KEY,
    object_id INTEGER UNIQUE NOT NULL,           -- P6 ObjectId
    project_object_id INTEGER NOT NULL,          -- Parent project P6 ObjectId
    parent_object_id INTEGER,                    -- Parent WBS P6 ObjectId (hierarchy)
    code VARCHAR(100),                           -- WBS code (used as block/plot identifier)
    name VARCHAR(500) NOT NULL,                  -- WBS element name
    seq_num INTEGER,                             -- Sequence number for ordering
    status VARCHAR(50),                          -- WBS status
    last_sync_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for WBS
CREATE INDEX IF NOT EXISTS idx_p6_wbs_object_id ON p6_wbs(object_id);
CREATE INDEX IF NOT EXISTS idx_p6_wbs_project ON p6_wbs(project_object_id);
CREATE INDEX IF NOT EXISTS idx_p6_wbs_parent ON p6_wbs(parent_object_id);
CREATE INDEX IF NOT EXISTS idx_p6_wbs_code ON p6_wbs(code);

-- ============================================================================
-- Resource Assignments Table
-- Used for: Contractor names in DP Vendor Block, DP Vendor IDT tables
-- ============================================================================
CREATE TABLE IF NOT EXISTS p6_resource_assignments (
    id SERIAL PRIMARY KEY,
    object_id INTEGER UNIQUE NOT NULL,           -- P6 ObjectId
    activity_object_id INTEGER NOT NULL,         -- Activity P6 ObjectId
    resource_object_id INTEGER,                  -- Resource P6 ObjectId
    project_object_id INTEGER,                   -- Project P6 ObjectId
    resource_name VARCHAR(255),                  -- Resource/Contractor name
    resource_type VARCHAR(50),                   -- Labor, Nonlabor, Material
    planned_units DECIMAL(15,4),                 -- Planned units
    actual_units DECIMAL(15,4),                  -- Actual units worked
    remaining_units DECIMAL(15,4),               -- Remaining units
    planned_cost DECIMAL(20,2),                  -- Planned cost
    actual_cost DECIMAL(20,2),                   -- Actual cost
    start_date TIMESTAMP,                        -- Assignment start
    finish_date TIMESTAMP,                       -- Assignment finish
    is_primary BOOLEAN DEFAULT false,            -- Primary resource flag
    last_sync_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Resource Assignments
CREATE INDEX IF NOT EXISTS idx_p6_ra_object_id ON p6_resource_assignments(object_id);
CREATE INDEX IF NOT EXISTS idx_p6_ra_activity ON p6_resource_assignments(activity_object_id);
CREATE INDEX IF NOT EXISTS idx_p6_ra_resource ON p6_resource_assignments(resource_object_id);
CREATE INDEX IF NOT EXISTS idx_p6_ra_project ON p6_resource_assignments(project_object_id);

-- ============================================================================
-- UDF (User Defined Fields) Values Table
-- Used for: Total Quantity, UOM, Scope, Remarks in DP tables
-- ============================================================================
CREATE TABLE IF NOT EXISTS p6_udf_values (
    id SERIAL PRIMARY KEY,
    udf_type_object_id INTEGER NOT NULL,         -- UDF Type P6 ObjectId
    foreign_object_id INTEGER NOT NULL,          -- Activity/Resource ObjectId this UDF is on
    udf_type_name VARCHAR(255),                  -- UDF name (e.g., "Total Quantity", "Scope")
    subject_area VARCHAR(100),                   -- Activity, Resource, Project, etc.
    text_value TEXT,                             -- Text value
    double_value DECIMAL(20,6),                  -- Numeric value
    integer_value INTEGER,                       -- Integer value
    date_value TIMESTAMP,                        -- Date value
    code_value VARCHAR(255),                     -- Code value (for code-type UDFs)
    last_sync_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(udf_type_object_id, foreign_object_id)
);

-- Indexes for UDF Values
CREATE INDEX IF NOT EXISTS idx_p6_udf_type ON p6_udf_values(udf_type_object_id);
CREATE INDEX IF NOT EXISTS idx_p6_udf_foreign ON p6_udf_values(foreign_object_id);
CREATE INDEX IF NOT EXISTS idx_p6_udf_name ON p6_udf_values(udf_type_name);

-- ============================================================================
-- Project Issues Table
-- Used for: RFI tracking in MMS & Module RFI table
-- ============================================================================
CREATE TABLE IF NOT EXISTS p6_project_issues (
    id SERIAL PRIMARY KEY,
    object_id INTEGER UNIQUE NOT NULL,           -- P6 ObjectId
    project_object_id INTEGER NOT NULL,          -- Project P6 ObjectId
    wbs_object_id INTEGER,                       -- WBS P6 ObjectId (for module/section)
    name VARCHAR(500) NOT NULL,                  -- Issue name/title
    status VARCHAR(50),                          -- Open, Closed, etc.
    priority VARCHAR(50),                        -- High, Medium, Low
    create_date TIMESTAMP,                       -- When issue was created
    due_date TIMESTAMP,                          -- Due date
    close_date TIMESTAMP,                        -- When closed
    description TEXT,                            -- Issue description
    responsible_manager_name VARCHAR(255),       -- Assigned manager
    tracking_layout_name VARCHAR(255),           -- Tracking layout
    last_sync_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Project Issues
CREATE INDEX IF NOT EXISTS idx_p6_issues_object_id ON p6_project_issues(object_id);
CREATE INDEX IF NOT EXISTS idx_p6_issues_project ON p6_project_issues(project_object_id);
CREATE INDEX IF NOT EXISTS idx_p6_issues_wbs ON p6_project_issues(wbs_object_id);
CREATE INDEX IF NOT EXISTS idx_p6_issues_status ON p6_project_issues(status);

-- ============================================================================
-- Activity Relationships Table
-- Used for: Understanding activity dependencies
-- ============================================================================
CREATE TABLE IF NOT EXISTS p6_relationships (
    id SERIAL PRIMARY KEY,
    object_id INTEGER UNIQUE NOT NULL,           -- P6 ObjectId
    predecessor_object_id INTEGER NOT NULL,      -- Predecessor activity ObjectId
    successor_object_id INTEGER NOT NULL,        -- Successor activity ObjectId
    predecessor_project_id INTEGER,              -- Predecessor project ObjectId
    successor_project_id INTEGER,                -- Successor project ObjectId
    type VARCHAR(10),                            -- FS, SS, FF, SF
    lag DECIMAL(10,2) DEFAULT 0,                 -- Lag duration
    lag_type VARCHAR(50),                        -- Lag type
    last_sync_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Relationships
CREATE INDEX IF NOT EXISTS idx_p6_rel_predecessor ON p6_relationships(predecessor_object_id);
CREATE INDEX IF NOT EXISTS idx_p6_rel_successor ON p6_relationships(successor_object_id);

-- ============================================================================
-- Enhanced Activities Table (if p6_activities doesn't exist, create it)
-- Core table for all DPR sheets
-- ============================================================================
DO $$
BEGIN
    -- Add new columns to existing p6_activities if they don't exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'p6_activities') THEN
        -- Add WBS name for quick access
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'p6_activities' AND column_name = 'wbs_name') THEN
            ALTER TABLE p6_activities ADD COLUMN wbs_name VARCHAR(500);
        END IF;
        
        -- Add WBS code for block/plot identification
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'p6_activities' AND column_name = 'wbs_code') THEN
            ALTER TABLE p6_activities ADD COLUMN wbs_code VARCHAR(100);
        END IF;
        
        -- Add primary resource name for contractor display
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'p6_activities' AND column_name = 'primary_resource_name') THEN
            ALTER TABLE p6_activities ADD COLUMN primary_resource_name VARCHAR(255);
        END IF;
        
        -- Add remaining early dates for forecast
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'p6_activities' AND column_name = 'remaining_early_start') THEN
            ALTER TABLE p6_activities ADD COLUMN remaining_early_start TIMESTAMP;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'p6_activities' AND column_name = 'remaining_early_finish') THEN
            ALTER TABLE p6_activities ADD COLUMN remaining_early_finish TIMESTAMP;
        END IF;
    END IF;
END $$;

-- ============================================================================
-- P6 Sync Log Table
-- Track synchronization history
-- ============================================================================
CREATE TABLE IF NOT EXISTS p6_sync_log (
    id SERIAL PRIMARY KEY,
    project_object_id INTEGER NOT NULL,
    sync_type VARCHAR(50) NOT NULL,              -- activities, wbs, resources, issues, full
    status VARCHAR(50) NOT NULL,                 -- started, completed, failed
    records_synced INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Index for sync log
CREATE INDEX IF NOT EXISTS idx_p6_sync_project ON p6_sync_log(project_object_id);
CREATE INDEX IF NOT EXISTS idx_p6_sync_type ON p6_sync_log(sync_type);

-- ============================================================================
-- Trigger functions for updated_at timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_p6_wbs_updated_at ON p6_wbs;
CREATE TRIGGER update_p6_wbs_updated_at
    BEFORE UPDATE ON p6_wbs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_p6_ra_updated_at ON p6_resource_assignments;
CREATE TRIGGER update_p6_ra_updated_at
    BEFORE UPDATE ON p6_resource_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_p6_issues_updated_at ON p6_project_issues;
CREATE TRIGGER update_p6_issues_updated_at
    BEFORE UPDATE ON p6_project_issues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON TABLE p6_wbs IS 'Work Breakdown Structure from Oracle P6 - used for plots, blocks, sections';
COMMENT ON TABLE p6_resource_assignments IS 'Resource assignments from P6 - used for contractor/vendor names';
COMMENT ON TABLE p6_udf_values IS 'User Defined Field values from P6 - used for custom fields like Qty, UOM, Scope';
COMMENT ON TABLE p6_project_issues IS 'Project issues from P6 - used for RFI tracking';
COMMENT ON TABLE p6_relationships IS 'Activity relationships from P6 - used for dependency tracking';
COMMENT ON TABLE p6_sync_log IS 'Sync history log for tracking P6 data synchronization';
