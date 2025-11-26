-- server/database/projects-schema.sql
-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'planning',
    progress INTEGER NOT NULL DEFAULT 0,
    plan_start DATE,
    plan_end DATE,
    actual_start DATE,
    actual_end DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample projects
INSERT INTO projects (name, location, status, progress, plan_start, plan_end) VALUES
('Mundra Port Expansion', 'Gujarat, India', 'active', 75, '2025-02-01', '2025-11-30'),
('Ahmedabad Metro Line 2', 'Ahmedabad, Gujarat', 'active', 45, '2025-02-01', '2025-11-30'),
('Chennai Coastal Road', 'Chennai, Tamil Nadu', 'planning', 10, '2025-02-01', '2025-11-30')
ON CONFLICT DO NOTHING;