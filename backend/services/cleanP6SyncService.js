// server/services/cleanP6SyncService.js
// Clean P6 Sync Service - Uses EXACT P6 API field names (camelCase)
// Date: 2026-01-04

const { restClient } = require('./oracleP6RestClient');
const pool = require('../db');

/**
 * Clean P6 Sync Service
 * - Uses EXACT P6 API field names - no transformation
 * - Sync order: projects → wbs → activities → resources → resourceAssignments → UDFs
 */
class CleanP6SyncService {
    constructor() {
        this.syncLog = [];
    }

    log(message) {
        console.log(`[P6 Sync] ${message}`);
        this.syncLog.push({ timestamp: new Date(), message });
    }

    // ========================================================================
    // 1. SYNC PROJECTS
    // ========================================================================
    async syncProjects() {
        this.log('1/9 Starting projects sync...');

        const projects = await restClient.get('/project', {
            Fields: 'ObjectId,Id,Name,Status,StartDate,FinishDate,DataDate,Description'
        });

        this.log(`Fetched ${projects.length} projects from P6`);

        for (const project of projects) {
            await pool.query(`
                INSERT INTO p6_projects (
                    "objectId", "projectId", "name", "status",
                    "startDate", "finishDate", "plannedStartDate", "plannedFinishDate",
                    "dataDate", "description", "lastSyncAt"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
                ON CONFLICT ("objectId") DO UPDATE SET
                    "projectId" = EXCLUDED."projectId",
                    "name" = EXCLUDED."name",
                    "status" = EXCLUDED."status",
                    "startDate" = EXCLUDED."startDate",
                    "finishDate" = EXCLUDED."finishDate",
                    "plannedStartDate" = EXCLUDED."plannedStartDate",
                    "plannedFinishDate" = EXCLUDED."plannedFinishDate",
                    "dataDate" = EXCLUDED."dataDate",
                    "description" = EXCLUDED."description",
                    "lastSyncAt" = NOW()
            `, [
                project.ObjectId,
                project.Id,
                project.Name,
                project.Status,
                project.StartDate,
                project.FinishDate,
                project.PlannedStartDate,
                project.PlannedFinishDate,
                project.DataDate,
                project.Description
            ]);
        }

        this.log(`✓ Synced ${projects.length} projects`);
        return projects.length;
    }

    // ========================================================================
    // 2. SYNC WBS
    // ========================================================================
    async syncWBS() {
        this.log('2/9 Starting WBS sync...');

        const wbsList = await restClient.get('/wbs', {
            Fields: 'ObjectId,Name,ParentObjectId,ProjectObjectId,Code,Status'
        });

        this.log(`Fetched ${wbsList.length} WBS elements from P6`);

        for (const wbs of wbsList) {
            await pool.query(`
                INSERT INTO p6_wbs (
                    "wbsObjectId", "name", "parentObjectId", "projectObjectId", "code", "status", "lastSyncAt"
                ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
                ON CONFLICT ("wbsObjectId") DO UPDATE SET
                    "name" = EXCLUDED."name",
                    "parentObjectId" = EXCLUDED."parentObjectId",
                    "projectObjectId" = EXCLUDED."projectObjectId",
                    "code" = EXCLUDED."code",
                    "status" = EXCLUDED."status",
                    "lastSyncAt" = NOW()
            `, [
                wbs.ObjectId,
                wbs.Name,
                wbs.ParentObjectId,
                wbs.ProjectObjectId,
                wbs.Code,
                wbs.Status
            ]);
        }

        this.log(`✓ Synced ${wbsList.length} WBS elements`);
        return wbsList.length;
    }

