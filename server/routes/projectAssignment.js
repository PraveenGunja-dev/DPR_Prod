// server/routes/projectAssignment.js
const express = require('express');
const router = express.Router();
const { 
  assignProjectToSupervisor,
  getAssignedProjects,
  getProjectSupervisors,
  unassignProjectFromSupervisor
} = require('../controllers/projectAssignmentController');

// PMAG route to assign a project to a supervisor
router.post('/assign', assignProjectToSupervisor);

// PMAG route to unassign a project from a supervisor
router.post('/unassign', unassignProjectFromSupervisor);

// PMAG route to get supervisors for a project
router.get('/project/:projectId/supervisors', getProjectSupervisors);

// Supervisor route to get assigned projects
router.get('/assigned', getAssignedProjects);

module.exports = router;