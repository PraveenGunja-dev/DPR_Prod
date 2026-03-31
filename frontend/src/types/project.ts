// src/types/project.ts

export interface Project {
    id: number;
    name: string;
    location?: string;
    status?: string;
    progress?: number;
    p6_object_id?: number;
    p6_last_sync?: string;
    project_type?: 'solar' | 'wind' | 'pss' | 'other';
    projectType?: string;
}

export interface ProjectAssignment {
    id: number;
    user_id: number;
    project_id: number;
    sheet_types: string[];
    created_at: string;
}
