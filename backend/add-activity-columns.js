// Add missing columns to p6_activities table
const pool = require('./db');

async function addColumns() {
    console.log('Adding missing columns to p6_activities...');

    const columns = [
        'ALTER TABLE p6_activities ADD COLUMN IF NOT EXISTS activity_id VARCHAR(100)',
        'ALTER TABLE p6_activities ADD COLUMN IF NOT EXISTS planned_non_labor_units DECIMAL(15,4)',
        'ALTER TABLE p6_activities ADD COLUMN IF NOT EXISTS actual_non_labor_units DECIMAL(15,4)',
        'ALTER TABLE p6_activities ADD COLUMN IF NOT EXISTS remaining_non_labor_units DECIMAL(15,4)',
        'ALTER TABLE p6_activities ADD COLUMN IF NOT EXISTS duration DECIMAL(10,2)',
        'ALTER TABLE p6_activities ADD COLUMN IF NOT EXISTS actual_duration DECIMAL(10,2)',
        'ALTER TABLE p6_activities ADD COLUMN IF NOT EXISTS remaining_duration DECIMAL(10,2)',
        'ALTER TABLE p6_activities ADD COLUMN IF NOT EXISTS baseline_start_date TIMESTAMP',
        'ALTER TABLE p6_activities ADD COLUMN IF NOT EXISTS baseline_finish_date TIMESTAMP',
        'ALTER TABLE p6_activities ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP'
    ];

    for (const sql of columns) {
        try {
            await pool.query(sql);
            console.log('✅', sql.replace(/ALTER TABLE p6_activities ADD COLUMN IF NOT EXISTS /, ''));
        } catch (e) {
            console.log('⚠️', e.message);
        }
    }

    console.log('\nDone! Table columns updated.');
    await pool.end();
}

addColumns().catch(e => { console.error(e); process.exit(1); });
