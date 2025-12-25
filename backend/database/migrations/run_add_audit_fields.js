// server/database/migrations/run_add_audit_fields.js
// Run with: node server/database/migrations/run_add_audit_fields.js

const pool = require('../../db');

async function runMigration() {
    console.log('Starting migration: Adding audit tracking fields to dpr_supervisor_entries...\n');

    try {
        // Add submitted_by field
        console.log('Adding submitted_by field...');
        await pool.query(`
      ALTER TABLE dpr_supervisor_entries 
      ADD COLUMN IF NOT EXISTS submitted_by INTEGER REFERENCES users(user_id)
    `);

        // Add PM review fields
        console.log('Adding pm_reviewed_at field...');
        await pool.query(`
      ALTER TABLE dpr_supervisor_entries 
      ADD COLUMN IF NOT EXISTS pm_reviewed_at TIMESTAMP
    `);

        console.log('Adding pm_reviewed_by field...');
        await pool.query(`
      ALTER TABLE dpr_supervisor_entries 
      ADD COLUMN IF NOT EXISTS pm_reviewed_by INTEGER REFERENCES users(user_id)
    `);

        // Add rejection reason field (if not exists)
        console.log('Adding rejection_reason field...');
        await pool.query(`
      ALTER TABLE dpr_supervisor_entries 
      ADD COLUMN IF NOT EXISTS rejection_reason TEXT
    `);

        // Add PMAG push fields
        console.log('Adding pushed_at field...');
        await pool.query(`
      ALTER TABLE dpr_supervisor_entries 
      ADD COLUMN IF NOT EXISTS pushed_at TIMESTAMP
    `);

        console.log('Adding pushed_by field...');
        await pool.query(`
      ALTER TABLE dpr_supervisor_entries 
      ADD COLUMN IF NOT EXISTS pushed_by INTEGER REFERENCES users(user_id)
    `);

        // Create indexes
        console.log('Creating indexes...');
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_dpr_entries_submitted_by ON dpr_supervisor_entries(submitted_by)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_dpr_entries_pm_reviewed_by ON dpr_supervisor_entries(pm_reviewed_by)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_dpr_entries_pushed_by ON dpr_supervisor_entries(pushed_by)`);

        // Verify the changes
        console.log('\nVerifying columns in dpr_supervisor_entries:');
        const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'dpr_supervisor_entries' 
      ORDER BY ordinal_position
    `);

        console.log('\nTable columns:');
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type}`);
        });

        console.log('\n✓ Migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
