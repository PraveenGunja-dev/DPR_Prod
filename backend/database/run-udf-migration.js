// server/database/run-udf-migration.js
// Run this script to add UDF columns to p6_activities table

const pool = require('../db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    console.log('Running UDF columns migration...');

    try {
        const migrationSql = fs.readFileSync(
            path.join(__dirname, 'migrations', 'add_p6_udf_columns.sql'),
            'utf8'
        );

        await pool.query(migrationSql);

        console.log('✅ Migration completed successfully!');
        console.log('Added columns: total_quantity, uom, block_capacity, phase, spv_no, scope, hold, front');

        // Verify columns exist
        const result = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'p6_activities' 
            AND column_name IN ('total_quantity', 'uom', 'block_capacity', 'phase', 'spv_no', 'scope', 'hold', 'front')
            ORDER BY column_name
        `);

        console.log('\nVerified columns:');
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name} (${row.data_type})`);
        });

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        await pool.end();
    }
}

runMigration();
