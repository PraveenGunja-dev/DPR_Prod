// src/services/cellCommentsService.ts
// Frontend service for cell-level comments API

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

// Helper to get auth token
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface CellComment {
    id: string;
    sheet_id: number;
    row_index: number;
    column_key: string;
    parent_comment_id: string | null;
    comment_text: string;
    comment_type: 'REJECTION' | 'GENERAL';
    created_by: number;
    role: string;
    author_name: string;
    created_at: string;
    is_deleted: boolean;
    replies?: CellComment[];
}

export interface CommentThread extends CellComment {
    replies: CellComment[];
}

// Add a new comment to a cell
export const addCellComment = async (
    sheetId: number,
    rowIndex: number,
    columnKey: string,
    commentText: string,
    commentType: 'REJECTION' | 'GENERAL' = 'GENERAL'
): Promise<CellComment> => {
    const response = await axios.post(
        `${API_URL}/api/cell-comments`,
        { sheetId, rowIndex, columnKey, commentText, commentType },
        { headers: getAuthHeader() }
    );
    return response.data.comment;
};

// Get all comments for a sheet
export const getCommentsBySheet = async (sheetId: number): Promise<{
    comments: CellComment[];
    commentsByCell: Record<string, CellComment[]>;
    totalCount: number;
}> => {
    const response = await axios.get(
        `${API_URL}/api/cell-comments/${sheetId}`,
        { headers: getAuthHeader() }
    );
    return response.data;
};

// Get comments for a specific cell
export const getCommentsByCell = async (
    sheetId: number,
    rowIndex: number,
    columnKey: string
): Promise<{ threads: CommentThread[] }> => {
    const response = await axios.get(
        `${API_URL}/api/cell-comments/cell/query`,
        {
            params: { sheetId, rowIndex, columnKey },
            headers: getAuthHeader()
        }
    );
    return response.data;
};

// Reply to a comment
export const replyToComment = async (
    commentId: string,
    commentText: string
): Promise<CellComment> => {
    const response = await axios.post(
        `${API_URL}/api/cell-comments/${commentId}/reply`,
        { commentText },
        { headers: getAuthHeader() }
    );
    return response.data.comment;
};

// Delete a comment (soft delete)
export const deleteComment = async (commentId: string): Promise<void> => {
    await axios.delete(
        `${API_URL}/api/cell-comments/${commentId}`,
        { headers: getAuthHeader() }
    );
};

// Check if sheet has rejection comments
export const hasRejectionComments = async (sheetId: number): Promise<{
    hasRejectionComments: boolean;
    count: number;
}> => {
    const response = await axios.get(
        `${API_URL}/api/cell-comments/${sheetId}/has-rejection`,
        { headers: getAuthHeader() }
    );
    return response.data;
};
