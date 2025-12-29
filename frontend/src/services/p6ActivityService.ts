// src/services/p6ActivityService.ts
// Service to fetch P6 activities for supervisor tables
// UPDATED: Uses clean /api/dpr-activities endpoints - NO FALLBACK VALUES

import apiClient from './apiClient';

export interface P6Activity {
    // Core identifiers
    objectId: number;
    activityId: string | null;
    slNo: number;

    // Description
    description: string | null;

    // Status fields
    status: string | null;
    percentComplete: number | null;

    // Quantities - EXACT P6 VALUES
    totalQuantity: number | null;
    actualQuantity: number | null;
    remainingQuantity: number | null;

    // Date fields - EXACT P6 VALUES
    basePlanStart: string | null;
    basePlanFinish: string | null;
    forecastStart: string | null;
    forecastFinish: string | null;
    actualStart: string | null;
    actualFinish: string | null;

    // Duration
    plannedDuration: number | null;

    // Fields that need manual entry (not available from P6 API)
    uom: string | null;
    blockCapacity: number | null;
    phase: string | null;
    block: string | null;
    spvNumber: string | null;
    scope: string | null;
    hold: string | null;
    front: string | null;
    priority: string | null;
    plot: string | null;

    // User-editable fields (stored locally)
    remarks?: string;
    cumulative?: string;
    yesterday?: string;
    today?: string;
}

export interface PaginationInfo {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
}

export interface P6ActivitiesResponse {
    success: boolean;
    projectObjectId: number;
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
    activities: P6Activity[];
    // Nested pagination object for backward compatibility with SupervisorDashboard
    pagination?: PaginationInfo;
}

export interface DPQtyResponse {
    success: boolean;
    projectObjectId: number;
    count: number;
    data: P6Activity[];
}

/**
 * Fetch P6 activities for a specific project with pagination
 * Uses new clean API - NO FALLBACK VALUES
 */
