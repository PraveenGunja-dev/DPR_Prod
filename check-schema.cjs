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

async function checkSchema() {
  try {
    console.log('Checking projects table schema...');
    const projectsSchema = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      ORDER BY ordinal_position
    `);
    
    console.log('Projects table columns:');
    projectsSchema.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type})`);
    });
    
    console.log('\nChecking p6_activities table schema...');
    const activitiesSchema = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'p6_activities' 
      ORDER BY ordinal_position
    `);
    
    console.log('P6 Activities table columns:');
    activitiesSchema.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type})`);
    });
    
  } catch (error) {
    console.error('Error checking schema:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();