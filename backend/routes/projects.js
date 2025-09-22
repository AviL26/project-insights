// backend/routes/projects.js - Enhanced with Phase 3 Caching & Performance Monitoring
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

// Input validation helper (enhanced)
const validateProjectInput = (data) => {
  const errors = [];
  
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
  
  if (data.budget && (typeof data.budget !== 'number' || data.budget < 0)) {
    errors.push({
      field: 'budget',
      message: 'Budget must be a positive number'
    });
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
    'active': ['planning', 'design', 'permitting', 'construction'],
    'archived': ['completed', 'cancelled', 'on_hold']
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
    
    // Log activity
    await dbService.logActivity('READ', 'projects', null, {
      action: 'get_by_status',
      status,
      count: projects.length,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
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
    whereConditions.push('(name LIKE ? OR description LIKE ? OR location LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
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
    
    // Log activity
    await dbService.logActivity('READ', 'projects', null, {
      action: 'get_all',
      filters: { status, type, location, search },
      pagination: { page, limit },
      resultCount: projects.length,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
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

// Get single project with related data
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
    
    // Get related data using transactions for consistency
    const relatedData = await dbService.transaction(async (tx) => {
      const [materials, ecologicalData, complianceData] = await Promise.all([
        tx.all('SELECT * FROM materials WHERE project_id = ? ORDER BY created_at DESC LIMIT 10', [projectId]),
        tx.all('SELECT * FROM ecological_data WHERE project_id = ? ORDER BY measurement_date DESC LIMIT 20', [projectId]),
        tx.all('SELECT * FROM compliance_data WHERE project_id = ? ORDER BY due_date ASC', [projectId])
      ]);
      
      return { materials, ecologicalData, complianceData };
    });
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT project by ID with relations', duration, true);
    
    // Log activity
    await dbService.logActivity('READ', 'projects', projectId, {
      action: 'get_single',
      includedRelated: ['materials', 'ecological_data', 'compliance_data'],
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
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

// Create new project
router.post('/', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  // Validate input
  const validationErrors = validateProjectInput(req.body);
  if (validationErrors.length > 0) {
    throw new ValidationError('Validation failed', validationErrors);
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
  
  try {
    const result = await dbService.transaction(async (tx) => {
      const query = `
        INSERT INTO projects (name, description, location, type, status, budget, start_date, end_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const insertResult = await tx.run(query, [
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
      const newProject = await tx.get('SELECT * FROM projects WHERE id = ?', [insertResult.lastID]);
      
      return newProject;
    });
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('INSERT project', duration, true);
    
    // Invalidate cache since data changed
    invalidateProjectCache();
    
    // Log activity
    await dbService.logActivity('CREATE', 'projects', result.id, {
      action: 'create_project',
      projectData: sanitizedData,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log(`Project created in ${duration}ms - ID: ${result.id}`);
    
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
    throw new DatabaseError('Failed to create project', error);
  }
}));

// Update project
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
            budget = ?, start_date = ?, end_date = ?, updated_at = CURRENT_TIMESTAMP
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
    
    // Log activity
    await dbService.logActivity('UPDATE', 'projects', projectId, {
      action: 'update_project',
      previousData: result.existingProject,
      newData: sanitizedData,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
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

// Delete project
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
    
    // Log activity
    await dbService.logActivity('DELETE', 'projects', projectId, {
      action: 'delete_project',
      deletedData: result,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
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

// New Performance & Cache Management Endpoints for Phase 3

// GET /api/projects/admin/performance - Get performance metrics
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

// POST /api/projects/admin/cache/clear - Clear cache
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

// GET /api/projects/stats - Project statistics with caching
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

module.exports = router;