// P6 Token Routes
const express = require('express');
const router = express.Router();
const { generateP6Token, getValidP6Token, clearCachedToken, isTokenValid } = require('../services/p6TokenService');

// Authentication middleware will be passed from server.js
let authenticateToken;

const setPool = (pool, authMiddleware) => {
    authenticateToken = authMiddleware;
};

/**
 * POST /api/p6-token/generate
 * Generate a fresh P6 OAuth token (called on user login)
 */
router.post('/generate', (req, res, next) => authenticateToken(req, res, next), async (req, res) => {
    try {
        const tokenData = await generateP6Token();
        res.json({
            success: true,
            message: 'P6 token generated successfully',
            token: tokenData.accessToken,
            expiresIn: tokenData.expiresIn
        });
    } catch (error) {
        console.error('Error generating P6 token:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate P6 token',
            error: error.message
        });
    }
});

/**
 * GET /api/p6-token/current
 * Get the current valid token (uses cache or generates new one)
 */
router.get('/current', (req, res, next) => authenticateToken(req, res, next), async (req, res) => {
    try {
        const token = await getValidP6Token();
        res.json({
            success: true,
            token: token,
            isValid: isTokenValid()
        });
    } catch (error) {
        console.error('Error getting P6 token:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get P6 token',
            error: error.message
        });
    }
});

/**
 * POST /api/p6-token/refresh
 * Force refresh the P6 token
 */
router.post('/refresh', (req, res, next) => authenticateToken(req, res, next), async (req, res) => {
    try {
        clearCachedToken();
        const tokenData = await generateP6Token();
        res.json({
            success: true,
            message: 'P6 token refreshed successfully',
            token: tokenData.accessToken,
            expiresIn: tokenData.expiresIn
        });
    } catch (error) {
        console.error('Error refreshing P6 token:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to refresh P6 token',
            error: error.message
        });
    }
});

/**
 * GET /api/p6-token/status
 * Check token status
 */
router.get('/status', (req, res, next) => authenticateToken(req, res, next), (req, res) => {
    res.json({
        success: true,
        isValid: isTokenValid()
    });
});

module.exports = { router, setPool };

