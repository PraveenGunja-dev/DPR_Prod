// src/modules/sitepm/services/pmDashboardService.ts
import { getEntriesForPMReview, approveEntryByPM, rejectEntryByPM, updateEntryByPM } from "@/modules/auth/services/dprSupervisorService";
import { getUserProjects, assignProjectToSupervisor, assignProjectsToMultipleSupervisors } from "@/modules/auth/services/projectService";
import { registerUser, Supervisor, normalizeUser, getAllSupervisors } from "@/modules/auth/services/authService";
// Function to format date as YYYY-MM-DD
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "Not set";
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

// Fetch submitted entries from supervisors
export const fetchSubmittedEntries = async (projectId?: number) => {
  try {
    console.log('PM Dashboard Service: Fetching entries for project:', projectId);
    const entries = await getEntriesForPMReview(projectId);
    console.log('PM Dashboard Service: Received entries:', entries.length, entries);
    return entries;
  } catch (error: any) {
    console.error('Error fetching entries:', error);
    console.error('Error details:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to load submitted sheets");
  }
};

// Approve entry by PM
export const approveEntry = async (entryId: number) => {
  try {
    await approveEntryByPM(entryId);
  } catch (error) {
    console.error(`Failed to approve entry ${entryId}:`, error);
    throw new Error(`Failed to approve entry: ${(error as Error).message || 'Unknown error'}`);
  }
};

// Reject entry by PM
export const rejectEntry = async (entryId: number, rejectionReason?: string) => {
  try {
    await rejectEntryByPM(entryId, rejectionReason);
  } catch (error) {
    console.error(`Failed to reject entry ${entryId}:`, error);
    throw new Error(`Failed to reject entry: ${(error as Error).message || 'Unknown error'}`);
  }
};

// Update entry by PM
export const updateEntry = async (entryId: number, data: any) => {
  try {
    await updateEntryByPM(entryId, data);
  } catch (error) {
    console.error(`Failed to update entry ${entryId}:`, error);
    throw new Error(`Failed to update entry: ${(error as Error).message || 'Unknown error'}`);
  }
};

// Fetch user projects
export const fetchUserProjects = async () => {
  try {
    const projectsData = await getUserProjects();
    return projectsData;
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    throw new Error("Failed to fetch projects");
  }
};

// Fetch supervisors
export const fetchSupervisors = async () => {
  try {
    // Use the authService's getAllSupervisors function which handles API calls correctly
    const supervisorsData = await getAllSupervisors();
    return supervisorsData;
  } catch (error) {
    console.error('Error fetching supervisors:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to fetch supervisors'
    );
  }
};

// Create supervisor
export const createSupervisor = async (userData: Omit<import('@/modules/auth/services/authService').User, 'ObjectId'>) => {
  try {
    const registeredUserResponse = await registerUser(userData);
    return registeredUserResponse;
  } catch (error) {
    console.error('Supervisor creation error:', error);
    throw new Error(error instanceof Error ? error.message : 'Supervisor creation failed');
  }
};

// Assign project to supervisor
export const assignProject = async (projectId: number, supervisorId: number) => {
  try {
    await assignProjectToSupervisor(projectId, supervisorId);
  } catch (error) {
    console.error('Project assignment error:', error);
    throw new Error(error instanceof Error ? error.message : 'Project assignment failed');
  }
};

// Assign multiple projects to multiple supervisors
export const assignMultipleProjects = async (projectIds: number[], supervisorIds: number[]) => {
  try {
    await assignProjectsToMultipleSupervisors(projectIds, supervisorIds);
  } catch (error) {
    console.error('Multiple project assignment error:', error);
    throw new Error(error instanceof Error ? error.message : 'Project assignment failed');
  }
};