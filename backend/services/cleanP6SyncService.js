// server/services/cleanP6SyncService.js
// Clean P6 Sync Service - Fetches exact data from P6 API without fallbacks

const { restClient } = require('./oracleP6RestClient');
const pool = require('../db');

/**
 * Clean P6 Sync Service
 * - Fetches exact values from P6 API
 * - NO fallback values
 * - Stores to local database
 */
class CleanP6SyncService {
    constructor() {
        this.syncLog = [];
    }

    log(message) {
        console.log(`[P6 Sync] ${message}`);
        this.syncLog.push({ timestamp: new Date(), message });
    }

    /**
     * Sync all projects from P6
     */
    async syncProjects() {
        this.log('Starting projects sync...');

        // Only request valid fields as per P6 API /project/fields
        const projects = await restClient.get('/project', {
            Fields: 'ObjectId,Id,Name,Status,StartDate,FinishDate,PlannedStartDate,ForecastStartDate,ForecastFinishDate,DataDate,Description'
        });

        this.log(`Fetched ${projects.length} projects from P6`);

        for (const project of projects) {
            // Match existing p6_projects table schema
            await pool.query(`
                INSERT INTO p6_projects (
                    object_id, p6_id, name, status, 
                    start_date, finish_date, 
                    planned_start_date, forecast_start_date, forecast_finish_date,
                    data_date, description,
                    last_sync_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
                ON CONFLICT (object_id) DO UPDATE SET
                    p6_id = EXCLUDED.p6_id,
                    name = EXCLUDED.name,
                    status = EXCLUDED.status,
                    start_date = EXCLUDED.start_date,
                    finish_date = EXCLUDED.finish_date,
                    planned_start_date = EXCLUDED.planned_start_date,
                    forecast_start_date = EXCLUDED.forecast_start_date,
                    forecast_finish_date = EXCLUDED.forecast_finish_date,
                    data_date = EXCLUDED.data_date,
                    description = EXCLUDED.description,
                    last_sync_at = NOW()
            `, [
                project.ObjectId,
                project.Id,
                project.Name,
                project.Status,
                project.StartDate,
                project.FinishDate,
                project.PlannedStartDate,
                project.ForecastStartDate,
                project.ForecastFinishDate,
                project.DataDate,
                project.Description
            ]);
        }

        this.log(`Synced ${projects.length} projects to database`);
        return projects.length;
    }

    /**
     * Sync activities for a specific project
     */
    async syncActivitiesForProject(projectObjectId) {
        this.log(`Syncing activities for project ${projectObjectId}...`);

        // Fetch activities with only valid P6 API fields
        const activities = await restClient.get('/activity', {
            Fields: 'ObjectId,Id,Name,Status,PercentComplete,PlannedStartDate,PlannedFinishDate,ActualStartDate,ActualFinishDate,BaselineStartDate,BaselineFinishDate,PlannedNonLaborUnits,ActualNonLaborUnits,RemainingNonLaborUnits,PlannedDuration,ActualDuration,RemainingDuration,WBSObjectId,ProjectObjectId',
            Filter: `ProjectObjectId = ${projectObjectId}`
        });

        this.log(`Fetched ${activities.length} activities for project ${projectObjectId}`);

        for (const activity of activities) {
            await pool.query(`
                INSERT INTO p6_activities (
                    object_id, activity_id, name, status, percent_complete,
                    planned_start_date, planned_finish_date,
                    actual_start_date, actual_finish_date,
                    baseline_start_date, baseline_finish_date,
                    planned_non_labor_units, actual_non_labor_units, remaining_non_labor_units,
                    duration, actual_duration, remaining_duration,
                    wbs_object_id, project_object_id,
                    last_sync_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW())
                ON CONFLICT (object_id) DO UPDATE SET
                    activity_id = EXCLUDED.activity_id,
                    name = EXCLUDED.name,
                    status = EXCLUDED.status,
                    percent_complete = EXCLUDED.percent_complete,
                    planned_start_date = EXCLUDED.planned_start_date,
                    planned_finish_date = EXCLUDED.planned_finish_date,
                    actual_start_date = EXCLUDED.actual_start_date,
                    actual_finish_date = EXCLUDED.actual_finish_date,
                    baseline_start_date = EXCLUDED.baseline_start_date,
                    baseline_finish_date = EXCLUDED.baseline_finish_date,
                    planned_non_labor_units = EXCLUDED.planned_non_labor_units,
                    actual_non_labor_units = EXCLUDED.actual_non_labor_units,
                    remaining_non_labor_units = EXCLUDED.remaining_non_labor_units,
                    duration = EXCLUDED.duration,
                    actual_duration = EXCLUDED.actual_duration,
                    remaining_duration = EXCLUDED.remaining_duration,
                    wbs_object_id = EXCLUDED.wbs_object_id,
                    project_object_id = EXCLUDED.project_object_id,
                    last_sync_at = NOW()
            `, [
                activity.ObjectId,
                activity.Id,
                activity.Name,
                activity.Status,
                activity.PercentComplete,
                activity.PlannedStartDate,
                activity.PlannedFinishDate,
                activity.ActualStartDate,
                activity.ActualFinishDate,
                activity.BaselineStartDate,
                activity.BaselineFinishDate,
                activity.PlannedNonLaborUnits,
                activity.ActualNonLaborUnits,
                activity.RemainingNonLaborUnits,
                activity.PlannedDuration,
                activity.ActualDuration,
                activity.RemainingDuration,
                activity.WBSObjectId,
                activity.ProjectObjectId || projectObjectId
            ]);
        }

        this.log(`Synced ${activities.length} activities to database`);
        return activities.length;
    }

