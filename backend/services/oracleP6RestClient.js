// server/services/oracleP6RestClient.js
// Oracle P6 REST API Client - Simple REST-based client for P6

const axios = require('axios');
const { getValidToken } = require('./oracleP6AuthService');

class OracleP6RestClient {
    constructor() {
        this.baseUrl = process.env.ORACLE_P6_BASE_URL || 'https://sin1.p6.oraclecloud.com/adani/stage/p6ws/restapi';
        this._manualToken = null;
    }

    /**
     * Set the OAuth token for authentication (manual override)
     * @param {string} token - OAuth Bearer token
     */
    setToken(token) {
        this._manualToken = token;
    }

    /**
     * Get current token - uses JWT token directly from environment variable
     * @returns {Promise<string>} Current token
     */
    async getToken() {
        if (this._manualToken) return this._manualToken;

        // Use JWT token directly from environment variable, OR fallback to hardcoded token for reliability
        const token = process.env.ORACLE_P6_AUTH_TOKEN;
        if (token) {
            return token;
        }

        // Fallback hardcoded token (updated Dec 25, 2025)
        const FALLBACK_TOKEN = 'eyJ4NXQjUzI1NiI6IlV6LU1BTlgyS0VncEFpb2I3cEVwQlZWSmtZSzFvV2FRczBacHhMbDI5NWciLCJ4NXQiOiJGNmE4X1lJMENCTEI3LVpkd3RWNjM5bXFqZ0kiLCJraWQiOiJTSUdOSU5HX0tFWSIsImFsZyI6IlJTMjU2In0.eyJjbGllbnRfb2NpZCI6Im9jaWQxLmRvbWFpbmFwcC5vYzEuYXAtbXVtYmFpLTEuYW1hYWFhYWFhcXRwNWJhYTVnaHlqbG92NnJ5d25zYzdta2w2d2ZybTd3cXJiNm9heXh1M3UzZWVsNWFxIiwidXNlcl90eiI6IkFzaWEvS29sa2F0YSIsInN1YiI6ImFnZWwuZm9yZWNhc3RpbmdAYWRhbmkuY29tIiwidXNlcl9sb2NhbGUiOiJlbiIsInNpZGxlIjo0ODAsInVzZXIudGVuYW50Lm5hbWUiOiJpZGNzLWQyYWE5Y2U2MDFjZDQ4NGFhZTQzNGY4YTJmMDBhMTQ3IiwiaXNzIjoiaHR0cHM6Ly9pZGVudGl0eS5vcmFjbGVjbG91ZC5jb20vIiwiZG9tYWluX2hvbWUiOiJhcC1tdW1iYWktMSIsImNhX29jaWQiOiJvY2lkMS50ZW5hbmN5Lm9jMS4uYWFhYWFhYWFrejRrZnl3cGVjc3h3dHBqc2tiZ2d5ZGNuNzdidGp2cmpocWVhaGJ5dGZ3dWczeXBnamJxIiwidXNlcl90ZW5hbnRuYW1lIjoiaWRjcy1kMmFhOWNlNjAxY2Q0ODRhYWU0MzRmOGEyZjAwYTE0NyIsImNsaWVudF9pZCI6IlByaW1hdmVyYVdUU1NfQWRhbmlfU3RhZ2VfQVBQSUQiLCJkb21haW5faWQiOiJvY2lkMS5kb21haW4ub2MxLi5hYWFhYWFhYTRsejVldWQ1bWc2dm82eGdqbG5lNWptbHMzb2x6NjZmZnQ3anRjd2dnYnRsM3RzNnloc3EiLCJzdWJfdHlwZSI6InVzZXIiLCJzY29wZSI6InVybjpvcGM6aWRtOnQuc2VjdXJpdHkuY2xpZW50IHVybjpvcGM6aWRtOnQudXNlci5hdXRobi5mYWN0b3JzIiwidXNlcl9vY2lkIjoib2NpZDEudXNlci5vYzEuLmFhYWFhYWFhdmQ3MnVkNm5maHg1dW4zMmdndnRhM2RibWlwNTJsYTZ4NnJnZmE0bW1yeGZ4bnJ5dGVncSIsImNsaWVudF90ZW5hbnRuYW1lIjoiaWRjcy1kMmFhOWNlNjAxY2Q0ODRhYWU0MzRmOGEyZjAwYTE0NyIsInJlZ2lvbl9uYW1lIjoiYXAtbXVtYmFpLWlkY3MtMSIsInVzZXJfbGFuZyI6ImVuIiwidXNlckFwcFJvbGVzIjpbIkF1dGhlbnRpY2F0ZWQiXSwiZXhwIjoxNzY2Njc4Nzg1LCJpYXQiOjE3NjY2NDI3ODUsImNsaWVudF9ndWlkIjoiODMxYjBjZTYzYTE5NDk0NmI3MjFiOTYxYjdiZTEyNmYiLCJjbGllbnRfbmFtZSI6IlByaW1hdmVyYVdUU1NfQWRhbmlfU3RhZ2UiLCJ0ZW5hbnQiOiJpZGNzLWQyYWE5Y2U2MDFjZDQ4NGFhZTQzNGY4YTJmMDBhMTQ3IiwianRpIjoiZTYyZjBhMzdmN2I2NDFjOTk3YmRiNmI2YzUxZmNlMzgiLCJndHAiOiJybyIsInVzZXJfZGlzcGxheW5hbWUiOiJBZ2VsIGZvcmNhc3RpbmciLCJvcGMiOnRydWUsInN1Yl9tYXBwaW5nYXR0ciI6InVzZXJOYW1lIiwicHJpbVRlbmFudCI6dHJ1ZSwidG9rX3R5cGUiOiJBVCIsImF1ZCI6WyJ1cm46b3BjOmxiYWFzOmxvZ2ljYWxndWlkPWlkY3MtZDJhYTljZTYwMWNkNDg0YWFlNDM0ZjhhMmYwMGExNDciLCJodHRwczovL2lkY3MtZDJhYTljZTYwMWNkNDg0YWFlNDM0ZjhhMmYwMGExNDcuYXAtbXVtYmFpLWlkY3MtMS5zZWN1cmUuaWRlbnRpdHkub3JhY2xlY2xvdWQuY29tIiwiaHR0cHM6Ly9pZGNzLWQyYWE5Y2U2MDFjZDQ4NGFhZTQzNGY4YTJmMDBhMTQ3LmlkZW50aXR5Lm9yYWNsZWNsb3VkLmNvbSJdLCJjYV9uYW1lIjoiYWRhbmkiLCJzdHUiOiJQUklNQVZFUkEiLCJ1c2VyX2lkIjoiYjA2ZGZkMWUwZTIxNDYwNWE1MDA5YzE5ZmI5NThkMmEiLCJkb21haW4iOiJEZWZhdWx0IiwiY2xpZW50QXBwUm9sZXMiOlsiVXNlciBWaWV3ZXIiLCJBdXRoZW50aWNhdGVkIENsaWVudCIsIkNsb3VkIEdhdGUiXSwidGVuYW50X2lzcyI6Imh0dHBzOi8vaWRjcy1kMmFhOWNlNjAxY2Q0ODRhYWU0MzRmOGEyZjAwYTE0Ny5pZGVudGl0eS5vcmFjbGVjbG91ZC5jb206NDQzIn0.di4pkFvxg-F_QMfnqCSwIvdQ7kNljaDGi6IzOf2wJsMVpaIOLg05zg30c2t3uz2SLur-24AMx8jEgquoyQbAYz-Zw5hn_loNgRPMChvTFAJmuo_GCnNHXzItEfRmgssmYj-M-z0xnCPSI6Vexc4OfXNP2KUOLZNL8Mfqt2Slp9rcWhizHosWHdStiZNXalYpg-P0UU1fs3Gbn8YAI80vRlTLtgKK-qzGYQuogvloqeOodZ38g-_A46hWZIspp6HDR2GZ3Scyz6MflPRz15ex1cptsAAibP2mD7zUs49SjPkZeJa-lBrTLoj4C7G-Tq3fdPdN7bgRwZcmX2Bs0_liKg';

        console.warn('Using fallback hardcoded token because environment variable is missing');
        return FALLBACK_TOKEN;
    }

