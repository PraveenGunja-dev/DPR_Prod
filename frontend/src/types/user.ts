// src/types/user.ts

export type UserRole = 'supervisor' | 'Site PM' | 'PMAG' | 'Super Admin' | 'admin' | 'pending_approval';

export interface User {
    userId: number;
    ObjectId?: number; // P6 compatibility
    name: string;
    Name?: string; // P6 compatibility
    email: string;
    Email?: string; // P6 compatibility
    role: UserRole;
    Role?: UserRole; // P6 compatibility
    is_active?: boolean;
    sso_provider?: string;
    azure_oid?: string;
}

export interface Supervisor extends User {
    role: 'supervisor';
}

export interface SitePM extends User {
    role: 'Site PM';
}

export interface LoginCredentials {
    email: string;
    password?: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

export interface SSOAuthResponse {
    status: 'authenticated' | 'pending_approval' | 'error';
    accessToken?: string;
    refreshToken?: string;
    user: User;
    message?: string;
}

export interface AccessRequest {
    id: number;
    user_name: string;
    user_email: string;
    requested_role: string;
    justification?: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    reviewer_name?: string;
    reviewer_id?: number;
    reviewed_at?: string;
    review_notes?: string;
}
