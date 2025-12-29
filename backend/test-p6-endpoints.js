// Test script to check P6 API endpoints availability
// Run with: node backend/test-p6-endpoints.js

const { restClient } = require('./services/oracleP6RestClient');

async function testEndpoint(name, fn) {
    try {
        console.log(`\n=== Testing ${name} ===`);
        const result = await fn();
        console.log(`✅ ${name}: SUCCESS - ${Array.isArray(result) ? result.length + ' items' : 'OK'}`);
        if (Array.isArray(result) && result.length > 0) {
            console.log('Sample:', JSON.stringify(result[0], null, 2));
        }
        return { success: true, count: Array.isArray(result) ? result.length : 1, data: result };
    } catch (error) {
        console.log(`❌ ${name}: FAILED - ${error.response?.status || error.message}`);
        if (error.response?.data) {
            console.log('Error data:', JSON.stringify(error.response.data).substring(0, 200));
        }
        return { success: false, error: error.message };
    }
}

async function main() {
    console.log('='.repeat(60));
    console.log('P6 API ENDPOINT AVAILABILITY TEST (camelCase URLs)');
    console.log('='.repeat(60));

    const results = {};

    // Test each endpoint with DIRECT API calls (correct camelCase)
    results.project = await testEndpoint('/project',
        () => restClient.get('/project', { Fields: 'ObjectId,Id,Name' }));

    results.activity = await testEndpoint('/activity',
        () => restClient.get('/activity', { Fields: 'ObjectId,Id,Name,Status' }));

    results.resource = await testEndpoint('/resource',
        () => restClient.get('/resource', { Fields: 'ObjectId,Id,Name' }));

    results.udfValue = await testEndpoint('/udfValue',
        () => restClient.get('/udfValue', { Fields: 'ObjectId,ForeignObjectId,UDFTypeTitle,Text' }));

    results.activityCodeType = await testEndpoint('/activityCodeType',
        () => restClient.get('/activityCodeType', { Fields: 'ObjectId,Name' }));

    results.activityCode = await testEndpoint('/activityCode',
        () => restClient.get('/activityCode', { Fields: 'ObjectId,CodeValue,Description' }));

    results.resourceAssignment = await testEndpoint('/resourceAssignment',
        () => restClient.get('/resourceAssignment', { Fields: 'ObjectId,ActivityObjectId,ResourceName' }));

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));

    for (const [name, result] of Object.entries(results)) {
        const status = result.success ? '✅ AVAILABLE' : '❌ NOT AVAILABLE';
        const count = result.count ? ` (${result.count} items)` : '';
        console.log(`${name}: ${status}${count}`);
    }
}

main().catch(console.error);
