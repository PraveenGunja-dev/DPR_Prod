const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5431,
    database: 'postgres',
    user: 'postgres',
    password: 'Prvn@3315'
});

(async () => {
    try {
        // Get all tables
        const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log('=== TABLES ===');
        console.log(tables.rows.map(r => r.table_name).join('\n'));

        // Check p6_projects
        try {
            const projects = await pool.query('SELECT * FROM p6_projects LIMIT 10');
            console.log('\n=== P6_PROJECTS (first 10) ===');
            console.log('Count:', projects.rowCount);
            console.log(projects.rows);
        } catch (e) {
            console.log('\nP6_PROJECTS table not found or error:', e.message);
        }

        // Check p6_activities
        try {
            const activities = await pool.query('SELECT COUNT(*) as count FROM p6_activities');
            console.log('\n=== P6_ACTIVITIES COUNT ===');
            console.log(activities.rows[0].count);

            const sample = await pool.query('SELECT id, name, project_object_id FROM p6_activities LIMIT 5');
            console.log('\n=== P6_ACTIVITIES SAMPLE ===');
            console.log(sample.rows);
        } catch (e) {
            console.log('\nP6_ACTIVITIES table not found or error:', e.message);
        }

        // Check users
        try {
            const users = await pool.query('SELECT id, username, role FROM users');
            console.log('\n=== USERS ===');
            console.log(users.rows);
        } catch (e) {
            console.log('\nUSERS table not found or error:', e.message);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
})();
