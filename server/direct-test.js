const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function testQuery() {
  try {
    console.log('Testing database query for PM entries...\n');
    
    // Simulate what the PM API endpoint does
    const result = await pool.query(`
      SELECT dse.*, u.name as supervisor_name, u.email as supervisor_email
      FROM dpr_supervisor_entries dse
      JOIN users u ON dse.supervisor_id = u.user_id
      WHERE dse.status IN ('submitted_to_pm', 'approved_by_pm', 'rejected_by_pm')
      ORDER BY dse.submitted_at DESC
    `);
    
    console.log(`Found ${result.rows.length} entries\n`);
    
    if (result.rows.length > 0) {
      console.log('Entries:');
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}. ID: ${row.id}, Sheet: ${row.sheet_type}, Status: ${row.status}`);
        console.log(`   Supervisor: ${row.supervisor_name} (${row.supervisor_email})`);
        console.log(`   Submitted: ${row.submitted_at}`);
        console.log('');
      });
    }
    
    pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    pool.end();
  }
}

testQuery();
