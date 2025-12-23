// src/services/p6ActivityService.ts
// Service to fetch P6 activities for supervisor tables

import apiClient from './apiClient';

export interface P6Activity {
    // Core identifiers
    activityId: string;
    objectId: string;
    slNo: number;

    // Description fields
    description: string;
    activities: string;

    // Status fields
    status: string;
    percentComplete: number;
    actual: string;
    completionPercentage: string;

    // Date fields
    basePlanStart: string;
    basePlanFinish: string;
    forecastStart: string;
    forecastFinish: string;
    actualStart: string;
    actualFinish: string;

    // WBS/Block fields
    block: string;
    newBlockNom: string;
    plot: string;

    // User-editable fields
    totalQuantity: string;
    uom: string;
    remarks: string;
    priority: string;
    baselinePriority: string;
    contractorName: string;
    scope: string;
    holdDueToWtg: string;
    front: string;
    balance: string;
    cumulative: string;
    section: string;
    yesterdayValue: string;
    todayValue: string;
    yesterday: string;
    today: string;
}

export interface PaginationInfo {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
}

export interface P6ActivitiesResponse {
    message: string;
    projectId: string;
    count: number;
    activities: P6Activity[];
    pagination?: PaginationInfo;
    source: string;
}

/**
 * Fetch P6 activities for a specific project with pagination
 * @param projectObjectId - The P6 Project ObjectId
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 * @returns Paginated response with activities and pagination metadata
 */
export const getP6ActivitiesPaginated = async (
    projectObjectId: number | string,
    page: number = 1,
    limit: number = 50
): Promise<P6ActivitiesResponse> => {
    try {
        const response = await apiClient.get<P6ActivitiesResponse>(
            `/api/oracle-p6/activities-full?projectId=${projectObjectId}&page=${page}&limit=${limit}`
        );
        console.log(`Fetched ${response.data.count} P6 activities for project ${projectObjectId} (page ${page}/${response.data.pagination?.totalPages || 1})`);
        return response.data;
    } catch (error) {
        console.error('Error fetching P6 activities:', error);
        throw error;
    }
};

/**
 * Fetch P6 activities for a specific project (legacy - fetches first page only)
 * @param projectObjectId - The P6 Project ObjectId
 * @returns Array of P6 activities
 * @deprecated Use getP6ActivitiesPaginated for better performance
 */
export const getP6ActivitiesForProject = async (projectObjectId: number | string): Promise<P6Activity[]> => {
    try {
        const response = await getP6ActivitiesPaginated(projectObjectId, 1, 50);
        return response.activities;
    } catch (error) {
        console.error('Error fetching P6 activities:', error);
        throw error;
    }
};

/**
 * Trigger manual sync of P6 data for a project
 */
export const syncP6Data = async (projectObjectId: number | string): Promise<void> => {
    try {
        await apiClient.post('/api/oracle-p6/sync', { projectId: projectObjectId });
        console.log(`Synced P6 data for project ${projectObjectId}`);
    } catch (error) {
        console.error('Error syncing P6 data:', error);
        throw error;
    }
};

/**
 * P6 activities already come mapped - just return them for DP Qty table
 */
export const mapActivitiesToDPQty = (activities: P6Activity[]) => {
    return activities.map((activity) => ({
        slNo: String(activity.slNo),
        description: activity.description,
        totalQuantity: activity.totalQuantity,
        uom: activity.uom,
        basePlanStart: activity.basePlanStart,
        basePlanFinish: activity.basePlanFinish,
        forecastStart: activity.forecastStart,
        forecastFinish: activity.forecastFinish,
        actualStart: activity.actualStart,
        actualFinish: activity.actualFinish,
        remarks: activity.remarks,
        balance: activity.balance,
        cumulative: activity.cumulative,
        yesterday: activity.yesterday,
        today: activity.today
    }));
};

/**
 * P6 activities already come mapped - just return them for DP Block table
 */
export const mapActivitiesToDPBlock = (activities: P6Activity[]) => {
    return activities.map((activity) => ({
        activityId: activity.activityId,
        activities: activity.activities,
        plot: activity.plot,
        newBlockNom: activity.newBlockNom,
        baselinePriority: activity.baselinePriority,
        scope: activity.scope,
        holdDueToWtg: activity.holdDueToWtg,
        front: activity.front,
        actual: activity.actual,
        completionPercentage: activity.completionPercentage,
        balance: activity.balance,
        baselineStart: activity.basePlanStart,
        baselineFinish: activity.basePlanFinish,
        actualStart: activity.actualStart,
        actualFinish: activity.actualFinish,
        forecastStart: activity.forecastStart,
        forecastFinish: activity.forecastFinish,
        yesterdayValue: activity.yesterdayValue,
        todayValue: activity.todayValue
    }));
};

/**
 * P6 activities mapped for DP Vendor Block table
 */
export const mapActivitiesToDPVendorBlock = (activities: P6Activity[]) => {
    return activities.map((activity) => ({
        activityId: activity.activityId,
        activities: activity.activities,
        plot: activity.plot,
        newBlockNom: activity.newBlockNom,
        priority: activity.priority,
        baselinePriority: activity.baselinePriority,
        contractorName: activity.contractorName,
        scope: activity.scope,
        holdDueToWtg: activity.holdDueToWtg,
        front: activity.front,
        actual: activity.actual,
        completionPercentage: activity.completionPercentage,
        remarks: activity.remarks,
        yesterdayValue: activity.yesterdayValue,
        todayValue: activity.todayValue
    }));
};

/**
 * P6 activities mapped for Manpower Details table
 */
export const mapActivitiesToManpowerDetails = (activities: P6Activity[]) => {
    return activities.map((activity) => ({
        activityId: activity.activityId,
        slNo: String(activity.slNo),
        block: activity.block,
        contractorName: activity.contractorName,
        activity: activity.activities,
        section: activity.section,
        yesterdayValue: activity.yesterdayValue,
        todayValue: activity.todayValue
    }));
};

/**
 * P6 activities mapped for DP Vendor IDT table
 */
export const mapActivitiesToDPVendorIdt = (activities: P6Activity[]) => {
    return activities.map((activity) => ({
        activityId: activity.activityId,
        activities: activity.activities,
        plot: activity.plot,
        newBlockNom: activity.newBlockNom,
        baselinePriority: activity.baselinePriority,
        scope: activity.scope,
        front: activity.front,
        priority: activity.priority,
        contractorName: activity.contractorName,
        remarks: activity.remarks,
        actual: activity.actual,
        completionPercentage: activity.completionPercentage,
        yesterdayValue: activity.yesterdayValue,
        todayValue: activity.todayValue
    }));
};
