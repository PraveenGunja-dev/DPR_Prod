const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5431,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Prvn@3315'
});

async function checkTables() {
  try {
    console.log('Checking database tables...');
    
    // List all tables
    const tables = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    console.log('Tables in database:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.tablename}`);
    });
    
    // Check p6_projects table
    console.log('\nChecking p6_projects table...');
    const p6ProjectsCount = await pool.query('SELECT COUNT(*) as count FROM p6_projects');
    console.log(`P6 Projects count: ${p6ProjectsCount.rows[0].count}`);
    
    // Sample p6_projects
    const sampleProjects = await pool.query(`
      SELECT object_id, p6_id, name, status 
      FROM p6_projects 
      ORDER BY name 
      LIMIT 5
    `);
    
    console.log('\nSample P6 projects:');
    sampleProjects.rows.forEach(row => {
      console.log(`  ${row.name} (ID: ${row.p6_id}, ObjectID: ${row.object_id}, Status: ${row.status})`);
    });
    
    // Check projects table (different from p6_projects)
    console.log('\nChecking projects table...');
    const projectsCount = await pool.query('SELECT COUNT(*) as count FROM projects');
    console.log(`Projects count: ${projectsCount.rows[0].count}`);
    
    // Check p6_activities table
    console.log('\nChecking p6_activities table...');
    const activitiesCount = await pool.query('SELECT COUNT(*) as count FROM p6_activities');
    console.log(`P6 Activities count: ${activitiesCount.rows[0].count.toLocaleString()}`);
    
  } catch (error) {
    console.error('Error checking tables:', error.message);
  } finally {
    await pool.end();
  }
}

checkTables();