    /**
     * Sync Activity Code Types
     */
    async syncActivityCodeTypes() {
        this.log('Syncing activity code types...');

        const codeTypes = await restClient.get('/activityCodeType', {
            Fields: 'ObjectId,Name,SequenceNumber,Scope,ProjectObjectId'
        });

        this.log(`Fetched ${codeTypes.length} activity code types`);

        for (const codeType of codeTypes) {
            await pool.query(`
                INSERT INTO p6_activity_code_types (
                    object_id, name, sequence_number, project_object_id
                ) VALUES ($1, $2, $3, $4)
                ON CONFLICT (object_id) DO UPDATE SET
                    name = EXCLUDED.name,
                    sequence_number = EXCLUDED.sequence_number,
                    project_object_id = EXCLUDED.project_object_id
            `, [
                codeType.ObjectId,
                codeType.Name,
                codeType.SequenceNumber,
                codeType.ProjectObjectId
            ]);
        }

        return codeTypes.length;
    }

    /**
     * Sync Activity Codes
     */
    async syncActivityCodes() {
        this.log('Syncing activity codes...');

        const codes = await restClient.get('/activityCode', {
            Fields: 'ObjectId,CodeValue,Description,CodeTypeObjectId,Color,SequenceNumber'
        });

        this.log(`Fetched ${codes.length} activity codes`);

        for (const code of codes) {
            await pool.query(`
                INSERT INTO p6_activity_codes (
                    object_id, code_value, description, code_type_object_id, color, sequence_number
                ) VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (object_id) DO UPDATE SET
                    code_value = EXCLUDED.code_value,
                    description = EXCLUDED.description,
                    code_type_object_id = EXCLUDED.code_type_object_id,
                    color = EXCLUDED.color,
                    sequence_number = EXCLUDED.sequence_number
            `, [
                code.ObjectId,
                code.CodeValue,
                code.Description,
                code.CodeTypeObjectId,
                code.Color,
                code.SequenceNumber
            ]);
        }

        return codes.length;
    }

    /**
     * Sync Activity Code Assignments for a project's activities
     */
    async syncActivityCodeAssignmentsForProject(projectObjectId) {
        this.log(`Syncing activity code assignments for project ${projectObjectId}...`);

        // Get activities for this project first
        const activities = await pool.query(
            'SELECT object_id FROM p6_activities WHERE project_object_id = $1',
            [projectObjectId]
        );

        let totalAssignments = 0;

        // Fetch assignments in batches
        for (const activity of activities.rows) {
            try {
                const assignments = await restClient.get('/activityCodeAssignment', {
                    Fields: 'ActivityObjectId,ActivityCodeObjectId',
                    Filter: `ActivityObjectId = ${activity.object_id}`
                });

                for (const assignment of assignments) {
                    await pool.query(`
                        INSERT INTO p6_activity_code_assignments (
                            activity_object_id, activity_code_object_id
                        ) VALUES ($1, $2)
                        ON CONFLICT (activity_object_id, activity_code_object_id) DO NOTHING
                    `, [
                        assignment.ActivityObjectId,
                        assignment.ActivityCodeObjectId
                    ]);
                    totalAssignments++;
                }
            } catch (e) {
                // Skip if assignment fetch fails for this activity
                this.log(`Warning: Could not fetch assignments for activity ${activity.object_id}`);
            }
        }

        return totalAssignments;
    }

