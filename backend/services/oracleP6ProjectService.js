// server/services/oracleP6ProjectService.js
// Oracle P6 Project Service - Fetches projects using SOAP web services

const { soapClient } = require('./oracleP6SoapClient');

// Default project fields to retrieve
const DEFAULT_PROJECT_FIELDS = [
    'ObjectId',
    'Id',
    'Name',
    'Description',
    'Status',
    'StartDate',
    'FinishDate',
    'PlannedStartDate',
    'LocationName',
    'ParentEPSName',
    'ParentEPSObjectId'
];

/**
 * Fetch all projects from Oracle P6
 * @param {string} token - OAuth token (optional, uses env if not provided)
 * @param {Array<string>} fields - Fields to retrieve (optional)
 * @returns {Promise<Array>} Array of projects
 */
async function fetchProjectsFromP6(token = null, fields = DEFAULT_PROJECT_FIELDS) {
    console.log('[P6 Project Service] Fetching projects from Oracle P6...');

    // Set token if provided
    if (token) {
        soapClient.setToken(token);
    }

    try {
        const projects = await soapClient.readProjects(fields);

        // Map to standardized format
        return projects.map(project => ({
            p6ObjectId: parseInt(project.ObjectId) || null,
            p6Id: project.Id || null,
            name: project.Name || 'Unnamed Project',
            description: project.Description || null,
            status: project.Status || 'Unknown',
            startDate: project.StartDate || project.PlannedStartDate || null,
            finishDate: project.FinishDate || null,
            plannedStartDate: project.PlannedStartDate || null,
            location: project.LocationName || null,
            epsName: project.ParentEPSName || null,
            epsObjectId: parseInt(project.ParentEPSObjectId) || null,
            // Raw data for debugging
            _raw: project
        }));

    } catch (error) {
        console.error('[P6 Project Service] Error fetching projects:', error.message);
        throw error;
    }
}

/**
 * Fetch a single project by ObjectId
 * @param {number} objectId - Project ObjectId
 * @param {string} token - OAuth token (optional)
 * @returns {Promise<Object>} Project object
 */
async function fetchProjectById(objectId, token = null) {
    console.log(`[P6 Project Service] Fetching project ${objectId}...`);

    if (token) {
        soapClient.setToken(token);
    }

    try {
        // Read with filter for specific ObjectId
        const fields = DEFAULT_PROJECT_FIELDS;
        const filter = `ObjectId = ${objectId}`;

        // For filtered queries, we need to build the SOAP envelope manually
        const fieldElements = fields.map(field => `<Field>${field}</Field>`).join('\n      ');

        const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:v2="http://xmlns.oracle.com/Primavera/P6/WS/Project/V2">
  <soapenv:Header/>
  <soapenv:Body>
    <v2:ReadProjects>
      ${fieldElements}
      <Filter>${filter}</Filter>
    </v2:ReadProjects>
  </soapenv:Body>
</soapenv:Envelope>`;

        const axios = require('axios');
        const baseUrl = process.env.ORACLE_P6_BASE_URL || 'https://sin1.p6.oraclecloud.com/adani/stage/p6ws/services';

        const response = await axios.post(`${baseUrl}/ProjectService`, envelope, {
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'ReadProjects',
                'Authorization': `Bearer ${soapClient.getToken()}`,
                'Accept': 'text/xml, application/xml'
            },
            timeout: 30000
        });

        const projects = soapClient.parseProjectsFromXml(response.data);

        if (projects.length === 0) {
            return null;
        }

        const project = projects[0];
        return {
            p6ObjectId: parseInt(project.ObjectId) || null,
            p6Id: project.Id || null,
            name: project.Name || 'Unnamed Project',
            description: project.Description || null,
            status: project.Status || 'Unknown',
            startDate: project.StartDate || project.PlannedStartDate || null,
            finishDate: project.FinishDate || null,
            plannedStartDate: project.PlannedStartDate || null,
            location: project.LocationName || null,
            epsName: project.ParentEPSName || null,
            epsObjectId: parseInt(project.ParentEPSObjectId) || null
        };

    } catch (error) {
        console.error(`[P6 Project Service] Error fetching project ${objectId}:`, error.message);
        throw error;
    }
}

/**
 * Get projects with optional status filter
 * @param {string} status - Filter by status (e.g., 'Active')
 * @param {string} token - OAuth token (optional)
 * @returns {Promise<Array>} Filtered projects
 */
async function fetchProjectsByStatus(status, token = null) {
    const projects = await fetchProjectsFromP6(token);

    if (!status) {
        return projects;
    }

    return projects.filter(p =>
        p.status && p.status.toLowerCase() === status.toLowerCase()
    );
}

/**
 * Search projects by name
 * @param {string} searchTerm - Search term
 * @param {string} token - OAuth token (optional)
 * @returns {Promise<Array>} Matching projects
 */
async function searchProjects(searchTerm, token = null) {
    const projects = await fetchProjectsFromP6(token);

    if (!searchTerm) {
        return projects;
    }

    const term = searchTerm.toLowerCase();
    return projects.filter(p =>
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.p6Id && p.p6Id.toLowerCase().includes(term)) ||
        (p.epsName && p.epsName.toLowerCase().includes(term))
    );
}

module.exports = {
    fetchProjectsFromP6,
    fetchProjectById,
    fetchProjectsByStatus,
    searchProjects,
    DEFAULT_PROJECT_FIELDS
};
