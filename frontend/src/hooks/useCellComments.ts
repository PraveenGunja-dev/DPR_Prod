// src/hooks/useCellComments.ts
// Hook for managing cell comments in a sheet

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    getCommentsBySheet,
    addCellComment,
    hasRejectionComments as checkHasRejectionComments,
    type CellComment
} from '@/services/cellCommentsService';

interface UseCellCommentsOptions {
    sheetId: number | null;
    enabled?: boolean;
}

interface CellCommentsState {
    comments: CellComment[];
    commentsByCell: Record<string, CellComment[]>;
    hasRejectionComments: boolean;
    rejectionCommentsCount: number;
    loading: boolean;
    error: string | null;
}

export const useCellComments = ({ sheetId, enabled = true }: UseCellCommentsOptions) => {
    const [state, setState] = useState<CellCommentsState>({
        comments: [],
        commentsByCell: {},
        hasRejectionComments: false,
        rejectionCommentsCount: 0,
        loading: false,
        error: null
    });

    // Load all comments for the sheet
    const loadComments = useCallback(async () => {
        if (!sheetId || !enabled) return;

        setState(prev => ({ ...prev, loading: true, error: null }));
        try {
            const data = await getCommentsBySheet(sheetId);
            const rejectionCheck = await checkHasRejectionComments(sheetId);

            setState({
                comments: data.comments,
                commentsByCell: data.commentsByCell,
                hasRejectionComments: rejectionCheck.hasRejectionComments,
                rejectionCommentsCount: rejectionCheck.count,
                loading: false,
                error: null
            });
        } catch (error: any) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: error.message || 'Failed to load comments'
            }));
        }
    }, [sheetId, enabled]);

    // Load on mount and when sheetId changes
    useEffect(() => {
        loadComments();
    }, [loadComments]);

    // Get comments for a specific cell
    const getCommentsForCell = useCallback((rowIndex: number, columnKey: string): CellComment[] => {
        const cellKey = `${rowIndex}_${columnKey}`;
        return state.commentsByCell[cellKey] || [];
    }, [state.commentsByCell]);

    // Check if a cell has comments
    const cellHasComments = useCallback((rowIndex: number, columnKey: string): boolean => {
        return getCommentsForCell(rowIndex, columnKey).length > 0;
    }, [getCommentsForCell]);

    // Check if a cell has rejection comments
    const cellHasRejectionComment = useCallback((rowIndex: number, columnKey: string): boolean => {
        return getCommentsForCell(rowIndex, columnKey).some(c => c.comment_type === 'REJECTION');
    }, [getCommentsForCell]);

    // Get comment count for a cell
    const getCommentCount = useCallback((rowIndex: number, columnKey: string): number => {
        return getCommentsForCell(rowIndex, columnKey).length;
    }, [getCommentsForCell]);

    // Get cells with rejection comments (for highlighting)
    const cellsWithRejectionComments = useMemo(() => {
        const cells: Array<{ rowIndex: number; columnKey: string }> = [];
        Object.entries(state.commentsByCell).forEach(([cellKey, comments]) => {
            if (comments.some(c => c.comment_type === 'REJECTION')) {
                const [rowIndex, columnKey] = cellKey.split('_');
                cells.push({ rowIndex: parseInt(rowIndex), columnKey });
            }
        });
        return cells;
    }, [state.commentsByCell]);

    return {
        ...state,
        loadComments,
        getCommentsForCell,
        cellHasComments,
        cellHasRejectionComment,
        getCommentCount,
        cellsWithRejectionComments
    };
};

export default useCellComments;
