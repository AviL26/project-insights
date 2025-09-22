// backend/routes/materials.js - Enhanced with Phase 3 Caching & Performance Monitoring
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
const invalidateMaterialCache = () => {
  cacheService.invalidate('materials');
  cacheService.invalidate('projects'); // Materials affect project totals
  console.log('Material cache invalidated');
};

// Cache middleware for GET requests
const cacheMiddleware = (ttl = 300000) => {
  return (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = cacheService.generateKey('materials', {
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
const validateMaterialInput = (data) => {
  const errors = [];
  
  if (!data.project_id || typeof data.project_id !== 'number' || data.project_id <= 0) {
    errors.push({
      field: 'project_id',
      message: 'Valid project ID is required'
    });
  }
  
  if (!data.material_type || typeof data.material_type !== 'string' || data.material_type.trim().length === 0) {
    errors.push({
      field: 'material_type',
      message: 'Material type is required'
    });
  }
  
  const validMaterialTypes = ['econcrete', 'concrete', 'steel', 'aggregate', 'admixture', 'fiber', 'other'];
  if (data.material_type && !validMaterialTypes.includes(data.material_type)) {
    errors.push({
      field: 'material_type',
      message: `Material type must be one of: ${validMaterialTypes.join(', ')}`
    });
  }
  
  if (data.quantity && (typeof data.quantity !== 'number' || data.quantity <= 0)) {
    errors.push({
      field: 'quantity',
      message: 'Quantity must be a positive number'
    });
  }
  
  if (data.unit && typeof data.unit !== 'string') {
    errors.push({
      field: 'unit',
      message: 'Unit must be a string'
    });
  }
  
  if (data.cost && (typeof data.cost !== 'number' || data.cost < 0)) {
    errors.push({
      field: 'cost',
      message: 'Cost must be a non-negative number'
    });
  }
  
  if (data.supplier && typeof data.supplier !== 'string') {
    errors.push({
      field: 'supplier',
      message: 'Supplier must be a string'
    });
  }
  
  if (data.delivery_date && isNaN(Date.parse(data.delivery_date))) {
    errors.push({
      field: 'delivery_date',
      message: 'Delivery date must be a valid date'
    });
  }
  
  return errors;
};

// Sanitize input helper
const sanitizeInput = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

// Get all materials with pagination and filtering
router.get('/', cacheMiddleware(180000), asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const offset = (page - 1) * limit;
  
  const { project_id, material_type, supplier } = req.query;
  
  // Build WHERE clause
  const whereConditions = [];
  const params = [];
  
  if (project_id) {
    whereConditions.push('m.project_id = ?');
    params.push(parseInt(project_id));
  }
  
  if (material_type) {
    whereConditions.push('m.material_type = ?');
    params.push(material_type);
  }
  
  if (supplier) {
    whereConditions.push('m.supplier LIKE ?');
    params.push(`%${supplier}%`);
  }
  
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  
  try {
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM materials m ${whereClause}`;
    const countResult = await dbService.get(countQuery, params);
    const total = countResult.total;
    
    // Get paginated results with project info and cost totals
    const query = `
      SELECT 
        m.*, 
        p.name as project_name, 
        p.location as project_location,
        (m.quantity * m.cost) as total_cost
      FROM materials m
      LEFT JOIN projects p ON m.project_id = p.id
      ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const finalParams = [...params, limit, offset];
    const materials = await dbService.all(query, finalParams);
    
    // Calculate summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_items,
        SUM(m.quantity * COALESCE(m.cost, 0)) as total_value,
        COUNT(DISTINCT m.material_type) as unique_types,
        COUNT(DISTINCT m.supplier) as unique_suppliers
      FROM materials m
      ${whereClause}
    `;
    const summary = await dbService.get(summaryQuery, params);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT materials with pagination', duration, true);
    
    // Log activity
    await dbService.logActivity('READ', 'materials', null, {
      action: 'get_all',
      filters: { project_id, material_type, supplier },
      pagination: { page, limit },
      resultCount: materials.length,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log(`Materials page ${page} retrieved in ${duration}ms (${materials.length} items)`);
    
    res.json({
      success: true,
      data: materials,
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
    performanceMonitor.trackQuery('SELECT materials with pagination', duration, false);
    throw new DatabaseError('Failed to fetch materials', error);
  }
}));

// Get materials by project ID
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
    
    // Get materials for the project with cost calculations
    const materials = await dbService.all(`
      SELECT 
        *,
        (quantity * COALESCE(cost, 0)) as total_cost
      FROM materials 
      WHERE project_id = ? 
      ORDER BY created_at DESC
    `, [projectId]);
    
    // Calculate project material summary
    const summary = await dbService.get(`
      SELECT 
        COUNT(*) as total_materials,
        SUM(quantity * COALESCE(cost, 0)) as total_value,
        COUNT(DISTINCT material_type) as material_types,
        COUNT(DISTINCT supplier) as suppliers
      FROM materials 
      WHERE project_id = ?
    `, [projectId]);
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT materials by project', duration, true);
    
    // Log activity
    await dbService.logActivity('READ', 'materials', null, {
      action: 'get_by_project',
      projectId,
      resultCount: materials.length,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log(`Project ${projectId} materials retrieved in ${duration}ms`);
    
    res.json({
      success: true,
      data: materials,
      project: project,
      summary,
      performance: {
        queryTime: duration,
        cached: false
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT materials by project', duration, false);
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to fetch materials for project', error);
  }
}));

// Get single material
router.get('/:id', cacheMiddleware(300000), asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const materialId = parseInt(req.params.id);
  
  if (isNaN(materialId)) {
    throw new ValidationError('Invalid material ID', [{
      field: 'id',
      message: 'Material ID must be a valid number'
    }]);
  }
  
  try {
    const material = await dbService.get(`
      SELECT 
        m.*,
        p.name as project_name, 
        p.location as project_location,
        (m.quantity * COALESCE(m.cost, 0)) as total_cost
      FROM materials m
      LEFT JOIN projects p ON m.project_id = p.id
      WHERE m.id = ?
    `, [materialId]);
    
    if (!material) {
      throw new NotFoundError('Material');
    }
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT material by ID', duration, true);
    
    // Log activity
    await dbService.logActivity('READ', 'materials', materialId, {
      action: 'get_single',
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log(`Material ${materialId} retrieved in ${duration}ms`);
    
    res.json({
      success: true,
      data: material,
      performance: {
        queryTime: duration,
        cached: false
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT material by ID', duration, false);
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to fetch material', error);
  }
}));

// Create new material
router.post('/', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  // Validate input
  const validationErrors = validateMaterialInput(req.body);
  if (validationErrors.length > 0) {
    throw new ValidationError('Validation failed', validationErrors);
  }
  
  // Sanitize input
  const sanitizedData = {
    project_id: req.body.project_id,
    material_type: req.body.material_type,
    specification: sanitizeInput(req.body.specification || ''),
    quantity: req.body.quantity || null,
    unit: sanitizeInput(req.body.unit || ''),
    cost: req.body.cost || null,
    supplier: sanitizeInput(req.body.supplier || ''),
    delivery_date: req.body.delivery_date || null,
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
        INSERT INTO materials (
          project_id, material_type, specification, quantity, unit, 
          cost, supplier, delivery_date, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const insertResult = await tx.run(query, [
        sanitizedData.project_id,
        sanitizedData.material_type,
        sanitizedData.specification,
        sanitizedData.quantity,
        sanitizedData.unit,
        sanitizedData.cost,
        sanitizedData.supplier,
        sanitizedData.delivery_date,
        sanitizedData.notes
      ]);
      
      // Get the created material
      const newMaterial = await tx.get('SELECT * FROM materials WHERE id = ?', [insertResult.lastID]);
      
      return newMaterial;
    });
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('INSERT material', duration, true);
    
    // Invalidate cache since data changed
    invalidateMaterialCache();
    
    // Log activity
    await dbService.logActivity('CREATE', 'materials', result.id, {
      action: 'create_material',
      materialData: sanitizedData,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log(`Material created in ${duration}ms - ID: ${result.id}`);
    
    res.status(201).json({
      success: true,
      message: 'Material created successfully',
      data: result,
      performance: {
        queryTime: duration
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('INSERT material', duration, false);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new DatabaseError('Failed to create material', error);
  }
}));

// Update material
router.put('/:id', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const materialId = parseInt(req.params.id);
  
  if (isNaN(materialId)) {
    throw new ValidationError('Invalid material ID', [{
      field: 'id',
      message: 'Material ID must be a valid number'
    }]);
  }
  
  // Validate input
  const validationErrors = validateMaterialInput(req.body);
  if (validationErrors.length > 0) {
    throw new ValidationError('Validation failed', validationErrors);
  }
  
  // Sanitize input
  const sanitizedData = {
    project_id: req.body.project_id,
    material_type: req.body.material_type,
    specification: sanitizeInput(req.body.specification || ''),
    quantity: req.body.quantity || null,
    unit: sanitizeInput(req.body.unit || ''),
    cost: req.body.cost || null,
    supplier: sanitizeInput(req.body.supplier || ''),
    delivery_date: req.body.delivery_date || null,
    notes: sanitizeInput(req.body.notes || '')
  };
  
  try {
    const result = await dbService.transaction(async (tx) => {
      // Check if material exists
      const existingMaterial = await tx.get('SELECT * FROM materials WHERE id = ?', [materialId]);
      if (!existingMaterial) {
        throw new NotFoundError('Material');
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
        UPDATE materials 
        SET project_id = ?, material_type = ?, specification = ?, quantity = ?, 
            unit = ?, cost = ?, supplier = ?, delivery_date = ?, notes = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      await tx.run(query, [
        sanitizedData.project_id,
        sanitizedData.material_type,
        sanitizedData.specification,
        sanitizedData.quantity,
        sanitizedData.unit,
        sanitizedData.cost,
        sanitizedData.supplier,
        sanitizedData.delivery_date,
        sanitizedData.notes,
        materialId
      ]);
      
      // Get the updated material
      const updatedMaterial = await tx.get('SELECT * FROM materials WHERE id = ?', [materialId]);
      
      return { existingMaterial, updatedMaterial };
    });
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('UPDATE material', duration, true);
    
    // Invalidate cache since data changed
    invalidateMaterialCache();
    
    // Log activity
    await dbService.logActivity('UPDATE', 'materials', materialId, {
      action: 'update_material',
      previousData: result.existingMaterial,
      newData: sanitizedData,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log(`Material ${materialId} updated in ${duration}ms`);
    
    res.json({
      success: true,
      message: 'Material updated successfully',
      data: result.updatedMaterial,
      performance: {
        queryTime: duration
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('UPDATE material', duration, false);
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }
    throw new DatabaseError('Failed to update material', error);
  }
}));

// Delete material
router.delete('/:id', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const materialId = parseInt(req.params.id);
  
  if (isNaN(materialId)) {
    throw new ValidationError('Invalid material ID', [{
      field: 'id',
      message: 'Material ID must be a valid number'
    }]);
  }
  
  try {
    const result = await dbService.transaction(async (tx) => {
      // Check if material exists and get its data for logging
      const existingMaterial = await tx.get('SELECT * FROM materials WHERE id = ?', [materialId]);
      if (!existingMaterial) {
        throw new NotFoundError('Material');
      }
      
      // Delete material
      await tx.run('DELETE FROM materials WHERE id = ?', [materialId]);
      
      return existingMaterial;
    });
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('DELETE material', duration, true);
    
    // Invalidate cache since data changed
    invalidateMaterialCache();
    
    // Log activity
    await dbService.logActivity('DELETE', 'materials', materialId, {
      action: 'delete_material',
      deletedData: result,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log(`Material ${materialId} deleted in ${duration}ms`);
    
    res.json({
      success: true,
      message: 'Material deleted successfully',
      performance: {
        queryTime: duration
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('DELETE material', duration, false);
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to delete material', error);
  }
}));

// Get material statistics with caching
router.get('/admin/stats', cacheMiddleware(300000), asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  try {
    const [typeStats, supplierStats, costStats] = await Promise.all([
      dbService.all(`
        SELECT 
          material_type,
          COUNT(*) as count,
          SUM(quantity * COALESCE(cost, 0)) as total_value,
          AVG(cost) as avg_cost
        FROM materials 
        GROUP BY material_type
        ORDER BY total_value DESC
      `),
      dbService.all(`
        SELECT 
          supplier,
          COUNT(*) as count,
          SUM(quantity * COALESCE(cost, 0)) as total_value
        FROM materials 
        WHERE supplier IS NOT NULL AND supplier != ''
        GROUP BY supplier
        ORDER BY total_value DESC
        LIMIT 10
      `),
      dbService.get(`
        SELECT 
          COUNT(*) as total_materials,
          SUM(quantity * COALESCE(cost, 0)) as total_value,
          AVG(cost) as avg_cost,
          COUNT(DISTINCT material_type) as unique_types,
          COUNT(DISTINCT supplier) as unique_suppliers
        FROM materials
      `)
    ]);
    
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT material statistics', duration, true);
    
    console.log(`Material statistics retrieved in ${duration}ms`);
    
    res.json({
      success: true,
      data: {
        byType: typeStats,
        bySupplier: supplierStats,
        totals: costStats
      },
      performance: {
        queryTime: duration,
        cached: false
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT material statistics', duration, false);
    throw new DatabaseError('Failed to fetch material statistics', error);
  }
}));

module.exports = router;