// server/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// We'll pass the pool from server.js when registering the routes
let pool;

const router = express.Router();

// Function to set the pool and middleware (called from server.js)
const setPool = (dbPool, authMiddleware) => {
  pool = dbPool;
  authenticateToken = authMiddleware;
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
};

// Middleware to check if user is PMAG
const isPMAG = (req, res, next) => {
  console.log("isPMAG middleware - req.user:", req.user); // Debug log
  if (req.user && req.user.role === 'PMAG') {
    console.log("User is PMAG, allowing access"); // Debug log
    next();
  } else {
    console.log("User is not PMAG, denying access"); // Debug log
    res.status(403).json({ message: 'Access denied. PMAG privileges required.' });
  }
};

// We'll pass the authenticateToken middleware from server.js when registering the routes
let authenticateToken;

// Register a new user (no authentication required)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        message: 'All fields are required: name, email, password, role' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Invalid email format' 
      });
    }

    // Validate password strength (at least 8 characters)
    if (password.length < 8) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long' 
      });
    }

    // Validate role
    const validRoles = ['supervisor', 'Site PM', 'PMAG', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        message: 'Invalid role. Must be one of: ' + validRoles.join(', ')
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user into database
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING user_id, name, email, role',
      [name, email, hashedPassword, role]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'adani_flow_secret_key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login user (no authentication required)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Invalid email format' 
      });
    }

    // Find user by email
    const result = await pool.query(
      'SELECT user_id, name, email, password, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'adani_flow_secret_key',
      { expiresIn: '24h' }
    );

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user profile (requires authentication)
const getUserProfile = async (req, res) => {
  try {
    // Get user ID from authenticated request
    const userId = req.user.userId;

    // Find user by ID
    const result = await pool.query(
      'SELECT user_id, name, email, role FROM users WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    res.status(200).json({
      message: 'Profile fetched successfully',
      user
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

router.get('/profile', (req, res, next) => {
  if (authenticateToken) {
    authenticateToken(req, res, next);
  } else {
    next();
  }
}, getUserProfile);

// Get all supervisors (requires authentication and PMAG role)
router.get('/supervisors', (req, res, next) => {
  if (authenticateToken) {
    authenticateToken(req, res, () => {
      isPMAG(req, res, next);
    });
  } else {
    next();
  }
}, async (req, res) => {
  try {
    console.log("Fetching supervisors for user:", req.user); // Debug log
    // Get all users with supervisor role
    const result = await pool.query(
      'SELECT user_id, name, email, role FROM users WHERE role = $1 ORDER BY name',
      ['supervisor']
    );

    console.log("Supervisors found:", result.rows); // Debug log
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Fetch supervisors error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Reset users - delete all and create admin (admin only)
router.post('/reset-users', isAdmin, async (req, res) => {
  try {
    // Delete all existing users
    await pool.query('DELETE FROM users');
    
    // Create admin user
    const adminPassword = 'admin123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING user_id, name, email, role',
      ['Admin User', 'admin@adani.com', hashedPassword, 'admin']
    );

    const adminUser = result.rows[0];

    res.status(200).json({
      message: 'Users reset successfully. Admin user created.',
      admin: {
        user_id: adminUser.user_id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        password: adminPassword // Note: In a real application, never send passwords in responses
      }
    });
  } catch (error) {
    console.error('Reset users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = { router, setPool, getUserProfile };