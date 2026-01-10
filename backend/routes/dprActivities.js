// server/routes/dprActivities.js
// DPR Activities API - Uses EXACT P6 API field names (camelCase)

const express = require('express');
const router = express.Router();

let pool;
let authenticateToken;

const setPool = (dbPool, authMiddleware) => {
    pool = dbPool;
    authenticateToken = authMiddleware;
};

const ensureAuth = (req, res, next) => {
    if (typeof authenticateToken === 'function') {
        return authenticateToken(req, res, next);
    }
    return res.status(401).json({ message: 'Authentication middleware not initialized' });
};

const ensurePool = (req, res, next) => {
    if (pool) {
        req.pool = pool;
        return next();
    }
    return res.status(500).json({ message: 'Database pool not initialized' });
};

const ensureAuthAndPool = [ensureAuth, ensurePool];

/**
 * GET /api/dpr-activities/projects
 */
router.get('/projects', ensureAuthAndPool, async (req, res) => {
    try {
        const result = await req.pool.query(`
            SELECT 
                p."objectId",
                p."projectId",
                p."name",
                p."status",
                p."startDate",
                p."finishDate",
                p."plannedStartDate",
                p."plannedFinishDate",
                p."dataDate",
                COUNT(a."activityObjectId") as "activityCount"
            FROM p6_projects p
            LEFT JOIN p6_activities a ON p."objectId" = a."projectObjectId"
            GROUP BY p."objectId", p."projectId", p."name", p."status",
                     p."startDate", p."finishDate", p."plannedStartDate",
                     p."plannedFinishDate", p."dataDate"
            ORDER BY p."name"
        `);

        res.json({
            success: true,
            count: result.rows.length,
            projects: result.rows
        });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/dpr-activities/activities/:projectObjectId
 * Returns activities with resource assignments, resources, WBS, UDFs
 */
router.get('/activities/:projectObjectId', ensureAuthAndPool, async (req, res) => {
    try {
        const { projectObjectId } = req.params;
        const { page = 1, limit = 100 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Get total count
        const countResult = await req.pool.query(
            'SELECT COUNT(*) FROM p6_activities WHERE "projectObjectId" = $1',
            [projectObjectId]
        );
        const totalCount = parseInt(countResult.rows[0].count);

        // Get activities with JOINs
        const result = await req.pool.query(`
            SELECT 
                a."activityObjectId",
                a."activityId",
                a."name",
                a."plannedStartDate",
                a."plannedFinishDate",
                a."actualStartDate",
                a."actualFinishDate",
                a."forecastFinishDate",
                a."status",
                a."wbsObjectId",
                a."projectObjectId",
                -- From resource_assignments
                ra."targetQty",
                ra."actualQty",
                ra."remainingQty",
                ra."actualUnits",
                ra."remainingUnits",
                -- Calculated % complete
                CASE 
                    WHEN ra."targetQty" > 0 THEN ROUND((ra."actualQty" / ra."targetQty") * 100, 2)
                    ELSE NULL 
                END AS "percentComplete",
                -- From resources
                r."name" AS "contractorName",
                COALESCE(uom."name", r."unitOfMeasure") AS "unitOfMeasure",
                r."resourceType",
                -- From WBS
                w."name" AS "wbsName",
                w."code" AS "wbsCode"
            FROM p6_activities a
            LEFT JOIN p6_resource_assignments ra ON a."activityObjectId" = ra."activityObjectId"
            LEFT JOIN p6_resources r ON ra."resourceObjectId" = r."resourceObjectId"
            LEFT JOIN p6_unit_of_measures uom ON r."unitOfMeasure"::BIGINT = uom."objectId"
            LEFT JOIN p6_wbs w ON a."wbsObjectId" = w."wbsObjectId"
            WHERE a."projectObjectId" = $1
            ORDER BY a."plannedStartDate", a."activityId"
            LIMIT $2 OFFSET $3
        `, [projectObjectId, parseInt(limit), offset]);

        // Get UDF values
        const activityIds = result.rows.map(r => r.activityObjectId);
        let udfMap = {};

        if (activityIds.length > 0) {
            const udfResult = await req.pool.query(`
                SELECT "foreignObjectId", "udfTypeTitle", "udfValue"
                FROM p6_activity_udf_values
                WHERE "foreignObjectId" = ANY($1)
            `, [activityIds]);

            for (const udf of udfResult.rows) {
                if (!udfMap[udf.foreignObjectId]) udfMap[udf.foreignObjectId] = {};
                udfMap[udf.foreignObjectId][udf.udfTypeTitle] = udf.udfValue;
            }
        }

        // Get activity codes
        let codeMap = {};
        if (activityIds.length > 0) {
            const codeResult = await req.pool.query(`
                SELECT 
                    aca."activityObjectId",
                    act."name" AS "codeTypeName",
                    ac."name" AS "codeName",
                    ac."codeValue"
                FROM p6_activity_code_assignments aca
                JOIN p6_activity_codes ac ON aca."activityCodeObjectId" = ac."objectId"
                JOIN p6_activity_code_types act ON ac."activityCodeTypeObjectId" = act."objectId"
                WHERE aca."activityObjectId" = ANY($1)
            `, [activityIds]);

            for (const code of codeResult.rows) {
                if (!codeMap[code.activityObjectId]) codeMap[code.activityObjectId] = {};
                codeMap[code.activityObjectId][code.codeTypeName] = code.codeName || code.codeValue;
            }
        }

        // Get WBS UDFs
        const wbsIds = [...new Set(result.rows.map(r => r.wbsObjectId).filter(Boolean))];
        let wbsUdfMap = {};

        if (wbsIds.length > 0) {
            const wbsUdfResult = await req.pool.query(`
                SELECT "foreignObjectId", "udfTypeTitle", "udfValue"
                FROM p6_wbs_udf_values
                WHERE "foreignObjectId" = ANY($1)
            `, [wbsIds]);

            for (const udf of wbsUdfResult.rows) {
                if (!wbsUdfMap[udf.foreignObjectId]) wbsUdfMap[udf.foreignObjectId] = {};
                wbsUdfMap[udf.foreignObjectId][udf.udfTypeTitle] = udf.udfValue;
            }
        }

        // Enrich activities
        const activities = result.rows.map(row => {
            const activityUdfs = udfMap[row.activityObjectId] || {};
            const activityCodes = codeMap[row.activityObjectId] || {};
            const wbsUdfs = wbsUdfMap[row.wbsObjectId] || {};

            return {
                // Core fields - exact P6 names
                activityObjectId: row.activityObjectId,
                activityId: row.activityId,
                name: row.name,
                status: row.status,

                // Dates
                plannedStartDate: row.plannedStartDate,
                plannedFinishDate: row.plannedFinishDate,
                actualStartDate: row.actualStartDate,
                actualFinishDate: row.actualFinishDate,
                forecastFinishDate: row.forecastFinishDate,

                // From resource assignments
                targetQty: row.targetQty,
                actualQty: row.actualQty,
                remainingQty: row.remainingQty,
                actualUnits: row.actualUnits,
                remainingUnits: row.remainingUnits,

                // Calculated
                percentComplete: row.percentComplete,

                // From resources
                contractorName: row.contractorName,
                unitOfMeasure: row.unitOfMeasure,
                resourceType: row.resourceType,

                // WBS
                wbsObjectId: row.wbsObjectId,
                wbsName: row.wbsName,
                wbsCode: row.wbsCode,

                // Activity UDFs
                scope: activityUdfs['Scope'] || null,
                front: activityUdfs['Front'] || null,
                remarks: activityUdfs['Remarks'] || null,
                holdDueToWTG: activityUdfs['Hold Due to WTG'] || null,

                // WBS UDFs
                blockCapacity: wbsUdfs['Block Capacity'] || wbsUdfs['Block Capacity (MWac)'] || null,
                spvNumber: wbsUdfs['SPV Number'] || null,
                block: wbsUdfs['Block'] || null,
                phase: wbsUdfs['Phase'] || null,

                // Activity Codes
                priority: activityCodes['Priority'] || null,
                plot: activityCodes['Plot'] || null,
                newBlockNom: activityCodes['New Block Nom'] || activityCodes['NewBlockNom'] || null
            };
        });

        res.json({
            success: true,
            projectObjectId: parseInt(projectObjectId),
            totalCount,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(totalCount / parseInt(limit)),
            activities
        });
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/dpr-activities/dp-qty/:projectObjectId
 */
router.get('/dp-qty/:projectObjectId', ensureAuthAndPool, async (req, res) => {
    try {
        const { projectObjectId } = req.params;

        const result = await req.pool.query(`
            SELECT 
                a."activityObjectId",
                a."activityId",
                a."name",
                a."status",
                a."plannedStartDate",
                a."plannedFinishDate",
                a."actualStartDate",
                a."actualFinishDate",
                a."forecastFinishDate",
                ra."targetQty",
                ra."actualQty",
                ra."remainingQty",
                CASE 
                    WHEN ra."targetQty" > 0 THEN ROUND((ra."actualQty" / ra."targetQty") * 100, 2)
                    ELSE NULL 
                END AS "percentComplete",
                r."name" AS "contractorName",
                COALESCE(uom."name", r."unitOfMeasure") AS "unitOfMeasure"
            FROM p6_activities a
            LEFT JOIN p6_resource_assignments ra ON a."activityObjectId" = ra."activityObjectId"
            LEFT JOIN p6_resources r ON ra."resourceObjectId" = r."resourceObjectId"
            LEFT JOIN p6_unit_of_measures uom ON r."unitOfMeasure"::BIGINT = uom."objectId"
            WHERE a."projectObjectId" = $1
            ORDER BY a."plannedStartDate", a."activityId"
        `, [projectObjectId]);

        const data = result.rows.map((row, index) => ({
            slNo: (index + 1).toString(),
            activityObjectId: row.activityObjectId,
            activityId: row.activityId,
            name: row.name,
            status: row.status,
            targetQty: row.targetQty ? parseFloat(row.targetQty) : null,
            actualQty: row.actualQty ? parseFloat(row.actualQty) : null,
            remainingQty: row.remainingQty ? parseFloat(row.remainingQty) : null,
            percentComplete: row.percentComplete ? parseFloat(row.percentComplete) : null,
            contractorName: row.contractorName,
            unitOfMeasure: row.unitOfMeasure,
            plannedStartDate: row.plannedStartDate ? row.plannedStartDate.toISOString().split('T')[0] : null,
            plannedFinishDate: row.plannedFinishDate ? row.plannedFinishDate.toISOString().split('T')[0] : null,
            actualStartDate: row.actualStartDate ? row.actualStartDate.toISOString().split('T')[0] : null,
            actualFinishDate: row.actualFinishDate ? row.actualFinishDate.toISOString().split('T')[0] : null,
            forecastFinishDate: row.forecastFinishDate ? row.forecastFinishDate.toISOString().split('T')[0] : null
        }));

        res.json({
            success: true,
            projectObjectId: parseInt(projectObjectId),
            count: data.length,
            data
        });
    } catch (error) {
        console.error('Error fetching DP Qty data:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/dpr-activities/manpower/:projectObjectId
 * Labor resources only
 */
router.get('/manpower/:projectObjectId', ensureAuthAndPool, async (req, res) => {
    try {
        const { projectObjectId } = req.params;

        const result = await req.pool.query(`
            SELECT 
                a."activityObjectId",
                a."activityId",
                a."name" AS activity,
                r."name" AS contractor,
                ra."actualUnits",
                ra."remainingUnits",
                w."name" AS block
            FROM p6_activities a
            JOIN p6_resource_assignments ra ON a."activityObjectId" = ra."activityObjectId"
            JOIN p6_resources r ON ra."resourceObjectId" = r."resourceObjectId"
            LEFT JOIN p6_wbs w ON a."wbsObjectId" = w."wbsObjectId"
            WHERE a."projectObjectId" = $1
              AND r."resourceType" = 'Labor'
            ORDER BY r."name", a."activityId"
        `, [projectObjectId]);

        res.json({
            success: true,
            projectObjectId: parseInt(projectObjectId),
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching manpower data:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/dpr-activities/activity-codes
 */
router.get('/activity-codes', ensureAuthAndPool, async (req, res) => {
    try {
        const codeTypes = await req.pool.query(`
            SELECT "objectId", "name", "scope", "projectObjectId"
            FROM p6_activity_code_types
            ORDER BY "name"
        `);

        const codes = await req.pool.query(`
            SELECT 
                c."objectId",
                c."name",
                c."codeValue",
                c."description",
                c."activityCodeTypeObjectId",
                t."name" as "codeTypeName"
            FROM p6_activity_codes c
            LEFT JOIN p6_activity_code_types t ON c."activityCodeTypeObjectId" = t."objectId"
            ORDER BY t."name", c."name"
        `);

        res.json({
            success: true,
            codeTypes: codeTypes.rows,
            codes: codes.rows
        });
    } catch (error) {
        console.error('Error fetching activity codes:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/dpr-activities/sync-status
 */
router.get('/sync-status', ensureAuthAndPool, async (req, res) => {
    try {
        const counts = await Promise.all([
            req.pool.query('SELECT COUNT(*) FROM p6_projects'),
            req.pool.query('SELECT COUNT(*) FROM p6_wbs'),
            req.pool.query('SELECT COUNT(*) FROM p6_activities'),
            req.pool.query('SELECT COUNT(*) FROM p6_resources'),
            req.pool.query('SELECT COUNT(*) FROM p6_resource_assignments'),
            req.pool.query('SELECT COUNT(*) FROM p6_activity_code_types'),
            req.pool.query('SELECT COUNT(*) FROM p6_activity_codes'),
            req.pool.query('SELECT MAX("lastSyncAt") as "lastSync" FROM p6_projects'),
            req.pool.query('SELECT MAX("lastSyncAt") as "lastSync" FROM p6_activities')
        ]);

        res.json({
            success: true,
            counts: {
                projects: parseInt(counts[0].rows[0].count),
                wbs: parseInt(counts[1].rows[0].count),
                activities: parseInt(counts[2].rows[0].count),
                resources: parseInt(counts[3].rows[0].count),
                resourceAssignments: parseInt(counts[4].rows[0].count),
                activityCodeTypes: parseInt(counts[5].rows[0].count),
                activityCodes: parseInt(counts[6].rows[0].count)
            },
            lastSync: {
                projects: counts[7].rows[0].lastSync,
                activities: counts[8].rows[0].lastSync
            }
        });
    } catch (error) {
        console.error('Error fetching sync status:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = { router, setPool };
