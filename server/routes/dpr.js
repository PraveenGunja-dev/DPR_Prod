// server/routes/dpr.js
const express = require('express');
const router = express.Router();
const {
  getDraftSheet,
  saveDraftSheet,
  submitSheet,
  getSheetsForPMReview,
  updateSheetByPM,
  approveSheetByPM,
  rejectSheetByPM,
  getSheetsForPMAGReview,
  finalApprovalByPMAG,
  rejectByPMAG,
  getSheetComments,
  getSheetById
} = require('../controllers/dprController');

// All routes require authentication (applied in server.js)

// Supervisor routes
router.get('/draft', getDraftSheet);  // Get or create draft sheet
router.post('/save-draft', saveDraftSheet);  // Save draft
router.post('/submit', submitSheet);  // Submit to PM

// PM routes
router.get('/pm/sheets', getSheetsForPMReview);  // Get sheets for PM review
router.put('/pm/update', updateSheetByPM);  // Update sheet data
router.post('/pm/approve', approveSheetByPM);  // Approve and send to PMAG
router.post('/pm/reject', rejectSheetByPM);  // Reject and send back to supervisor

// PMAG routes
router.get('/pmag/sheets', getSheetsForPMAGReview);  // Get sheets for PMAG review
router.post('/pmag/approve', finalApprovalByPMAG);  // Final approval
router.post('/pmag/reject', rejectByPMAG);  // Reject and send back to PM

// Common routes
router.get('/sheet/:sheetId', getSheetById);  // Get specific sheet
router.get('/sheet/:sheetId/comments', getSheetComments);  // Get comments

module.exports = router;
