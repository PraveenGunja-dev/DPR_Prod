// Test UDF fetching with corrected endpoint
require('dotenv').config();

const { restClient } = require('./services/oracleP6RestClient');

(async () => {
    try {
        console.log('Testing P6 UDF endpoint...');

        // First get a few activities from a project
        console.log('\n1. Getting activities from a project...');
        const activities = await restClient.readActivities(
            ['ObjectId', 'Id', 'Name'],
            1981 // PSS_14 project
        );
        console.log(`Found ${activities.length} activities`);

        if (activities.length > 0) {
            // Get ObjectIds of first 5 activities
            const activityIds = activities.slice(0, 5).map(a => a.ObjectId);
            console.log('\n2. Testing UDF fetch for activity IDs:', activityIds);

            const udfValues = await restClient.readActivityUDFValues(activityIds);
            console.log(`\n✓ Retrieved ${udfValues.length} UDF values`);

            if (udfValues.length > 0) {
                console.log('\nSample UDF values:');
                udfValues.slice(0, 5).forEach(udf => {
                    console.log(`  - ${udf.UDFTypeTitle}: ${udf.Text || udf.Double || udf.Integer || udf.CodeValue || 'N/A'}`);
                });
            }
        }
    } catch (error) {
        console.error('\n✗ FAILED:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
})();
