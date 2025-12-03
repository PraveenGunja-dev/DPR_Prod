const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function testTable() {
  try {
    console.log('Testing if dpr_supervisor_entries table exists...');
    
    // Check if table exists
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'dpr_supervisor_entries'
      );
    `);
    
    const tableExists = result.rows[0].exists;
    console.log('Table exists:', tableExists);
    
    if (tableExists) {
      // Get table structure
      const structure = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'dpr_supervisor_entries'
        ORDER BY ordinal_position;
      `);
      
      console.log('Table structure:');
      structure.rows.forEach(row => {
        console.log(`  ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
      
      // Count rows
      const count = await pool.query('SELECT COUNT(*) FROM dpr_supervisor_entries;');
      console.log(`Row count: ${count.rows[0].count}`);
    } else {
      console.log('Table does not exist');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

testTable();