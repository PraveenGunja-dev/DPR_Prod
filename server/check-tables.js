const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5431,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Prvn@3315',
});

async function checkTables() {
  try {
    // Check if system_logs table exists
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'system_logs'
    `);
    
    console.log('System logs table exists:', result.rows.length > 0);
    
    // Check if dpr_supervisor_entries table exists
    const dprResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'dpr_supervisor_entries'
    `);
    
    console.log('DPR supervisor entries table exists:', dprResult.rows.length > 0);
    
    // Check if rejection_reason column exists in dpr_supervisor_entries
    const columnResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'dpr_supervisor_entries' 
      AND column_name = 'rejection_reason'
    `);
    
    console.log('Rejection reason column exists:', columnResult.rows.length > 0);
    
    pool.end();
  } catch (error) {
    console.error('Error checking tables:', error);
    pool.end();
  }
}

checkTables();