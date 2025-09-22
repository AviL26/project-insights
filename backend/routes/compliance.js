// backend/routes/compliance.js - Enhanced with Phase 3 Caching & Performance Monitoring
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
const invalidateComplianceCache = () => {
  cacheService.invalidate('compliance');
  cacheService.invalidate('projects'); // Compliance affects project status
  console.log('Compliance cache invalidated');
};

// Cache middleware for GET requests
const cacheMiddleware = (ttl = 300000) => {
  return (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = cacheService.generateKey('compliance', {
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

// Input validation helper
const validateComplianceInput = (data) => {
  const errors = [];
  
  if (!data.project_id || typeof data.project_id !== 'number' || data.project_id <= 0) {
    errors.push({
      field: 'project_id',
      message: 'Valid project ID is required'
    });
  }
  
  if (!data.requirement_type || typeof data.requirement_type !== 'string' || data.requirement_type.trim().length === 0) {
    errors.push({
      field: 'requirement_type',
      message: 'Requirement type is required'
    });
  }
  
  const validRequirementTypes = [
    'environmental_permit', 'building_permit', 'marine_permit', 'safety_compliance',
    'environmental_impact', 'heritage_assessment', 'navigation_clearance',
    'fisheries_consultation', 'coastal_management', 'water_quality',
    'noise_regulations', 'waste_management', 'biodiversity_protection',
    'public_consultation', 'regulatory_approval', 'other'
  ];
  
  if (data.requirement_type && !validRequirementTypes.includes(data.requirement_type)) {
    errors.push({
      field: 'requirement_type',
      message: `Requirement type must be one of: ${validRequirementTypes.join(', ')}`
    });
  }
  
  if (!data.status || typeof data.status !== 'string') {
    errors.push({
      field: 'status',
      message: 'Status is required'
    });
  }
  
  const validStatuses = ['pending', 'in_progress', 'submitted', 'approved', 'rejected', 'expired', 'not_required'];
  if (data.status && !validStatuses.includes(data.status)) {
    errors.push({
      field: 'status',
      message: `Status must be one of: ${validStatuses.join(', ')}`
    });
  }
  
  if (data.priority && typeof data.priority !== 'string') {
    errors.push({
      field: 'priority',
      message: 'Priority must be a string'
    });
  }
  
  const validPriorities = ['low', 'medium', 'high', 'critical'];
  if (data.priority && !validPriorities.includes(data.priority)) {
    errors.push({
      field: 'priority',
      message: `Priority must be one of: ${validPriorities.join(', ')}`
    });
  }
  
  if (data.due_date && isNaN(Date.parse(data.due_date))) {
    errors.push({
      field: 'due_date',
      message: 'Due date must be a valid date'
    });
  }
  
  if (data.submission_date && isNaN(Date.parse(data.submission_date))) {
    errors.push({
      field: 'submission_date',
      message: 'Submission date must be a valid date'
    });
  }
  
  if (data.approval_date && isNaN(Date.parse(data.approval_date))) {
    errors.push({
      field: 'approval_date',
      message: 'Approval date must be a valid date'
    });
  }
  
  if (data.expiry_date && isNaN(Date.parse(data.expiry_date))) {
    errors.push({
      field: 'expiry_date',
      message: 'Expiry date must be a valid date'
    });
  }
  
  // Date logic validation
  if (data.submission_date && data.due_date && new Date(data.submission_date) > new Date(data.due_date)) {
    errors.push({
      field: 'submission_date',
      message: 'Submission date cannot be after due date'
    });
  }
  
  if (data.approval_date && data.submission_date && new Date(data.approval_date) < new Date(data.submission_date)) {
    errors.push({
      field: 'approval_date',
      message: 'Approval date cannot be before submission date'
    });
  }
  
  return errors;
};

// Sanitize input helper
const sanitizeInput = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

// Get all compliance data with pagination and filtering
router.get('/', cacheMiddleware(240000), asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const offset = (page - 1) * limit;
  
  const { project_id, requirement_type, status, priority, due_soon } = req.query;
  
  // Build WHERE clause
  const whereConditions = [];
  const params = [];
  
  if (project_id) {
    whereConditions.push('c.project_id = ?');
    params.push(parseInt(project_id));
  }
  
  if (requirement_type) {
    whereConditions.push('c.requirement_type = ?');
    params.push(requirement_type);
  }
  
  if (status) {
    whereConditions.push('c.status = ?');
    params.push(status);
  }
  
  if (priority) {
    whereConditions.push('c.priority = ?');
    params.push(priority);
  }
  
  // Filter for items due within next 30 days
  if (due_soon === 'true') {
    whereConditions.push('c.due_date <= date("now", "+30 days")');
    whereConditions.push('c.status NOT IN ("approved", "rejected", "expired", "not_required")');
  }
  
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  
  try {
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM compliance_data c ${whereClause}`;
    const countResult = await dbService.get(countQuery, params);
    const total = countResult.total;
    
    // Get paginated results with project info and enhanced data
    const query = `
      SELECT 
        c.*, 
        p.name as project_name, 
        p.location as project_location,
        CASE 
          WHEN c.due_date < date('now') AND c.status NOT IN ('approved', 'rejected', 'expired', 'not_required') 
          THEN 1 ELSE 0 
        END as is_overdue,
        CASE 
          WHEN c.due_date <= date('now', '+7 days') AND c.status NOT IN ('approved', 'rejected', 'expired', 'not_required') 
          THEN 1 ELSE 0 
        END as due_this_week,
        julianday(c.due_date) - julianday('now') as days_until_due
      FROM compliance_data c
      LEFT JOIN projects p ON c.project_id = p.id
      ${whereClause}
      ORDER BY 
        CASE c.priority 
          WHEN 'critical' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
          ELSE 5 
        END,
        c.due_date ASC,
        c.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const finalParams = [...params, limit, offset];
    const complianceData = await dbService.all(query, finalParams);
    
    // Calculate summary statistics for current view
    const summaryQuery = `
      SELECT 
        COUNT(*) as filtered_total,
        SUM(CASE WHEN c.status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN c.status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN c.priority = 'critical' THEN 1 ELSE 0 END) as critical_count,
        SUM(CASE WHEN c.due_date < date('now') AND c.status NOT IN ('approved', 'rejected', 'expired', 'not_required') THEN 1 ELSE 0 END) as overdue_count,
        COALESCE(SUM(c.cost), 0) as total_cost
      FROM compliance_data c
      LEFT JOIN projects p ON c.project_id = p.id
      ${whereClause}
    `;
    const summary = await dbService.get(summaryQuery, params);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT compliance with pagination', duration, true);
    
    // Log activity
    await dbService.logActivity('READ', 'compliance_data', null, {
      action: 'get_all',
      filters: { project_id, requirement_type, status, priority, due_soon },
      pagination: { page, limit },
      resultCount: complianceData.length,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log(`Compliance page ${page} retrieved in ${duration}ms (${complianceData.length} items)`);
    
    res.json({
      success: true,
      data: complianceData,
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
      summary,
      performance: {
        queryTime: duration,
        cached: false
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT compliance with pagination', duration, false);
    throw new DatabaseError('Failed to fetch compliance data', error);
  }
}));

// Get compliance data by project ID
router.get('/project/:projectId', cacheMiddleware(300000), asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const projectId = parseInt(req.params.projectId);
  
  if (isNaN(projectId)) {
    throw new ValidationError('Invalid project ID', [{
      field: 'projectId',
      message: 'Project ID must be a valid number'
    }]);
  }
  
  try {
    // Check if project exists
    const project = await dbService.get('SELECT id, name FROM projects WHERE id = ?', [projectId]);
    if (!project) {
      throw new NotFoundError('Project');
    }
    
    // Get compliance data for the project with enhanced calculations
    const complianceData = await dbService.all(`
      SELECT 
        *,
        CASE 
          WHEN due_date < date('now') AND status NOT IN ('approved', 'rejected', 'expired', 'not_required') 
          THEN 1 ELSE 0 
        END as is_overdue,
        CASE 
          WHEN due_date <= date('now', '+7 days') AND status NOT IN ('approved', 'rejected', 'expired', 'not_required') 
          THEN 1 ELSE 0 
        END as due_this_week,
        julianday(due_date) - julianday('now') as days_until_due
      FROM compliance_data 
      WHERE project_id = ? 
      ORDER BY 
        CASE priority 
          WHEN 'critical' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
          ELSE 5 
        END,
        due_date ASC,
        created_at DESC
    `, [projectId]);
    
    // Calculate comprehensive compliance summary
    const summary = {
      total: complianceData.length,
      pending: complianceData.filter(item => item.status === 'pending').length,
      in_progress: complianceData.filter(item => item.status === 'in_progress').length,
      submitted: complianceData.filter(item => item.status === 'submitted').length,
      approved: complianceData.filter(item => item.status === 'approved').length,
      rejected: complianceData.filter(item => item.status === 'rejected').length,
      overdue: complianceData.filter(item => item.is_overdue === 1).length,
      due_this_week: complianceData.filter(item => item.due_this_week === 1).length,
      critical: complianceData.filter(item => item.priority === 'critical').length,
      total_cost: complianceData.reduce((sum, item) => sum + (item.cost || 0), 0),
      compliance_rate: complianceData.length > 0 ? 
        Math.round((complianceData.filter(item => item.status === 'approved').length / complianceData.length) * 100) : 0
    };
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT compliance by project', duration, true);
    
    // Log activity
    await dbService.logActivity('READ', 'compliance_data', null, {
      action: 'get_by_project',
      projectId,
      resultCount: complianceData.length,
      summary,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log(`Project ${projectId} compliance retrieved in ${duration}ms`);
    
    res.json({
      success: true,
      data: complianceData,
      project: project,
      summary: summary,
      performance: {
        queryTime: duration,
        cached: false
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT compliance by project', duration, false);
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to fetch compliance data for project', error);
  }
}));

// Get single compliance item
router.get('/:id', cacheMiddleware(300000), asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const complianceId = parseInt(req.params.id);
  
  if (isNaN(complianceId)) {
    throw new ValidationError('Invalid compliance ID', [{
      field: 'id',
      message: 'Compliance ID must be a valid number'
    }]);
  }
  
  try {
    const complianceData = await dbService.get(`
      SELECT 
        c.*, 
        p.name as project_name, 
        p.location as project_location,
        CASE 
          WHEN c.due_date < date('now') AND c.status NOT IN ('approved', 'rejected', 'expired', 'not_required') 
          THEN 1 ELSE 0 
        END as is_overdue,
        julianday(c.due_date) - julianday('now') as days_until_due
      FROM compliance_data c
      LEFT JOIN projects p ON c.project_id = p.id
      WHERE c.id = ?
    `, [complianceId]);
    
    if (!complianceData) {
      throw new NotFoundError('Compliance data');
    }
    
    // Parse documents if they exist
    if (complianceData.documents) {
      try {
        complianceData.documents = JSON.parse(complianceData.documents);
      } catch (e) {
        console.warn(`Failed to parse documents for compliance ${complianceId}`);
        complianceData.documents = null;
      }
    }
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT compliance by ID', duration, true);
    
    // Log activity
    await dbService.logActivity('READ', 'compliance_data', complianceId, {
      action: 'get_single',
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log(`Compliance ${complianceId} retrieved in ${duration}ms`);
    
    res.json({
      success: true,
      data: complianceData,
      performance: {
        queryTime: duration,
        cached: false
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT compliance by ID', duration, false);
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to fetch compliance data', error);
  }
}));

// Create new compliance item
router.post('/', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  // Validate input
  const validationErrors = validateComplianceInput(req.body);
  if (validationErrors.length > 0) {
    throw new ValidationError('Validation failed', validationErrors);
  }
  
  // Sanitize input
  const sanitizedData = {
    project_id: req.body.project_id,
    requirement_type: req.body.requirement_type,
    title: sanitizeInput(req.body.title || ''),
    description: sanitizeInput(req.body.description || ''),
    status: req.body.status,
    priority: req.body.priority || 'medium',
    responsible_party: sanitizeInput(req.body.responsible_party || ''),
    regulatory_body: sanitizeInput(req.body.regulatory_body || ''),
    reference_number: sanitizeInput(req.body.reference_number || ''),
    due_date: req.body.due_date || null,
    submission_date: req.body.submission_date || null,
    approval_date: req.body.approval_date || null,
    expiry_date: req.body.expiry_date || null,
    cost: req.body.cost || null,
    documents: req.body.documents ? JSON.stringify(req.body.documents) : null,
    notes: sanitizeInput(req.body.notes || '')
  };
  
  try {
    const result = await dbService.transaction(async (tx) => {
      // Verify project exists
      const project = await tx.get('SELECT id FROM projects WHERE id = ?', [sanitizedData.project_id]);
      if (!project) {
        throw new ValidationError('Project not found', [{
          field: 'project_id',
          message: 'Referenced project does not exist'
        }]);
      }
      
      const query = `
        INSERT INTO compliance_data (
          project_id, requirement_type, title, description, status, priority,
          responsible_party, regulatory_body, reference_number, due_date,
          submission_date, approval_date, expiry_date, cost, documents, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const insertResult = await tx.run(query, [
        sanitizedData.project_id,
        sanitizedData.requirement_type,
        sanitizedData.title,
        sanitizedData.description,
        sanitizedData.status,
        sanitizedData.priority,
        sanitizedData.responsible_party,
        sanitizedData.regulatory_body,
        sanitizedData.reference_number,
        sanitizedData.due_date,
        sanitizedData.submission_date,
        sanitizedData.approval_date,
        sanitizedData.expiry_date,
        sanitizedData.cost,
        sanitizedData.documents,
        sanitizedData.notes
      ]);
      
      // Get the created compliance data
      const newComplianceData = await tx.get('SELECT * FROM compliance_data WHERE id = ?', [insertResult.lastID]);
      
      return newComplianceData;
    });
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('INSERT compliance', duration, true);
    
    // Invalidate cache since data changed
    invalidateComplianceCache();
    
    // Log activity
    await dbService.logActivity('CREATE', 'compliance_data', result.id, {
      action: 'create_compliance_item',
      complianceData: sanitizedData,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log(`Compliance item created in ${duration}ms - ID: ${result.id}`);
    
    res.status(201).json({
      success: true,
      message: 'Compliance item created successfully',
      data: result,
      performance: {
        queryTime: duration
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('INSERT compliance', duration, false);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new DatabaseError('Failed to create compliance item', error);
  }
}));

// Update compliance item
router.put('/:id', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const complianceId = parseInt(req.params.id);
  
  if (isNaN(complianceId)) {
    throw new ValidationError('Invalid compliance ID', [{
      field: 'id',
      message: 'Compliance ID must be a valid number'
    }]);
  }
  
  // Validate input
  const validationErrors = validateComplianceInput(req.body);
  if (validationErrors.length > 0) {
    throw new ValidationError('Validation failed', validationErrors);
  }
  
  // Sanitize input
  const sanitizedData = {
    project_id: req.body.project_id,
    requirement_type: req.body.requirement_type,
    title: sanitizeInput(req.body.title || ''),
    description: sanitizeInput(req.body.description || ''),
    status: req.body.status,
    priority: req.body.priority || 'medium',
    responsible_party: sanitizeInput(req.body.responsible_party || ''),
    regulatory_body: sanitizeInput(req.body.regulatory_body || ''),
    reference_number: sanitizeInput(req.body.reference_number || ''),
    due_date: req.body.due_date || null,
    submission_date: req.body.submission_date || null,
    approval_date: req.body.approval_date || null,
    expiry_date: req.body.expiry_date || null,
    cost: req.body.cost || null,
    documents: req.body.documents ? JSON.stringify(req.body.documents) : null,
    notes: sanitizeInput(req.body.notes || '')
  };
  
  try {
    const result = await dbService.transaction(async (tx) => {
      // Check if compliance data exists
      const existingData = await tx.get('SELECT * FROM compliance_data WHERE id = ?', [complianceId]);
      if (!existingData) {
        throw new NotFoundError('Compliance data');
      }
      
      // Verify project exists
      const project = await tx.get('SELECT id FROM projects WHERE id = ?', [sanitizedData.project_id]);
      if (!project) {
        throw new ValidationError('Project not found', [{
          field: 'project_id',
          message: 'Referenced project does not exist'
        }]);
      }
      
      const query = `
        UPDATE compliance_data 
        SET project_id = ?, requirement_type = ?, title = ?, description = ?,
            status = ?, priority = ?, responsible_party = ?, regulatory_body = ?,
            reference_number = ?, due_date = ?, submission_date = ?, approval_date = ?,
            expiry_date = ?, cost = ?, documents = ?, notes = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      await tx.run(query, [
        sanitizedData.project_id,
        sanitizedData.requirement_type,
        sanitizedData.title,
        sanitizedData.description,
        sanitizedData.status,
        sanitizedData.priority,
        sanitizedData.responsible_party,
        sanitizedData.regulatory_body,
        sanitizedData.reference_number,
        sanitizedData.due_date,
        sanitizedData.submission_date,
        sanitizedData.approval_date,
        sanitizedData.expiry_date,
        sanitizedData.cost,
        sanitizedData.documents,
        sanitizedData.notes,
        complianceId
      ]);
      
      // Get the updated compliance data
      const updatedData = await tx.get('SELECT * FROM compliance_data WHERE id = ?', [complianceId]);
      
      return { existingData, updatedData };
    });
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('UPDATE compliance', duration, true);
    
    // Invalidate cache since data changed
    invalidateComplianceCache();
    
    // Log activity
    await dbService.logActivity('UPDATE', 'compliance_data', complianceId, {
      action: 'update_compliance_item',
      previousData: result.existingData,
      newData: sanitizedData,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log(`Compliance ${complianceId} updated in ${duration}ms`);
    
    res.json({
      success: true,
      message: 'Compliance item updated successfully',
      data: result.updatedData,
      performance: {
        queryTime: duration
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('UPDATE compliance', duration, false);
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }
    throw new DatabaseError('Failed to update compliance item', error);
  }
}));

// Delete compliance item
router.delete('/:id', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const complianceId = parseInt(req.params.id);
  
  if (isNaN(complianceId)) {
    throw new ValidationError('Invalid compliance ID', [{
      field: 'id',
      message: 'Compliance ID must be a valid number'
    }]);
  }
  
  try {
    const result = await dbService.transaction(async (tx) => {
      // Check if compliance data exists and get its data for logging
      const existingData = await tx.get('SELECT * FROM compliance_data WHERE id = ?', [complianceId]);
      if (!existingData) {
        throw new NotFoundError('Compliance data');
      }
      
      // Delete compliance data
      await tx.run('DELETE FROM compliance_data WHERE id = ?', [complianceId]);
      
      return existingData;
    });
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('DELETE compliance', duration, true);
    
    // Invalidate cache since data changed
    invalidateComplianceCache();
    
    // Log activity
    await dbService.logActivity('DELETE', 'compliance_data', complianceId, {
      action: 'delete_compliance_item',
      deletedData: result,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log(`Compliance ${complianceId} deleted in ${duration}ms`);
    
    res.json({
      success: true,
      message: 'Compliance item deleted successfully',
      performance: {
        queryTime: duration
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('DELETE compliance', duration, false);
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to delete compliance item', error);
  }
}));

// Get compliance dashboard summary
router.get('/dashboard/summary', cacheMiddleware(120000), asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { project_id } = req.query;
  
  try {
    let whereClause = '';
    let params = [];
    
    if (project_id) {
      whereClause = 'WHERE project_id = ?';
      params = [parseInt(project_id)];
    }
    
    // Get comprehensive statistics with performance calculations
    const stats = await dbService.get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN priority = 'critical' THEN 1 ELSE 0 END) as critical_items,
        SUM(CASE WHEN due_date <= date('now', '+7 days') AND status NOT IN ('approved', 'rejected', 'expired', 'not_required') THEN 1 ELSE 0 END) as due_this_week,
        SUM(CASE WHEN due_date < date('now') AND status NOT IN ('approved', 'rejected', 'expired', 'not_required') THEN 1 ELSE 0 END) as overdue,
        COALESCE(SUM(cost), 0) as total_cost,
        ROUND(AVG(CASE WHEN status = 'approved' THEN 100.0 ELSE 0 END), 2) as compliance_rate
      FROM compliance_data ${whereClause}
    `, params);
    
    // Get recent activity with enhanced details
    const recentActivity = await dbService.all(`
      SELECT 
        c.*, 
        p.name as project_name,
        CASE 
          WHEN c.due_date < date('now') AND c.status NOT IN ('approved', 'rejected', 'expired', 'not_required') 
          THEN 1 ELSE 0 
        END as is_overdue
      FROM compliance_data c
      LEFT JOIN projects p ON c.project_id = p.id
      ${whereClause}
      ORDER BY c.updated_at DESC
      LIMIT 10
    `, params);
    
    // Get upcoming deadlines with priority sorting
    const upcomingDeadlines = await dbService.all(`
      SELECT 
        c.*, 
        p.name as project_name,
        julianday(c.due_date) - julianday('now') as days_until_due
      FROM compliance_data c
      LEFT JOIN projects p ON c.project_id = p.id
      WHERE c.due_date <= date('now', '+30 days') 
        AND c.status NOT IN ('approved', 'rejected', 'expired', 'not_required')
        ${project_id ? 'AND c.project_id = ?' : ''}
      ORDER BY 
        CASE c.priority 
          WHEN 'critical' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
          ELSE 5 
        END,
        c.due_date ASC
      LIMIT 15
    `, project_id ? [parseInt(project_id)] : []);
    
    // Get compliance trends by requirement type
    const requirementTypeStats = await dbService.all(`
      SELECT 
        requirement_type,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        ROUND(AVG(CASE WHEN status = 'approved' THEN 100.0 ELSE 0 END), 2) as approval_rate,
        COALESCE(SUM(cost), 0) as total_cost
      FROM compliance_data 
      ${whereClause}
      GROUP BY requirement_type
      ORDER BY count DESC
      LIMIT 10
    `, params);
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT compliance dashboard', duration, true);
    
    // Log activity
    await dbService.logActivity('READ', 'compliance_data', null, {
      action: 'dashboard_summary',
      projectId: project_id,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log(`Compliance dashboard retrieved in ${duration}ms`);
    
    res.json({
      success: true,
      data: {
        statistics: stats,
        recentActivity,
        upcomingDeadlines,
        requirementTypeStats
      },
      performance: {
        queryTime: duration,
        cached: false
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT compliance dashboard', duration, false);
    throw new DatabaseError('Failed to fetch compliance dashboard', error);
  }
}));

// Get compliance statistics with detailed analytics
router.get('/admin/stats', cacheMiddleware(300000), asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  try {
    const [statusStats, priorityStats, typeStats, monthlyStats] = await Promise.all([
      // Status distribution
      dbService.all(`
        SELECT 
          status,
          COUNT(*) as count,
          COALESCE(SUM(cost), 0) as total_cost,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM compliance_data), 2) as percentage
        FROM compliance_data 
        GROUP BY status
        ORDER BY count DESC
      `),
      
      // Priority distribution
      dbService.all(`
        SELECT 
          priority,
          COUNT(*) as count,
          SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue_count,
          COALESCE(AVG(cost), 0) as avg_cost
        FROM compliance_data 
        GROUP BY priority
        ORDER BY 
          CASE priority 
            WHEN 'critical' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            WHEN 'low' THEN 4 
            ELSE 5 
          END
      `),
      
      // Requirement type analysis
      dbService.all(`
        SELECT 
          requirement_type,
          COUNT(*) as count,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
          ROUND(AVG(CASE WHEN status = 'approved' THEN 100.0 ELSE 0 END), 2) as approval_rate,
          AVG(julianday(approval_date) - julianday(submission_date)) as avg_approval_days
        FROM compliance_data 
        WHERE requirement_type IS NOT NULL
        GROUP BY requirement_type
        ORDER BY count DESC
      `),
      
      // Monthly trends (last 12 months)
      dbService.all(`
        SELECT 
          strftime('%Y-%m', created_at) as month,
          COUNT(*) as created_count,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
          COALESCE(SUM(cost), 0) as monthly_cost
        FROM compliance_data 
        WHERE created_at >= date('now', '-12 months')
        GROUP BY strftime('%Y-%m', created_at)
        ORDER BY month ASC
      `)
    ]);
    
    // Calculate overall performance metrics
    const overallStats = await dbService.get(`
      SELECT 
        COUNT(*) as total_items,
        COALESCE(SUM(cost), 0) as total_cost,
        COUNT(DISTINCT project_id) as projects_with_compliance,
        COUNT(DISTINCT regulatory_body) as unique_regulatory_bodies,
        AVG(julianday(approval_date) - julianday(submission_date)) as avg_approval_time,
        ROUND(AVG(CASE WHEN status = 'approved' THEN 100.0 ELSE 0 END), 2) as overall_approval_rate
      FROM compliance_data
    `);
    
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT compliance statistics', duration, true);
    
    console.log(`Compliance statistics retrieved in ${duration}ms`);
    
    res.json({
      success: true,
      data: {
        overall: overallStats,
        byStatus: statusStats,
        byPriority: priorityStats,
        byType: typeStats,
        monthlyTrends: monthlyStats
      },
      performance: {
        queryTime: duration,
        cached: false
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT compliance statistics', duration, false);
    throw new DatabaseError('Failed to fetch compliance statistics', error);
  }
}));

// Bulk update compliance statuses
router.post('/bulk/update-status', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { ids, status, notes } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ValidationError('IDs array is required and cannot be empty', [{
      field: 'ids',
      message: 'Must provide an array of compliance IDs'
    }]);
  }
  
  const validStatuses = ['pending', 'in_progress', 'submitted', 'approved', 'rejected', 'expired', 'not_required'];
  if (!validStatuses.includes(status)) {
    throw new ValidationError('Invalid status', [{
      field: 'status',
      message: `Status must be one of: ${validStatuses.join(', ')}`
    }]);
  }
  
  try {
    const result = await dbService.transaction(async (tx) => {
      const placeholders = ids.map(() => '?').join(',');
      const updateQuery = `
        UPDATE compliance_data 
        SET status = ?, 
            notes = COALESCE(?, notes),
            updated_at = CURRENT_TIMESTAMP
        WHERE id IN (${placeholders})
      `;
      
      const updateResult = await tx.run(updateQuery, [status, notes, ...ids]);
      
      // Get updated items for response
      const updatedItems = await tx.all(
        `SELECT * FROM compliance_data WHERE id IN (${placeholders})`,
        ids
      );
      
      return {
        updatedCount: updateResult.changes,
        updatedItems
      };
    });
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('UPDATE bulk compliance status', duration, true);
    
    // Invalidate cache since data changed
    invalidateComplianceCache();
    
    // Log activity
    await dbService.logActivity('UPDATE', 'compliance_data', null, {
      action: 'bulk_update_status',
      ids,
      newStatus: status,
      updatedCount: result.updatedCount,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log(`Bulk compliance update completed in ${duration}ms - ${result.updatedCount} items`);
    
    res.json({
      success: true,
      message: `Successfully updated ${result.updatedCount} compliance items`,
      data: {
        updatedCount: result.updatedCount,
        updatedItems: result.updatedItems
      },
      performance: {
        queryTime: duration
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('UPDATE bulk compliance status', duration, false);
    throw new DatabaseError('Failed to bulk update compliance items', error);
  }
}));

module.exports = router;