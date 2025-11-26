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

// Function to list all users
async function listUsers() {
  try {
    const result = await pool.query('SELECT user_id, name, email, role FROM users');
    
    console.log('Current users in the database:');
    console.log('--------------------------------');
    result.rows.forEach(user => {
      console.log(`ID: ${user.user_id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
    });
    console.log('--------------------------------');
    console.log(`Total users: ${result.rows.length}`);
    
    // Close the pool
    await pool.end();
  } catch (error) {
    console.error('Error listing users:', error);
    await pool.end();
    process.exit(1);
  }
}

// Run the function
listUsers();