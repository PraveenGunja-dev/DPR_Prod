const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5431,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Prvn@3315',
});

async function addColumn() {
  try {
    console.log('Adding rejection_reason column to dpr_supervisor_entries table...');
    
    // Add the rejection_reason column
    await pool.query(`
      ALTER TABLE dpr_supervisor_entries 
      ADD COLUMN IF NOT EXISTS rejection_reason TEXT
    `);
    
    console.log('Column added successfully!');
    
    // Verify the column was added
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'dpr_supervisor_entries' 
      AND column_name = 'rejection_reason'
    `);
    
    console.log('Rejection reason column exists:', result.rows.length > 0);
    
    pool.end();
  } catch (error) {
    console.error('Error adding column:', error);
    pool.end();
  }
}

addColumn();