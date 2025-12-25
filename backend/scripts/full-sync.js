const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

const { syncProjectsFromP6 } = require('../services/oracleP6SyncService');
const p6DataService = require('../services/p6DataService');

// PostgreSQL connection pool (Fallback to hardcoded if env missing, matching server.js fix)
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5431,
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Prvn@3315',
});

async function runFullSync() {
    try {
        console.log('Starting FULL SYNC of Oracle P6 Data...');

        // 1. Sync Project List
        console.log('\n--- Step 1: Syncing Project List ---');
        // We pass 'null' for token so it uses the one in restClient (environment or fallback)
        const projectSyncResult = await syncProjectsFromP6(pool, null);
        console.log(`Synced ${projectSyncResult.totalFromP6} projects.`);

        // 2. Fetch all projects to iterate
        const res = await pool.query('SELECT object_id, name FROM p6_projects ORDER BY name');
        const projects = res.rows;

        console.log(`\n--- Step 2: Syncing Details for ${projects.length} Projects ---`);

        for (const [index, project] of projects.entries()) {
            const projectId = project.object_id;
            console.log(`\n[${index + 1}/${projects.length}] Syncing Project: ${project.name} (ID: ${projectId})`);

            try {
                await p6DataService.syncProject(projectId);
            } catch (err) {
                console.error(`Failed to sync project ${project.name}:`, err.message);
                // Continue to next project
            }
        }

        console.log('\n--- FULL SYNC COMPLETED ---');
    } catch (error) {
        console.error('Fatal Error during full sync:', error);
    } finally {
        await pool.end();
    }
}

runFullSync();
