// server/services/oracleP6ActivityService.js
// Oracle P6 Activity Service - Fetch and sync activity data from Oracle P6 API

const { apiClient } = require('./oracleP6ApiClient');

class OracleP6ActivityService {
    constructor(pool) {
        this.pool = pool;
        this.apiClient = apiClient;
    }

    /**
     * Fetch activities for a project from Oracle P6 API
     * Oracle P6 EPPM REST API uses /restapi/activity with ProjectObjectId filter
     * @param {string} projectId - Oracle P6 project ObjectId
     * @returns {Promise<Array>} Array of activities
     */
    async fetchActivitiesFromP6(projectId) {
        try {
            console.log(`Fetching activities for project ${projectId} from Oracle P6 RESTAPI...`);

            // Oracle P6 EPPM REST API standard endpoint for activities
            // Filter by ProjectObjectId to get activities for specific project
            const response = await this.apiClient.get('/restapi/activity', {
                ProjectObjectId: projectId
            });

            console.log('Successfully fetched activities from Oracle P6 RESTAPI');

            // Handle different response formats from Oracle P6
            let activities = null;

            if (Array.isArray(response)) {
                activities = response;
            } else if (response.data && Array.isArray(response.data)) {
                activities = response.data;
            } else if (response.Activity && Array.isArray(response.Activity)) {
                activities = response.Activity;
            } else if (response.activities && Array.isArray(response.activities)) {
                activities = response.activities;
            } else {
                console.log('Unexpected response format:', response);
                return [];
            }

            console.log(`Fetched ${activities.length} activities for project ${projectId}`);
            return activities;

        } catch (error) {
            console.error(`Error fetching activities for project ${projectId}:`, error.message);
            throw error;
        }
    }

    /**
     * Map Oracle P6 activity to local schema
     * @param {Object} p6Activity - Oracle P6 activity object
     * @param {number} localProjectId - Local project ID
     * @returns {Object} Mapped activity object
     */
    mapP6ActivityToLocal(p6Activity, localProjectId) {
        return {
            object_id: p6Activity.ObjectId || p6Activity.object_id || p6Activity.Id || p6Activity.id,
            name: p6Activity.Name || p6Activity.name || p6Activity.ActivityName || 'Unnamed Activity',
            project_id: localProjectId,
            wbs_object_id: p6Activity.WBSObjectId || p6Activity.wbs_object_id || null,
            status: p6Activity.Status || p6Activity.status || 'Not Started',
            percent_complete: p6Activity.PercentComplete || p6Activity.percent_complete || 0,
            planned_start_date: p6Activity.PlannedStartDate || p6Activity.planned_start_date || null,
            planned_finish_date: p6Activity.PlannedFinishDate || p6Activity.planned_finish_date || null,
            actual_start_date: p6Activity.ActualStartDate || p6Activity.actual_start_date || null,
            actual_finish_date: p6Activity.ActualFinishDate || p6Activity.actual_finish_date || null,
            baseline_start_date: p6Activity.BaselineStartDate || p6Activity.baseline_start_date || null,
            baseline_finish_date: p6Activity.BaselineFinishDate || p6Activity.baseline_finish_date || null,
            forecast_start_date: p6Activity.ForecastStartDate || p6Activity.forecast_start_date || null,
            forecast_finish_date: p6Activity.ForecastFinishDate || p6Activity.forecast_finish_date || null,
            duration: p6Activity.Duration || p6Activity.duration || null,
            remaining_duration: p6Activity.RemainingDuration || p6Activity.remaining_duration || null,
            actual_duration: p6Activity.ActualDuration || p6Activity.actual_duration || null,
            physical_percent_complete: p6Activity.PhysicalPercentComplete || p6Activity.physical_percent_complete || 0,
            activity_type: p6Activity.ActivityType || p6Activity.activity_type || 'Task Dependent',
            critical: p6Activity.Critical || p6Activity.critical || false,
            p6_last_sync: new Date()
        };
    }

