// Quick migration script to add UOM table
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5431,
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Prvn@3315',
});

async function migrate() {
    try {
        console.log('Creating p6_unit_of_measures table...');

        await pool.query(`
      DROP TABLE IF EXISTS p6_unit_of_measures CASCADE;
      
      CREATE TABLE p6_unit_of_measures (
          "objectId" BIGINT PRIMARY KEY,
          "name" TEXT NOT NULL,
          "lastSyncAt" TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_p6_uom_name ON p6_unit_of_measures("name");
    `);

        console.log('✓ p6_unit_of_measures table created successfully!');

    } catch (error) {
        console.error('Migration error:', error.message);
    } finally {
        await pool.end();
    }
}

migrate();
