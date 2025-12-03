// server/cache/redisClient.js
const redis = require('redis');
const dotenv = require('dotenv');

dotenv.config();

// Flag to track if Redis is available
let isRedisAvailable = false;
let isConnecting = false;

// Create Redis client
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  // Add password if needed
  // password: process.env.REDIS_PASSWORD,
});

// Handle connection events
redisClient.on('connect', () => {
  console.log('Connected to Redis');
  isRedisAvailable = true;
  isConnecting = false;
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
  isRedisAvailable = false;
  isConnecting = false;
});

redisClient.on('ready', () => {
  console.log('Redis client ready');
  isRedisAvailable = true;
  isConnecting = false;
});

redisClient.on('end', () => {
  console.log('Redis connection ended');
  isRedisAvailable = false;
  isConnecting = false;
});

// Connect to Redis
const connectRedis = async () => {
  if (isConnecting || isRedisAvailable) {
    return;
  }
  
  isConnecting = true;
  try {
    await redisClient.connect();
    isRedisAvailable = true;
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
    isRedisAvailable = false;
  } finally {
    isConnecting = false;
  }
};

// Initial connection attempt
connectRedis();

// Utility functions for caching with fallback
const cache = {
  // Get data from cache
  get: async (key) => {
    // If Redis is not available, return null to force fetching from database
    if (!isRedisAvailable) {
      // Try to reconnect
      await connectRedis();
      if (!isRedisAvailable) {
        return null;
      }
    }
    
    try {
      const data = await redisClient.get(key);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Redis get error:', error);
      // Mark Redis as unavailable on error
      isRedisAvailable = false;
      return null;
    }
  },

  // Set data in cache with expiration time (in seconds)
  set: async (key, value, expireTime = 300) => { // Default 5 minutes
    // If Redis is not available, try to reconnect
    if (!isRedisAvailable) {
      await connectRedis();
      if (!isRedisAvailable) {
        return false;
      }
    }
    
    try {
      await redisClient.setEx(key, expireTime, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      // Mark Redis as unavailable on error
      isRedisAvailable = false;
      return false;
    }
  },

  // Delete data from cache
  del: async (key) => {
    // If Redis is not available, try to reconnect
    if (!isRedisAvailable) {
      await connectRedis();
      if (!isRedisAvailable) {
        return false;
      }
    }
    
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Redis delete error:', error);
      // Mark Redis as unavailable on error
      isRedisAvailable = false;
      return false;
    }
  },

  // Clear all cache
  flushAll: async () => {
    // If Redis is not available, try to reconnect
    if (!isRedisAvailable) {
      await connectRedis();
      if (!isRedisAvailable) {
        return false;
      }
    }
    
    try {
      await redisClient.flushAll();
      return true;
    } catch (error) {
      console.error('Redis flushAll error:', error);
      // Mark Redis as unavailable on error
      isRedisAvailable = false;
      return false;
    }
  }
};

module.exports = { redisClient, cache, connectRedis };