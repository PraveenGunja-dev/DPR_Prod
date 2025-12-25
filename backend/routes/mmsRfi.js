const express = require('express');
const router = express.Router();
const { 
  addDynamicColumn,
  getDynamicColumns,
  updateDynamicColumn,
  deleteDynamicColumn,
  getMmsRfiDraftEntry,
  saveMmsRfiDraftEntry,
  submitMmsRfiEntry
} = require('../controllers/mmsRfiController');

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

// Dynamic Columns Management
router.post('/dynamic-columns', ensureAuth, addDynamicColumn);
router.get('/dynamic-columns', ensureAuth, getDynamicColumns);
router.put('/dynamic-columns/:columnId', ensureAuth, updateDynamicColumn);
router.delete('/dynamic-columns/:columnId', ensureAuth, deleteDynamicColumn);

// MMS & RFI Entries
router.get('/entries/draft', ensureAuth, getMmsRfiDraftEntry);
router.post('/entries/save-draft', ensureAuth, saveMmsRfiDraftEntry);
router.post('/entries/submit', ensureAuth, submitMmsRfiEntry);

module.exports = { router, setPool };