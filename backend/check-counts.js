// Check p6_resources table schema
const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5431,
    database: 'postgres',
    user: 'postgres',
    password: 'Prvn@3315'
});

async function checkSchema() {
    try {
        const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'p6_resources' 
      ORDER BY ordinal_position
    `);

        console.log('p6_resources columns:');
        result.rows.forEach(row => {
            console.log('  -', row.column_name, ':', row.data_type);
        });

        // Also check p6_resource_assignments
        const result2 = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'p6_resource_assignments' 
      ORDER BY ordinal_position
    `);

        console.log('\np6_resource_assignments columns:');
        result2.rows.forEach(row => {
            console.log('  -', row.column_name, ':', row.data_type);
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkSchema();
