// server/controllers/cellCommentsController.js
// Controller for cell-level comments feature

const pool = require('../db');

// Add a new comment to a cell
const addComment = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { sheetId, rowIndex, columnKey, commentText, commentType } = req.body;

        // Validate required fields
        if (!sheetId || rowIndex === undefined || !columnKey || !commentText) {
            return res.status(400).json({ message: 'Sheet ID, row index, column key, and comment text are required' });
        }

        // Only Site PM can add REJECTION comments
        if (commentType === 'REJECTION' && userRole !== 'Site PM') {
            return res.status(403).json({ message: 'Only Site PM can add rejection comments' });
        }

        // PMAG and Admin can only read, not add comments
        if (userRole === 'PMAG' || userRole === 'Super Admin') {
            return res.status(403).json({ message: 'You can only view comments, not add them' });
        }

        const result = await pool.query(
            `INSERT INTO cell_comments 
       (sheet_id, row_index, column_key, comment_text, comment_type, created_by, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [sheetId, rowIndex, columnKey, commentText, commentType || 'GENERAL', userId, userRole]
        );

        res.status(201).json({ message: 'Comment added successfully', comment: result.rows[0] });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Get all comments for a sheet
const getCommentsBySheet = async (req, res) => {
    try {
        const { sheetId } = req.params;

        if (!sheetId) {
            return res.status(400).json({ message: 'Sheet ID is required' });
        }

        const result = await pool.query(
            `SELECT cc.*, u.name as author_name 
       FROM cell_comments cc
       JOIN users u ON cc.created_by = u.user_id
       WHERE cc.sheet_id = $1 AND cc.is_deleted = FALSE
       ORDER BY cc.created_at ASC`,
            [sheetId]
        );

        // Group comments by cell
        const commentsByCell = {};
        result.rows.forEach(comment => {
            const cellKey = `${comment.row_index}_${comment.column_key}`;
            if (!commentsByCell[cellKey]) {
                commentsByCell[cellKey] = [];
            }
            commentsByCell[cellKey].push(comment);
        });

        res.status(200).json({
            comments: result.rows,
            commentsByCell,
            totalCount: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Get comments for a specific cell
const getCommentsByCell = async (req, res) => {
    try {
        const { sheetId, rowIndex, columnKey } = req.query;

        if (!sheetId || rowIndex === undefined || !columnKey) {
            return res.status(400).json({ message: 'Sheet ID, row index, and column key are required' });
        }

        const result = await pool.query(
            `SELECT cc.*, u.name as author_name 
       FROM cell_comments cc
       JOIN users u ON cc.created_by = u.user_id
       WHERE cc.sheet_id = $1 AND cc.row_index = $2 AND cc.column_key = $3 AND cc.is_deleted = FALSE
       ORDER BY cc.created_at ASC`,
            [sheetId, rowIndex, columnKey]
        );

        // Organize into threads (parent comments with replies)
        const threads = [];
        const replyMap = {};

        result.rows.forEach(comment => {
            if (comment.parent_comment_id === null) {
                threads.push({ ...comment, replies: [] });
            } else {
                if (!replyMap[comment.parent_comment_id]) {
                    replyMap[comment.parent_comment_id] = [];
                }
                replyMap[comment.parent_comment_id].push(comment);
            }
        });

        // Attach replies to their parent comments
        threads.forEach(thread => {
            thread.replies = replyMap[thread.id] || [];
        });

        res.status(200).json({ threads });
    } catch (error) {
        console.error('Error fetching cell comments:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Reply to a comment
const replyToComment = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { id } = req.params;
        const { commentText } = req.body;

        if (!commentText) {
            return res.status(400).json({ message: 'Comment text is required' });
        }

        // PMAG and Admin can only read, not reply
        if (userRole === 'PMAG' || userRole === 'Super Admin') {
            return res.status(403).json({ message: 'You can only view comments, not reply to them' });
        }

        // Get the parent comment to copy sheet_id, row_index, column_key
        const parentResult = await pool.query(
            'SELECT * FROM cell_comments WHERE id = $1 AND is_deleted = FALSE',
            [id]
        );

        if (parentResult.rows.length === 0) {
            return res.status(404).json({ message: 'Parent comment not found' });
        }

        const parent = parentResult.rows[0];

        const result = await pool.query(
            `INSERT INTO cell_comments 
       (sheet_id, row_index, column_key, parent_comment_id, comment_text, comment_type, created_by, role)
       VALUES ($1, $2, $3, $4, $5, 'GENERAL', $6, $7)
       RETURNING *`,
            [parent.sheet_id, parent.row_index, parent.column_key, id, commentText, userId, userRole]
        );

        res.status(201).json({ message: 'Reply added successfully', comment: result.rows[0] });
    } catch (error) {
        console.error('Error replying to comment:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Soft delete a comment (role-based)
const deleteComment = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { id } = req.params;

        // Check if comment exists and user has permission
        const checkResult = await pool.query(
            'SELECT * FROM cell_comments WHERE id = $1 AND is_deleted = FALSE',
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const comment = checkResult.rows[0];

        // Only the author or Super Admin can delete
        if (comment.created_by !== userId && userRole !== 'Super Admin') {
            return res.status(403).json({ message: 'You can only delete your own comments' });
        }

        await pool.query(
            'UPDATE cell_comments SET is_deleted = TRUE WHERE id = $1',
            [id]
        );

        res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Check if sheet has rejection comments (for validation before reject)
const hasRejectionComments = async (req, res) => {
    try {
        const { sheetId } = req.params;

        // Check if table exists first
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'cell_comments'
            ) as exists
        `);

        if (!tableCheck.rows[0].exists) {
            // Table doesn't exist yet, allow rejection without comments
            return res.status(200).json({ hasRejectionComments: false, count: 0, tableExists: false });
        }

        const result = await pool.query(
            `SELECT COUNT(*) as count FROM cell_comments 
       WHERE sheet_id = $1 AND comment_type = 'REJECTION' AND is_deleted = FALSE`,
            [sheetId]
        );

        const hasComments = parseInt(result.rows[0].count) > 0;

        res.status(200).json({ hasRejectionComments: hasComments, count: parseInt(result.rows[0].count), tableExists: true });
    } catch (error) {
        console.error('Error checking rejection comments:', error);
        // If there's any error, allow rejection to proceed (backend will validate)
        res.status(200).json({ hasRejectionComments: false, count: 0, error: error.message });
    }
};

module.exports = {
    addComment,
    getCommentsBySheet,
    getCommentsByCell,
    replyToComment,
    deleteComment,
    hasRejectionComments
};
