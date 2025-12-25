/**
 * Redis Cache Client with In-Memory Fallback
 * Production-ready: Uses Redis when available, falls back to in-memory for development
 */

const { createClient } = require('redis');

// In-memory cache fallback
class InMemoryCache {
    constructor() {
        this.cache = new Map();
        this.ttls = new Map();
    }

    async get(key) {
        if (!this.cache.has(key)) {
            return null;
        }

        const ttl = this.ttls.get(key);
        if (ttl && Date.now() > ttl) {
            this.cache.delete(key);
            this.ttls.delete(key);
            return null;
        }

        return this.cache.get(key);
    }

    async set(key, value, options = {}) {
        this.cache.set(key, value);
        if (options.EX) {
            this.ttls.set(key, Date.now() + (options.EX * 1000));
        }
        return 'OK';
    }

    async del(key) {
        this.cache.delete(key);
        this.ttls.delete(key);
        return 1;
    }

    async flushAll() {
        this.cache.clear();
        this.ttls.clear();
        return 'OK';
    }

    async keys(pattern = '*') {
        if (pattern === '*') {
            return Array.from(this.cache.keys());
        }
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return Array.from(this.cache.keys()).filter(key => regex.test(key));
    }

    async quit() {
        return 'OK';
    }
}

// State - start with in-memory cache immediately (safe default)
let cache = new InMemoryCache();
let redisClient = null;
let isRedisAvailable = false;

// Try to upgrade to Redis in background
async function tryConnectRedis() {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = process.env.REDIS_PORT || 6379;
    const redisPassword = process.env.REDIS_PASSWORD || undefined;

    try {
        // Create Redis client
        const client = createClient({
            socket: {
                host: redisHost,
                port: parseInt(redisPort),
                connectTimeout: 3000, // 3 second timeout
            },
            password: redisPassword,
        });

        // Error handler
        client.on('error', (err) => {
            console.warn('Redis error:', err.message);
        });

        // Connect to Redis
        await client.connect();

        // Test connection
        await client.ping();

        console.log(`✓ Redis connected successfully (${redisHost}:${redisPort})`);

        // Upgrade to Redis
        redisClient = client;
        cache = client;
        isRedisAvailable = true;

    } catch (error) {
        console.warn(`Redis not available: ${error.message}. Using in-memory cache.`);
        // Keep using in-memory cache
    }
}

// Start Redis connection attempt (non-blocking)
tryConnectRedis().catch(err => {
    console.warn('Redis initialization failed:', err.message);
});

module.exports = {
    cache,
    redisClient,
    isRedisAvailable,
    // For code that needs to ensure Redis is tried first
    ensureInitialized: tryConnectRedis,
};