    /**
     * Sync UDF Values for activities in a project
     */
    async syncUDFValuesForProject(projectObjectId) {
        this.log(`Syncing UDF values for project ${projectObjectId}...`);

        try {
            const udfValues = await restClient.get('/udfValue', {
                Fields: 'ForeignObjectId,UDFTypeTitle,Text,Double,Integer,Cost,StartDate,FinishDate,CodeValue,Description',
                Filter: `ProjectObjectId = ${projectObjectId}`
            });

            this.log(`Fetched ${udfValues.length} UDF values`);

            for (const udf of udfValues) {
                await pool.query(`
                    INSERT INTO p6_udf_values (
                        foreign_object_id, udf_type_title, text_value, double_value, 
                        integer_value, cost_value, start_date, finish_date, code_value, description
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    ON CONFLICT (foreign_object_id, udf_type_title) DO UPDATE SET
                        text_value = EXCLUDED.text_value,
                        double_value = EXCLUDED.double_value,
                        integer_value = EXCLUDED.integer_value,
                        cost_value = EXCLUDED.cost_value,
                        start_date = EXCLUDED.start_date,
                        finish_date = EXCLUDED.finish_date,
                        code_value = EXCLUDED.code_value,
                        description = EXCLUDED.description
                `, [
                    udf.ForeignObjectId,
                    udf.UDFTypeTitle,
                    udf.Text,
                    udf.Double,
                    udf.Integer,
                    udf.Cost,
                    udf.StartDate,
                    udf.FinishDate,
                    udf.CodeValue,
                    udf.Description
                ]);
            }

            return udfValues.length;
        } catch (e) {
            this.log(`Warning: UDF values sync failed: ${e.message}`);
            return 0;
        }
    }

    /**
     * Full sync for a specific project
     */
    async syncProject(projectObjectId) {
        this.log(`=== Starting full sync for project ${projectObjectId} ===`);

        const results = {
            activities: 0,
            codeAssignments: 0,
            udfValues: 0
        };

        try {
            results.activities = await this.syncActivitiesForProject(projectObjectId);
            results.codeAssignments = await this.syncActivityCodeAssignmentsForProject(projectObjectId);
            results.udfValues = await this.syncUDFValuesForProject(projectObjectId);
        } catch (e) {
            this.log(`Error during sync: ${e.message}`);
            throw e;
        }

        this.log(`=== Sync complete for project ${projectObjectId} ===`);
        this.log(`Results: ${JSON.stringify(results)}`);

        return results;
    }

    /**
     * Full sync - all projects
     */
    async syncAll() {
        this.log('=== Starting FULL P6 SYNC ===');

        // Sync global data first
        await this.syncActivityCodeTypes();
        await this.syncActivityCodes();

        // Sync all projects
        const projectCount = await this.syncProjects();

        // Get all projects from database
        const projects = await pool.query('SELECT object_id, name FROM p6_projects');

        for (const project of projects.rows) {
            try {
                await this.syncProject(project.object_id);
            } catch (e) {
                this.log(`Error syncing project ${project.name}: ${e.message}`);
            }
        }

        this.log('=== FULL P6 SYNC COMPLETE ===');
        return { projectCount, syncLog: this.syncLog };
    }

    /**
     * Clear all P6 data (for fresh sync)
     */
    async clearAllData() {
        this.log('Clearing all P6 data...');

        await pool.query('TRUNCATE TABLE p6_udf_values CASCADE');
        await pool.query('TRUNCATE TABLE p6_activity_code_assignments CASCADE');
        await pool.query('TRUNCATE TABLE p6_activity_codes CASCADE');
        await pool.query('TRUNCATE TABLE p6_activity_code_types CASCADE');
        await pool.query('TRUNCATE TABLE p6_activities CASCADE');
        // Don't truncate projects as they're referenced by other tables

        this.log('All P6 data cleared');
    }
}

// Export singleton
const cleanP6SyncService = new CleanP6SyncService();
module.exports = { cleanP6SyncService, CleanP6SyncService };
