// src/services/chartService.ts
import apiClient from './apiClient';

/**
 * Get all charts data for a user role and project
 */
export const getAllChartsData = async (role: string, projectId?: number) => {
    try {
        const params = projectId ? { projectId } : {};
        
        // Fetch all chart data in parallel
        const [
            plannedVsActual,
            completionDelay,
            approvalFlow,
            submissionTrends,
            rejectionDistribution,
            bottlenecks,
            healthComparison
        ] = await Promise.all([
            apiClient.get('/charts/planned-vs-actual', { params }).then(res => res.data).catch(() => []),
            apiClient.get('/charts/completion-delay', { params }).then(res => res.data).catch(() => []),
            apiClient.get('/charts/approval-flow', { params }).then(res => res.data).catch(() => []),
            apiClient.get('/charts/submission-trends', { params }).then(res => res.data).catch(() => []),
            apiClient.get('/charts/rejection-distribution', { params }).then(res => res.data).catch(() => []),
            apiClient.get('/charts/bottlenecks', { params }).then(res => res.data).catch(() => []),
            apiClient.get('/charts/health-comparison', { params }).then(res => res.data).catch(() => [])
        ]);

        return {
            plannedVsActual: plannedVsActual || [],
            completionDelay: completionDelay || [],
            approvalFlow: approvalFlow || [],
            submissionTrends: submissionTrends || [],
            rejectionDistribution: rejectionDistribution || [],
            bottlenecks: bottlenecks || [],
            healthComparison: healthComparison || []
        };
    } catch (error) {
        console.error('Error fetching charts data:', error);
        return {
            plannedVsActual: [],
            completionDelay: [],
            approvalFlow: [],
            submissionTrends: [],
            rejectionDistribution: [],
            bottlenecks: [],
            healthComparison: []
        };
    }
};
