// Test the new DPR Activities API
const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api/dpr-activities';

// Get a test token first
async function getTestToken() {
    try {
        const loginRes = await axios.post('http://localhost:3002/api/auth/login', {
            email: 'supervisor@adani.com',
            password: 'password123'
        });
        return loginRes.data.token;
    } catch (e) {
        console.log('Login failed, using dummy token for testing');
        return null;
    }
}

async function testAPI() {
    console.log('='.repeat(60));
    console.log('TESTING DPR ACTIVITIES API');
    console.log('='.repeat(60));

    const token = await getTestToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
        // Test sync status
        console.log('\n1. Testing /sync-status...');
        const syncRes = await axios.get(`${BASE_URL}/sync-status`, { headers });
        console.log('✅ Sync Status:', JSON.stringify(syncRes.data, null, 2));

        // Test projects
        console.log('\n2. Testing /projects...');
        const projectsRes = await axios.get(`${BASE_URL}/projects`, { headers });
        console.log(`✅ Projects: ${projectsRes.data.count} projects`);
        console.log('First 3 projects:', projectsRes.data.projects.slice(0, 3).map(p => p.name));

        // Get first project with activities
        const firstProject = projectsRes.data.projects.find(p => parseInt(p.activity_count) > 0);
        if (firstProject) {
            const projectObjectId = firstProject.object_id;

            // Test activities
            console.log(`\n3. Testing /activities/${projectObjectId}...`);
            const activitiesRes = await axios.get(`${BASE_URL}/activities/${projectObjectId}?limit=5`, { headers });
            console.log(`✅ Activities: ${activitiesRes.data.totalCount} total, showing ${activitiesRes.data.activities.length}`);
            console.log('Sample activity:', JSON.stringify(activitiesRes.data.activities[0], null, 2));

            // Test DP Qty format
            console.log(`\n4. Testing /dp-qty/${projectObjectId}...`);
            const dpQtyRes = await axios.get(`${BASE_URL}/dp-qty/${projectObjectId}`, { headers });
            console.log(`✅ DP Qty: ${dpQtyRes.data.count} activities`);
            console.log('Sample DP Qty row:', JSON.stringify(dpQtyRes.data.data[0], null, 2));
        }

        // Test activity codes
        console.log('\n5. Testing /activity-codes...');
        const codesRes = await axios.get(`${BASE_URL}/activity-codes`, { headers });
        console.log(`✅ Activity Codes: ${codesRes.data.codeTypes.length} code types, ${codesRes.data.codes.length} codes`);
        console.log('Sample code types:', codesRes.data.codeTypes.slice(0, 5).map(t => t.name));

        console.log('\n' + '='.repeat(60));
        console.log('ALL API TESTS PASSED ✅');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ API Test Error:', error.response?.data || error.message);
    }
}

testAPI();
