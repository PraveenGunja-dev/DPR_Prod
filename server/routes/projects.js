// server/routes/projects.js
const express = require('express');
const router = express.Router();
const { 
  getUserProjects, 
  getProjectById, 
  createProject, 
  updateProject 
} = require('../controllers/projectsController');

// All routes require authentication
router.get('/user', getUserProjects);
router.get('/:id', getProjectById);
router.post('/', createProject);
router.put('/:id', updateProject);

module.exports = router;