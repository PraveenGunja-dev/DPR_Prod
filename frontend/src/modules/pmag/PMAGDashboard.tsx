import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { useNotification } from "@/modules/auth/contexts/NotificationContext";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
    PMAGDashboardSummary,
    PMAGSheetEntries,
    PMAGChartsSection,
    PMAGUserManagementModals,
    PMAGSuccessModal
} from "./components";
import { PMAGDashboardDetailModal, DashboardModalType } from "./components/PMAGDashboardDetailModal";
import { SnapshotFilterModal } from "@/modules/superadmin/components/SnapshotFilterModal";
import { DateComparisonModal } from "@/components/shared/DateComparisonModal";
import { 
    getEntriesForPMAGReview, 
    getHistoryForPMAG, 
    getArchivedEntries, 
    approveEntryByPMAG, 
    rejectEntryByPMAG, 
    pushEntryToP6 
} from "@/services/dprService";
import { getUserProjects } from "@/services/projectService";
import { getP6ActivitiesForProject } from "@/services/p6ActivityService";
import { ViewUserModal } from "@/modules/superadmin/components/ViewUserModal";
import { getAllSitePMs, getAllPMAGs, registerUser } from "@/services/userService";
import { DPREntry, Project, User } from "@/types";

const PMAGDashboard = () => {
    const location = useLocation();
    const { user } = useAuth();
    const { addNotification } = useNotification();
    const { projectName, projectId } = location.state || { projectName: "Project", projectId: null };

    const [projects, setProjects] = useState<Project[]>([]);
    const [p6Activities, setP6Activities] = useState<any[]>([]);
    const [teamMembers, setTeamMembers] = useState<User[]>([]);
    const [approvedEntries, setApprovedEntries] = useState<DPREntry[]>([]);
    const [historyEntries, setHistoryEntries] = useState<DPREntry[]>([]);
    const [archivedEntries, setArchivedEntries] = useState<DPREntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [detailModalState, setDetailModalState] = useState<{ isOpen: boolean; type: DashboardModalType; data: any[]; title?: string }>({
        isOpen: false, type: null, data: [], title: undefined
    });

    const [expandedEntries, setExpandedEntries] = useState<Record<number, boolean>>({});

    const loadData = async () => {
        try {
            setLoading(true);
            const [pjs, reviewEntries, members] = await Promise.all([
                getUserProjects(),
                getEntriesForPMAGReview(projectId),
                getAllSitePMs() // Simplified for PMAG view
            ]);
            setProjects(pjs);
            setApprovedEntries(reviewEntries);
            setTeamMembers(members);
            if (projectId) setP6Activities(await getP6ActivitiesForProject(projectId));
        } catch (e) {
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [projectId]);

    const handleFinalApprove = async (entryId: number) => {
        try {
            await approveEntryByPMAG(entryId);
            toast.success("Final approved");
            loadData();
        } catch (e) { toast.error("Approval failed"); }
    };

    const handleReject = async (entryId: number) => {
        try {
            await rejectEntryByPMAG(entryId, "Rejected by PMAG");
            toast.success("Rejected to PM");
            loadData();
        } catch (e) { toast.error("Rejection failed"); }
    };

    const handlePushToP6 = async (entry: any) => {
        try {
            toast.promise(pushEntryToP6(entry.id), {
                loading: 'Pushing to P6...',
                success: (data: any) => {
                    loadData();
                    return data.message || "Successfully pushed to P6";
                },
                error: (err: any) => `Push failed: ${err.message || 'Unknown error'}`
            });
        } catch (e) {
            toast.error("Push process failed to start");
        }
    };

    return (
        <DashboardLayout userName={user?.name || user?.Name || "User"} userRole={user?.role || user?.Role || "PMAG"} projectName={projectName}>
            <PMAGDashboardSummary
                projectName={projectName} userName={user?.name || user?.Name}
                approvedEntries={approvedEntries} historyEntries={historyEntries} archivedEntries={archivedEntries} teamMembers={teamMembers}
                onShowMembers={() => setDetailModalState({ isOpen: true, type: 'members', data: teamMembers, title: 'Team Members' })}
                onShowApproved={() => setDetailModalState({ isOpen: true, type: 'approved', data: approvedEntries, title: 'Approved Sheets' })}
            />
            <PMAGSheetEntries 
                approvedEntries={approvedEntries} 
                onFinalApprove={handleFinalApprove} 
                onReject={handleReject} 
                onRefresh={loadData}
                expandedEntries={expandedEntries}
                setExpandedEntries={setExpandedEntries}
                onPushToP6={handlePushToP6}
                projects={projects}
            />
            <PMAGChartsSection p6Activities={p6Activities} approvedEntries={approvedEntries} historyEntries={historyEntries} archivedEntries={archivedEntries} />
            <PMAGDashboardDetailModal 
                isOpen={detailModalState.isOpen} 
                onClose={() => setDetailModalState(prev => ({ ...prev, isOpen: false }))} 
                type={detailModalState.type} 
                data={detailModalState.data} 
                title={detailModalState.title}
                onFinalApprove={handleFinalApprove}
                onReject={handleReject}
                onPushToP6={handlePushToP6}
            />
        </DashboardLayout>
    );
};

export default PMAGDashboard;