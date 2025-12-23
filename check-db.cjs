const { Pool } = require('pg');

// Database configuration from .env
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'Prvn@3315',
  port: 5431,
});

async function checkData() {
  try {
    console.log('Checking database for data...');
    
    // Check projects
    const projects = await pool.query('SELECT COUNT(*) as count FROM projects');
    console.log('Projects count:', projects.rows[0].count);
    
    // Check p6_projects
    const p6Projects = await pool.query('SELECT COUNT(*) as count FROM p6_projects');
    console.log('P6 Projects count:', p6Projects.rows[0].count);
    
    // Check activities
    const activities = await pool.query('SELECT COUNT(*) as count FROM activities');
    console.log('Activities count:', activities.rows[0].count);
    
    // Check p6_activities
    const p6Activities = await pool.query('SELECT COUNT(*) as count FROM p6_activities');
    console.log('P6 Activities count:', p6Activities.rows[0].count);
    
    // Check users
    const users = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log('Users count:', users.rows[0].count);
    
    // Show some sample data
    if (parseInt(p6Activities.rows[0].count) > 0) {
      const sampleActivities = await pool.query('SELECT * FROM p6_activities LIMIT 3');
      console.log('Sample P6 Activities:', sampleActivities.rows);
    } else if (parseInt(activities.rows[0].count) > 0) {
      const sampleActivities = await pool.query('SELECT * FROM activities LIMIT 3');
      console.log('Sample Activities:', sampleActivities.rows);
    }
    
    if (parseInt(p6Projects.rows[0].count) > 0) {
      const sampleProjects = await pool.query('SELECT * FROM p6_projects LIMIT 3');
      console.log('Sample P6 Projects:', sampleProjects.rows);
    } else if (parseInt(projects.rows[0].count) > 0) {
      const sampleProjects = await pool.query('SELECT * FROM projects LIMIT 3');
      console.log('Sample Projects:', sampleProjects.rows);
    }
    
    // Check for any data in p6 related tables
    const p6Tables = ['p6_wbs', 'p6_resource_assignments', 'p6_udf_values', 'p6_project_issues'];
    for (const table of p6Tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`${table} count:`, result.rows[0].count);
        if (parseInt(result.rows[0].count) > 0) {
          const sample = await pool.query(`SELECT * FROM ${table} LIMIT 1`);
          console.log(`Sample ${table}:`, sample.rows[0]);
        }
      } catch (error) {
        console.log(`${table} does not exist or error:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('Error checking database:', error.message);
  } finally {
    await pool.end();
  }
}

checkData();