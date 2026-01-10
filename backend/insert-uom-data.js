// Quick script to manually insert UOM data from P6 Swagger response
// Since the API call is failing, we'll insert the data directly

const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5431,
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Prvn@3315',
});

// UOM data from P6 Swagger - provided by user
const uomData = [
    { "Name": "Sqm", "ObjectId": "2523" },
    { "Name": "Cubic metre", "ObjectId": "884" },
    { "Name": "Cubic metre", "ObjectId": "881" },
    { "Name": "Cubic metre", "ObjectId": "878" },
    { "Name": "Cubic metre", "ObjectId": "875" },
    { "Name": "Cubic metre", "ObjectId": "872" },
    { "Name": "Cubic metre", "ObjectId": "869" },
    { "Name": "Cubic metre", "ObjectId": "863" },
    { "Name": "Cubic metre", "ObjectId": "860" },
    { "Name": "Cubic metre", "ObjectId": "857" },
    { "Name": "Cubic metre", "ObjectId": "854" },
    { "Name": "Cubic metre", "ObjectId": "851" },
    { "Name": "Cubic metre", "ObjectId": "848" },
];

async function insertUOM() {
    console.log('Inserting UOM data manually...');

    try {
        let count = 0;
        for (const uom of uomData) {
            await pool.query(`
        INSERT INTO p6_unit_of_measures ("objectId", "name", "lastSyncAt")
        VALUES ($1, $2, NOW())
        ON CONFLICT ("objectId") DO UPDATE SET
          "name" = EXCLUDED."name",
          "lastSyncAt" = NOW()
      `, [parseInt(uom.ObjectId), uom.Name]);
            count++;
        }

        console.log(`✓ Inserted ${count} UOM records`);

        // Show what's in the table
        const result = await pool.query('SELECT * FROM p6_unit_of_measures ORDER BY "objectId"');
        console.log('\nUOM Table Contents:');
        console.table(result.rows);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

insertUOM();
