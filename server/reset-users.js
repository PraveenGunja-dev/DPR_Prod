const { Pool } = require('pg');
const bcrypt = require('bcrypt');
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

// Function to reset users and create admin
async function resetUsers() {
  try {
    // Delete all existing users
    console.log('Deleting all existing users...');
    await pool.query('DELETE FROM users');
    console.log('All users deleted successfully.');

    // Create admin PMAG user
    console.log('Creating admin PMAG user...');
    const adminPassword = 'admin123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING user_id, name, email, role',
      ['Admin User', 'admin@adani.com', hashedPassword, 'PMAG']
    );

    const adminUser = result.rows[0];
    console.log('Admin user created successfully:');
    console.log('Name:', adminUser.name);
    console.log('Email:', adminUser.email);
    console.log('Role:', adminUser.role);
    console.log('Password:', adminPassword);
    console.log('\n*** IMPORTANT ***');
    console.log('Please change the default password after first login!');
    console.log('******************');

    // Close the pool
    await pool.end();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error resetting users:', error);
    await pool.end();
    process.exit(1);
  }
}

// Run the function
resetUsers();