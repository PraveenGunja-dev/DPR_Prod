const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5431,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Prvn@3315',
});

async function checkData() {
  try {
    console.log('Checking database data...\n');
    
    // Check all entries
    const allEntries = await pool.query('SELECT id, supervisor_id, project_id, sheet_type, status, entry_date, submitted_at FROM dpr_supervisor_entries ORDER BY updated_at DESC');
    console.log(`Total entries in database: ${allEntries.rows.length}`);
    
    if (allEntries.rows.length > 0) {
      console.log('\nAll entries:');
      allEntries.rows.forEach(entry => {
        console.log(`  ID: ${entry.id}, Sheet: ${entry.sheet_type}, Status: ${entry.status}, Date: ${entry.entry_date}, Submitted: ${entry.submitted_at}`);
      });
    }
    
    // Check submitted entries
    const submitted = await pool.query('SELECT COUNT(*) FROM dpr_supervisor_entries WHERE status = \'submitted_to_pm\'');
    console.log(`\nSubmitted to PM: ${submitted.rows[0].count}`);
    
    // Check approved entries
    const approved = await pool.query('SELECT COUNT(*) FROM dpr_supervisor_entries WHERE status = \'approved_by_pm\'');
    console.log(`Approved by PM: ${approved.rows[0].count}`);
    
    // Check draft entries
    const draft = await pool.query('SELECT COUNT(*) FROM dpr_supervisor_entries WHERE status = \'draft\'');
    console.log(`Draft: ${draft.rows[0].count}`);
    
    // Check rejected entries
    const rejected = await pool.query('SELECT COUNT(*) FROM dpr_supervisor_entries WHERE status = \'rejected_by_pm\'');
    console.log(`Rejected: ${rejected.rows[0].count}`);
    
    pool.end();
  } catch (error) {
    console.error('Error:', error);
    pool.end();
  }
}

checkData();
