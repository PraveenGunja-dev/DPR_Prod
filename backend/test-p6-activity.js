// Test script to check P6 Activity endpoint with project filter
// Run with: node backend/test-p6-activity.js

const { restClient } = require('./services/oracleP6RestClient');

async function main() {
    console.log('='.repeat(60));
    console.log('P6 ACTIVITY ENDPOINT TEST (with Project Filter)');
    console.log('='.repeat(60));

    try {
        // First, get a valid project ObjectId
        console.log('\n=== Getting Projects ===');
        const projects = await restClient.get('/project', { Fields: 'ObjectId,Id,Name' });
        console.log(`Found ${projects.length} projects`);

        if (projects.length === 0) {
            console.log('No projects found');
            return;
        }

        // Get a project with activities - try first few projects
        const testProject = projects[0];
        console.log(`\nTesting with project: ${testProject.Name} (ObjectId: ${testProject.ObjectId})`);

        // Now get activities for this project
        console.log('\n=== Getting Activities for Project ===');
        const activities = await restClient.get('/activity', {
            Fields: 'ObjectId,Id,Name,Status,PercentComplete,PlannedStartDate,PlannedFinishDate,ActualStartDate,ActualFinishDate,PlannedNonLaborUnits',
            Filter: `ProjectObjectId = ${testProject.ObjectId}`
        });

        console.log(`✅ Found ${activities.length} activities for project ${testProject.Name}`);

        if (activities.length > 0) {
            console.log('\nSample activity:', JSON.stringify(activities[0], null, 2));

            // Show all field names from first record
            console.log('\nAvailable fields:', Object.keys(activities[0]).join(', '));
        }

        // Test UDF Value endpoint with correct fields
        console.log('\n=== Testing UDF Value Fields ===');
        try {
            // First, get the correct field names from /udfValue/fields
            const udfFields = await restClient.get('/udfValue/fields');
            console.log('UDF Value fields available:', JSON.stringify(udfFields, null, 2).substring(0, 500));
        } catch (e) {
            console.log('UDF fields error:', e.message);
        }

        // Test Activity Code Assignment
        console.log('\n=== Testing Activity Code Assignments ===');
        const assignments = await restClient.get('/activityCodeAssignment', {
            Fields: 'ObjectId,ActivityObjectId,ActivityCodeObjectId',
            Filter: `ActivityObjectId = ${activities[0]?.ObjectId || 1}` // Get for one activity
        });
        console.log(`Found ${assignments.length} activity code assignments`);
        if (assignments.length > 0) {
            console.log('Sample:', JSON.stringify(assignments[0], null, 2));
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response?.data) {
            console.error('Response:', JSON.stringify(error.response.data));
        }
    }
}

main().catch(console.error);
