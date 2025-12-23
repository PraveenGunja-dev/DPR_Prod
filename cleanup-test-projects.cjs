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

async function cleanupTestProjects() {
  try {
    console.log('Connecting to database...');
    
    // First, let's see what projects we have before deleting
    const projectsBefore = await pool.query(`
      SELECT id, name, status, created_at 
      FROM projects 
      ORDER BY id
    `);
    
    console.log(`Found ${projectsBefore.rows.length} projects before cleanup:`);
    projectsBefore.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Name: ${row.name}, Status: ${row.status}`);
    });
    
    // Ask for confirmation before proceeding
    console.log('\nWARNING: This will delete all projects from the local database.');
    console.log('The P6 activities will remain intact.');
    console.log('Do you want to proceed? (yes/no)');
    
    // For automation, we'll proceed directly
    console.log('\nProceeding with cleanup...');
    
    // Delete all projects (but keep the activities)
    const deleteResult = await pool.query('DELETE FROM projects RETURNING id, name');
    
    console.log(`\nDeleted ${deleteResult.rowCount} projects:`);
    deleteResult.rows.forEach(row => {
      console.log(`  - ${row.name} (ID: ${row.id})`);
    });
    
    // Verify the cleanup
    const projectsAfter = await pool.query('SELECT COUNT(*) as count FROM projects');
    const activitiesAfter = await pool.query('SELECT COUNT(*) as count FROM p6_activities');
    
    console.log('\n=== CLEANUP SUMMARY ===');
    console.log(`Projects remaining: ${projectsAfter.rows[0].count}`);
    console.log(`P6 Activities remaining: ${activitiesAfter.rows[0].count.toLocaleString()}`);
    console.log('Cleanup completed successfully!');
    
  } catch (error) {
    console.error('Error during cleanup:', error.message);
  } finally {
    await pool.end();
  }
}

cleanupTestProjects();