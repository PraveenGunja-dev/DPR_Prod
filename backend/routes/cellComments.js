// server/routes/cellComments.js
// Routes for cell-level comments API

const express = require('express');
const router = express.Router();
const cellCommentsController = require('../controllers/cellCommentsController');

let authenticateToken;

const setPool = (poolInstance, authMiddleware) => {
    authenticateToken = authMiddleware;
};

// Middleware to ensure authentication is applied
const ensureAuth = (req, res, next) => {
    if (!authenticateToken) {
        return res.status(500).json({ message: 'Authentication not configured' });
    }
    authenticateToken(req, res, next);
};

// POST /api/cell-comments - Add a new comment
router.post('/', ensureAuth, (req, res) => cellCommentsController.addComment(req, res));

// GET /api/cell-comments/cell/query - Get comments for a specific cell (must be before :sheetId)
router.get('/cell/query', ensureAuth, (req, res) => cellCommentsController.getCommentsByCell(req, res));

// GET /api/cell-comments/:sheetId/has-rejection - Check if sheet has rejection comments
router.get('/:sheetId/has-rejection', ensureAuth, (req, res) => cellCommentsController.hasRejectionComments(req, res));

// GET /api/cell-comments/:sheetId - Get all comments for a sheet
router.get('/:sheetId', ensureAuth, (req, res) => cellCommentsController.getCommentsBySheet(req, res));

// POST /api/cell-comments/:id/reply - Reply to a comment
router.post('/:id/reply', ensureAuth, (req, res) => cellCommentsController.replyToComment(req, res));

// DELETE /api/cell-comments/:id - Soft delete a comment
router.delete('/:id', ensureAuth, (req, res) => cellCommentsController.deleteComment(req, res));

module.exports = { router, setPool };
