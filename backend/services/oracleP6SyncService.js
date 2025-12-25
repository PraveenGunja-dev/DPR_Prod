// server/services/oracleP6SyncService.js
// Service to sync Oracle P6 data to local database

const { restClient } = require('./oracleP6RestClient');

/**
 * Sync projects from Oracle P6 to local database
 * @param {Object} pool - Database connection pool
 * @param {string} token - OAuth token (optional)
 * @returns {Promise<Object>} Sync result
 */
async function syncProjectsFromP6(pool, token = null) {
    console.log('[P6 Sync] Starting project sync from Oracle P6...');

    if (token) {
        restClient.setToken(token);
    }

    // Fetch all projects from P6 REST API with basic fields
    const p6Projects = await restClient.readProjects([
        'ObjectId', 'Id', 'Name', 'Description', 'Status',
        'StartDate', 'FinishDate', 'ParentEPSName'
    ]);

    console.log(`[P6 Sync] Retrieved ${p6Projects.length} projects from P6`);

    let inserted = 0;
    let updated = 0;
    let errors = 0;

    for (const project of p6Projects) {
        try {
            // Upsert project to database
            const result = await pool.query(`
        INSERT INTO p6_projects (
          object_id, p6_id, name, description, status,
          start_date, finish_date, planned_start_date, scheduled_finish_date,
          forecast_start_date, forecast_finish_date, data_date, must_finish_by_date,
          location_name, latitude, longitude,
          parent_eps_name, parent_eps_object_id, obs_name, obs_object_id,
          current_budget, original_budget, proposed_budget, current_variance,
          overall_project_score, risk_level, risk_score,
          is_template, create_date, create_user, last_update_date, last_update_user,
          last_sync_at, sync_status
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9,
          $10, $11, $12, $13,
          $14, $15, $16,
          $17, $18, $19, $20,
          $21, $22, $23, $24,
          $25, $26, $27,
          $28, $29, $30, $31, $32,
          CURRENT_TIMESTAMP, 'synced'
        )
        ON CONFLICT (object_id) DO UPDATE SET
          p6_id = EXCLUDED.p6_id,
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          status = EXCLUDED.status,
          start_date = EXCLUDED.start_date,
          finish_date = EXCLUDED.finish_date,
          planned_start_date = EXCLUDED.planned_start_date,
          scheduled_finish_date = EXCLUDED.scheduled_finish_date,
          forecast_start_date = EXCLUDED.forecast_start_date,
          forecast_finish_date = EXCLUDED.forecast_finish_date,
          data_date = EXCLUDED.data_date,
          must_finish_by_date = EXCLUDED.must_finish_by_date,
          location_name = EXCLUDED.location_name,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          parent_eps_name = EXCLUDED.parent_eps_name,
          parent_eps_object_id = EXCLUDED.parent_eps_object_id,
          obs_name = EXCLUDED.obs_name,
          obs_object_id = EXCLUDED.obs_object_id,
          current_budget = EXCLUDED.current_budget,
          original_budget = EXCLUDED.original_budget,
          proposed_budget = EXCLUDED.proposed_budget,
          current_variance = EXCLUDED.current_variance,
          overall_project_score = EXCLUDED.overall_project_score,
          risk_level = EXCLUDED.risk_level,
          risk_score = EXCLUDED.risk_score,
          is_template = EXCLUDED.is_template,
          create_date = EXCLUDED.create_date,
          create_user = EXCLUDED.create_user,
          last_update_date = EXCLUDED.last_update_date,
          last_update_user = EXCLUDED.last_update_user,
          last_sync_at = CURRENT_TIMESTAMP,
          sync_status = 'synced',
          updated_at = CURRENT_TIMESTAMP
        RETURNING (xmax = 0) AS inserted
      `, [
                parseInt(project.ObjectId) || null,
                project.Id || null,
                project.Name || 'Unnamed Project',
                project.Description || null,
                project.Status || 'Active',
                project.StartDate || null,
                project.FinishDate || null,
                project.PlannedStartDate || null,
                project.ScheduledFinishDate || null,
                project.ForecastStartDate || null,
                project.ForecastFinishDate || null,
                project.DataDate || null,
                project.MustFinishByDate || null,
                project.LocationName || null,
                parseFloat(project.Latitude) || null,
                parseFloat(project.Longitude) || null,
                project.ParentEPSName || null,
                parseInt(project.ParentEPSObjectId) || null,
                project.OBSName || null,
                parseInt(project.OBSObjectId) || null,
                parseFloat(project.CurrentBudget) || null,
                parseFloat(project.OriginalBudget) || null,
                parseFloat(project.ProposedBudget) || null,
                parseFloat(project.CurrentVariance) || null,
                parseFloat(project.OverallProjectScore) || null,
                project.RiskLevel || null,
                parseFloat(project.RiskScore) || null,
                project.IsTemplate === 'true' || project.IsTemplate === true,
                project.CreateDate || null,
                project.CreateUser || null,
                project.LastUpdateDate || null,
                project.LastUpdateUser || null
            ]);

            if (result.rows[0]?.inserted) {
                inserted++;
            } else {
                updated++;
            }

        } catch (err) {
            console.error(`[P6 Sync] Error syncing project ${project.ObjectId}:`, err.message);
            errors++;
        }
    }

    console.log(`[P6 Sync] Sync complete: ${inserted} inserted, ${updated} updated, ${errors} errors`);

    return {
        success: true,
        totalFromP6: p6Projects.length,
        inserted,
        updated,
        errors,
        syncedAt: new Date().toISOString()
    };
}

/**
 * Get all projects from local database (synced from P6)
 * @param {Object} pool - Database connection pool
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} Projects
 */
async function getProjectsFromDb(pool, filters = {}) {
    let query = 'SELECT * FROM p6_projects';
    const params = [];
    const conditions = [];

    if (filters.status) {
        conditions.push(`status = $${params.length + 1}`);
        params.push(filters.status);
    }

    if (filters.search) {
        conditions.push(`(name ILIKE $${params.length + 1} OR p6_id ILIKE $${params.length + 1})`);
        params.push(`%${filters.search}%`);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY name ASC';

    const result = await pool.query(query, params);
    return result.rows;
}

/**
 * Get a single project by ObjectId
 * @param {Object} pool - Database connection pool
 * @param {number} objectId - P6 ObjectId
 * @returns {Promise<Object|null>} Project or null
 */
async function getProjectByObjectId(pool, objectId) {
    const result = await pool.query(
        'SELECT * FROM p6_projects WHERE object_id = $1',
        [objectId]
    );
    return result.rows[0] || null;
}

module.exports = {
    syncProjectsFromP6,
    getProjectsFromDb,
    getProjectByObjectId
};
