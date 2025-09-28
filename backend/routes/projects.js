// backend/routes/projects.js - UPDATED FOR ENHANCED WIZARD COMPATIBILITY
const express = require('express');
const router = express.Router();

// Use new database service and existing error handler
const dbService = require('../db/database-service');
const { 
  asyncHandler, 
  ValidationError, 
  DatabaseError, 
  NotFoundError 
} = require('../middleware/error-handler');

// Import Phase 3 utilities
const { CacheService, PerformanceMonitor } = require('../utils/pagination');

// Initialize Phase 3 services
const cacheService = new CacheService();
const performanceMonitor = new PerformanceMonitor();

// Performance monitoring middleware
router.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    performanceMonitor.trackEndpoint(req.route?.path || req.path, duration, res.statusCode);
  });
  
  next();
});

// Cache invalidation helper
const invalidateProjectCache = () => {
  cacheService.invalidate('projects');
  console.log('Project cache invalidated');
};

// ENHANCED: Input validation helper to match wizard output
const validateProjectInput = (data) => {
  const errors = [];
  
  console.log('Validating project input:', JSON.stringify(data, null, 2));
  
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Project name is required and must be a non-empty string'
    });
  }
  
  if (data.name && data.name.length > 255) {
    errors.push({
      field: 'name',
      message: 'Project name must be less than 255 characters'
    });
  }
  
  if (!data.location || typeof data.location !== 'string' || data.location.trim().length === 0) {
    errors.push({
      field: 'location',
      message: 'Location is required and must be a non-empty string'
    });
  }
  
  if (!data.type || typeof data.type !== 'string') {
    errors.push({
      field: 'type',
      message: 'Project type is required'
    });
  }
  
  const validTypes = ['breakwater', 'seawall', 'pier', 'jetty', 'artificial_reef', 'coastal_protection'];
  if (data.type && !validTypes.includes(data.type)) {
    errors.push({
      field: 'type',
      message: `Project type must be one of: ${validTypes.join(', ')}`
    });
  }
  
  // ENHANCED: Better numeric validation
  if (data.budget !== null && data.budget !== undefined) {
    const budget = Number(data.budget);
    if (isNaN(budget) || budget < 0) {
      errors.push({
        field: 'budget',
        message: 'Budget must be a positive number'
      });
    }
  }
  
  // ENHANCED: Validate dimensions if provided
  const dimensionFields = ['length', 'width', 'height', 'depth'];
  dimensionFields.forEach(field => {
    if (data[field] !== null && data[field] !== undefined) {
      const value = Number(data[field]);
      if (isNaN(value) || value < 0) {
        errors.push({
          field: field,
          message: `${field} must be a positive number`
        });
      }
    }
  });
  
  // ENHANCED: Validate coordinates if provided
  if (data.latitude !== null && data.latitude !== undefined) {
    const lat = Number(data.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push({
        field: 'latitude',
        message: 'Latitude must be between -90 and 90 degrees'
      });
    }
  }
  
  if (data.longitude !== null && data.longitude !== undefined) {
    const lon = Number(data.longitude);
    if (isNaN(lon) || lon < -180 || lon > 180) {
      errors.push({
        field: 'longitude',
        message: 'Longitude must be between -180 and 180 degrees'
      });
    }
  }
  
  if (data.start_date && isNaN(Date.parse(data.start_date))) {
    errors.push({
      field: 'start_date',
      message: 'Start date must be a valid date'
    });
  }
  
  if (data.end_date && isNaN(Date.parse(data.end_date))) {
    errors.push({
      field: 'end_date',
      message: 'End date must be a valid date'
    });
  }
  
  if (data.start_date && data.end_date && new Date(data.start_date) > new Date(data.end_date)) {
    errors.push({
      field: 'date_range',
      message: 'End date must be after start date'
    });
  }
  
  return errors;
};

// Sanitize input helper
const sanitizeInput = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

// ENHANCED: Parse numeric fields safely
const parseNumericField = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
};

// Cache middleware for GET requests
const cacheMiddleware = (ttl = 300000) => {
  return (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = cacheService.generateKey('projects', {
      url: req.originalUrl,
      query: req.query
    });

    const cached = cacheService.get(cacheKey);
    if (cached) {
      console.log(`Cache hit for: ${req.originalUrl}`);
      return res.json(cached);
    }

    // Override res.json to cache successful responses
    const originalJson = res.json;
    res.json = (data) => {
      if (res.statusCode === 200) {
        cacheService.set(cacheKey, data, ttl);
        console.log(`Cached response for: ${req.originalUrl}`);
      }
      return originalJson.call(res, data);
    };

    next();
  };
};

