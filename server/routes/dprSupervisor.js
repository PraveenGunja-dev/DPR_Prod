// server/routes/dprSupervisor.js
const express = require('express');
const router = express.Router();
const {
  getDraftEntry,
  saveDraftEntry,
  submitEntry,
  getEntriesForPMReview,
  approveEntryByPM,
  rejectEntryByPM,
  getEntryById,
  getEntriesForPMAGReview,
  finalApproveByPMAG,
  rejectEntryByPMAG
} = require('../controllers/dprSupervisorController');

// All routes require authentication (applied in server.js)

// Supervisor routes
router.get('/draft', getDraftEntry);  // Get or create draft entry
router.post('/save-draft', saveDraftEntry);  // Save draft
router.post('/submit', submitEntry);  // Submit to PM

// PM routes
router.get('/pm/entries', getEntriesForPMReview);  // Get entries for PM review
router.post('/pm/approve', approveEntryByPM);  // Approve entry
router.post('/pm/reject', rejectEntryByPM);  // Reject entry

// PMAG routes
router.get('/pmag/entries', getEntriesForPMAGReview);  // Get entries for PMAG review
router.post('/pmag/approve', finalApproveByPMAG);  // Final approval
router.post('/pmag/reject', rejectEntryByPMAG);  // Reject back to PM

// Common routes
router.get('/entry/:entryId', getEntryById);  // Get specific entry

module.exports = router;