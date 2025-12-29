// Check existing p6_projects table schema
const pool = require('./db');

async function main() {
    const result = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'p6_projects' 
        ORDER BY ordinal_position
    `);
    console.log('p6_projects columns:');
    console.log(JSON.stringify(result.rows, null, 2));
    await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
