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

async function checkAllColumns() {
  try {
    console.log('Checking all columns in projects table...');
    
    // Check all columns in projects table
    const projectColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      ORDER BY ordinal_position
    `);
    
    console.log('Projects table columns:');
    projectColumns.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type})`);
    });
    
    // Check what columns exist in projects table that might relate to P6
    const p6RelatedColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' AND (column_name ILIKE '%p6%' OR column_name ILIKE '%project%')
    `);
    
    console.log('\nP6/Project-related columns in projects table:');
    if (p6RelatedColumns.rows.length > 0) {
      p6RelatedColumns.rows.forEach(row => {
        console.log(`  ${row.column_name}`);
      });
    } else {
      console.log('  None found');
    }
    
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
    
    // Check total count of activities
    const totalCount = await pool.query(`
      SELECT COUNT(*) as total FROM p6_activities
    `);
    
    console.log(`\nTotal activities in database: ${totalCount.rows[0].total}`);
    
  } catch (error) {
    console.error('Error checking columns:', error.message);
  } finally {
    await pool.end();
  }
}

checkAllColumns();