-- server/database/schema.sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('supervisor', 'Site PM', 'PMAG')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

-- Create project_assignments table
CREATE TABLE IF NOT EXISTS project_assignments (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(user_id) ON DELETE SET NULL,
    UNIQUE(project_id, user_id)
);

-- Insert sample users with actual passwords
-- Password for all users is "admin123"
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@adani.com', '$2b$10$example_hashed_password', 'PMAG'),
('Project Manager', 'pm@adani.com', '$2b$10$example_hashed_password', 'Site PM'),
('Supervisor User', 'supervisor@adani.com', '$2b$10$example_hashed_password', 'supervisor')
ON CONFLICT (email) DO NOTHING;

-- Insert sample projects
INSERT INTO projects (name, location, status, progress, plan_start, plan_end) VALUES
('Mundra Port Expansion', 'Gujarat, India', 'active', 75, '2025-02-01', '2025-11-30'),
('Ahmedabad Metro Line 2', 'Ahmedabad, Gujarat', 'active', 45, '2025-02-01', '2025-11-30'),
('Chennai Coastal Road', 'Chennai, Tamil Nadu', 'planning', 10, '2025-02-01', '2025-11-30')
ON CONFLICT DO NOTHING;