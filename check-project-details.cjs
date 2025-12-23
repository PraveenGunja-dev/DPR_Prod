const { Pool } = require('pg');
require('dotenv').config();

// Database configuration from .env
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5431,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Prvn@3315'
});

async function checkProjectDetails() {
  try {
    console.log('Connecting to database...');
    
    // Check projects with their names and activity counts
    const projectsWithActivities = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.status,
        COUNT(a.object_id) as activity_count
      FROM projects p
      LEFT JOIN p6_activities a ON p.id = a.project_object_id
      GROUP BY p.id, p.name, p.status
      ORDER BY activity_count DESC
    `);
    
    console.log('\nProjects details:');
    console.log('ID\tName\t\t\t\tStatus\t\tActivities');
    console.log('------------------------------------------------------------------------------------');
    projectsWithActivities.rows.forEach(row => {
      console.log(`${row.id}\t${row.name.substring(0, 30)}\t\t${row.status}\t\t${row.activity_count}`);
    });
    
    // Show top 5 projects with most activities
    console.log('\nTop 5 projects with most activities:');
    projectsWithActivities.rows.slice(0, 5).forEach((row, index) => {
      console.log(`${index + 1}. ${row.name} (${row.activity_count} activities)`);
    });
    
    // Summary
    const totalProjects = projectsWithActivities.rows.length;
    const totalActivities = projectsWithActivities.rows.reduce((sum, row) => sum + parseInt(row.activity_count), 0);
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total Projects: ${totalProjects}`);
    console.log(`Total P6 Activities: ${totalActivities.toLocaleString()}`);
    
  } catch (error) {
    console.error('Error checking project details:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  } finally {
    await pool.end();
  }
}

checkProjectDetails();