    // ========================================================================
    // 3. SYNC ACTIVITIES
    // ========================================================================
    async syncActivities() {
        this.log('3/9 Starting activities sync...');

        const activities = await restClient.get('/activity', {
            Fields: 'ObjectId,Id,Name,PlannedStartDate,PlannedFinishDate,ActualStartDate,ActualFinishDate,ForecastFinishDate,Status,WBSObjectId,ProjectObjectId'
        });

        this.log(`Fetched ${activities.length} activities from P6`);

        for (const activity of activities) {
            await pool.query(`
                INSERT INTO p6_activities (
                    "activityObjectId", "activityId", "name",
                    "plannedStartDate", "plannedFinishDate",
                    "actualStartDate", "actualFinishDate", "forecastFinishDate",
                    "status", "wbsObjectId", "projectObjectId", "lastSyncAt"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
                ON CONFLICT ("activityObjectId") DO UPDATE SET
                    "activityId" = EXCLUDED."activityId",
                    "name" = EXCLUDED."name",
                    "plannedStartDate" = EXCLUDED."plannedStartDate",
                    "plannedFinishDate" = EXCLUDED."plannedFinishDate",
                    "actualStartDate" = EXCLUDED."actualStartDate",
                    "actualFinishDate" = EXCLUDED."actualFinishDate",
                    "forecastFinishDate" = EXCLUDED."forecastFinishDate",
                    "status" = EXCLUDED."status",
                    "wbsObjectId" = EXCLUDED."wbsObjectId",
                    "projectObjectId" = EXCLUDED."projectObjectId",
                    "lastSyncAt" = NOW()
            `, [
                activity.ObjectId,
                activity.Id,
                activity.Name,
                activity.PlannedStartDate,
                activity.PlannedFinishDate,
                activity.ActualStartDate,
                activity.ActualFinishDate,
                activity.ForecastFinishDate,
                activity.Status,
                activity.WBSObjectId,
                activity.ProjectObjectId
            ]);
        }

        this.log(`✓ Synced ${activities.length} activities`);
        return activities.length;
    }

    // ========================================================================
    // 4. SYNC RESOURCES
    // ========================================================================
    async syncResources() {
        this.log('4/9 Starting resources sync...');

        const resources = await restClient.get('/resource', {
            Fields: 'ObjectId,Id,Name,UnitOfMeasure,ResourceType'
        });

        this.log(`Fetched ${resources.length} resources from P6`);

        for (const resource of resources) {
            await pool.query(`
                INSERT INTO p6_resources (
                    "resourceObjectId", "resourceId", "name", "unitOfMeasure", "resourceType", "lastSyncAt"
                ) VALUES ($1, $2, $3, $4, $5, NOW())
                ON CONFLICT ("resourceObjectId") DO UPDATE SET
                    "resourceId" = EXCLUDED."resourceId",
                    "name" = EXCLUDED."name",
                    "unitOfMeasure" = EXCLUDED."unitOfMeasure",
                    "resourceType" = EXCLUDED."resourceType",
                    "lastSyncAt" = NOW()
            `, [
                resource.ObjectId,
                resource.Id,
                resource.Name,
                resource.UnitOfMeasure,
                resource.ResourceType
            ]);
        }

        this.log(`✓ Synced ${resources.length} resources`);
        return resources.length;
    }

    // ========================================================================
    // 4.5 SYNC UNIT OF MEASURES (Lookup Table)
    // ========================================================================
    async syncUnitOfMeasures() {
        this.log('4.5/10 Starting unit of measures sync...');

        try {
            const uomList = await restClient.get('/unitOfMeasure', {
                Fields: 'ObjectId,Name'
            });

            this.log(`Fetched ${uomList.length} units of measure from P6`);

            for (const uom of uomList) {
                await pool.query(`
                    INSERT INTO p6_unit_of_measures (
                        "objectId", "name", "lastSyncAt"
                    ) VALUES ($1, $2, NOW())
                    ON CONFLICT ("objectId") DO UPDATE SET
                        "name" = EXCLUDED."name",
                        "lastSyncAt" = NOW()
                `, [
                    uom.ObjectId,
                    uom.Name
                ]);
            }

            this.log(`✓ Synced ${uomList.length} units of measure`);
            return uomList.length;
        } catch (e) {
            this.log(`Warning: Unit of measures sync failed: ${e.message}`);
            return 0;
        }
    }

