// P6 Token Service - Handles OAuth token generation and refresh
const axios = require('axios');

const P6_TOKEN_URL = 'https://sin1.p6.oraclecloud.com/adani/p6ws/oauth/token';
const P6_AUTH_TOKEN = 'YWdlbC5mb3JlY2FzdGluZ0BhZGFuaS5jb206VGhhbmt5b3VAMWEyYjNj';

// In-memory token cache
let cachedToken = null;
let tokenExpiresAt = null;

/**
 * Generate a new P6 OAuth token
 */
async function generateP6Token() {
    try {
        console.log('[P6 Token] Generating new token from Oracle P6...');

        const response = await axios.post(
            P6_TOKEN_URL,
            'grant_type=client_credentials',
            {
                headers: {
                    'Authorization': `Basic ${P6_AUTH_TOKEN}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                timeout: 10000 // 10 second timeout
            }
        );

        const { access_token, token_type, expires_in } = response.data;

        if (!access_token) {
            throw new Error('No access token in response');
        }

        // Cache the token with expiration time (subtract 60 seconds for safety margin)
        cachedToken = access_token;
        const expiresInMs = (expires_in - 60) * 1000;
        tokenExpiresAt = Date.now() + expiresInMs;

        console.log(`[P6 Token] Token generated successfully. Expires in ${expires_in} seconds`);

        return {
            accessToken: access_token,
            tokenType: token_type,
            expiresIn: expires_in
        };
    } catch (error) {
        console.error('[P6 Token] Error generating token:', error.message);
        if (error.response) {
            console.error('[P6 Token] Response status:', error.response.status);
            console.error('[P6 Token] Response data:', error.response.data);
        }
        throw new Error('Failed to generate P6 token: ' + error.message);
    }
}

/**
 * Get a valid P6 token - returns cached token or generates a new one
 */
async function getValidP6Token() {
    // Check if we have a valid cached token
    if (cachedToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
        console.log('[P6 Token] Using cached token');
        return cachedToken;
    }

    // Token expired or doesn't exist, generate a new one
    console.log('[P6 Token] Token expired or missing, generating new token');
    const tokenData = await generateP6Token();
    return tokenData.accessToken;
}

/**
 * Clear cached token (for logout or manual refresh)
 */
function clearCachedToken() {
    console.log('[P6 Token] Clearing cached token');
    cachedToken = null;
    tokenExpiresAt = null;
}

/**
 * Check if token is valid
 */
function isTokenValid() {
    return cachedToken && tokenExpiresAt && Date.now() < tokenExpiresAt;
}

module.exports = {
    generateP6Token,
    getValidP6Token,
    clearCachedToken,
    isTokenValid
};
