// Show sample synced data with all fields
const pool = require('./db');

async function showSampleData() {
    console.log('='.repeat(70));
    console.log('SYNCED P6 DATA - SAMPLE ACTIVITIES');
    console.log('='.repeat(70));

    // Show columns in p6_activities
    const columns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'p6_activities' 
        ORDER BY ordinal_position
    `);

    console.log('\n📊 Activity Table Columns:');
    columns.rows.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
    });

    // Get sample activities with all data
    const sample = await pool.query(`
        SELECT 
            a.activity_id,
            a.name,
            a.status,
            a.percent_complete,
            a.planned_non_labor_units as total_qty,
            a.actual_non_labor_units as actual_qty,
            a.planned_start_date,
            a.planned_finish_date,
            a.actual_start_date,
            a.actual_finish_date,
            a.duration as planned_duration,
            a.actual_duration,
            p.name as project_name
        FROM p6_activities a
        JOIN p6_projects p ON a.project_object_id = p.object_id
        WHERE a.planned_non_labor_units IS NOT NULL 
          AND a.planned_non_labor_units > 0
        ORDER BY a.planned_non_labor_units DESC
        LIMIT 10
    `);

    console.log('\n📋 Sample Activities (Top 10 by Total Qty):');
    console.log('='.repeat(70));

    sample.rows.forEach((row, i) => {
        console.log(`\n${i + 1}. ${row.name}`);
        console.log(`   Activity ID: ${row.activity_id}`);
        console.log(`   Project: ${row.project_name}`);
        console.log(`   Status: ${row.status}`);
        console.log(`   % Complete: ${row.percent_complete}%`);
        console.log(`   Total Qty: ${parseFloat(row.total_qty).toLocaleString()}`);
        console.log(`   Actual Qty: ${row.actual_qty || 'N/A'}`);
        console.log(`   Planned Start: ${row.planned_start_date?.toISOString().split('T')[0] || 'N/A'}`);
        console.log(`   Planned Finish: ${row.planned_finish_date?.toISOString().split('T')[0] || 'N/A'}`);
        console.log(`   Duration: ${row.planned_duration || 'N/A'}`);
    });

    // Check activity codes synced
    console.log('\n\n📊 Activity Codes Sample (for Priority, Plot, Block):');
    console.log('='.repeat(70));

    const codeTypes = await pool.query(`
        SELECT name, COUNT(*) as code_count
        FROM p6_activity_code_types
        GROUP BY name
        ORDER BY code_count DESC
        LIMIT 15
    `);

    codeTypes.rows.forEach(ct => {
        console.log(`  - ${ct.name}: ${ct.code_count} codes`);
    });

    await pool.end();
}

showSampleData().catch(e => { console.error(e); process.exit(1); });