    // ========================================================================
    // 5. SYNC RESOURCE ASSIGNMENTS
    // P6 API uses: PlannedUnits/BudgetedUnits = Total Qty, ActualUnits, RemainingUnits
    // We map: PlannedUnits → targetQty, ActualUnits → actualQty, RemainingUnits → remainingQty
    // ========================================================================
    async syncResourceAssignments() {
        this.log('5/9 Starting resource assignments sync...');

        // P6 API actual fields (not TargetQty/ActualQty - those don't exist)
        const assignments = await restClient.get('/resourceAssignment', {
            Fields: 'ObjectId,ActivityObjectId,ResourceObjectId,PlannedUnits,ActualUnits,RemainingUnits,BudgetedUnits,ProjectObjectId'
        });

        this.log(`Fetched ${assignments.length} resource assignments from P6`);

        for (const ra of assignments) {
            // Map P6 fields to our DB columns:
            // PlannedUnits (or BudgetedUnits) → targetQty (Total Quantity)
            // ActualUnits → actualQty AND actualUnits (same value in P6)
            // RemainingUnits → remainingQty AND remainingUnits
            const targetQty = ra.PlannedUnits || ra.BudgetedUnits || null;

            await pool.query(`
                INSERT INTO p6_resource_assignments (
                    "objectId", "activityObjectId", "resourceObjectId",
                    "targetQty", "actualQty", "remainingQty",
                    "actualUnits", "remainingUnits", "projectObjectId", "lastSyncAt"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
                ON CONFLICT ("objectId") DO UPDATE SET
                    "activityObjectId" = EXCLUDED."activityObjectId",
                    "resourceObjectId" = EXCLUDED."resourceObjectId",
                    "targetQty" = EXCLUDED."targetQty",
                    "actualQty" = EXCLUDED."actualQty",
                    "remainingQty" = EXCLUDED."remainingQty",
                    "actualUnits" = EXCLUDED."actualUnits",
                    "remainingUnits" = EXCLUDED."remainingUnits",
                    "projectObjectId" = EXCLUDED."projectObjectId",
                    "lastSyncAt" = NOW()
            `, [
                ra.ObjectId,
                ra.ActivityObjectId,
                ra.ResourceObjectId,
                targetQty,                    // PlannedUnits/BudgetedUnits → targetQty
                ra.ActualUnits,               // ActualUnits → actualQty
                ra.RemainingUnits,            // RemainingUnits → remainingQty
                ra.ActualUnits,               // Also store as actualUnits (for manpower)
                ra.RemainingUnits,            // Also store as remainingUnits (for manpower)
                ra.ProjectObjectId
            ]);
        }

        this.log(`✓ Synced ${assignments.length} resource assignments`);
        return assignments.length;
    }

    // ========================================================================
    // 6. SYNC ACTIVITY UDF VALUES
    // ========================================================================
    async syncActivityUDFValues() {
        this.log('6/9 Starting activity UDF values sync...');

        try {
            const udfValues = await restClient.get('/udfValue', {
                Fields: 'ForeignObjectId,UDFTypeObjectId,UDFTypeTitle,Text,Double,Integer,CodeValue'
            });

            const activityObjectIds = await pool.query('SELECT "activityObjectId" FROM p6_activities');
            const activityIds = new Set(activityObjectIds.rows.map(r => r.activityObjectId));

            let count = 0;
            for (const udf of udfValues) {
                if (activityIds.has(udf.ForeignObjectId)) {
                    const value = udf.Text || udf.Double?.toString() || udf.Integer?.toString() || udf.CodeValue || null;

                    await pool.query(`
                        INSERT INTO p6_activity_udf_values (
                            "foreignObjectId", "udfTypeObjectId", "udfTypeTitle", "udfValue"
                        ) VALUES ($1, $2, $3, $4)
                        ON CONFLICT ("foreignObjectId", "udfTypeObjectId") DO UPDATE SET
                            "udfTypeTitle" = EXCLUDED."udfTypeTitle",
                            "udfValue" = EXCLUDED."udfValue"
                    `, [udf.ForeignObjectId, udf.UDFTypeObjectId, udf.UDFTypeTitle, value]);
                    count++;
                }
            }

            this.log(`✓ Synced ${count} activity UDF values`);
            return count;
        } catch (e) {
            this.log(`Warning: Activity UDF sync failed: ${e.message}`);
            return 0;
        }
    }

