-- Custom Sheets and Dynamic Columns Schema

-- Table to store custom sheet definitions
CREATE TABLE IF NOT EXISTS custom_sheets (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE(project_id, name)
);

-- Table to store dynamic column definitions for custom sheets
CREATE TABLE IF NOT EXISTS custom_sheet_columns (
    id SERIAL PRIMARY KEY,
    sheet_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    data_type VARCHAR(50) NOT NULL DEFAULT 'text' CHECK (data_type IN ('text', 'number', 'date', 'boolean')),
    is_required BOOLEAN DEFAULT FALSE,
    default_value TEXT,
    position INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sheet_id) REFERENCES custom_sheets(id) ON DELETE CASCADE,
    UNIQUE(sheet_id, name),
    UNIQUE(sheet_id, position)
);

-- Table to store custom sheet data entries
CREATE TABLE IF NOT EXISTS custom_sheet_entries (
    id SERIAL PRIMARY KEY,
    sheet_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    supervisor_id INTEGER NOT NULL,
    entry_date DATE NOT NULL,
    previous_date DATE NOT NULL,
    data_json JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted_to_pm', 'approved_by_pm', 'rejected_by_pm', 'final_approved')),
    submitted_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sheet_id) REFERENCES custom_sheets(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (supervisor_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE(sheet_id, supervisor_id, entry_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_custom_sheets_project_id ON custom_sheets(project_id);
CREATE INDEX IF NOT EXISTS idx_custom_sheets_created_by ON custom_sheets(created_by);
CREATE INDEX IF NOT EXISTS idx_custom_sheet_columns_sheet_id ON custom_sheet_columns(sheet_id);
CREATE INDEX IF NOT EXISTS idx_custom_sheet_entries_sheet_id ON custom_sheet_entries(sheet_id);
CREATE INDEX IF NOT EXISTS idx_custom_sheet_entries_supervisor_id ON custom_sheet_entries(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_custom_sheet_entries_project_id ON custom_sheet_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_custom_sheet_entries_status ON custom_sheet_entries(status);
CREATE INDEX IF NOT EXISTS idx_custom_sheet_entries_dates ON custom_sheet_entries(entry_date, previous_date);