// Full P6 Sync - Sync activities for ALL projects
// Run with: node backend/sync-all-projects.js

const { cleanP6SyncService } = require('./services/cleanP6SyncService');
const pool = require('./db');

async function syncAllProjectActivities() {
    console.log('='.repeat(60));
    console.log('FULL P6 SYNC - ALL PROJECTS');
    console.log('='.repeat(60));
    console.log('Started at:', new Date().toISOString());

    const startTime = Date.now();
    let totalActivities = 0;
    let successfulProjects = 0;
    let failedProjects = 0;

    try {
        // First sync projects, code types, and codes
        console.log('\n1. Syncing projects...');
        const projectCount = await cleanP6SyncService.syncProjects();
        console.log(`✅ Synced ${projectCount} projects`);

        console.log('\n2. Syncing activity code types...');
        const codeTypesCount = await cleanP6SyncService.syncActivityCodeTypes();
        console.log(`✅ Synced ${codeTypesCount} activity code types`);

        console.log('\n3. Syncing activity codes...');
        const codesCount = await cleanP6SyncService.syncActivityCodes();
        console.log(`✅ Synced ${codesCount} activity codes`);

        // Get all projects from database
        console.log('\n4. Syncing activities for ALL projects...');
        const projects = await pool.query('SELECT object_id, name, p6_id FROM p6_projects ORDER BY object_id');
        console.log(`Found ${projects.rows.length} projects to sync\n`);

        for (let i = 0; i < projects.rows.length; i++) {
            const project = projects.rows[i];
            const progress = `[${i + 1}/${projects.rows.length}]`;

            try {
                process.stdout.write(`${progress} ${project.name || project.p6_id}... `);
                const activityCount = await cleanP6SyncService.syncActivitiesForProject(project.object_id);
                console.log(`✅ ${activityCount} activities`);
                totalActivities += activityCount;
                successfulProjects++;
            } catch (e) {
                console.log(`❌ Error: ${e.message.substring(0, 50)}`);
                failedProjects++;
            }
        }

        // Summary
        const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
        console.log('\n' + '='.repeat(60));
        console.log('SYNC COMPLETE');
        console.log('='.repeat(60));
        console.log(`Duration: ${duration} minutes`);
        console.log(`Projects synced: ${successfulProjects}/${projects.rows.length}`);
        console.log(`Failed projects: ${failedProjects}`);
        console.log(`Total activities: ${totalActivities}`);

        // Final database counts
        const counts = await Promise.all([
            pool.query('SELECT COUNT(*) FROM p6_projects'),
            pool.query('SELECT COUNT(*) FROM p6_activities'),
            pool.query('SELECT COUNT(*) FROM p6_activity_code_types'),
            pool.query('SELECT COUNT(*) FROM p6_activity_codes'),
        ]);

        console.log('\nDatabase Summary:');
        console.log(`  Projects: ${counts[0].rows[0].count}`);
        console.log(`  Activities: ${counts[1].rows[0].count}`);
        console.log(`  Activity Code Types: ${counts[2].rows[0].count}`);
        console.log(`  Activity Codes: ${counts[3].rows[0].count}`);

    } catch (error) {
        console.error('\n❌ SYNC FAILED:', error.message);
        console.error(error.stack);
    }

    await pool.end();
}

syncAllProjectActivities();