    // ========================================================================
    // 7. SYNC WBS UDF VALUES
    // ========================================================================
    async syncWBSUDFValues() {
        this.log('7/9 Starting WBS UDF values sync...');

        try {
            const udfValues = await restClient.get('/udfValue', {
                Fields: 'ForeignObjectId,UDFTypeObjectId,UDFTypeTitle,Text,Double,Integer,CodeValue'
            });

            const wbsObjectIds = await pool.query('SELECT "wbsObjectId" FROM p6_wbs');
            const wbsIds = new Set(wbsObjectIds.rows.map(r => r.wbsObjectId));

            let count = 0;
            for (const udf of udfValues) {
                if (wbsIds.has(udf.ForeignObjectId)) {
                    const value = udf.Text || udf.Double?.toString() || udf.Integer?.toString() || udf.CodeValue || null;

                    await pool.query(`
                        INSERT INTO p6_wbs_udf_values (
                            "foreignObjectId", "udfTypeObjectId", "udfTypeTitle", "udfValue"
                        ) VALUES ($1, $2, $3, $4)
                        ON CONFLICT ("foreignObjectId", "udfTypeObjectId") DO UPDATE SET
                            "udfTypeTitle" = EXCLUDED."udfTypeTitle",
                            "udfValue" = EXCLUDED."udfValue"
                    `, [udf.ForeignObjectId, udf.UDFTypeObjectId, udf.UDFTypeTitle, value]);
                    count++;
                }
            }

            this.log(`✓ Synced ${count} WBS UDF values`);
            return count;
        } catch (e) {
            this.log(`Warning: WBS UDF sync failed: ${e.message}`);
            return 0;
        }
    }

    // ========================================================================
    // 8. SYNC PROJECT UDF VALUES
    // ========================================================================
    async syncProjectUDFValues() {
        this.log('8/9 Starting project UDF values sync...');

        try {
            const udfValues = await restClient.get('/udfValue', {
                Fields: 'ForeignObjectId,UDFTypeObjectId,UDFTypeTitle,Text,Double,Integer,CodeValue'
            });

            const projectObjectIds = await pool.query('SELECT "objectId" FROM p6_projects');
            const projectIds = new Set(projectObjectIds.rows.map(r => r.objectId));

            let count = 0;
            for (const udf of udfValues) {
                if (projectIds.has(udf.ForeignObjectId)) {
                    const value = udf.Text || udf.Double?.toString() || udf.Integer?.toString() || udf.CodeValue || null;

                    await pool.query(`
                        INSERT INTO p6_project_udf_values (
                            "foreignObjectId", "udfTypeObjectId", "udfTypeTitle", "udfValue"
                        ) VALUES ($1, $2, $3, $4)
                        ON CONFLICT ("foreignObjectId", "udfTypeObjectId") DO UPDATE SET
                            "udfTypeTitle" = EXCLUDED."udfTypeTitle",
                            "udfValue" = EXCLUDED."udfValue"
                    `, [udf.ForeignObjectId, udf.UDFTypeObjectId, udf.UDFTypeTitle, value]);
                    count++;
                }
            }

            this.log(`✓ Synced ${count} project UDF values`);
            return count;
        } catch (e) {
            this.log(`Warning: Project UDF sync failed: ${e.message}`);
            return 0;
        }
    }