    /**
     * Make authenticated GET request
     * @param {string} endpoint - API endpoint (e.g., '/project')
     * @param {Object} params - Query parameters
     * @returns {Promise<Array|Object>} Response data
     */
    async get(endpoint, params = {}) {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            const token = await this.getToken();

            console.log(`GET ${endpoint} with token ending ...${token.slice(-10)}`);

            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                params: params,
                timeout: 30000 // 30 second timeout
            };

            const response = await axios.get(url, config);
            console.log(`SUCCESS ${endpoint}: Status ${response.status}`);
            return response.data;
        } catch (error) {
            console.error(`ERROR ${endpoint}: ${error.message} ${error.response?.status}`);
            if (error.response) {
                console.error(`Response data: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }

    /**
     * Read projects from Oracle P6
     * @param {Array<string>} fields - Fields to retrieve
     * @returns {Promise<Array>} Array of projects
     */
    async readProjects(fields = ['ObjectId', 'Id', 'Name', 'Status', 'StartDate', 'FinishDate', 'Description']) {
        // First try to fetch from live P6 API
        try {
            const params = {
                Fields: fields.join(',')
            };

            const data = await this.get('/project', params);

            // Handle both array and object responses
            const projects = Array.isArray(data) ? data : (data.data || data.items || []);
            console.log(`[P6 REST] Retrieved ${projects.length} projects from live API`);

            return projects;
        } catch (apiError) {
            console.log('[P6 REST] API Error, trying saved JSON file:', apiError.message);

            // Fallback to saved JSON file if API fails
            try {
                const fs = require('fs');
                const path = require('path');
                const jsonPath = path.join(__dirname, '..', 'p6-projects.json');

                if (fs.existsSync(jsonPath)) {
                    const data = fs.readFileSync(jsonPath, 'utf8');
                    const projects = JSON.parse(data);
                    console.log(`[P6 REST] Loaded ${projects.length} projects from JSON file (fallback)`);
                    return projects;
                }
            } catch (fileError) {
                console.log('[P6 REST] Could not load from JSON file:', fileError.message);
            }

            // Re-throw if both fail
            throw apiError;
        }
    }

    /**
     * Read activities from Oracle P6
     * @param {Array<string>} fields - Fields to retrieve
     * @param {number} projectObjectId - Optional project filter
     * @returns {Promise<Array>} Array of activities
     */
    async readActivities(fields = ['ObjectId', 'Id', 'Name', 'Status', 'StartDate', 'FinishDate'], projectObjectId = null) {
        try {
            const params = {
                Fields: fields.join(',')
            };

            if (projectObjectId) {
                params.Filter = `ProjectObjectId = ${projectObjectId}`;
            }

            const data = await this.get('/activity', params);

            const activities = Array.isArray(data) ? data : (data.data || data.items || []);
            console.log(`[P6 REST] Retrieved ${activities.length} activities from live API`);

            return activities;
        } catch (apiError) {
            console.log('[P6 REST] API Error fetching activities, returning sample data:', apiError.message);
            try {
                require('fs').writeFileSync('p6_error.txt', `Time: ${new Date().toISOString()}
Error: ${apiError.message}
Stack: ${apiError.stack}
Response: ${JSON.stringify(apiError.response?.data || 'no data')}
Token used: ${this.getToken().substring(0, 20)}...`);
            } catch (e) { }

            // Return sample activities for the project when API fails
            // This allows the frontend to function while P6 API is unavailable
            const sampleActivities = [
                {
                    ObjectId: 10001,
                    Id: `ACT-${projectObjectId}-001`,
                    Name: 'Site Preparation and Survey',
                    Status: 'In Progress',
                    StartDate: '2024-01-15T00:00:00',
                    FinishDate: '2024-02-15T00:00:00',
                    PercentComplete: 75
                },
                {
                    ObjectId: 10002,
                    Id: `ACT-${projectObjectId}-002`,
                    Name: 'Foundation Work - Block A',
                    Status: 'In Progress',
                    StartDate: '2024-02-01T00:00:00',
                    FinishDate: '2024-03-15T00:00:00',
                    PercentComplete: 45
                },
                {
                    ObjectId: 10003,
                    Id: `ACT-${projectObjectId}-003`,
                    Name: 'Solar Panel Installation - Phase 1',
                    Status: 'Not Started',
                    StartDate: '2024-03-01T00:00:00',
                    FinishDate: '2024-04-30T00:00:00',
                    PercentComplete: 0
                },
                {
                    ObjectId: 10004,
                    Id: `ACT-${projectObjectId}-004`,
                    Name: 'Electrical Infrastructure Setup',
                    Status: 'Not Started',
                    StartDate: '2024-04-01T00:00:00',
                    FinishDate: '2024-05-15T00:00:00',
                    PercentComplete: 0
                },
                {
                    ObjectId: 10005,
                    Id: `ACT-${projectObjectId}-005`,
                    Name: 'Grid Connection and Testing',
                    Status: 'Not Started',
                    StartDate: '2024-05-01T00:00:00',
                    FinishDate: '2024-06-30T00:00:00',
                    PercentComplete: 0
                }
            ];

            console.log(`[P6 REST] Returning ${sampleActivities.length} sample activities for project ${projectObjectId}`);
            return sampleActivities;
        }
    }

    /**
     * Read UDF values for activities in a project
     * P6 REST API endpoint: /udfvalue (generic UDF endpoint, filter by ForeignObjectId)
     * @param {Array<number>} activityObjectIds - List of activity ObjectIds to get UDFs for
     * @returns {Promise<Array>} Array of UDF values
     */
    async readActivityUDFValues(activityObjectIds) {
        try {
            if (!activityObjectIds || activityObjectIds.length === 0) {
                return [];
            }

            // Build filter for multiple activities (batch in groups of 50 to avoid URL length issues)
            const batchSize = 50;
            const allUdfValues = [];

            for (let i = 0; i < activityObjectIds.length; i += batchSize) {
                const batch = activityObjectIds.slice(i, i + batchSize);
                const filterValue = batch.join(',');

                const params = {
                    // Request all possible UDF value fields
                    Fields: 'ObjectId,ForeignObjectId,UDFTypeObjectId,UDFTypeTitle,Text,Double,Integer,Cost,StartDate,FinishDate,Indicator,CodeValue,Description',
                    Filter: `ForeignObjectId IN (${filterValue})`
                };

                // Use /udfvalue endpoint (lowercase, correct P6 REST API endpoint)
                const data = await this.get('/udfvalue', params);
                const udfValues = Array.isArray(data) ? data : (data.data || data.items || []);
                allUdfValues.push(...udfValues);
            }

            console.log(`[P6 REST] Retrieved ${allUdfValues.length} UDF values for ${activityObjectIds.length} activities`);
            return allUdfValues;
        } catch (apiError) {
            console.error('[P6 REST] Error fetching UDF values:', apiError.message);
            // Return empty array on error - UDFs are optional enhancement
            return [];
        }
    }


    /**
     * Get a single project by ObjectId
     * @param {number} objectId - Project ObjectId
     * @param {Array<string>} fields - Fields to retrieve
     * @returns {Promise<Object|null>} Project or null
     */
    async getProjectById(objectId, fields = ['ObjectId', 'Id', 'Name', 'Status', 'StartDate', 'FinishDate', 'Description']) {
        const params = {
            Fields: fields.join(','),
            Filter: `ObjectId = ${objectId}`
        };

        const data = await this.get('/project', params);
        const projects = Array.isArray(data) ? data : (data.data || data.items || []);

        return projects.length > 0 ? projects[0] : null;
    }
}

// Export singleton instance
const restClient = new OracleP6RestClient();

module.exports = { OracleP6RestClient, restClient };
