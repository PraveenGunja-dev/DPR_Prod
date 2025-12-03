// Script to clean up duplicate projects and keep only the first 3 unique ones
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function cleanupDuplicateProjects() {
  try {
    console.log('Starting project cleanup...\n');
    
    // First, let's see what we have
    const allProjects = await pool.query('SELECT id, name FROM projects ORDER BY id');
    console.log('Current projects:');
    allProjects.rows.forEach(project => {
      console.log(`  ID: ${project.id}, Name: ${project.name}`);
    });
    
    // Get the unique project names and their first IDs
    const uniqueProjects = await pool.query(`
      SELECT MIN(id) as first_id, name
      FROM projects
      GROUP BY name
      ORDER BY MIN(id)
    `);
    
    console.log('\nUnique projects (keeping first occurrence):');
    uniqueProjects.rows.forEach(project => {
      console.log(`  ID: ${project.first_id}, Name: ${project.name}`);
    });
    
    // Get IDs to delete (everything except the first 3 unique projects)
    const idsToKeep = uniqueProjects.rows.slice(0, 3).map(p => p.first_id);
    console.log('\nKeeping project IDs:', idsToKeep);
    
    const projectsToDelete = await pool.query(
      'SELECT id FROM projects WHERE id NOT IN ($1, $2, $3)',
      idsToKeep
    );
    
    const idsToDelete = projectsToDelete.rows.map(row => row.id);
    console.log('Deleting project IDs:', idsToDelete);
    
    if (idsToDelete.length > 0) {
      // Delete the duplicate projects
      // The foreign key constraints with ON DELETE CASCADE should handle related records
      await pool.query(
        `DELETE FROM projects WHERE id = ANY($1)`,
        [idsToDelete]
      );
      
      console.log(`\nSuccessfully deleted ${idsToDelete.length} duplicate projects`);
    } else {
      console.log('\nNo duplicate projects to delete');
    }
    
    // Verify the result
    const remainingProjects = await pool.query('SELECT id, name FROM projects ORDER BY id');
    console.log('\nRemaining projects:');
    remainingProjects.rows.forEach(project => {
      console.log(`  ID: ${project.id}, Name: ${project.name}`);
    });
    
    pool.end();
  } catch (error) {
    console.error('Error during cleanup:', error.message);
    pool.end();
  }
}

cleanupDuplicateProjects();