// Script to add sample projects to local database
require('dotenv').config();
const pool = require('./db');

async function addSampleProjects() {
    try {
        console.log('Adding sample projects to local database...');

        // Check if projects table exists and add sample data
        const result = await pool.query(`
      INSERT INTO projects (name, location, status, progress, plan_start, plan_end) 
      VALUES 
        ('PLOT A-06 135 MW - KHAVDA HYBRID SOLAR PHASE 3', 'Gujarat, India', 'Active', 25, '2025-01-01', '2025-12-31'),
        ('PLOT B-02 100 MW - RAJKOT SOLAR PROJECT', 'Gujarat, India', 'Active', 10, '2025-02-01', '2025-11-30'),
        ('PLOT C-01 75 MW - KUTCH WIND ENERGY', 'Gujarat, India', 'Planning', 0, '2025-03-01', '2026-06-30'),
        ('PLOT D-05 200 MW - JAISALMER SOLAR PARK', 'Rajasthan, India', 'Active', 45, '2024-06-01', '2025-08-30'),
        ('PLOT E-03 150 MW - ANANTAPUR SOLAR COMPLEX', 'Andhra Pradesh, India', 'Active', 60, '2024-03-01', '2025-06-30')
      ON CONFLICT DO NOTHING
      RETURNING id, name;
    `);

        console.log('Sample projects added:', result.rows);

        // Also check if there are any users to assign projects to
        const users = await pool.query(`SELECT user_id, name, role FROM users WHERE role IN ('supervisor', 'Site PM') LIMIT 5`);
        console.log('Available users for assignment:', users.rows);

        // Assign projects to the first supervisor/Site PM found
        if (users.rows.length > 0 && result.rows.length > 0) {
            for (const project of result.rows) {
                for (const user of users.rows) {
                    try {
                        await pool.query(`
              INSERT INTO project_assignments (project_id, user_id, assigned_by)
              VALUES ($1, $2, $2)
              ON CONFLICT DO NOTHING
            `, [project.id, user.user_id]);
                        console.log(`Assigned project ${project.name} to user ${user.name}`);
                    } catch (e) {
                        // Ignore duplicate assignment errors
                    }
                }
            }
        }

        console.log('Done! Sample projects added and assigned.');
        process.exit(0);
    } catch (error) {
        console.error('Error adding sample projects:', error.message);
        process.exit(1);
    }
}

addSampleProjects();
