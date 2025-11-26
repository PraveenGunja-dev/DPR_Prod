const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('Testing database connection with these credentials:');
console.log('Host:', process.env.DB_HOST);
console.log('Port:', process.env.DB_PORT);
console.log('Database:', process.env.DB_NAME);
console.log('User:', process.env.DB_USER);

// PostgreSQL connection pool with timeout
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectionTimeoutMillis: 5000, // 5 second timeout
});

// Test database connection
console.log('Attempting to connect to database...');
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.message);
    console.error('Error code:', err.code);
  } else {
    console.log('Database connected successfully');
    console.log('Current time from database:', res.rows[0].now);
  }
  // Close the pool
  pool.end();
});

// Add a timeout to exit the script if it hangs
setTimeout(() => {
  console.log('Test timed out after 10 seconds');
  process.exit(1);
}, 10000);