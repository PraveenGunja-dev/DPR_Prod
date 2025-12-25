// server/services/oracleP6AuthService.js
// Oracle P6 Authentication Service - Handles token generation and management

const axios = require('axios');

class OracleP6AuthService {
  constructor() {
    this.baseUrl = process.env.ORACLE_P6_BASE_URL || 'https://sin1.p6.oraclecloud.com/adani/stage/p6ws';
    this.authToken = process.env.ORACLE_P6_AUTH_TOKEN || 'YWdlbC5mb3JlY2FzdGluZ0BhZGFuaS5jb206VGhhbmt5b3VAMWEyYjNj';
    this.tokenExpiry = parseInt(process.env.ORACLE_P6_TOKEN_EXPIRY || '3600', 10);
    
    // Token cache
    this.cachedToken = null;
    this.tokenExpiresAt = null;
  }

  /**
   * Generate access token from Oracle P6 API
   * @returns {Promise<Object>} Token object with accessToken and expiresAt
   */
  async generateToken() {
    try {
      console.log('Generating Oracle P6 access token...');
      
      const response = await axios.post(
        `${this.baseUrl}/oauth/token`,
        null, // No body needed
        {
          headers: {
            'authToken': this.authToken,
            'token_exp': this.tokenExpiry.toString()
          },
          timeout: 10000 // 10 second timeout
        }
      );

      console.log('Oracle P6 token generated successfully');
      
      // Cache the token
      this.cachedToken = response.data.access_token || response.data.token || response.data;
      this.tokenExpiresAt = Date.now() + (this.tokenExpiry * 1000);

      return {
        accessToken: this.cachedToken,
        expiresAt: this.tokenExpiresAt,
        expiresIn: this.tokenExpiry
      };
    } catch (error) {
      console.error('Error generating Oracle P6 token:', error.message);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        throw new Error(`Oracle P6 API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        throw new Error('Oracle P6 API is not reachable. Please check network connection.');
      } else {
        throw new Error(`Token generation failed: ${error.message}`);
      }
    }
  }

  /**
   * Get valid access token (from cache or generate new)
   * @returns {Promise<string>} Valid access token
   */
  async getValidToken() {
    // Check if we have a cached token that's still valid
    if (this.cachedToken && this.tokenExpiresAt) {
      const timeUntilExpiry = this.tokenExpiresAt - Date.now();
      
      // If token expires in more than 5 minutes, use cached token
      if (timeUntilExpiry > 300000) {
        console.log('Using cached Oracle P6 token');
        return this.cachedToken;
      }
    }

    // Generate new token
    console.log('Cached token expired or not available, generating new token...');
    const tokenData = await this.generateToken();
    return tokenData.accessToken;
  }

  /**
   * Invalidate cached token (force refresh on next request)
   */
  invalidateToken() {
    console.log('Invalidating cached Oracle P6 token');
    this.cachedToken = null;
    this.tokenExpiresAt = null;
  }

  /**
   * Test token generation
   * @returns {Promise<boolean>} True if token generation successful
   */
  async testConnection() {
    try {
      const tokenData = await this.generateToken();
      console.log('Oracle P6 connection test successful');
      console.log('Token expires in:', tokenData.expiresIn, 'seconds');
      return true;
    } catch (error) {
      console.error('Oracle P6 connection test failed:', error.message);
      return false;
    }
  }
}

// Export singleton instance
const authService = new OracleP6AuthService();

module.exports = {
  authService,
  OracleP6AuthService,
  generateToken: () => authService.generateToken(),
  getValidToken: () => authService.getValidToken(),
  invalidateToken: () => authService.invalidateToken(),
  testConnection: () => authService.testConnection()
};
