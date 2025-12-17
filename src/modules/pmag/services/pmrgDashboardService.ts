import { getAllSupervisors } from "@/modules/auth/services/authService";
import { getUserProjects } from "@/modules/auth/services/projectService";
import { getEntriesForPMAGReview, finalApproveByPMAG, rejectEntryByPMAG } from "@/modules/auth/services/dprSupervisorService";

// Fetch projects and supervisors
export const fetchData = async () => {
  try {
    // Fetch projects
    const projectsData = await getUserProjects();
    
    // Fetch supervisors from API
    console.log("About to fetch supervisors...");
    const supervisorsData = await getAllSupervisors();
    console.log("Supervisors fetched:", supervisorsData); // Debug log
    
    return { projects: projectsData, supervisors: supervisorsData };
  } catch (error) {
    console.error("Failed to fetch data:", error); // Debug log
    throw error;
  }
};

// Fetch approved entries from PM
export const fetchApprovedEntries = async () => {
  try {
    const entries = await getEntriesForPMAGReview();
    return entries;
  } catch (error) {
    console.error('Error fetching approved entries:', error);
    throw error;
  }
};

// Handle final approval by PMRG
export const handleFinalApprove = async (entryId: number) => {
  try {
    await finalApproveByPMAG(entryId);
    return true;
  } catch (error) {
    console.error('Error final approving entry:', error);
    throw error;
  }
};

// Handle reject by PMRG
export const handleRejectToPM = async (entryId: number, rejectionReason?: string) => {
  try {
    await rejectEntryByPMAG(entryId, rejectionReason);
    return true;
  } catch (error) {
    console.error('Error rejecting entry to PM:', error);
    throw error;
  }
};

