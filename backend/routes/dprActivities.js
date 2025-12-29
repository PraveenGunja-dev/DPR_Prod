// server/routes/dprActivities.js
// DPR Activities API - Reads from local database (synced from P6)
// NO FALLBACK VALUES - Returns exact P6 data

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
 * Get all projects with activity counts
 */
router.get('/projects', ensureAuthAndPool, async (req, res) => {
    try {
        const result = await req.pool.query(`
            SELECT 
                p.object_id,
                p.p6_id as project_id,
                p.name,
                p.status,
                p.start_date,
                p.finish_date,
                p.planned_start_date,
                p.forecast_start_date,
                p.forecast_finish_date,
                p.data_date,
                COUNT(a.object_id) as activity_count
            FROM p6_projects p
            LEFT JOIN p6_activities a ON p.object_id = a.project_object_id
            GROUP BY p.object_id, p.p6_id, p.name, p.status, 
                     p.start_date, p.finish_date, p.planned_start_date,
                     p.forecast_start_date, p.forecast_finish_date, p.data_date
            ORDER BY p.name
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
 * Get all activities for a specific project (exact P6 data)
 */
router.get('/activities/:projectObjectId', ensureAuthAndPool, async (req, res) => {
    try {
        const { projectObjectId } = req.params;
        const { page = 1, limit = 100 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Get total count
        const countResult = await req.pool.query(
            'SELECT COUNT(*) FROM p6_activities WHERE project_object_id = $1',
            [projectObjectId]
        );
        const totalCount = parseInt(countResult.rows[0].count);

        // Get activities with pagination
        const result = await req.pool.query(`
            SELECT 
                a.object_id,
                a.activity_id,
                a.name,
                a.status,
                a.percent_complete,
                a.planned_start_date,
                a.planned_finish_date,
                a.actual_start_date,
                a.actual_finish_date,
                a.baseline_start_date,
                a.baseline_finish_date,
                a.planned_non_labor_units as total_quantity,
                a.actual_non_labor_units as actual_quantity,
                a.remaining_non_labor_units as remaining_quantity,
                a.duration as planned_duration,
                a.actual_duration,
                a.remaining_duration,
                a.wbs_object_id,
                a.project_object_id,
                a.last_sync_at
            FROM p6_activities a
            WHERE a.project_object_id = $1
            ORDER BY a.planned_start_date, a.activity_id
            LIMIT $2 OFFSET $3
        `, [projectObjectId, parseInt(limit), offset]);

        res.json({
            success: true,
            projectObjectId: parseInt(projectObjectId),
            totalCount,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(totalCount / parseInt(limit)),
            activities: result.rows
        });
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/dpr-activities/dp-qty/:projectObjectId
 * Get activities mapped to DP Qty table format (exact P6 data, no defaults)
 */
router.get('/dp-qty/:projectObjectId', ensureAuthAndPool, async (req, res) => {
    try {
        const { projectObjectId } = req.params;

        const result = await req.pool.query(`
            SELECT 
                a.object_id,
                a.activity_id,
                a.name as description,
                a.status,
                a.percent_complete,
                a.planned_non_labor_units as total_quantity,
                a.actual_non_labor_units as actual_quantity,
                a.planned_start_date as base_plan_start,
                a.planned_finish_date as base_plan_finish,
                a.baseline_start_date as forecast_start,
                a.baseline_finish_date as forecast_finish,
                a.actual_start_date,
                a.actual_finish_date,
                a.duration as planned_duration,
                a.wbs_object_id
            FROM p6_activities a
            WHERE a.project_object_id = $1
            ORDER BY a.planned_start_date, a.activity_id
        `, [projectObjectId]);

        // Map to DP Qty format - NO FALLBACK VALUES
        const dpQtyData = result.rows.map((row, index) => ({
            slNo: (index + 1).toString(),
            objectId: row.object_id,
            activityId: row.activity_id || null,
            description: row.description || null,
            status: row.status || null,
            percentComplete: row.percent_complete !== null ? parseFloat(row.percent_complete) : null,
            totalQuantity: row.total_quantity !== null ? parseFloat(row.total_quantity) : null,
            actualQuantity: row.actual_quantity !== null ? parseFloat(row.actual_quantity) : null,
            uom: null, // Not available from P6 - needs manual entry
            basePlanStart: row.base_plan_start ? row.base_plan_start.toISOString().split('T')[0] : null,
            basePlanFinish: row.base_plan_finish ? row.base_plan_finish.toISOString().split('T')[0] : null,
            forecastStart: row.forecast_start ? row.forecast_start.toISOString().split('T')[0] : null,
            forecastFinish: row.forecast_finish ? row.forecast_finish.toISOString().split('T')[0] : null,
            actualStart: row.actual_start_date ? row.actual_start_date.toISOString().split('T')[0] : null,
            actualFinish: row.actual_finish_date ? row.actual_finish_date.toISOString().split('T')[0] : null,
            plannedDuration: row.planned_duration !== null ? parseFloat(row.planned_duration) : null,
            // Fields that need manual entry (not in P6 API)
            blockCapacity: null,
            phase: null,
            block: null,
            spvNumber: null,
            scope: null,
            hold: null,
            front: null,
            priority: null,
            plot: null
        }));

        res.json({
            success: true,
            projectObjectId: parseInt(projectObjectId),
            count: dpQtyData.length,
            data: dpQtyData
        });
    } catch (error) {
        console.error('Error fetching DP Qty data:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/dpr-activities/activity-codes
 * Get all activity code types and codes (for Priority, Plot, Block mapping)
 */
router.get('/activity-codes', ensureAuthAndPool, async (req, res) => {
    try {
        // Get code types
        const codeTypes = await req.pool.query(`
            SELECT object_id, name, sequence_number, project_object_id
            FROM p6_activity_code_types
            ORDER BY name
        `);

        // Get codes
        const codes = await req.pool.query(`
            SELECT 
                c.object_id,
                c.code_value,
                c.description,
                c.code_type_object_id,
                t.name as code_type_name
            FROM p6_activity_codes c
            LEFT JOIN p6_activity_code_types t ON c.code_type_object_id = t.object_id
            ORDER BY t.name, c.sequence_number
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
 * Get sync status and last sync time
 */
router.get('/sync-status', ensureAuthAndPool, async (req, res) => {
    try {
        const counts = await Promise.all([
            req.pool.query('SELECT COUNT(*) FROM p6_projects'),
            req.pool.query('SELECT COUNT(*) FROM p6_activities'),
            req.pool.query('SELECT COUNT(*) FROM p6_activity_code_types'),
            req.pool.query('SELECT COUNT(*) FROM p6_activity_codes'),
            req.pool.query('SELECT MAX(last_sync_at) as last_sync FROM p6_projects'),
            req.pool.query('SELECT MAX(last_sync_at) as last_sync FROM p6_activities')
        ]);

        res.json({
            success: true,
            counts: {
                projects: parseInt(counts[0].rows[0].count),
                activities: parseInt(counts[1].rows[0].count),
                activityCodeTypes: parseInt(counts[2].rows[0].count),
                activityCodes: parseInt(counts[3].rows[0].count)
            },
            lastSync: {
                projects: counts[4].rows[0].last_sync,
                activities: counts[5].rows[0].last_sync
            }
        });
    } catch (error) {
        console.error('Error fetching sync status:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = { router, setPool };
