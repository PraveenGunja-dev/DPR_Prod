// server/routes/customSheets.js
const express = require('express');
const router = express.Router();
const {
  createCustomSheet,
  getCustomSheets,
  getCustomSheetById,
  updateCustomSheet,
  deleteCustomSheet,
  addColumnToSheet,
  removeColumnFromSheet,
  getCustomSheetDraftEntry,
  saveCustomSheetDraftEntry,
  submitCustomSheetEntry
} = require('../controllers/customSheetsController');

// We'll pass the authenticateToken middleware from server.js when registering the routes
let authenticateToken;

// Function to set the middleware (called from server.js)
const setPool = (dbPool, authMiddleware) => {
  authenticateToken = authMiddleware;
};

// Helper function to ensure authenticateToken is available
const ensureAuth = (req, res, next) => {
  if (typeof authenticateToken === 'function') {
    return authenticateToken(req, res, next);
  }
  // If authenticateToken is not set yet, deny access
  return res.status(401).json({ message: 'Authentication middleware not initialized' });
};

// All routes require authentication
// Custom sheets management routes
router.post('/', ensureAuth, createCustomSheet);  // Create a new custom sheet
router.get('/', ensureAuth, getCustomSheets);  // Get all custom sheets for a project
router.get('/:sheetId', ensureAuth, getCustomSheetById);  // Get a specific custom sheet
router.put('/:sheetId', ensureAuth, updateCustomSheet);  // Update a custom sheet
router.delete('/:sheetId', ensureAuth, deleteCustomSheet);  // Delete a custom sheet

// Column management routes
router.post('/:sheetId/columns', ensureAuth, addColumnToSheet);  // Add a column to a sheet
router.delete('/:sheetId/columns/:columnId', ensureAuth, removeColumnFromSheet);  // Remove a column from a sheet

// Custom sheet entry routes (similar to existing DPR supervisor routes)
router.get('/entries/draft', ensureAuth, getCustomSheetDraftEntry);  // Get or create draft entry
router.post('/entries/save-draft', ensureAuth, saveCustomSheetDraftEntry);  // Save draft
router.post('/entries/submit', ensureAuth, submitCustomSheetEntry);  // Submit to PM

module.exports = { router, setPool };