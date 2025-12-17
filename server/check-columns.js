const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function checkColumns() {
  try {
    // Check if rejection_reason column exists
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'dpr_supervisor_entries' 
      AND column_name = 'rejection_reason'
    `);
    
    console.log('Rejection reason column exists:', result.rows.length > 0);
    
    // Check all columns in dpr_supervisor_entries table
    const allColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'dpr_supervisor_entries'
      ORDER BY ordinal_position
    `);
    
    console.log('All columns in dpr_supervisor_entries:');
    allColumns.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type})`);
    });
    
    pool.end();
  } catch (error) {
    console.error('Error checking columns:', error);
    pool.end();
  }
}

checkColumns();