// Simple test to check what projects exist and what entries are associated with them
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function checkProjectsAndEntries() {
  try {
    console.log('Checking projects and entries...\n');
    
    // Check all projects
    const projects = await pool.query('SELECT * FROM projects');
    console.log('Projects in database:');
    projects.rows.forEach(project => {
      console.log(`  ID: ${project.id}, Name: ${project.name}`);
    });
    
    console.log('\nSubmitted entries by project:');
    // Check submitted entries grouped by project
    const entriesByProject = await pool.query(`
      SELECT 
        project_id,
        COUNT(*) as entry_count,
        STRING_AGG(sheet_type, ', ') as sheet_types
      FROM dpr_supervisor_entries 
      WHERE status = 'submitted_to_pm'
      GROUP BY project_id
      ORDER BY project_id
    `);
    
    if (entriesByProject.rows.length > 0) {
      entriesByProject.rows.forEach(row => {
        console.log(`  Project ${row.project_id}: ${row.entry_count} entries (${row.sheet_types})`);
      });
    } else {
      console.log('  No submitted entries found');
    }
    
    pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    pool.end();
  }
}

checkProjectsAndEntries();