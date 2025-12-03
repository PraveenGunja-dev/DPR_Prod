// server/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const path = require('path');

// Load environment variables from the root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Log environment variables for debugging (only in development)
if (process.env.NODE_ENV !== 'production') {
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_PORT:', process.env.DB_PORT);
  console.log('DB_NAME:', process.env.DB_NAME);
  console.log('DB_USER:', process.env.DB_USER);
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
  console.log('REFRESH_TOKEN_SECRET:', process.env.REFRESH_TOKEN_SECRET ? 'SET' : 'NOT SET');
}

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Production-ready connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Test database connection
const testDatabaseConnection = () => {
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('Database connection error:', err.message);
      if (process.env.NODE_ENV !== 'production') {
        console.log('Retrying in 5 seconds...');
        setTimeout(testDatabaseConnection, 5000); // Retry after 5 seconds
      }
    } else {
      console.log('Database connected successfully');
    }
  });
};

// Test database connection
testDatabaseConnection();

// Import Redis cache
const { cache } = require('./cache/redisClient');

// Authentication middleware - Oracle P6 API compatible
// Supports both Bearer token (JWT) and session-based authentication
const authenticateToken = (req, res, next) => {
  // Check for Authorization header with Bearer token (JWT)
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];
  
  // If no Bearer token, check for custom token header (Oracle P6 style)
  if (!token) {
    token = req.headers['x-adani-token'] || req.headers['x-p6-token'];
  }
  
  // If still no token, check for token in query parameters (less secure but Oracle P6 compatible)
  if (!token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ 
      message: 'Access token required',
      // Oracle P6 compatible error format
      error: {
        code: 'AUTH_TOKEN_MISSING',
        description: 'Authentication token is required'
      }
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'adani_flow_secret_key', (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Token expired',
          error: {
            code: 'AUTH_TOKEN_EXPIRED',
            description: 'Authentication token has expired'
          }
        });
      }
      return res.status(403).json({ 
        message: 'Invalid token',
        error: {
          code: 'AUTH_TOKEN_INVALID',
          description: 'Authentication token is invalid'
        }
      });
    }
    req.user = user; // Attach the decoded user data to the request object
    next();
  });
};

// Refresh token middleware for refresh token endpoint (doesn't require authentication)
const refreshTokenMiddleware = (req, res, next) => {
  next();
};

// Import routes
const { router: authRoutes, setPool, getUserProfile } = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const projectAssignmentRoutes = require('./routes/projectAssignment');
const activityRoutes = require('./routes/activities');
const dprRoutes = require('./routes/dpr');
const dprSupervisorRoutes = require('./routes/dprSupervisor');

// Set the pool for auth routes
setPool(pool, authenticateToken);

// API routes - Modified to match Oracle P6 API structure
app.use('/project', authenticateToken, projectRoutes);
app.use('/activity', authenticateToken, activityRoutes);
app.use('/project-assignment', authenticateToken, projectAssignmentRoutes);
app.use('/dpr', authenticateToken, dprRoutes);
app.use('/dpr-supervisor', authenticateToken, dprSupervisorRoutes);

// Import individual route handlers
const { router: authRouter } = require('./routes/auth');

// Alternative Oracle P6 compatible login endpoint
app.post('/login', async (req, res, next) => {
  // Find the login route handler in the auth router
  const loginLayer = authRouter.stack.find(layer => 
    layer.route && layer.route.path === '/login' && layer.route.methods.post
  );
  
  if (loginLayer) {
    // Call the login handler directly
    return loginLayer.route.stack[0].handle(req, res, next);
  } else {
    return res.status(404).json({ message: 'Route not found' });
  }
});

// Alternative Oracle P6 compatible register endpoint
app.post('/register', async (req, res, next) => {
  // Find the register route handler in the auth router
  const registerLayer = authRouter.stack.find(layer => 
    layer.route && layer.route.path === '/register' && layer.route.methods.post
  );
  
  if (registerLayer) {
    // Call the register handler directly
    return registerLayer.route.stack[0].handle(req, res, next);
  } else {
    return res.status(404).json({ message: 'Route not found' });
  }
});

// Refresh token endpoint
app.post('/auth/refresh-token', refreshTokenMiddleware, async (req, res, next) => {
  // Find the refresh token route handler in the auth router
  const refreshLayer = authRouter.stack.find(layer => 
    layer.route && layer.route.path === '/refresh-token' && layer.route.methods.post
  );
  
  if (refreshLayer) {
    // Call the refresh token handler directly
    return refreshLayer.route.stack[0].handle(req, res, next);
  } else {
    return res.status(404).json({ message: 'Route not found' });
  }
});

// Oracle P6 compatible profile endpoint
app.get('/auth/profile', authenticateToken, getUserProfile);

// Oracle P6 compatible supervisors endpoint with caching
app.get('/auth/supervisors', authenticateToken, async (req, res) => {
  try {
    // Check if user is PMAG
    if (req.user.role !== 'PMAG') {
      return res.status(403).json({ message: 'Access denied. PMAG privileges required.' });
    }
    
    // Try to get data from cache first
    const cacheKey = 'supervisors_list';
    let supervisors = await cache.get(cacheKey);
    
    if (supervisors) {
      console.log('Returning supervisors from cache');
      return res.status(200).json(supervisors);
    }
    
    // If not in cache, fetch from database
    console.log('Fetching supervisors from database');
    const result = await pool.query(
      'SELECT user_id, name, email, role FROM users WHERE role = $1 ORDER BY name',
      ['supervisor']
    );
    
    // Transform to Oracle P6 format (PascalCase)
    supervisors = result.rows.map(user => ({
      ObjectId: user.user_id,
      Name: user.name,
      Email: user.email,
      Role: user.role
    }));
    
    // Cache the result for 5 minutes
    await cache.set(cacheKey, supervisors, 300);
    
    res.status(200).json(supervisors);
  } catch (error) {
    console.error('Fetch supervisors error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Oracle P6 compatible logout endpoint
app.post('/logout', authenticateToken, (req, res) => {
  // In a real implementation with sessions, we would destroy the session here
  // For JWT, we simply return success as the client should discard the token
  res.status(200).json({ message: 'Logout successful' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    message: 'Server is running', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint for basic server info
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Adani Flow Backend API', 
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { error: err.message })
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, pool, authenticateToken };