export const getP6ActivitiesPaginated = async (
    projectObjectId: number | string,
    page: number = 1,
    limit: number = 100
): Promise<P6ActivitiesResponse> => {
    try {
        const response = await apiClient.get<P6ActivitiesResponse>(
            `/api/dpr-activities/activities/${projectObjectId}?page=${page}&limit=${limit}`
        );

        const data = response.data;

        // Build pagination object for backward compatibility with SupervisorDashboard
        const pagination: PaginationInfo = {
            page: data.page,
            limit: data.limit,
            totalCount: data.totalCount,
            totalPages: data.totalPages,
            hasMore: data.page < data.totalPages
        };

        // Transform activities to match expected format
        const activities: P6Activity[] = data.activities.map((a: any, index: number) => ({
            objectId: a.object_id,
            activityId: a.activity_id,
            slNo: index + 1 + ((page - 1) * limit),
            description: a.name,
            status: a.status,
            percentComplete: a.percent_complete ? parseFloat(a.percent_complete) : null,
            totalQuantity: a.total_quantity ? parseFloat(a.total_quantity) : null,
            actualQuantity: a.actual_quantity ? parseFloat(a.actual_quantity) : null,
            remainingQuantity: a.remaining_quantity ? parseFloat(a.remaining_quantity) : null,
            basePlanStart: a.planned_start_date ? a.planned_start_date.split('T')[0] : null,
            basePlanFinish: a.planned_finish_date ? a.planned_finish_date.split('T')[0] : null,
            forecastStart: a.baseline_start_date ? a.baseline_start_date.split('T')[0] : null,
            forecastFinish: a.baseline_finish_date ? a.baseline_finish_date.split('T')[0] : null,
            actualStart: a.actual_start_date ? a.actual_start_date.split('T')[0] : null,
            actualFinish: a.actual_finish_date ? a.actual_finish_date.split('T')[0] : null,
            plannedDuration: a.planned_duration ? parseFloat(a.planned_duration) : null,
            // Fields not available from P6 API - return null
            uom: null,
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

        console.log(`Fetched ${activities.length} P6 activities for project ${projectObjectId} (page ${page}/${pagination.totalPages})`);

        return {
            ...data,
            activities,
            pagination
        };
    } catch (error) {
        console.error('Error fetching P6 activities:', error);
        throw error;
    }
};

/**
 * Fetch P6 activities in DP Qty format (all activities, no pagination)
 * Uses new clean API - NO FALLBACK VALUES
 */
export const getDPQtyActivities = async (
    projectObjectId: number | string
): Promise<DPQtyResponse> => {
    try {
        const response = await apiClient.get<DPQtyResponse>(
            `/api/dpr-activities/dp-qty/${projectObjectId}`
        );
        console.log(`Fetched ${response.data.count} DP Qty activities for project ${projectObjectId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching DP Qty activities:', error);
        throw error;
    }
};

/**
 * Fetch P6 activities for a specific project (legacy - fetches first page only)
 * @deprecated Use getP6ActivitiesPaginated for better performance
 */
export const getP6ActivitiesForProject = async (projectObjectId: number | string): Promise<P6Activity[]> => {
    try {
        const response = await getP6ActivitiesPaginated(projectObjectId, 1, 100);
        return response.activities;
    } catch (error) {
        console.error('Error fetching P6 activities:', error);
        throw error;
    }
};

/**
 * Get sync status
 */
export const getSyncStatus = async () => {
    try {
        const response = await apiClient.get('/api/dpr-activities/sync-status');
        return response.data;
    } catch (error) {
        console.error('Error fetching sync status:', error);
        throw error;
    }
};

/**
 * Trigger P6 sync (placeholder - sync is now handled by backend scheduled job)
 * Kept for backward compatibility with existing components
 */
export const syncP6Data = async (_projectObjectId: number | string): Promise<void> => {
    console.log('P6 sync is now handled by backend. Use scheduled sync or manual scripts.');
    // No-op: sync is now done by backend cleanP6SyncService
};

/**
 * Map activities to DP Qty table format
 * NO FALLBACK VALUES - returns null for missing data
 */
export const mapActivitiesToDPQty = (activities: P6Activity[]) => {
    return activities.map((activity, index) => ({
        slNo: String(index + 1),
        description: activity.description,
        totalQuantity: activity.totalQuantity !== null ? String(activity.totalQuantity) : null,
        actualQuantity: activity.actualQuantity !== null ? String(activity.actualQuantity) : null,
        uom: activity.uom, // Needs manual entry
        basePlanStart: activity.basePlanStart,
        basePlanFinish: activity.basePlanFinish,
        forecastStart: activity.forecastStart,
        forecastFinish: activity.forecastFinish,
        actualStart: activity.actualStart,
        actualFinish: activity.actualFinish,
        plannedDuration: activity.plannedDuration !== null ? String(activity.plannedDuration) : null,
        percentComplete: activity.percentComplete !== null ? String(activity.percentComplete) : null,
        remarks: activity.remarks || null,
        cumulative: activity.cumulative || null,
        yesterday: activity.yesterday || null,
        today: activity.today || null
    }));
};

/**
 * Map activities for DP Block table
 * NO FALLBACK VALUES - returns null for missing data
 */
export const mapActivitiesToDPBlock = (activities: P6Activity[]) => {
    return activities.map((activity) => ({
        activityId: activity.activityId,
        activities: activity.description,
        blockCapacity: activity.blockCapacity, // Needs manual entry
        phase: activity.phase, // Needs manual entry
        block: activity.block, // Needs manual entry
        spvNumber: activity.spvNumber, // Needs manual entry
        priority: activity.priority, // Needs manual entry
        scope: activity.scope, // Needs manual entry
        hold: activity.hold, // Needs manual entry
        front: activity.front, // Needs manual entry
        completed: activity.percentComplete !== null ? String(activity.percentComplete) : null,
        balance: activity.remainingQuantity !== null ? String(activity.remainingQuantity) : null,
        baselineStartDate: activity.basePlanStart,
        baselineEndDate: activity.basePlanFinish,
        actualStartDate: activity.actualStart,
        actualFinishDate: activity.actualFinish,
        forecastStartDate: activity.forecastStart,
        forecastFinishDate: activity.forecastFinish
    }));
};

/**
 * Map activities for DP Vendor Block table
 * NO FALLBACK VALUES
 */
export const mapActivitiesToDPVendorBlock = (activities: P6Activity[]) => {
    return activities.map((activity) => ({
        activityId: activity.activityId,
        activities: activity.description,
        plot: activity.plot, // Needs manual entry
        newBlockNom: activity.block, // Needs manual entry
        priority: activity.priority, // Needs manual entry
        scope: activity.scope, // Needs manual entry
        hold: activity.hold, // Needs manual entry
        front: activity.front, // Needs manual entry
        actual: activity.actualQuantity !== null ? String(activity.actualQuantity) : null,
        completionPercentage: activity.percentComplete !== null ? String(activity.percentComplete) : null
    }));
};

/**
 * Map activities for Manpower Details table
 * NO FALLBACK VALUES
 */
export const mapActivitiesToManpowerDetails = (activities: P6Activity[]) => {
    return activities.map((activity, index) => ({
        activityId: activity.activityId,
        slNo: String(index + 1),
        block: activity.block, // Needs manual entry
        activity: activity.description
    }));
};

/**
 * Map activities for DP Vendor IDT table
 * NO FALLBACK VALUES
 */
export const mapActivitiesToDPVendorIdt = (activities: P6Activity[]) => {
    return activities.map((activity) => ({
        activityId: activity.activityId,
        activities: activity.description,
        plot: activity.plot, // Needs manual entry
        newBlockNom: activity.block, // Needs manual entry
        scope: activity.scope, // Needs manual entry
        front: activity.front, // Needs manual entry
        priority: activity.priority, // Needs manual entry
        actual: activity.actualQuantity !== null ? String(activity.actualQuantity) : null,
        completionPercentage: activity.percentComplete !== null ? String(activity.percentComplete) : null
    }));
};
