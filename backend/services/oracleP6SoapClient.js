// server/services/oracleP6SoapClient.js
// Oracle P6 SOAP Web Services Client - Uses SOAP to interact with P6 services

const axios = require('axios');

class OracleP6SoapClient {
    constructor() {
        this.baseUrl = process.env.ORACLE_P6_BASE_URL || 'https://sin1.p6.oraclecloud.com/adani/stage/p6ws/services';
        this.projectServiceUrl = `${this.baseUrl}/ProjectService`;
        this.activityServiceUrl = `${this.baseUrl}/ActivityService`;
        this.token = process.env.ORACLE_P6_AUTH_TOKEN || null;
    }

    /**
     * Set the OAuth token for authentication
     * @param {string} token - OAuth Bearer token
     */
    setToken(token) {
        this.token = token;
    }

    /**
     * Get current token
     * @returns {string} Current token
     */
    getToken() {
        return this.token;
    }

    /**
     * Parse projects from SOAP XML response
     * @param {string} xml - Raw XML response
     * @returns {Array} Parsed projects
     */
    parseProjectsFromXml(xml) {
        const projects = [];

        // Match Project elements with or without namespace prefix
        const projectRegex = /<(?:ns\d+:|[^:]+:|)Project\s*(?:xmlns[^>]*)?>[\s\S]*?<\/(?:ns\d+:|[^:]+:|)Project>/gi;
        const projectMatches = xml.match(projectRegex) || [];

        for (const projectXml of projectMatches) {
            const project = {};

            // Extract field values - handles namespaced elements
            const fieldRegex = /<(?:ns\d+:|[^:]+:|)(\w+)(?:\s[^>]*)?>([^<]*)<\/(?:ns\d+:|[^:]+:|)\1>/gi;
            let match;

            while ((match = fieldRegex.exec(projectXml)) !== null) {
                const [, fieldName, value] = match;
                if (fieldName.toLowerCase() !== 'project') {
                    project[fieldName] = value;
                }
            }

            if (Object.keys(project).length > 0) {
                projects.push(project);
            }
        }

        return projects;
    }

    /**
     * Parse activities from SOAP XML response
     * @param {string} xml - Raw XML response
     * @returns {Array} Parsed activities
     */
    parseActivitiesFromXml(xml) {
        const activities = [];

        // Match Activity elements with or without namespace prefix
        const activityRegex = /<(?:ns\d+:|[^:]+:|)Activity\s*(?:xmlns[^>]*)?>[\s\S]*?<\/(?:ns\d+:|[^:]+:|)Activity>/gi;
        const activityMatches = xml.match(activityRegex) || [];

        for (const activityXml of activityMatches) {
            const activity = {};

            const fieldRegex = /<(?:ns\d+:|[^:]+:|)(\w+)(?:\s[^>]*)?>([^<]*)<\/(?:ns\d+:|[^:]+:|)\1>/gi;
            let match;

            while ((match = fieldRegex.exec(activityXml)) !== null) {
                const [, fieldName, value] = match;
                if (fieldName.toLowerCase() !== 'activity') {
                    activity[fieldName] = value;
                }
            }

            if (Object.keys(activity).length > 0) {
                activities.push(activity);
            }
        }

        return activities;
    }

    /**
     * Read projects from Oracle P6
     * @param {Array<string>} fields - Fields to retrieve
     * @param {string} filter - Optional filter expression
     * @returns {Promise<Array>} Array of projects
     */
    async readProjects(fields = ['ObjectId', 'Id', 'Name', 'Status'], filter = null) {
        if (!this.token) {
            throw new Error('OAuth token not set. Set ORACLE_P6_AUTH_TOKEN environment variable or call setToken().');
        }

        const fieldElements = fields.map(field => `<Field>${field}</Field>`).join('\n      ');
        const filterElement = filter ? `<Filter>${filter}</Filter>` : '';

        const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:v2="http://xmlns.oracle.com/Primavera/P6/WS/Project/V2">
  <soapenv:Header/>
  <soapenv:Body>
    <v2:ReadProjects>
      ${fieldElements}
      ${filterElement}
    </v2:ReadProjects>
  </soapenv:Body>
</soapenv:Envelope>`;

        console.log(`[P6 SOAP] Fetching projects from ${this.projectServiceUrl}`);

        try {
            const response = await axios.post(this.projectServiceUrl, envelope, {
                headers: {
                    'Content-Type': 'text/xml; charset=utf-8',
                    'SOAPAction': 'ReadProjects',
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'text/xml, application/xml'
                },
                timeout: 60000
            });

            const projects = this.parseProjectsFromXml(response.data);
            console.log(`[P6 SOAP] Retrieved ${projects.length} projects`);
            return projects;

        } catch (error) {
            console.error('[P6 SOAP] ReadProjects Error:', error.message);
            throw error;
        }
    }

    /**
     * Read activities from Oracle P6
     * @param {Array<string>} fields - Fields to retrieve
     * @param {number} projectObjectId - Optional project filter
     * @returns {Promise<Array>} Array of activities
     */
    async readActivities(fields = ['ObjectId', 'Id', 'Name', 'Status'], projectObjectId = null) {
        if (!this.token) {
            throw new Error('OAuth token not set. Set ORACLE_P6_AUTH_TOKEN environment variable or call setToken().');
        }

        const fieldElements = fields.map(field => `<Field>${field}</Field>`).join('\n      ');
        const filterElement = projectObjectId ? `<Filter>ProjectObjectId = ${projectObjectId}</Filter>` : '';

        const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:v1="http://xmlns.oracle.com/Primavera/P6/WS/Activity/V1">
  <soapenv:Header/>
  <soapenv:Body>
    <v1:ReadActivities>
      ${fieldElements}
      ${filterElement}
    </v1:ReadActivities>
  </soapenv:Body>
</soapenv:Envelope>`;

        console.log(`[P6 SOAP] Fetching activities from ${this.activityServiceUrl}`);

        try {
            const response = await axios.post(this.activityServiceUrl, envelope, {
                headers: {
                    'Content-Type': 'text/xml; charset=utf-8',
                    'SOAPAction': 'ReadActivities',
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'text/xml, application/xml'
                },
                timeout: 60000
            });

            const activities = this.parseActivitiesFromXml(response.data);
            console.log(`[P6 SOAP] Retrieved ${activities.length} activities`);
            return activities;

        } catch (error) {
            console.error('[P6 SOAP] ReadActivities Error:', error.message);
            throw error;
        }
    }
}

// Export singleton instance
const soapClient = new OracleP6SoapClient();

module.exports = { OracleP6SoapClient, soapClient };
