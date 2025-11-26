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

// Function to create a dummy project
async function createDummyProject() {
  try {
    console.log('Creating dummy project...');
    
    const result = await pool.query(`
      INSERT INTO projects 
      (name, location, status, progress, plan_start, plan_end)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, location, status, progress, plan_start, plan_end
    `, [
      'Dummy Project', 
      'Test Location', 
      'planning', 
      0, 
      '2025-02-01', 
      '2025-11-30'
    ]);
    
    console.log('Dummy project created successfully:');
    console.log(result.rows[0]);
    
    // Close the pool
    await pool.end();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error creating dummy project:', error);
    await pool.end();
    process.exit(1);
  }
}

// Run the function
createDummyProject();