// Get projects by status - Maps frontend categories to database statuses
router.get('/by-status/:status', cacheMiddleware(180000), asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { status } = req.params;
  
  // Map frontend categories to database statuses
const statusMapping = {
  'active': ['planning', 'design', 'permitting', 'construction', 'planned'],
  'archived': ['completed', 'cancelled', 'on_hold', 'archived']
};
  
  // Validate status parameter
  if (!statusMapping[status]) {
    throw new ValidationError(`Invalid status. Must be one of: ${Object.keys(statusMapping).join(', ')}`, [{
      field: 'status',
      message: `Status must be one of: ${Object.keys(statusMapping).join(', ')}`
    }]);
  }
  
  const dbStatuses = statusMapping[status];
  const placeholders = dbStatuses.map(() => '?').join(',');
  
  try {
    const projects = await dbService.all(
      `SELECT * FROM projects WHERE status IN (${placeholders}) ORDER BY created_at DESC`, 
      dbStatuses
    );
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT projects by status', duration, true);
    
    console.log(`Projects by status ${status} retrieved in ${duration}ms`);
    
    res.json({
      success: true,
      data: projects,
      statusMapping: {
        requested: status,
        databaseStatuses: dbStatuses
      },
      performance: {
        queryTime: duration,
        cached: false
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT projects by status', duration, false);
    throw new DatabaseError('Failed to fetch projects by status', error);
  }
}));

// Get all projects with pagination, filtering, and sorting
router.get('/', cacheMiddleware(180000), asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
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
    whereConditions.push('(name LIKE ? OR location LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  
  try {
    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM projects ${whereClause}`;
    const countResult = await dbService.get(countQuery, params);
    const total = countResult.total;
    
    // Get paginated results
    const query = `
      SELECT * FROM projects 
      ${whereClause}
      ORDER BY ${finalSortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    
    const finalParams = [...params, limit, offset];
    const projects = await dbService.all(query, finalParams);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT projects with pagination', duration, true);
    
    console.log(`Projects page ${page} retrieved in ${duration}ms (${projects.length} items)`);
    
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
      },
      performance: {
        queryTime: duration,
        cached: false
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT projects with pagination', duration, false);
    throw new DatabaseError('Failed to fetch projects', error);
  }
}));

// FIXED: Get single project with related data using correct table names
router.get('/:id', cacheMiddleware(300000), asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const projectId = parseInt(req.params.id);
  
  if (isNaN(projectId)) {
    throw new ValidationError('Invalid project ID', [{
      field: 'id',
      message: 'Project ID must be a valid number'
    }]);
  }
  
  try {
    // Get project details
    const project = await dbService.get('SELECT * FROM projects WHERE id = ?', [projectId]);
    
    if (!project) {
      throw new NotFoundError('Project');
    }
    
    // FIXED: Get related data using correct table names from your schema
    const relatedData = await dbService.transaction(async (tx) => {
      const [materials, species, regulations] = await Promise.all([
        tx.all('SELECT * FROM project_materials WHERE project_id = ? ORDER BY created_at DESC LIMIT 10', [projectId]),
        tx.all('SELECT * FROM species_database WHERE project_id = ? ORDER BY created_at DESC LIMIT 20', [projectId]),
        tx.all('SELECT * FROM regulatory_requirements WHERE project_id = ? ORDER BY created_at DESC', [projectId])
      ]);
      
      return { materials, species, regulations };
    });
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT project by ID with relations', duration, true);
    
    console.log(`Project ${projectId} with relations retrieved in ${duration}ms`);
    
    res.json({
      success: true,
      data: {
        ...project,
        ...relatedData
      },
      performance: {
        queryTime: duration,
        cached: false
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT project by ID with relations', duration, false);
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to fetch project', error);
  }
}));

// ENHANCED: Create new project - Updated to handle wizard fields
router.post('/', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  console.log('Received project creation request:', JSON.stringify(req.body, null, 2));
  
  // Validate input
  const validationErrors = validateProjectInput(req.body);
  if (validationErrors.length > 0) {
    console.error('Validation errors:', validationErrors);
    throw new ValidationError('Validation failed', validationErrors);
  }
  
  // ENHANCED: Sanitize and parse all possible fields from wizard
  const sanitizedData = {
    // Core required fields
    name: sanitizeInput(req.body.name),
    location: sanitizeInput(req.body.location),
    type: req.body.type,
    status: req.body.status || 'planning',
    
    // Optional text fields
    description: sanitizeInput(req.body.description || ''),
    client_name: req.body.client_name ? sanitizeInput(req.body.client_name) : null,
    project_manager: req.body.project_manager ? sanitizeInput(req.body.project_manager) : null,
    
    // Numeric fields with safe parsing
    budget: parseNumericField(req.body.budget),
    length: parseNumericField(req.body.length),
    width: parseNumericField(req.body.width),
    height: parseNumericField(req.body.height),
    depth: parseNumericField(req.body.depth),
    
    // Coordinate fields
    latitude: parseNumericField(req.body.latitude || req.body.lat),
    longitude: parseNumericField(req.body.longitude || req.body.lon),
    
    // Environmental fields
    water_depth: parseNumericField(req.body.water_depth),
    salinity: parseNumericField(req.body.salinity),
    temperature: parseNumericField(req.body.temperature),
    wave_height: parseNumericField(req.body.wave_height),
    ph_level: parseNumericField(req.body.ph_level),
    
    // Date fields
    start_date: req.body.start_date || null,
    end_date: req.body.end_date || null,
    
    // Array fields (store as JSON strings)
    primary_goals: req.body.primary_goals ? JSON.stringify(req.body.primary_goals) : null,
    target_species: req.body.target_species ? JSON.stringify(req.body.target_species) : null,
    habitat_types: req.body.habitat_types ? JSON.stringify(req.body.habitat_types) : null,
  };
  
  console.log('Sanitized data for database:', JSON.stringify(sanitizedData, null, 2));
  
  try {
    const result = await dbService.transaction(async (tx) => {
      // ENHANCED: Insert with all possible fields (only include columns that exist in your schema)
      const query = `
        INSERT INTO projects (
          name, description, location, type, status, budget, start_date, end_date,
          client_name, project_manager, length, width, height, depth,
          latitude, longitude, water_depth, salinity, temperature, wave_height,
          primary_goals, target_species, habitat_types, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `;
      
      const insertResult = await tx.run(query, [
        sanitizedData.name,
        sanitizedData.description,
        sanitizedData.location,
        sanitizedData.type,
        sanitizedData.status,
        sanitizedData.budget,
        sanitizedData.start_date,
        sanitizedData.end_date,
        sanitizedData.client_name,
        sanitizedData.project_manager,
        sanitizedData.length,
        sanitizedData.width,
        sanitizedData.height,
        sanitizedData.depth,
        sanitizedData.latitude,
        sanitizedData.longitude,
        sanitizedData.water_depth,
        sanitizedData.salinity,
        sanitizedData.temperature,
        sanitizedData.wave_height,
        sanitizedData.primary_goals,
        sanitizedData.target_species,
        sanitizedData.habitat_types
      ]);
      
      // Get the created project
      const newProject = await tx.get('SELECT * FROM projects WHERE id = ?', [insertResult.lastID]);
      
      return newProject;
    });
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('INSERT project', duration, true);
    
    // Invalidate cache since data changed
    invalidateProjectCache();
    
    console.log(`Project created successfully in ${duration}ms - ID: ${result.id}`);
    
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: result,
      performance: {
        queryTime: duration
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('INSERT project', duration, false);
    console.error('Database error during project creation:', error);
    throw new DatabaseError('Failed to create project', error);
  }
}));

// Update project (existing code with enhancements)
router.put('/:id', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const projectId = parseInt(req.params.id);
  
  if (isNaN(projectId)) {
    throw new ValidationError('Invalid project ID', [{
      field: 'id',
      message: 'Project ID must be a valid number'
    }]);
  }
  
  // Validate input
  const validationErrors = validateProjectInput(req.body);
  if (validationErrors.length > 0) {
    throw new ValidationError('Validation failed', validationErrors);
  }
  
  // ENHANCED: Handle all fields like in POST
  const sanitizedData = {
    name: sanitizeInput(req.body.name),
    description: sanitizeInput(req.body.description || ''),
    location: sanitizeInput(req.body.location),
    type: req.body.type,
    status: req.body.status,
    budget: parseNumericField(req.body.budget),
    start_date: req.body.start_date || null,
    end_date: req.body.end_date || null,
    client_name: req.body.client_name ? sanitizeInput(req.body.client_name) : null,
    project_manager: req.body.project_manager ? sanitizeInput(req.body.project_manager) : null,
    length: parseNumericField(req.body.length),
    width: parseNumericField(req.body.width),
    height: parseNumericField(req.body.height),
    depth: parseNumericField(req.body.depth),
    latitude: parseNumericField(req.body.latitude || req.body.lat),
    longitude: parseNumericField(req.body.longitude || req.body.lon)
  };
  
  try {
    const result = await dbService.transaction(async (tx) => {
      // Check if project exists
      const existingProject = await tx.get('SELECT * FROM projects WHERE id = ?', [projectId]);
      if (!existingProject) {
        throw new NotFoundError('Project');
      }
      
      const query = `
        UPDATE projects 
        SET name = ?, description = ?, location = ?, type = ?, status = ?, 
            budget = ?, start_date = ?, end_date = ?, client_name = ?, project_manager = ?,
            length = ?, width = ?, height = ?, depth = ?, latitude = ?, longitude = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `;
      
      await tx.run(query, [
        sanitizedData.name,
        sanitizedData.description,
        sanitizedData.location,
        sanitizedData.type,
        sanitizedData.status,
        sanitizedData.budget,
        sanitizedData.start_date,
        sanitizedData.end_date,
        sanitizedData.client_name,
        sanitizedData.project_manager,
        sanitizedData.length,
        sanitizedData.width,
        sanitizedData.height,
        sanitizedData.depth,
        sanitizedData.latitude,
        sanitizedData.longitude,
        projectId
      ]);
      
      // Get the updated project
      const updatedProject = await tx.get('SELECT * FROM projects WHERE id = ?', [projectId]);
      
      return { existingProject, updatedProject };
    });
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('UPDATE project', duration, true);
    
    // Invalidate cache since data changed
    invalidateProjectCache();
    
    console.log(`Project ${projectId} updated in ${duration}ms`);
    
    res.json({
      success: true,
      message: 'Project updated successfully',
      data: result.updatedProject,
      performance: {
        queryTime: duration
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('UPDATE project', duration, false);
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to update project', error);
  }
}));

// Delete project (existing code remains the same)
router.delete('/:id', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const projectId = parseInt(req.params.id);
  
  if (isNaN(projectId)) {
    throw new ValidationError('Invalid project ID', [{
      field: 'id',
      message: 'Project ID must be a valid number'
    }]);
  }
  
  try {
    const result = await dbService.transaction(async (tx) => {
      // Check if project exists and get its data for logging
      const existingProject = await tx.get('SELECT * FROM projects WHERE id = ?', [projectId]);
      if (!existingProject) {
        throw new NotFoundError('Project');
      }
      
      // Delete project (cascade will handle related data if configured)
      await tx.run('DELETE FROM projects WHERE id = ?', [projectId]);
      
      return existingProject;
    });
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('DELETE project', duration, true);
    
    // Invalidate cache since data changed
    invalidateProjectCache();
    
    console.log(`Project ${projectId} deleted in ${duration}ms`);
    
    res.json({
      success: true,
      message: 'Project deleted successfully',
      performance: {
        queryTime: duration
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('DELETE project', duration, false);
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to delete project', error);
  }
}));

// Performance & Cache Management Endpoints (existing code remains the same)
router.get('/admin/performance', asyncHandler(async (req, res) => {
  try {
    const performanceMetrics = performanceMonitor.getMetrics();
    const cacheStats = cacheService.getStats();
    
    res.json({
      success: true,
      data: {
        performance: performanceMetrics,
        cache: cacheStats,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    throw new DatabaseError('Failed to retrieve performance metrics', error);
  }
}));

router.post('/admin/cache/clear', asyncHandler(async (req, res) => {
  try {
    const { pattern } = req.body;
    
    if (pattern) {
      cacheService.invalidate(pattern);
    } else {
      cacheService.clear();
    }
    
    res.json({
      success: true,
      message: pattern ? `Cache cleared for pattern: ${pattern}` : 'All cache cleared'
    });
    
  } catch (error) {
    throw new DatabaseError('Failed to clear cache', error);
  }
}));

router.get('/stats', cacheMiddleware(300000), asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  try {
    const [statusStats, typeStats, budgetStats] = await Promise.all([
      dbService.all('SELECT status, COUNT(*) as count FROM projects GROUP BY status'),
      dbService.all('SELECT type, COUNT(*) as count FROM projects GROUP BY type'),
      dbService.get('SELECT COUNT(*) as total_projects, SUM(budget) as total_budget, AVG(budget) as avg_budget FROM projects WHERE budget IS NOT NULL')
    ]);
    
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT project statistics', duration, true);
    
    console.log(`Project statistics retrieved in ${duration}ms`);
    
    res.json({
      success: true,
      data: {
        byStatus: statusStats,
        byType: typeStats,
        budget: budgetStats
      },
      performance: {
        queryTime: duration,
        cached: false
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT project statistics', duration, false);
    throw new DatabaseError('Failed to fetch project statistics', error);
  }
}));

// Add these routes to your backend/routes/projects.js file:

// Archive a project
router.put('/:id/archive', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const projectId = parseInt(req.params.id);
  
  if (isNaN(projectId)) {
    throw new ValidationError('Invalid project ID', [{
      field: 'id',
      message: 'Project ID must be a valid number'
    }]);
  }
  
  try {
    const result = await dbService.transaction(async (tx) => {
      const existingProject = await tx.get('SELECT * FROM projects WHERE id = ?', [projectId]);
      if (!existingProject) {
        throw new NotFoundError('Project');
      }
      
      // Update status to archived (or whatever status represents archived in your system)
      await tx.run('UPDATE projects SET status = ?, updated_at = datetime(\'now\') WHERE id = ?', ['archived', projectId]);
      
      const updatedProject = await tx.get('SELECT * FROM projects WHERE id = ?', [projectId]);
      return updatedProject;
    });
    
    invalidateProjectCache();
    
    res.json({
      success: true,
      message: 'Project archived successfully',
      data: result
    });
    
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to archive project', error);
  }
}));

// Restore a project
router.put('/:id/restore', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const projectId = parseInt(req.params.id);
  
  if (isNaN(projectId)) {
    throw new ValidationError('Invalid project ID', [{
      field: 'id',
      message: 'Project ID must be a valid number'
    }]);
  }
  
  try {
    const result = await dbService.transaction(async (tx) => {
      const existingProject = await tx.get('SELECT * FROM projects WHERE id = ?', [projectId]);
      if (!existingProject) {
        throw new NotFoundError('Project');
      }
      
      // Update status back to planning or active
      await tx.run('UPDATE projects SET status = ?, updated_at = datetime(\'now\') WHERE id = ?', ['planning', projectId]);
      
      const updatedProject = await tx.get('SELECT * FROM projects WHERE id = ?', [projectId]);
      return updatedProject;
    });
    
    invalidateProjectCache();
    
    res.json({
      success: true,
      message: 'Project restored successfully',
      data: result
    });
    
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to restore project', error);
  }
}));

// Bulk archive
router.put('/bulk-archive', asyncHandler(async (req, res) => {
  const { projectIds } = req.body;
  
  if (!Array.isArray(projectIds) || projectIds.length === 0) {
    throw new ValidationError('projectIds array is required');
  }
  
  try {
    const placeholders = projectIds.map(() => '?').join(',');
    const result = await dbService.run(
      `UPDATE projects SET status = 'archived', updated_at = datetime('now') WHERE id IN (${placeholders})`,
      projectIds
    );
    
    invalidateProjectCache();
    
    res.json({
      success: true,
      data: { archivedCount: result.changes }
    });
    
  } catch (error) {
    throw new DatabaseError('Failed to archive projects', error);
  }
}));

// Permanent delete
router.delete('/:id/permanent', asyncHandler(async (req, res) => {
  const projectId = parseInt(req.params.id);
  
  if (isNaN(projectId)) {
    throw new ValidationError('Invalid project ID');
  }
  
  try {
    const result = await dbService.run('DELETE FROM projects WHERE id = ?', [projectId]);
    
    if (result.changes === 0) {
      throw new NotFoundError('Project');
    }
    
    invalidateProjectCache();
    
    res.json({
      success: true,
      message: 'Project permanently deleted'
    });
    
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to delete project', error);
  }
}));

// Bulk permanent delete
router.delete('/bulk-permanent', asyncHandler(async (req, res) => {
  const { projectIds } = req.body;
  
  if (!Array.isArray(projectIds) || projectIds.length === 0) {
    throw new ValidationError('projectIds array is required');
  }
  
  try {
    const placeholders = projectIds.map(() => '?').join(',');
    const result = await dbService.run(
      `DELETE FROM projects WHERE id IN (${placeholders})`,
      projectIds
    );
    
    invalidateProjectCache();
    
    res.json({
      success: true,
      data: { deletedCount: result.changes }
    });
    
  } catch (error) {
    throw new DatabaseError('Failed to delete projects', error);
  }
}));

module.exports = router;