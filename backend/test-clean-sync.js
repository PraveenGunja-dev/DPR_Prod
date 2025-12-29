// Test script for clean P6 sync
// Run with: node backend/test-clean-sync.js

const { cleanP6SyncService } = require('./services/cleanP6SyncService');
const pool = require('./db');

async function runMigration() {
    console.log('Running database migration...');
    const fs = require('fs');
    const path = require('path');

    const sqlPath = path.join(__dirname, 'database', 'p6-clean-sync-schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split by semicolons and run each statement
    const statements = sql.split(';').filter(s => s.trim());

    for (const statement of statements) {
        if (statement.trim()) {
            try {
                await pool.query(statement);
            } catch (e) {
                // Ignore errors for CREATE TABLE IF NOT EXISTS
                if (!e.message.includes('already exists')) {
                    console.log('SQL Warning:', e.message.substring(0, 100));
                }
            }
        }
    }

    console.log('Database migration complete');
}

async function testSync() {
    console.log('='.repeat(60));
    console.log('CLEAN P6 SYNC TEST');
    console.log('='.repeat(60));

    try {
        // Run migration first
        await runMigration();

        // Test syncing projects
        console.log('\n1. Syncing projects...');
        const projectCount = await cleanP6SyncService.syncProjects();
        console.log(`✅ Synced ${projectCount} projects`);

        // Test syncing activity code types
        console.log('\n2. Syncing activity code types...');
        const codeTypesCount = await cleanP6SyncService.syncActivityCodeTypes();
        console.log(`✅ Synced ${codeTypesCount} activity code types`);

        // Test syncing activity codes
        console.log('\n3. Syncing activity codes...');
        const codesCount = await cleanP6SyncService.syncActivityCodes();
        console.log(`✅ Synced ${codesCount} activity codes`);

        // Get first project to test activity sync
        const projectResult = await pool.query('SELECT object_id, name FROM p6_projects LIMIT 1');
        if (projectResult.rows.length > 0) {
            const project = projectResult.rows[0];
            console.log(`\n4. Syncing activities for project: ${project.name}...`);
            const activityCount = await cleanP6SyncService.syncActivitiesForProject(project.object_id);
            console.log(`✅ Synced ${activityCount} activities`);

            // Show sample activity from database
            const sampleActivity = await pool.query(
                'SELECT activity_id, name, status, percent_complete, planned_non_labor_units, planned_start_date FROM p6_activities WHERE project_object_id = $1 LIMIT 1',
                [project.object_id]
            );
            if (sampleActivity.rows.length > 0) {
                console.log('\nSample activity from database:');
                console.log(JSON.stringify(sampleActivity.rows[0], null, 2));
            }
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('SYNC TEST COMPLETE');
        console.log('='.repeat(60));

        // Show table counts
        const counts = await Promise.all([
            pool.query('SELECT COUNT(*) FROM p6_projects'),
            pool.query('SELECT COUNT(*) FROM p6_activities'),
            pool.query('SELECT COUNT(*) FROM p6_activity_code_types'),
            pool.query('SELECT COUNT(*) FROM p6_activity_codes'),
        ]);

        console.log(`\nDatabase Summary:`);
        console.log(`  Projects: ${counts[0].rows[0].count}`);
        console.log(`  Activities: ${counts[1].rows[0].count}`);
        console.log(`  Activity Code Types: ${counts[2].rows[0].count}`);
        console.log(`  Activity Codes: ${counts[3].rows[0].count}`);

    } catch (error) {
        console.error('Error during sync:', error.message);
        console.error(error.stack);
    }

    await pool.end();
}

testSync();
