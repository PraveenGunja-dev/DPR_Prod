const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5431,
  database: 'postgres',
  user: 'postgres',
  password: 'Prvn@3315',
});

async function checkUsers() {
  try {
    const result = await pool.query('SELECT user_id, name, email, role FROM users');
    console.log('Users in database:');
    console.log(JSON.stringify(result.rows, null, 2));
    
    // Check submitted entries with user details
    const entries = await pool.query(`
      SELECT dse.id, dse.sheet_type, dse.status, dse.project_id, u.name, u.email, u.role
      FROM dpr_supervisor_entries dse
      JOIN users u ON dse.supervisor_id = u.user_id
      WHERE dse.status = 'submitted_to_pm'
    `);
    console.log('\nSubmitted entries with user details:');
    console.log(JSON.stringify(entries.rows, null, 2));
    
    pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    pool.end();
  }
}

checkUsers();
