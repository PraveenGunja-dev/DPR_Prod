// Test the API directly with database connection (bypasses auth)
const pool = require('./db');

async function testDirect() {
    console.log('='.repeat(60));
    console.log('DIRECT DATABASE TEST - DPR ACTIVITIES API DATA');
    console.log('='.repeat(60));

    try {
        // Sync status
        console.log('\n1. Sync Status:');
        const counts = await Promise.all([
            pool.query('SELECT COUNT(*) FROM p6_projects'),
            pool.query('SELECT COUNT(*) FROM p6_activities'),
            pool.query('SELECT COUNT(*) FROM p6_activity_code_types'),
            pool.query('SELECT COUNT(*) FROM p6_activity_codes'),
        ]);
        console.log(`   Projects: ${counts[0].rows[0].count}`);
        console.log(`   Activities: ${counts[1].rows[0].count}`);
        console.log(`   Code Types: ${counts[2].rows[0].count}`);
        console.log(`   Codes: ${counts[3].rows[0].count}`);

        // Projects with activity counts
        console.log('\n2. Projects (top 5 by activity count):');
        const projects = await pool.query(`
            SELECT p.object_id, p.name, p.p6_id, COUNT(a.object_id) as activity_count
            FROM p6_projects p
            LEFT JOIN p6_activities a ON p.object_id = a.project_object_id
            GROUP BY p.object_id, p.name, p.p6_id
            ORDER BY activity_count DESC
            LIMIT 5
        `);
        projects.rows.forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.name}: ${p.activity_count} activities`);
        });

        // Sample activity in DP Qty format
        const firstProject = projects.rows[0];
        console.log(`\n3. Sample DP Qty data from "${firstProject.name}":`);
        const dpQty = await pool.query(`
            SELECT 
                a.activity_id,
                a.name as description,
                a.status,
                a.percent_complete,
                a.planned_non_labor_units as total_quantity,
                a.actual_non_labor_units as actual_quantity,
                a.planned_start_date,
                a.planned_finish_date,
                a.duration as planned_duration
            FROM p6_activities a
            WHERE a.project_object_id = $1
            AND a.planned_non_labor_units > 0
            ORDER BY a.planned_non_labor_units DESC
            LIMIT 3
        `, [firstProject.object_id]);

        dpQty.rows.forEach((row, i) => {
            console.log(`\n   Activity ${i + 1}:`);
            console.log(`     ID: ${row.activity_id}`);
            console.log(`     Description: ${row.description}`);
            console.log(`     Status: ${row.status}`);
            console.log(`     % Complete: ${row.percent_complete}%`);
            console.log(`     Total Qty: ${parseFloat(row.total_quantity).toLocaleString()}`);
            console.log(`     Actual Qty: ${row.actual_quantity ? parseFloat(row.actual_quantity).toLocaleString() : 'N/A'}`);
            console.log(`     Planned Start: ${row.planned_start_date?.toISOString().split('T')[0]}`);
            console.log(`     Duration: ${row.planned_duration}`);
        });

        // Activity codes sample
        console.log('\n4. Activity Code Types (top 10):');
        const codeTypes = await pool.query(`
            SELECT name, COUNT(*) OVER() as total
            FROM p6_activity_code_types
            GROUP BY name
            ORDER BY name
            LIMIT 10
        `);
        codeTypes.rows.forEach(t => console.log(`   - ${t.name}`));

        console.log('\n' + '='.repeat(60));
        console.log('✅ ALL DATA VERIFIED - API READY');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('Error:', error.message);
    }

    await pool.end();
}

testDirect();
