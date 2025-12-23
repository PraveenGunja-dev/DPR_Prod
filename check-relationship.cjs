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

async function checkRelationship() {
  try {
    console.log('Checking the relationship between projects and p6_activities...');
    
    // Check a few sample projects
    const sampleProjects = await pool.query(`
      SELECT id, name, p6_project_id FROM projects LIMIT 5
    `);
    
    console.log('Sample projects:');
    sampleProjects.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Name: ${row.name}, P6 Project ID: ${row.p6_project_id}`);
    });
    
    // Check if p6_project_id exists in projects table
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' AND column_name = 'p6_project_id'
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('\np6_project_id column exists in projects table');
      
      // Check projects with their P6 project IDs and activity counts
      const projectsWithP6 = await pool.query(`
        SELECT 
          p.id,
          p.name,
          p.p6_project_id,
          COUNT(a.object_id) as activity_count
        FROM projects p
        LEFT JOIN p6_activities a ON p.p6_project_id = a.project_object_id
        GROUP BY p.id, p.name, p.p6_project_id
        ORDER BY activity_count DESC
        LIMIT 10
      `);
      
      console.log('\nProjects with P6 project IDs:');
      projectsWithP6.rows.forEach(row => {
        console.log(`  ${row.name} (ID: ${row.id}, P6 ID: ${row.p6_project_id}) - ${row.activity_count} activities`);
      });
    } else {
      console.log('\np6_project_id column does not exist in projects table');
      
      // Check what columns exist in projects table that might relate to P6
      const projectColumns = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name ILIKE '%p6%'
      `);
      
      console.log('P6-related columns in projects table:');
      projectColumns.rows.forEach(row => {
        console.log(`  ${row.column_name}`);
      });
    }
    
    // Check a sample of activities to understand the data
    const sampleActivities = await pool.query(`
      SELECT project_object_id, name 
      FROM p6_activities 
      LIMIT 5
    `);
    
    console.log('\nSample activities:');
    sampleActivities.rows.forEach(row => {
      console.log(`  Project ID: ${row.project_object_id}, Activity: ${row.name}`);
    });
    
    // Check distinct project_object_ids in activities
    const distinctProjects = await pool.query(`
      SELECT DISTINCT project_object_id, COUNT(*) as activity_count
      FROM p6_activities
      GROUP BY project_object_id
      ORDER BY activity_count DESC
      LIMIT 10
    `);
    
    console.log('\nDistinct project IDs in activities:');
    distinctProjects.rows.forEach(row => {
      console.log(`  Project ID: ${row.project_object_id} - ${row.activity_count} activities`);
    });
    
  } catch (error) {
    console.error('Error checking relationship:', error.message);
  } finally {
    await pool.end();
  }
}

checkRelationship();