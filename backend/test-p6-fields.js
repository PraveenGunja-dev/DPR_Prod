// Get available fields for each P6 endpoint
// Run with: node backend/test-p6-fields.js

const { restClient } = require('./services/oracleP6RestClient');

async function getFields(endpoint) {
    try {
        const fields = await restClient.get(`${endpoint}/fields`);
        console.log(`\n=== ${endpoint}/fields ===`);
        console.log(typeof fields === 'string' ? fields : JSON.stringify(fields, null, 2));
        return fields;
    } catch (e) {
        console.log(`Error getting ${endpoint}/fields:`, e.message);
        return null;
    }
}

async function main() {
    console.log('P6 API Field Discovery');
    console.log('='.repeat(60));

    // Check fields for each endpoint
    await getFields('/project');
    await getFields('/activity');
    await getFields('/udfValue');
    await getFields('/activityCode');
    await getFields('/activityCodeType');
    await getFields('/resourceAssignment');
}

main().catch(console.error);
