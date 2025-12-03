// server/controllers/projectAssignmentController.js
const pool = require('../db');
const { cache } = require('../cache/redisClient');

// Assign a project to a supervisor
const assignProjectToSupervisor = async (req, res) => {
  try {
    // Check if user is PMAG (admin)
    if (req.user.role !== 'PMAG') {
      return res.status(403).json({ message: 'Access denied. PMAG privileges required.' });
    }
    
    const { projectId, supervisorId } = req.body;
    
    // Validate input
    if (!projectId || !supervisorId) {
      return res.status(400).json({ message: 'Project ID and Supervisor ID are required' });
    }
    
    // Check if project exists
    const projectResult = await pool.query(
      'SELECT id FROM projects WHERE id = $1',
      [projectId]
    );
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if supervisor exists and has the correct role
    const supervisorResult = await pool.query(
      'SELECT user_id, role FROM users WHERE user_id = $1 AND role = $2',
      [supervisorId, 'supervisor']
    );
    
    if (supervisorResult.rows.length === 0) {
      return res.status(404).json({ message: 'Supervisor not found or invalid role' });
    }
    
    // Check if assignment already exists
    const existingAssignment = await pool.query(
      'SELECT id FROM project_assignments WHERE project_id = $1 AND user_id = $2',
      [projectId, supervisorId]
    );
    
    if (existingAssignment.rows.length > 0) {
      return res.status(400).json({ message: 'Project is already assigned to this supervisor' });
    }
    
    // Assign project to supervisor
    const result = await pool.query(
      'INSERT INTO project_assignments (project_id, user_id, assigned_by) VALUES ($1, $2, $3) RETURNING id AS "ObjectId", project_id AS "ProjectId", user_id AS "UserId", assigned_at AS "AssignedAt"',
      [projectId, supervisorId, req.user.userId]
    );
    
    // Invalidate cache for this supervisor's projects
    await cache.del(`assigned_projects_${supervisorId}`);
    
    res.status(201).json({ 
      message: 'Project assigned to supervisor successfully',
      assignment: result.rows[0]
    });
  } catch (error) {
    console.error('Error assigning project to supervisor:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get assigned projects for a supervisor with caching
const getAssignedProjects = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Check if user is a supervisor
    if (req.user.role !== 'supervisor') {
      return res.status(403).json({ message: 'Access denied. Supervisor privileges required.' });
    }
    
    // Create cache key for assigned projects
    const cacheKey = `assigned_projects_${userId}`;
    
    // Try to get data from cache first
    let cachedProjects = await cache.get(cacheKey);
    if (cachedProjects) {
      console.log(`Returning assigned projects for supervisor ${userId} from cache`);
      return res.status(200).json(cachedProjects);
    }
    
    // Get projects assigned to this supervisor
    const result = await pool.query(`
      SELECT 
        p.id AS "ObjectId", 
        p.name AS "Name", 
        p.location AS "Location", 
        p.status AS "Status", 
        p.progress AS "PercentComplete", 
        p.plan_start as "PlannedStartDate", 
        p.plan_end as "PlannedFinishDate", 
        p.actual_start as "ActualStartDate", 
        p.actual_end as "ActualFinishDate"
      FROM projects p
      INNER JOIN project_assignments pa ON p.id = pa.project_id
      WHERE pa.user_id = $1
      ORDER BY p.name
    `, [userId]);
    
    // Cache the result for 5 minutes
    await cache.set(cacheKey, result.rows, 300);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching assigned projects:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get supervisors for a project (PMAG only) with caching
const getProjectSupervisors = async (req, res) => {
  try {
    // Check if user is PMAG (admin)
    if (req.user.role !== 'PMAG') {
      return res.status(403).json({ message: 'Access denied. PMAG privileges required.' });
    }
    
    const { projectId } = req.params;
    
    // Create cache key for project supervisors
    const cacheKey = `project_supervisors_${projectId}`;
    
    // Try to get data from cache first
    let cachedSupervisors = await cache.get(cacheKey);
    if (cachedSupervisors) {
      console.log(`Returning supervisors for project ${projectId} from cache`);
      return res.status(200).json(cachedSupervisors);
    }
    
    // Get supervisors assigned to this project
    const result = await pool.query(`
      SELECT 
        u.user_id AS "ObjectId",
        u.name AS "Name",
        u.email AS "Email",
        pa.assigned_at AS "AssignedAt"
      FROM users u
      INNER JOIN project_assignments pa ON u.user_id = pa.user_id
      WHERE pa.project_id = $1 AND u.role = 'supervisor'
      ORDER BY u.name
    `, [projectId]);
    
    // Cache the result for 5 minutes
    await cache.set(cacheKey, result.rows, 300);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching project supervisors:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Unassign a project from a supervisor (PMAG only)
const unassignProjectFromSupervisor = async (req, res) => {
  try {
    // Check if user is PMAG (admin)
    if (req.user.role !== 'PMAG') {
      return res.status(403).json({ message: 'Access denied. PMAG privileges required.' });
    }
    
    const { projectId, supervisorId } = req.body;
    
    // Validate input
    if (!projectId || !supervisorId) {
      return res.status(400).json({ message: 'Project ID and Supervisor ID are required' });
    }
    
    // Remove the assignment
    const result = await pool.query(
      'DELETE FROM project_assignments WHERE project_id = $1 AND user_id = $2 RETURNING id AS "ObjectId"',
      [projectId, supervisorId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    // Invalidate cache for this supervisor's projects
    await cache.del(`assigned_projects_${supervisorId}`);
    
    res.status(200).json({ 
      message: 'Project unassigned from supervisor successfully'
    });
  } catch (error) {
    console.error('Error unassigning project from supervisor:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  assignProjectToSupervisor,
  getAssignedProjects,
  getProjectSupervisors,
  unassignProjectFromSupervisor
};