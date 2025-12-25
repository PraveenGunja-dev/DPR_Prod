// Quick test of P6 token
require('dotenv').config();

const { restClient } = require('./services/oracleP6RestClient');

(async () => {
    try {
        console.log('Testing P6 API with new token...');
        console.log('Token from env:', process.env.ORACLE_P6_AUTH_TOKEN ? 'EXISTS (ending with ...' + process.env.ORACLE_P6_AUTH_TOKEN.slice(-10) + ')' : 'NOT SET');

        const projects = await restClient.readProjects(['ObjectId', 'Id', 'Name', 'Status']);
        console.log(`\n✓ SUCCESS! Retrieved ${projects.length} projects from P6 API`);
        console.log('\nFirst 3 projects:');
        projects.slice(0, 3).forEach(p => {
            console.log(`  - ${p.Name} (${p.Id})`);
        });
    } catch (error) {
        console.error('\n✗ FAILED:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
})();
