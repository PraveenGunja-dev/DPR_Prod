// Check actual database counts
const pool = require('./db');

async function checkCounts() {
    console.log('='.repeat(60));
    console.log('DATABASE SYNC VERIFICATION');
    console.log('='.repeat(60));

    // Total counts
    const projectCount = await pool.query('SELECT COUNT(*) FROM p6_projects');
    const activityCount = await pool.query('SELECT COUNT(*) FROM p6_activities');
    const codeTypesCount = await pool.query('SELECT COUNT(*) FROM p6_activity_code_types');
    const codesCount = await pool.query('SELECT COUNT(*) FROM p6_activity_codes');

    console.log('\nTotal Database Counts:');
    console.log(`  Projects: ${projectCount.rows[0].count}`);
    console.log(`  Activities: ${activityCount.rows[0].count}`);
    console.log(`  Activity Code Types: ${codeTypesCount.rows[0].count}`);
    console.log(`  Activity Codes: ${codesCount.rows[0].count}`);

    // Check projects with activities
    const projectsWithActivities = await pool.query(`
        SELECT p.object_id, p.name, p.p6_id, COUNT(a.object_id) as activity_count
        FROM p6_projects p
        LEFT JOIN p6_activities a ON p.object_id = a.project_object_id
        GROUP BY p.object_id, p.name, p.p6_id
        ORDER BY activity_count DESC
    `);

    const withActivities = projectsWithActivities.rows.filter(p => parseInt(p.activity_count) > 0);
    const withoutActivities = projectsWithActivities.rows.filter(p => parseInt(p.activity_count) === 0);

    console.log(`\nProjects with activities: ${withActivities.length}`);
    console.log(`Projects without activities: ${withoutActivities.length}`);

    console.log('\nTop 10 projects by activity count:');
    projectsWithActivities.rows.slice(0, 10).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name || p.p6_id}: ${p.activity_count} activities`);
    });

    console.log('\nProjects without activities (first 10):');
    withoutActivities.slice(0, 10).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name || p.p6_id} (ObjectId: ${p.object_id})`);
    });

    await pool.end();
}

checkCounts().catch(e => { console.error(e); process.exit(1); });
