import axios from 'axios';

// Get API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set auth token for API requests
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Define types
export interface Project {
  id: number;
  name: string;
  location: string;
  status: string;
  progress: number;
  planStart: string;
  planEnd: string;
  actualStart: string | null;
  actualEnd: string | null;
}

export interface User {
  user_id: number;
  name: string;
  email: string;
  role: 'supervisor' | 'Site PM' | 'PMAG';
}

export interface ProjectAssignment {
  id: number;
  projectId: number;
  userId: number;
  assignedAt: string;
}

export interface Supervisor {
  user_id: number;
  name: string;
  email: string;
  assigned_at: string;
}

// Get projects for the authenticated user
export const getUserProjects = async (): Promise<Project[]> => {
  try {
    const response = await api.get<Project[]>('/projects/user');
    return response.data;
  } catch (error) {
    throw new Error(
      axios.isAxiosError(error) && error.response
        ? error.response.data.message || 'Failed to fetch projects'
        : 'Network error'
    );
  }
};

// Get project by ID
export const getProjectById = async (projectId: number): Promise<Project> => {
  try {
    const response = await api.get<Project>(`/projects/${projectId}`);
    return response.data;
  } catch (error) {
    throw new Error(
      axios.isAxiosError(error) && error.response
        ? error.response.data.message || 'Failed to fetch project'
        : 'Network error'
    );
  }
};

// Create a new project
export const createProject = async (projectData: Omit<Project, 'id'>): Promise<Project> => {
  try {
    const response = await api.post<Project>('/projects', projectData);
    return response.data;
  } catch (error) {
    throw new Error(
      axios.isAxiosError(error) && error.response
        ? error.response.data.message || 'Failed to create project'
        : 'Network error'
    );
  }
};

// Update project
export const updateProject = async (projectId: number, projectData: Partial<Project>): Promise<Project> => {
  try {
    const response = await api.put<Project>(`/projects/${projectId}`, projectData);
    return response.data;
  } catch (error) {
    throw new Error(
      axios.isAxiosError(error) && error.response
        ? error.response.data.message || 'Failed to update project'
        : 'Network error'
    );
  }
};

// Assign project to supervisor
export const assignProjectToSupervisor = async (projectId: number, supervisorId: number): Promise<any> => {
  try {
    const response = await api.post('/project-assignment/assign', { projectId, supervisorId });
    return response.data;
  } catch (error) {
    throw new Error(
      axios.isAxiosError(error) && error.response
        ? error.response.data.message || 'Failed to assign project'
        : 'Network error'
    );
  }
};

// Get assigned projects for supervisor
export const getAssignedProjects = async (): Promise<Project[]> => {
  try {
    const response = await api.get<Project[]>('/project-assignment/assigned');
    return response.data;
  } catch (error) {
    throw new Error(
      axios.isAxiosError(error) && error.response
        ? error.response.data.message || 'Failed to fetch assigned projects'
        : 'Network error'
    );
  }
};

// Get supervisors for a project (PMAG only)
export const getProjectSupervisors = async (projectId: number): Promise<Supervisor[]> => {
  try {
    const response = await api.get<Supervisor[]>(`/project-assignment/project/${projectId}/supervisors`);
    return response.data;
  } catch (error) {
    throw new Error(
      axios.isAxiosError(error) && error.response
        ? error.response.data.message || 'Failed to fetch project supervisors'
        : 'Network error'
    );
  }
};

// Unassign project from supervisor (PMAG only)
export const unassignProjectFromSupervisor = async (projectId: number, supervisorId: number): Promise<any> => {
  try {
    const response = await api.post('/project-assignment/unassign', { projectId, supervisorId });
    return response.data;
  } catch (error) {
    throw new Error(
      axios.isAxiosError(error) && error.response
        ? error.response.data.message || 'Failed to unassign project'
        : 'Network error'
    );
  }
};