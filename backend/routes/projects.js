const express = require('express');
const router = express.Router();
const { db } = require('../db/database');

// Input validation helper
const validateProjectInput = (data) => {
  const errors = [];
  
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Project name is required and must be a non-empty string');
  }
  
  if (data.name && data.name.length > 255) {
    errors.push('Project name must be less than 255 characters');
  }
  
  if (!data.location || typeof data.location !== 'string' || data.location.trim().length === 0) {
    errors.push('Location is required and must be a non-empty string');
  }
  
  if (!data.type || typeof data.type !== 'string') {
    errors.push('Project type is required');
  }
  
  const validTypes = ['breakwater', 'seawall', 'pier', 'jetty', 'artificial_reef', 'coastal_protection'];
  if (data.type && !validTypes.includes(data.type)) {
    errors.push(`Project type must be one of: ${validTypes.join(', ')}`);
  }
  
  if (data.budget && (typeof data.budget !== 'number' || data.budget < 0)) {
    errors.push('Budget must be a positive number');
  }
  
  if (data.start_date && isNaN(Date.parse(data.start_date))) {
    errors.push('Start date must be a valid date');
  }
  
  if (data.end_date && isNaN(Date.parse(data.end_date))) {
    errors.push('End date must be a valid date');
  }
  
  if (data.start_date && data.end_date && new Date(data.start_date) > new Date(data.end_date)) {
    errors.push('End date must be after start date');
  }
  
  return errors;
};

// Sanitize input helper
const sanitizeInput = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

// Get all projects with pagination, filtering, and sorting
router.get('/', async (req, res) => {
  try {
    // Parse pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    
    // Parse filtering parameters
    const { status, type, location, search } = req.query;
    
    // Parse sorting parameters
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';
    
    // Valid sort columns to prevent SQL injection
    const validSortColumns = ['id', 'name', 'location', 'type', 'status', 'budget', 'start_date', 'end_date', 'created_at'];
    const finalSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    
    // Build WHERE clause
    const whereConditions = [];
    const params = [];
    
    if (status) {
      whereConditions.push('status = ?');
      params.push(status);
    }
    
    if (type) {
      whereConditions.push('type = ?');
      params.push(type);
    }
    
    if (location) {
      whereConditions.push('location LIKE ?');
      params.push(`%${location}%`);
    }
    
    if (search) {
      whereConditions.push('(name LIKE ? OR description LIKE ? OR location LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM projects ${whereClause}`;
    const countResult = await db.get(countQuery, params);
    const total = countResult.total;
    
    // Get paginated results
    const query = `
      SELECT * FROM projects 
      ${whereClause}
      ORDER BY ${finalSortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    
    const finalParams = [...params, limit, offset];
    const projects = await db.all(query, finalParams);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    res.json({
      success: true,
      data: projects,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null
      },
      filters: {
        status,
        type,
        location,
        search
      },
      sort: {
        sortBy: finalSortBy,
        sortOrder
      }
    });
    
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get single project with related data
router.get('/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
    }
    
    // Get project details
    const project = await db.get('SELECT * FROM projects WHERE id = ?', [projectId]);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Get related data in parallel for better performance
    const [materials, ecologicalData, complianceData, reports] = await Promise.all([
      db.all('SELECT * FROM materials WHERE project_id = ? ORDER BY created_at DESC LIMIT 10', [projectId]),
      db.all('SELECT * FROM ecological_data WHERE project_id = ? ORDER BY measurement_date DESC LIMIT 20', [projectId]),
      db.all('SELECT * FROM compliance_data WHERE project_id = ? ORDER BY due_date ASC', [projectId]),
      db.all('SELECT * FROM reports WHERE project_id = ? ORDER BY generated_at DESC LIMIT 5', [projectId])
    ]);
    
    res.json({
      success: true,
      data: {
        ...project,
        materials,
        ecologicalData,
        complianceData,
        reports
      }
    });
    
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Create new project
router.post('/', async (req, res) => {
  try {
    // Validate input
    const validationErrors = validateProjectInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // Sanitize input
    const sanitizedData = {
      name: sanitizeInput(req.body.name),
      description: sanitizeInput(req.body.description || ''),
      location: sanitizeInput(req.body.location),
      type: req.body.type,
      status: req.body.status || 'planning',
      budget: req.body.budget || null,
      start_date: req.body.start_date || null,
      end_date: req.body.end_date || null
    };
    
    const query = `
      INSERT INTO projects (name, description, location, type, status, budget, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await db.run(query, [
      sanitizedData.name,
      sanitizedData.description,
      sanitizedData.location,
      sanitizedData.type,
      sanitizedData.status,
      sanitizedData.budget,
      sanitizedData.start_date,
      sanitizedData.end_date
    ]);
    
    // Get the created project
    const newProject = await db.get('SELECT * FROM projects WHERE id = ?', [result.lastID]);
    
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: newProject
    });
    
  } catch (error) {
    console.error('Error creating project:', error);
    
    // Handle specific database errors
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({
        success: false,
        message: 'Database constraint violation',
        error: 'Invalid data provided'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
    }
    
    // Check if project exists
    const existingProject = await db.get('SELECT id FROM projects WHERE id = ?', [projectId]);
    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Validate input
    const validationErrors = validateProjectInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // Sanitize input
    const sanitizedData = {
      name: sanitizeInput(req.body.name),
      description: sanitizeInput(req.body.description || ''),
      location: sanitizeInput(req.body.location),
      type: req.body.type,
      status: req.body.status,
      budget: req.body.budget || null,
      start_date: req.body.start_date || null,
      end_date: req.body.end_date || null
    };
    
    const query = `
      UPDATE projects 
      SET name = ?, description = ?, location = ?, type = ?, status = ?, 
          budget = ?, start_date = ?, end_date = ?
      WHERE id = ?
    `;
    
    await db.run(query, [
      sanitizedData.name,
      sanitizedData.description,
      sanitizedData.location,
      sanitizedData.type,
      sanitizedData.status,
      sanitizedData.budget,
      sanitizedData.start_date,
      sanitizedData.end_date,
      projectId
    ]);
    
    // Get the updated project
    const updatedProject = await db.get('SELECT * FROM projects WHERE id = ?', [projectId]);
    
    res.json({
      success: true,
      message: 'Project updated successfully',
      data: updatedProject
    });
    
  } catch (error) {
    console.error('Error updating project:', error);
    
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({
        success: false,
        message: 'Database constraint violation',
        error: 'Invalid data provided'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
    }
    
    // Check if project exists
    const existingProject = await db.get('SELECT id FROM projects WHERE id = ?', [projectId]);
    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Delete project (cascade will handle related data)
    await db.run('DELETE FROM projects WHERE id = ?', [projectId]);
    
    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;