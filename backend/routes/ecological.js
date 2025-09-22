// backend/routes/ecological.js - Enhanced with Phase 3 Caching & Performance Monitoring
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
const invalidateEcologicalCache = () => {
  cacheService.invalidate('ecological');
  cacheService.invalidate('projects'); // Ecological data affects project environmental status
  console.log('Ecological cache invalidated');
};

// Cache middleware for GET requests
const cacheMiddleware = (ttl = 300000) => {
  return (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = cacheService.generateKey('ecological', {
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
const validateEcologicalInput = (data) => {
  const errors = [];
  
  if (!data.project_id || typeof data.project_id !== 'number' || data.project_id <= 0) {
    errors.push({
      field: 'project_id',
      message: 'Valid project ID is required'
    });
  }
  
  if (!data.measurement_type || typeof data.measurement_type !== 'string' || data.measurement_type.trim().length === 0) {
    errors.push({
      field: 'measurement_type',
      message: 'Measurement type is required'
    });
  }
  
  const validMeasurementTypes = [
    'water_quality', 'biodiversity', 'ph_level', 'temperature', 'salinity', 
    'dissolved_oxygen', 'turbidity', 'marine_life_count', 'coral_health', 
    'algae_growth', 'fish_population', 'substrate_colonization', 'other'
  ];
  
  if (data.measurement_type && !validMeasurementTypes.includes(data.measurement_type)) {
    errors.push({
      field: 'measurement_type',
      message: `Measurement type must be one of: ${validMeasurementTypes.join(', ')}`
    });
  }
  
  if (data.value && (typeof data.value !== 'number' && typeof data.value !== 'string')) {
    errors.push({
      field: 'value',
      message: 'Value must be a number or string'
    });
  }
  
  if (data.unit && typeof data.unit !== 'string') {
    errors.push({
      field: 'unit',
      message: 'Unit must be a string'
    });
  }
  
  if (!data.measurement_date || isNaN(Date.parse(data.measurement_date))) {
    errors.push({
      field: 'measurement_date',
      message: 'Valid measurement date is required'
    });
  }
  
  if (data.location && typeof data.location !== 'string') {
    errors.push({
      field: 'location',
      message: 'Location must be a string'
    });
  }
  
  if (data.depth && (typeof data.depth !== 'number' || data.depth < 0)) {
    errors.push({
      field: 'depth',
      message: 'Depth must be a non-negative number'
    });
  }
  
  if (data.coordinates) {
    if (typeof data.coordinates !== 'object' || 
        typeof data.coordinates.latitude !== 'number' || 
        typeof data.coordinates.longitude !== 'number') {
      errors.push({
        field: 'coordinates',
        message: 'Coordinates must be an object with latitude and longitude numbers'
      });
    } else {
      if (data.coordinates.latitude < -90 || data.coordinates.latitude > 90) {
        errors.push({
          field: 'coordinates.latitude',
          message: 'Latitude must be between -90 and 90'
        });
      }
      if (data.coordinates.longitude < -180 || data.coordinates.longitude > 180) {
        errors.push({
          field: 'coordinates.longitude',
          message: 'Longitude must be between -180 and 180'
        });
      }
    }
  }
  
  return errors;
};

// Sanitize input helper
const sanitizeInput = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

// Get all ecological data with pagination and filtering
router.get('/', cacheMiddleware(240000), asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const offset = (page - 1) * limit;
  
  const { project_id, measurement_type, location, date_from, date_to } = req.query;
  
  // Build WHERE clause
  const whereConditions = [];
  const params = [];
  
  if (project_id) {
    whereConditions.push('e.project_id = ?');
    params.push(parseInt(project_id));
  }
  
  if (measurement_type) {
    whereConditions.push('e.measurement_type = ?');
    params.push(measurement_type);
  }
  
  if (location) {
    whereConditions.push('e.location LIKE ?');
    params.push(`%${location}%`);
  }
  
  if (date_from) {
    whereConditions.push('e.measurement_date >= ?');
    params.push(date_from);
  }
  
  if (date_to) {
    whereConditions.push('e.measurement_date <= ?');
    params.push(date_to);
  }
  
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  
  try {
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM ecological_data e ${whereClause}`;
    const countResult = await dbService.get(countQuery, params);
    const total = countResult.total;
    
    // Get paginated results with project info and enhanced analytics
    const query = `
      SELECT 
        e.*, 
        p.name as project_name, 
        p.location as project_location,
        julianday('now') - julianday(e.measurement_date) as days_since_measurement
      FROM ecological_data e
      LEFT JOIN projects p ON e.project_id = p.id
      ${whereClause}
      ORDER BY e.measurement_date DESC, e.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const finalParams = [...params, limit, offset];
    const ecologicalData = await dbService.all(query, finalParams);
    
    // Parse coordinates for items that have them
    ecologicalData.forEach(item => {
      if (item.coordinates) {
        try {
          item.coordinates = JSON.parse(item.coordinates);
        } catch (e) {
          console.warn(`Failed to parse coordinates for ecological data ${item.id}`);
          item.coordinates = null;
        }
      }
    });
    
    // Calculate summary statistics for current view
    const summaryQuery = `
      SELECT 
        COUNT(*) as filtered_total,
        COUNT(DISTINCT e.measurement_type) as unique_measurement_types,
        COUNT(DISTINCT e.project_id) as unique_projects,
        COUNT(DISTINCT DATE(e.measurement_date)) as unique_measurement_dates,
        MIN(e.measurement_date) as earliest_measurement,
        MAX(e.measurement_date) as latest_measurement
      FROM ecological_data e
      LEFT JOIN projects p ON e.project_id = p.id
      ${whereClause}
    `;
    const summary = await dbService.get(summaryQuery, params);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT ecological with pagination', duration, true);
    
    // Log activity
    await dbService.logActivity('read', 'ecological_data', null, {
      action: 'get_all',
      filters: { project_id, measurement_type, location, date_from, date_to },
      pagination: { page, limit },
      resultCount: ecologicalData.length,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log(`Ecological page ${page} retrieved in ${duration}ms (${ecologicalData.length} items)`);
    
    res.json({
      success: true,
      data: ecologicalData,
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
    performanceMonitor.trackQuery('SELECT ecological with pagination', duration, false);
    throw new DatabaseError('Failed to fetch ecological data', error);
  }
}));

// Get ecological data by project ID
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
    
    // Get ecological data for the project with enhanced analytics
    const ecologicalData = await dbService.all(`
      SELECT 
        *,
        julianday('now') - julianday(measurement_date) as days_since_measurement
      FROM ecological_data 
      WHERE project_id = ? 
      ORDER BY measurement_date DESC, created_at DESC
    `, [projectId]);
    
    // Parse coordinates and calculate project environmental summary
    let environmentalSummary = {
      total_measurements: ecologicalData.length,
      measurement_types: new Set(),
      date_range: {
        earliest: null,
        latest: null
      },
      recent_measurements: 0, // within last 30 days
      locations_monitored: new Set(),
      avg_depth: 0,
      depth_measurements: 0
    };
    
    ecologicalData.forEach(item => {
      // Parse coordinates
      if (item.coordinates) {
        try {
          item.coordinates = JSON.parse(item.coordinates);
        } catch (e) {
          console.warn(`Failed to parse coordinates for ecological data ${item.id}`);
          item.coordinates = null;
        }
      }
      
      // Build summary
      environmentalSummary.measurement_types.add(item.measurement_type);
      if (item.location) environmentalSummary.locations_monitored.add(item.location);
      
      const measurementDate = new Date(item.measurement_date);
      if (!environmentalSummary.date_range.earliest || measurementDate < new Date(environmentalSummary.date_range.earliest)) {
        environmentalSummary.date_range.earliest = item.measurement_date;
      }
      if (!environmentalSummary.date_range.latest || measurementDate > new Date(environmentalSummary.date_range.latest)) {
        environmentalSummary.date_range.latest = item.measurement_date;
      }
      
      // Recent measurements (last 30 days)
      if (item.days_since_measurement <= 30) {
        environmentalSummary.recent_measurements++;
      }
      
      // Depth statistics
      if (item.depth !== null && item.depth !== undefined) {
        environmentalSummary.avg_depth = 
          (environmentalSummary.avg_depth * environmentalSummary.depth_measurements + item.depth) / 
          (environmentalSummary.depth_measurements + 1);
        environmentalSummary.depth_measurements++;
      }
    });
    
    // Convert sets to arrays and round averages
    environmentalSummary.measurement_types = Array.from(environmentalSummary.measurement_types);
    environmentalSummary.locations_monitored = Array.from(environmentalSummary.locations_monitored);
    environmentalSummary.avg_depth = Math.round(environmentalSummary.avg_depth * 100) / 100;
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT ecological by project', duration, true);
    
    // Log activity
    await dbService.logActivity('read', 'ecological_data', null, {
      action: 'get_by_project',
      projectId,
      resultCount: ecologicalData.length,
      summary: environmentalSummary,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log(`Project ${projectId} ecological data retrieved in ${duration}ms`);
    
    res.json({
      success: true,
      data: ecologicalData,
      project: project,
      environmentalSummary,
      performance: {
        queryTime: duration,
        cached: false
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT ecological by project', duration, false);
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to fetch ecological data for project', error);
  }
}));

// Get single ecological measurement
router.get('/:id', cacheMiddleware(300000), asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const ecologicalId = parseInt(req.params.id);
  
  if (isNaN(ecologicalId)) {
    throw new ValidationError('Invalid ecological data ID', [{
      field: 'id',
      message: 'Ecological data ID must be a valid number'
    }]);
  }
  
  try {
    const ecologicalData = await dbService.get(`
      SELECT 
        e.*, 
        p.name as project_name, 
        p.location as project_location,
        julianday('now') - julianday(e.measurement_date) as days_since_measurement
      FROM ecological_data e
      LEFT JOIN projects p ON e.project_id = p.id
      WHERE e.id = ?
    `, [ecologicalId]);
    
    if (!ecologicalData) {
      throw new NotFoundError('Ecological data');
    }
    
    // Parse coordinates if they exist
    if (ecologicalData.coordinates) {
      try {
        ecologicalData.coordinates = JSON.parse(ecologicalData.coordinates);
      } catch (e) {
        console.warn(`Failed to parse coordinates for ecological data ${ecologicalId}`);
        ecologicalData.coordinates = null;
      }
    }
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT ecological by ID', duration, true);
    
    // Log activity
    await dbService.logActivity('read', 'ecological_data', ecologicalId, {
      action: 'get_single',
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log(`Ecological data ${ecologicalId} retrieved in ${duration}ms`);
    
    res.json({
      success: true,
      data: ecologicalData,
      performance: {
        queryTime: duration,
        cached: false
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT ecological by ID', duration, false);
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to fetch ecological data', error);
  }
}));

// Create new ecological measurement
router.post('/', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  // Validate input
  const validationErrors = validateEcologicalInput(req.body);
  if (validationErrors.length > 0) {
    throw new ValidationError('Validation failed', validationErrors);
  }
  
  // Sanitize input
  const sanitizedData = {
    project_id: req.body.project_id,
    measurement_type: req.body.measurement_type,
    value: req.body.value,
    unit: sanitizeInput(req.body.unit || ''),
    measurement_date: req.body.measurement_date,
    location: sanitizeInput(req.body.location || ''),
    depth: req.body.depth || null,
    coordinates: req.body.coordinates ? JSON.stringify(req.body.coordinates) : null,
    weather_conditions: sanitizeInput(req.body.weather_conditions || ''),
    methodology: sanitizeInput(req.body.methodology || ''),
    equipment_used: sanitizeInput(req.body.equipment_used || ''),
    observer: sanitizeInput(req.body.observer || ''),
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
        INSERT INTO ecological_data (
          project_id, measurement_type, value, unit, measurement_date, 
          location, depth, coordinates, weather_conditions, methodology,
          equipment_used, observer, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const insertResult = await tx.run(query, [
        sanitizedData.project_id,
        sanitizedData.measurement_type,
        sanitizedData.value,
        sanitizedData.unit,
        sanitizedData.measurement_date,
        sanitizedData.location,
        sanitizedData.depth,
        sanitizedData.coordinates,
        sanitizedData.weather_conditions,
        sanitizedData.methodology,
        sanitizedData.equipment_used,
        sanitizedData.observer,
        sanitizedData.notes
      ]);
      
      // Get the created ecological data
      const newEcologicalData = await tx.get('SELECT * FROM ecological_data WHERE id = ?', [insertResult.lastID]);
      
      return newEcologicalData;
    });
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('INSERT ecological', duration, true);
    
    // Invalidate cache since data changed
    invalidateEcologicalCache();
    
    // Log activity
    await dbService.logActivity('CREATE', 'ecological_data', result.id, {
      action: 'create_ecological_measurement',
      ecologicalData: sanitizedData,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log(`Ecological measurement created in ${duration}ms - ID: ${result.id}`);
    
    res.status(201).json({
      success: true,
      message: 'Ecological measurement created successfully',
      data: result,
      performance: {
        queryTime: duration
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('INSERT ecological', duration, false);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new DatabaseError('Failed to create ecological measurement', error);
  }
}));

// Update ecological measurement
router.put('/:id', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const ecologicalId = parseInt(req.params.id);
  
  if (isNaN(ecologicalId)) {
    throw new ValidationError('Invalid ecological data ID', [{
      field: 'id',
      message: 'Ecological data ID must be a valid number'
    }]);
  }
  
  // Validate input
  const validationErrors = validateEcologicalInput(req.body);
  if (validationErrors.length > 0) {
    throw new ValidationError('Validation failed', validationErrors);
  }
  
  // Sanitize input
  const sanitizedData = {
    project_id: req.body.project_id,
    measurement_type: req.body.measurement_type,
    value: req.body.value,
    unit: sanitizeInput(req.body.unit || ''),
    measurement_date: req.body.measurement_date,
    location: sanitizeInput(req.body.location || ''),
    depth: req.body.depth || null,
    coordinates: req.body.coordinates ? JSON.stringify(req.body.coordinates) : null,
    weather_conditions: sanitizeInput(req.body.weather_conditions || ''),
    methodology: sanitizeInput(req.body.methodology || ''),
    equipment_used: sanitizeInput(req.body.equipment_used || ''),
    observer: sanitizeInput(req.body.observer || ''),
    notes: sanitizeInput(req.body.notes || '')
  };
  
  try {
    const result = await dbService.transaction(async (tx) => {
      // Check if ecological data exists
      const existingData = await tx.get('SELECT * FROM ecological_data WHERE id = ?', [ecologicalId]);
      if (!existingData) {
        throw new NotFoundError('Ecological data');
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
        UPDATE ecological_data 
        SET project_id = ?, measurement_type = ?, value = ?, unit = ?, 
            measurement_date = ?, location = ?, depth = ?, coordinates = ?,
            weather_conditions = ?, methodology = ?, equipment_used = ?,
            observer = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      await tx.run(query, [
        sanitizedData.project_id,
        sanitizedData.measurement_type,
        sanitizedData.value,
        sanitizedData.unit,
        sanitizedData.measurement_date,
        sanitizedData.location,
        sanitizedData.depth,
        sanitizedData.coordinates,
        sanitizedData.weather_conditions,
        sanitizedData.methodology,
        sanitizedData.equipment_used,
        sanitizedData.observer,
        sanitizedData.notes,
        ecologicalId
      ]);
      
      // Get the updated ecological data
      const updatedData = await tx.get('SELECT * FROM ecological_data WHERE id = ?', [ecologicalId]);
      
      return { existingData, updatedData };
    });
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('UPDATE ecological', duration, true);
    
    // Invalidate cache since data changed
    invalidateEcologicalCache();
    
    // Log activity
    await dbService.logActivity('UPDATE', 'ecological_data', ecologicalId, {
      action: 'update_ecological_measurement',
      previousData: result.existingData,
      newData: sanitizedData,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log(`Ecological data ${ecologicalId} updated in ${duration}ms`);
    
    res.json({
      success: true,
      message: 'Ecological measurement updated successfully',
      data: result.updatedData,
      performance: {
        queryTime: duration
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('UPDATE ecological', duration, false);
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }
    throw new DatabaseError('Failed to update ecological measurement', error);
  }
}));

// Delete ecological measurement
router.delete('/:id', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const ecologicalId = parseInt(req.params.id);
  
  if (isNaN(ecologicalId)) {
    throw new ValidationError('Invalid ecological data ID', [{
      field: 'id',
      message: 'Ecological data ID must be a valid number'
    }]);
  }
  
  try {
    const result = await dbService.transaction(async (tx) => {
      // Check if ecological data exists and get its data for logging
      const existingData = await tx.get('SELECT * FROM ecological_data WHERE id = ?', [ecologicalId]);
      if (!existingData) {
        throw new NotFoundError('Ecological data');
      }
      
      // Delete ecological data
      await tx.run('DELETE FROM ecological_data WHERE id = ?', [ecologicalId]);
      
      return existingData;
    });
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('DELETE ecological', duration, true);
    
    // Invalidate cache since data changed
    invalidateEcologicalCache();
    
    // Log activity
    await dbService.logActivity('DELETE', 'ecological_data', ecologicalId, {
      action: 'delete_ecological_measurement',
      deletedData: result,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log(`Ecological data ${ecologicalId} deleted in ${duration}ms`);
    
    res.json({
      success: true,
      message: 'Ecological measurement deleted successfully',
      performance: {
        queryTime: duration
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('DELETE ecological', duration, false);
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to delete ecological measurement', error);
  }
}));

// Get ecological statistics and analytics
router.get('/admin/stats', cacheMiddleware(300000), asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  try {
    const [measurementTypeStats, locationStats, monthlyTrends, overallStats] = await Promise.all([
      // Measurement type distribution
      dbService.all(`
        SELECT 
          measurement_type,
          COUNT(*) as count,
          MIN(measurement_date) as earliest_measurement,
          MAX(measurement_date) as latest_measurement,
          COUNT(DISTINCT project_id) as projects_monitored
        FROM ecological_data 
        GROUP BY measurement_type
        ORDER BY count DESC
      `),
      
      // Location analysis
      dbService.all(`
        SELECT 
          location,
          COUNT(*) as measurement_count,
          COUNT(DISTINCT measurement_type) as measurement_types,
          COUNT(DISTINCT project_id) as projects
        FROM ecological_data 
        WHERE location IS NOT NULL AND location != ''
        GROUP BY location
        ORDER BY measurement_count DESC
        LIMIT 15
      `),
      
      // Monthly measurement trends (last 12 months)
      dbService.all(`
        SELECT 
          strftime('%Y-%m', measurement_date) as month,
          COUNT(*) as measurement_count,
          COUNT(DISTINCT measurement_type) as unique_types,
          COUNT(DISTINCT project_id) as projects_monitored
        FROM ecological_data 
        WHERE measurement_date >= date('now', '-12 months')
        GROUP BY strftime('%Y-%m', measurement_date)
        ORDER BY month ASC
      `),
      
      // Overall statistics
      dbService.get(`
        SELECT 
          COUNT(*) as total_measurements,
          COUNT(DISTINCT measurement_type) as unique_measurement_types,
          COUNT(DISTINCT project_id) as projects_with_ecological_data,
          COUNT(DISTINCT location) as unique_locations,
          MIN(measurement_date) as earliest_measurement,
          MAX(measurement_date) as latest_measurement,
          AVG(depth) as avg_depth,
          COUNT(CASE WHEN depth IS NOT NULL THEN 1 END) as depth_measurements,
          COUNT(CASE WHEN coordinates IS NOT NULL THEN 1 END) as geo_located_measurements
        FROM ecological_data
      `)
    ]);
    
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT ecological statistics', duration, true);
    
    console.log(`Ecological statistics retrieved in ${duration}ms`);
    
    res.json({
      success: true,
      data: {
        overall: overallStats,
        byMeasurementType: measurementTypeStats,
        byLocation: locationStats,
        monthlyTrends: monthlyTrends
      },
      performance: {
        queryTime: duration,
        cached: false
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT ecological statistics', duration, false);
    throw new DatabaseError('Failed to fetch ecological statistics', error);
  }
}));

// Bulk import ecological measurements
router.post('/bulk/import', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { measurements } = req.body;
  
  if (!Array.isArray(measurements) || measurements.length === 0) {
    throw new ValidationError('Measurements array is required and cannot be empty', [{
      field: 'measurements',
      message: 'Must provide an array of ecological measurements'
    }]);
  }
  
  // Validate all measurements before processing
  const validationErrors = [];
  measurements.forEach((measurement, index) => {
    const errors = validateEcologicalInput(measurement);
    if (errors.length > 0) {
      validationErrors.push({
        index,
        errors
      });
    }
  });
  
  if (validationErrors.length > 0) {
    throw new ValidationError('Validation failed for multiple measurements', validationErrors);
  }
  
  try {
    const result = await dbService.transaction(async (tx) => {
      const insertedMeasurements = [];
      const projectIds = new Set();
      
      for (const measurement of measurements) {
        // Verify project exists
        const project = await tx.get('SELECT id FROM projects WHERE id = ?', [measurement.project_id]);
        if (!project) {
          throw new ValidationError(`Project ${measurement.project_id} not found`);
        }
        projectIds.add(measurement.project_id);
        
        // Sanitize data
        const sanitizedData = {
          project_id: measurement.project_id,
          measurement_type: measurement.measurement_type,
          value: measurement.value,
          unit: sanitizeInput(measurement.unit || ''),
          measurement_date: measurement.measurement_date,
          location: sanitizeInput(measurement.location || ''),
          depth: measurement.depth || null,
          coordinates: measurement.coordinates ? JSON.stringify(measurement.coordinates) : null,
          weather_conditions: sanitizeInput(measurement.weather_conditions || ''),
          methodology: sanitizeInput(measurement.methodology || ''),
          equipment_used: sanitizeInput(measurement.equipment_used || ''),
          observer: sanitizeInput(measurement.observer || ''),
          notes: sanitizeInput(measurement.notes || '')
        };
        
        const query = `
          INSERT INTO ecological_data (
            project_id, measurement_type, value, unit, measurement_date, 
            location, depth, coordinates, weather_conditions, methodology,
            equipment_used, observer, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const insertResult = await tx.run(query, [
          sanitizedData.project_id,
          sanitizedData.measurement_type,
          sanitizedData.value,
          sanitizedData.unit,
          sanitizedData.measurement_date,
          sanitizedData.location,
          sanitizedData.depth,
          sanitizedData.coordinates,
          sanitizedData.weather_conditions,
          sanitizedData.methodology,
          sanitizedData.equipment_used,
          sanitizedData.observer,
          sanitizedData.notes
        ]);
        
        insertedMeasurements.push({
          id: insertResult.lastID,
          ...sanitizedData
        });
      }
      
      return {
        insertedCount: insertedMeasurements.length,
        insertedMeasurements,
        affectedProjects: Array.from(projectIds)
      };
    });
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('INSERT bulk ecological', duration, true);
    
    // Invalidate cache since data changed
    invalidateEcologicalCache();
    
    // Log activity
    await dbService.logActivity('CREATE', 'ecological_data', null, {
      action: 'bulk_import_measurements',
      importedCount: result.insertedCount,
      affectedProjects: result.affectedProjects,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log(`Bulk ecological import completed in ${duration}ms - ${result.insertedCount} measurements`);
    
    res.status(201).json({
      success: true,
      message: `Successfully imported ${result.insertedCount} ecological measurements`,
      data: {
        importedCount: result.insertedCount,
        affectedProjects: result.affectedProjects,
        measurements: result.insertedMeasurements
      },
      performance: {
        queryTime: duration
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('INSERT bulk ecological', duration, false);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new DatabaseError('Failed to bulk import ecological measurements', error);
  }
}));

// Get environmental trends for a project
router.get('/project/:projectId/trends', cacheMiddleware(240000), asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const projectId = parseInt(req.params.projectId);
  const { measurement_type, period = '12' } = req.query; // period in months
  
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
    
    let whereClause = 'WHERE project_id = ? AND measurement_date >= date("now", ?)';
    let params = [projectId, `-${parseInt(period)} months`];
    
    if (measurement_type) {
      whereClause += ' AND measurement_type = ?';
      params.push(measurement_type);
    }
    
    // Get trends data grouped by month
    const trendsData = await dbService.all(`
      SELECT 
        strftime('%Y-%m', measurement_date) as month,
        measurement_type,
        COUNT(*) as measurement_count,
        AVG(CASE WHEN typeof(value) = 'real' OR typeof(value) = 'integer' THEN CAST(value AS REAL) END) as avg_numeric_value,
        MIN(CASE WHEN typeof(value) = 'real' OR typeof(value) = 'integer' THEN CAST(value AS REAL) END) as min_numeric_value,
        MAX(CASE WHEN typeof(value) = 'real' OR typeof(value) = 'integer' THEN CAST(value AS REAL) END) as max_numeric_value,
        COUNT(DISTINCT location) as unique_locations
      FROM ecological_data 
      ${whereClause}
      GROUP BY strftime('%Y-%m', measurement_date), measurement_type
      ORDER BY month ASC, measurement_type
    `, params);
    
    // Get overall project environmental health score
    const environmentalHealth = await dbService.get(`
      SELECT 
        COUNT(*) as total_measurements,
        COUNT(DISTINCT measurement_type) as measurement_diversity,
        COUNT(CASE WHEN measurement_date >= date('now', '-30 days') THEN 1 END) as recent_activity,
        COUNT(DISTINCT location) as monitoring_coverage
      FROM ecological_data 
      WHERE project_id = ?
    `, [projectId]);
    
    // Calculate environmental health score (0-100)
    let healthScore = 0;
    if (environmentalHealth.total_measurements > 0) {
      const diversityScore = Math.min(environmentalHealth.measurement_diversity * 8, 40); // up to 40 points
      const recentActivityScore = Math.min(environmentalHealth.recent_activity * 2, 30); // up to 30 points
      const coverageScore = Math.min(environmentalHealth.monitoring_coverage * 5, 30); // up to 30 points
      healthScore = diversityScore + recentActivityScore + coverageScore;
    }
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT ecological trends', duration, true);
    
    console.log(`Project ${projectId} ecological trends retrieved in ${duration}ms`);
    
    res.json({
      success: true,
      data: {
        project,
        trends: trendsData,
        environmentalHealth: {
          ...environmentalHealth,
          healthScore: Math.round(healthScore)
        },
        period: `${period} months`
      },
      performance: {
        queryTime: duration,
        cached: false
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT ecological trends', duration, false);
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to fetch ecological trends', error);
  }
}));

module.exports = router;