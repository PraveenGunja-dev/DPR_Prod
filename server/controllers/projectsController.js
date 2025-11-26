// server/controllers/projectsController.js
const pool = require('../db');

// Get all projects for a user based on their role
const getUserProjects = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    let result;
    
    if (userRole === 'supervisor') {
      // For supervisors, get only assigned projects
      result = await pool.query(`
        SELECT 
          p.id, 
          p.name, 
          p.location, 
          p.status, 
          p.progress, 
          p.plan_start as "planStart", 
          p.plan_end as "planEnd", 
          p.actual_start as "actualStart", 
          p.actual_end as "actualEnd"
        FROM projects p
        INNER JOIN project_assignments pa ON p.id = pa.project_id
        WHERE pa.user_id = $1
        ORDER BY p.name
      `, [userId]);
    } else {
      // For PMAG and Site PM, get all projects
      result = await pool.query(`
        SELECT 
          id, 
          name, 
          location, 
          status, 
          progress, 
          plan_start as "planStart", 
          plan_end as "planEnd", 
          actual_start as "actualStart", 
          actual_end as "actualEnd"
        FROM projects
        ORDER BY name
      `);
    }
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching user projects:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get a specific project by ID
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    let result;
    
    if (userRole === 'supervisor') {
      // For supervisors, check if they're assigned to this project
      result = await pool.query(`
        SELECT 
          p.id, 
          p.name, 
          p.location, 
          p.status, 
          p.progress, 
          p.plan_start as "planStart", 
          p.plan_end as "planEnd", 
          p.actual_start as "actualStart", 
          p.actual_end as "actualEnd"
        FROM projects p
        INNER JOIN project_assignments pa ON p.id = pa.project_id
        WHERE p.id = $1 AND pa.user_id = $2
      `, [id, userId]);
    } else {
      // For PMAG and Site PM, get the project directly
      result = await pool.query(`
        SELECT 
          id, 
          name, 
          location, 
          status, 
          progress, 
          plan_start as "planStart", 
          plan_end as "planEnd", 
          actual_start as "actualStart", 
          actual_end as "actualEnd"
        FROM projects
        WHERE id = $1
      `, [id]);
    }
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found or not assigned to you' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create a new project (PMAG/admin only)
const createProject = async (req, res) => {
  try {
    // Check if user is PMAG (admin)
    if (req.user.role !== 'PMAG') {
      return res.status(403).json({ message: 'Access denied. PMAG privileges required.' });
    }
    
    const { name, location, status, progress, planStart, planEnd, actualStart, actualEnd } = req.body;
    
    const result = await pool.query(`
      INSERT INTO projects 
      (name, location, status, progress, plan_start, plan_end, actual_start, actual_end)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING 
        id, 
        name, 
        location, 
        status, 
        progress, 
        plan_start as "planStart", 
        plan_end as "planEnd", 
        actual_start as "actualStart", 
        actual_end as "actualEnd"
    `, [name, location, status, progress, planStart, planEnd, actualStart, actualEnd]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update a project (PMAG/admin only)
const updateProject = async (req, res) => {
  try {
    // Check if user is PMAG (admin)
    if (req.user.role !== 'PMAG') {
      return res.status(403).json({ message: 'Access denied. PMAG privileges required.' });
    }
    
    const { id } = req.params;
    const { name, location, status, progress, planStart, planEnd, actualStart, actualEnd } = req.body;
    
    const result = await pool.query(`
      UPDATE projects 
      SET 
        name = COALESCE($1, name),
        location = COALESCE($2, location),
        status = COALESCE($3, status),
        progress = COALESCE($4, progress),
        plan_start = COALESCE($5, plan_start),
        plan_end = COALESCE($6, plan_end),
        actual_start = COALESCE($7, actual_start),
        actual_end = COALESCE($8, actual_end)
      WHERE id = $9
      RETURNING 
        id, 
        name, 
        location, 
        status, 
        progress, 
        plan_start as "planStart", 
        plan_end as "planEnd", 
        actual_start as "actualStart", 
        actual_end as "actualEnd"
    `, [name, location, status, progress, planStart, planEnd, actualStart, actualEnd, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getUserProjects,
  getProjectById,
  createProject,
  updateProject
};