    // ========================================================================
    // 9. SYNC ACTIVITY CODE ASSIGNMENTS
    // ========================================================================
    async syncActivityCodeAssignments() {
        this.log('9/9 Starting activity code assignments sync...');

        try {
            // Activity Code Types
            const codeTypes = await restClient.get('/activityCodeType', {
                Fields: 'ObjectId,Name,Scope,ProjectObjectId'
            });

            for (const ct of codeTypes) {
                await pool.query(`
                    INSERT INTO p6_activity_code_types ("objectId", "name", "scope", "projectObjectId")
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT ("objectId") DO UPDATE SET
                        "name" = EXCLUDED."name",
                        "scope" = EXCLUDED."scope",
                        "projectObjectId" = EXCLUDED."projectObjectId"
                `, [ct.ObjectId, ct.Name, ct.Scope, ct.ProjectObjectId]);
            }
            this.log(`  Synced ${codeTypes.length} activity code types`);

            // Activity Codes
            const codes = await restClient.get('/activityCode', {
                Fields: 'ObjectId,Name,CodeValue,Description,CodeTypeObjectId,Color'
            });

            for (const code of codes) {
                await pool.query(`
                    INSERT INTO p6_activity_codes ("objectId", "name", "codeValue", "description", "activityCodeTypeObjectId", "color")
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT ("objectId") DO UPDATE SET
                        "name" = EXCLUDED."name",
                        "codeValue" = EXCLUDED."codeValue",
                        "description" = EXCLUDED."description",
                        "activityCodeTypeObjectId" = EXCLUDED."activityCodeTypeObjectId",
                        "color" = EXCLUDED."color"
                `, [code.ObjectId, code.Name, code.CodeValue, code.Description, code.CodeTypeObjectId, code.Color]);
            }
            this.log(`  Synced ${codes.length} activity codes`);

            // Activity Code Assignments
            const assignments = await restClient.get('/activityCodeAssignment', {
                Fields: 'ActivityObjectId,ActivityCodeObjectId'
            });

            for (const assign of assignments) {
                await pool.query(`
                    INSERT INTO p6_activity_code_assignments ("activityObjectId", "activityCodeObjectId")
                    VALUES ($1, $2)
                    ON CONFLICT ("activityObjectId", "activityCodeObjectId") DO NOTHING
                `, [assign.ActivityObjectId, assign.ActivityCodeObjectId]);
            }

            this.log(`✓ Synced ${assignments.length} activity code assignments`);
            return assignments.length;
        } catch (e) {
            this.log(`Warning: Activity code assignments sync failed: ${e.message}`);
            return 0;
        }
    }

    // ========================================================================
    // FULL SYNC
    // ========================================================================
    async syncAll() {
        this.log('=== STARTING FULL P6 SYNC ===');
        this.syncLog = [];

        const results = {
            projects: 0,
            wbs: 0,
            activities: 0,
            resources: 0,
            unitOfMeasures: 0,
            resourceAssignments: 0,
            activityUDFValues: 0,
            wbsUDFValues: 0,
            projectUDFValues: 0,
            activityCodeAssignments: 0
        };

        try {
            results.projects = await this.syncProjects();
            results.wbs = await this.syncWBS();
            results.activities = await this.syncActivities();
            results.resources = await this.syncResources();
            results.unitOfMeasures = await this.syncUnitOfMeasures();
            results.resourceAssignments = await this.syncResourceAssignments();
            results.activityUDFValues = await this.syncActivityUDFValues();
            results.wbsUDFValues = await this.syncWBSUDFValues();
            results.projectUDFValues = await this.syncProjectUDFValues();
            results.activityCodeAssignments = await this.syncActivityCodeAssignments();

            this.log('=== FULL P6 SYNC COMPLETE ===');
            return { success: true, results, syncLog: this.syncLog };
        } catch (e) {
            this.log(`ERROR: ${e.message}`);
            return { success: false, error: e.message, results, syncLog: this.syncLog };
        }
    }

    async syncProject(projectObjectId) {
        this.log(`=== Syncing project ${projectObjectId} ===`);
        return this.syncAll();
    }

    async clearAllData() {
        this.log('Clearing all P6 data...');
        await pool.query('TRUNCATE TABLE p6_activity_code_assignments CASCADE');
        await pool.query('TRUNCATE TABLE p6_activity_codes CASCADE');
        await pool.query('TRUNCATE TABLE p6_activity_code_types CASCADE');
        await pool.query('TRUNCATE TABLE p6_project_udf_values CASCADE');
        await pool.query('TRUNCATE TABLE p6_wbs_udf_values CASCADE');
        await pool.query('TRUNCATE TABLE p6_activity_udf_values CASCADE');
        await pool.query('TRUNCATE TABLE p6_resource_assignments CASCADE');
        await pool.query('TRUNCATE TABLE p6_resources CASCADE');
        await pool.query('TRUNCATE TABLE p6_unit_of_measures CASCADE');
        await pool.query('TRUNCATE TABLE p6_activities CASCADE');
        await pool.query('TRUNCATE TABLE p6_wbs CASCADE');
        await pool.query('TRUNCATE TABLE p6_projects CASCADE');
        this.log('✓ All P6 data cleared');
    }
}

const cleanP6SyncService = new CleanP6SyncService();
module.exports = { cleanP6SyncService, CleanP6SyncService };
