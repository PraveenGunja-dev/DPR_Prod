// src/types/project.ts

export interface Project {
    id: number;
    ObjectId?: number; // P6 compatibility
    name: string;
    Name?: string; // P6 compatibility
    location?: string;
    Location?: string; // P6 compatibility
    status?: string;
    Status?: string; // P6 compatibility
    progress?: number;
    p6_object_id?: number;
    p6_last_sync?: string;
    project_type?: 'solar' | 'wind' | 'pss' | 'other';
    projectType?: string;
    ProjectType?: string; // P6 compatibility
}

export interface ProjectAssignment {
    id: number;
    user_id: number;
    project_id: number;
    sheet_types: string[];
    created_at: string;
}