    /**
     * Sync activities for a project from Oracle P6 to local database
     * @param {string} p6ProjectId - Oracle P6 project ObjectId
     * @param {number} localProjectId - Local project ID
     * @returns {Promise<Object>} Sync result
     */
    async syncActivitiesForProject(p6ProjectId, localProjectId) {
        if (!this.pool) {
            throw new Error('Database pool not initialized');
        }

        try {
            console.log(`Starting activity sync for project ${p6ProjectId}...`);

            const p6Activities = await this.fetchActivitiesFromP6(p6ProjectId);
            console.log(`Fetched ${p6Activities.length} activities from Oracle P6`);

            let syncedCount = 0;
            let errorCount = 0;
            const errors = [];

            for (const p6Activity of p6Activities) {
                try {
                    const mappedActivity = this.mapP6ActivityToLocal(p6Activity, localProjectId);

                    // Upsert activity (insert or update)
                    const query = `
            INSERT INTO p6_activities (
              object_id, name, project_id, wbs_object_id, status, percent_complete,
              planned_start_date, planned_finish_date, actual_start_date, actual_finish_date,
              baseline_start_date, baseline_finish_date, forecast_start_date, forecast_finish_date,
              duration, remaining_duration, actual_duration, physical_percent_complete,
              activity_type, critical, p6_last_sync
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
            ON CONFLICT (object_id) 
            DO UPDATE SET 
              name = EXCLUDED.name,
              wbs_object_id = EXCLUDED.wbs_object_id,
              status = EXCLUDED.status,
              percent_complete = EXCLUDED.percent_complete,
              planned_start_date = EXCLUDED.planned_start_date,
              planned_finish_date = EXCLUDED.planned_finish_date,
              actual_start_date = EXCLUDED.actual_start_date,
              actual_finish_date = EXCLUDED.actual_finish_date,
              baseline_start_date = EXCLUDED.baseline_start_date,
              baseline_finish_date = EXCLUDED.baseline_finish_date,
              forecast_start_date = EXCLUDED.forecast_start_date,
              forecast_finish_date = EXCLUDED.forecast_finish_date,
              duration = EXCLUDED.duration,
              remaining_duration = EXCLUDED.remaining_duration,
              actual_duration = EXCLUDED.actual_duration,
              physical_percent_complete = EXCLUDED.physical_percent_complete,
              activity_type = EXCLUDED.activity_type,
              critical = EXCLUDED.critical,
              p6_last_sync = EXCLUDED.p6_last_sync,
              updated_at = CURRENT_TIMESTAMP
            RETURNING id
          `;

                    await this.pool.query(query, [
                        mappedActivity.object_id,
                        mappedActivity.name,
                        mappedActivity.project_id,
                        mappedActivity.wbs_object_id,
                        mappedActivity.status,
                        mappedActivity.percent_complete,
                        mappedActivity.planned_start_date,
                        mappedActivity.planned_finish_date,
                        mappedActivity.actual_start_date,
                        mappedActivity.actual_finish_date,
                        mappedActivity.baseline_start_date,
                        mappedActivity.baseline_finish_date,
                        mappedActivity.forecast_start_date,
                        mappedActivity.forecast_finish_date,
                        mappedActivity.duration,
                        mappedActivity.remaining_duration,
                        mappedActivity.actual_duration,
                        mappedActivity.physical_percent_complete,
                        mappedActivity.activity_type,
                        mappedActivity.critical,
                        mappedActivity.p6_last_sync
                    ]);

                    syncedCount++;
                } catch (error) {
                    console.error(`Error syncing activity:`, error.message);
                    errorCount++;
                    errors.push({ activity: p6Activity, error: error.message });
                }
            }

            console.log(`Activity sync completed: ${syncedCount} synced, ${errorCount} errors`);

            return {
                success: true,
                totalActivities: p6Activities.length,
                syncedCount,
                errorCount,
                errors: errors.length > 0 ? errors : undefined
            };
        } catch (error) {
            console.error(`Error syncing activities for project ${p6ProjectId}:`, error.message);
            throw error;
        }
    }
}

module.exports = OracleP6ActivityService;
