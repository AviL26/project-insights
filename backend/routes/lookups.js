// backend/routes/lookups.js - ECOncrete Lookup Tables API - FIXED VERSION
const express = require('express');
const router = express.Router();

const dbService = require('../db/database-service');
const { 
  asyncHandler, 
  ValidationError, 
  DatabaseError, 
  NotFoundError 
} = require('../middleware/error-handler');

// Import Phase 3 utilities if available
let CacheService, PerformanceMonitor;
try {
  const paginationUtils = require('../utils/pagination');
  CacheService = paginationUtils.CacheService;
  PerformanceMonitor = paginationUtils.PerformanceMonitor;
} catch (error) {
  // Fallback if pagination utils not available
  CacheService = class { 
    generateKey() { return null; }
    get() { return null; }
    set() {}
    invalidate() {}
  };
  PerformanceMonitor = class {
    trackEndpoint() {}
    trackQuery() {}
  };
}

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

// Cache middleware for GET requests
const cacheMiddleware = (ttl = 600000) => {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();

    const cacheKey = cacheService.generateKey('lookups', {
      url: req.originalUrl,
      query: req.query
    });

    const cached = cacheService.get(cacheKey);
    if (cached) {
      console.log(`Cache hit for: ${req.originalUrl}`);
      return res.json(cached);
    }

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

// FIXED: Helper function to parse JSON fields safely
const parseJsonField = (jsonString) => {
  if (!jsonString || jsonString.trim() === '') return null;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.warn('Failed to parse JSON field:', jsonString.substring(0, 100));
    return null;
  }
};

// GET /api/lookups/materials
router.get('/materials', cacheMiddleware(900000), asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { category, subcategory, active_only = 'true' } = req.query;
  
  const whereConditions = [];
  const params = [];
  
  if (category) {
    whereConditions.push('category = ?');
    params.push(category);
  }
  if (subcategory) {
    whereConditions.push('subcategory = ?');
    params.push(subcategory);
  }
  if (active_only === 'true') {
    whereConditions.push('is_active = 1');
  }
  
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  
  try {
    const materials = await dbService.all(`
      SELECT * FROM materials_catalog 
      ${whereClause}
      ORDER BY sort_order ASC, name ASC
    `, params);
    
    materials.forEach(material => {
      material.ecological_enhancement = parseJsonField(material.ecological_enhancement);
      material.typical_applications = parseJsonField(material.typical_applications);
      material.size_specifications = parseJsonField(material.size_specifications);
      material.regulatory_approvals = parseJsonField(material.regulatory_approvals);
      material.supplier_info = parseJsonField(material.supplier_info);
    });
    
    const categories = await dbService.all(`
      SELECT DISTINCT category, COUNT(*) as count 
      FROM materials_catalog 
      WHERE is_active = 1 
      GROUP BY category 
      ORDER BY category
    `);
    
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT materials catalog', duration, true);
    
    await dbService.logActivity('READ', 'materials_catalog', null, {
      action: 'get_materials_lookup',
      filters: { category, subcategory, active_only },
      resultCount: materials.length,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log(`Materials catalog retrieved in ${duration}ms (${materials.length} items)`);
    
    res.json({
      success: true,
      data: materials,
      meta: {
        total: materials.length,
        categories: categories,
        cached: false
      },
      performance: {
        queryTime: duration
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT materials catalog', duration, false);
    throw new DatabaseError('Failed to fetch materials catalog', error);
  }
}));

// GET /api/lookups/structures
router.get('/structures', cacheMiddleware(900000), asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { category, wave_exposure, regulatory_complexity, active_only = 'true' } = req.query;
  
  const whereConditions = [];
  const params = [];
  
  if (category) {
    whereConditions.push('category = ?');
    params.push(category);
  }
  if (wave_exposure) {
    whereConditions.push('wave_exposure_suitability = ?');
    params.push(wave_exposure);
  }
  if (regulatory_complexity) {
    whereConditions.push('regulatory_complexity = ?');
    params.push(regulatory_complexity);
  }
  if (active_only === 'true') {
    whereConditions.push('is_active = 1');
  }
  
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  
  try {
    const structures = await dbService.all(`
      SELECT * FROM structure_types 
      ${whereClause}
      ORDER BY sort_order ASC, name ASC
    `, params);
    
    structures.forEach(structure => {
      structure.soil_type_requirements = parseJsonField(structure.soil_type_requirements);
      structure.typical_materials = parseJsonField(structure.typical_materials);
      structure.construction_methods = parseJsonField(structure.construction_methods);
      structure.permit_types_required = parseJsonField(structure.permit_types_required);
    });
    
    const categories = await dbService.all(`
      SELECT DISTINCT category, COUNT(*) as count 
      FROM structure_types 
      WHERE is_active = 1 
      GROUP BY category 
      ORDER BY category
    `);
    
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT structure types', duration, true);
    
    await dbService.logActivity('READ', 'structure_types', null, {
      action: 'get_structures_lookup',
      filters: { category, wave_exposure, regulatory_complexity, active_only },
      resultCount: structures.length,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log(`Structure types retrieved in ${duration}ms (${structures.length} items)`);
    
    res.json({
      success: true,
      data: structures,
      meta: {
        total: structures.length,
        categories: categories,
        cached: false
      },
      performance: {
        queryTime: duration
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT structure types', duration, false);
    throw new DatabaseError('Failed to fetch structure types', error);
  }
}));

// GET /api/lookups/jurisdictions - FIXED VERSION
router.get('/jurisdictions', cacheMiddleware(900000), asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { type, parent_id, regulatory_framework, active_only = 'true' } = req.query;
  
  const whereConditions = [];
  const params = [];
  
  if (type) {
    whereConditions.push('j.type = ?');
    params.push(type);
  }
  if (parent_id) {
    whereConditions.push('j.parent_jurisdiction_id = ?');
    params.push(parseInt(parent_id));
  }
  if (regulatory_framework) {
    whereConditions.push('j.regulatory_framework = ?');
    params.push(regulatory_framework);
  }
  if (active_only === 'true') {
    whereConditions.push('j.is_active = 1');
  }
  
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  
  try {
    const jurisdictions = await dbService.all(`
      SELECT 
        j.*,
        p.name as parent_name
      FROM jurisdictions j
      LEFT JOIN jurisdictions p ON j.parent_jurisdiction_id = p.id
      ${whereClause}
      ORDER BY j.sort_order ASC, j.name ASC
    `, params);
    
    // FIXED: Parse JSON fields with improved error handling
    jurisdictions.forEach(jurisdiction => {
      try {
        jurisdiction.environmental_regulations = parseJsonField(jurisdiction.environmental_regulations);
        jurisdiction.permit_requirements = parseJsonField(jurisdiction.permit_requirements);
        jurisdiction.regulatory_bodies = parseJsonField(jurisdiction.regulatory_bodies);
        jurisdiction.contact_information = parseJsonField(jurisdiction.contact_information);
        jurisdiction.documentation_requirements = parseJsonField(jurisdiction.documentation_requirements);
        jurisdiction.fees_structure = parseJsonField(jurisdiction.fees_structure);
        jurisdiction.marine_protected_areas = parseJsonField(jurisdiction.marine_protected_areas);
        jurisdiction.seasonal_restrictions = parseJsonField(jurisdiction.seasonal_restrictions);
      } catch (parseError) {
        console.error(`Error parsing JSON fields for jurisdiction ${jurisdiction.id}:`, parseError);
      }
    });
    
    const hierarchyStats = await dbService.all(`
      SELECT 
        type,
        COUNT(*) as count,
        COUNT(CASE WHEN parent_jurisdiction_id IS NULL THEN 1 END) as top_level_count
      FROM jurisdictions 
      WHERE is_active = 1 
      GROUP BY type 
      ORDER BY type
    `);
    
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT jurisdictions', duration, true);
    
    await dbService.logActivity('READ', 'jurisdictions', null, {
      action: 'get_jurisdictions_lookup',
      filters: { type, parent_id, regulatory_framework, active_only },
      resultCount: jurisdictions.length,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log(`Jurisdictions retrieved in ${duration}ms (${jurisdictions.length} items)`);
    
    res.json({
      success: true,
      data: jurisdictions,
      meta: {
        total: jurisdictions.length,
        hierarchyStats: hierarchyStats,
        cached: false
      },
      performance: {
        queryTime: duration
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT jurisdictions', duration, false);
    console.error('Jurisdictions query error:', error);
    throw new DatabaseError('Failed to fetch jurisdictions', error);
  }
}));

// GET /api/lookups/species
router.get('/species', cacheMiddleware(900000), asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { category, compatibility, conservation_status, jurisdiction_id, active_only = 'true' } = req.query;
  
  const whereConditions = [];
  const params = [];
  
  if (category) {
    whereConditions.push('category = ?');
    params.push(category);
  }
  if (compatibility) {
    whereConditions.push('econcrete_compatibility = ?');
    params.push(compatibility);
  }
  if (conservation_status) {
    whereConditions.push('conservation_status = ?');
    params.push(conservation_status);
  }
  if (jurisdiction_id) {
    whereConditions.push('jurisdictions_present LIKE ?');
    params.push(`%${jurisdiction_id}%`);
  }
  if (active_only === 'true') {
    whereConditions.push('is_active = 1');
  }
  
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  
  try {
    const species = await dbService.all(`
      SELECT * FROM species_database 
      ${whereClause}
      ORDER BY econcrete_compatibility DESC, category ASC, common_name ASC
    `, params);
    
    species.forEach(spec => {
      spec.monitoring_indicators = parseJsonField(spec.monitoring_indicators);
      spec.jurisdictions_present = parseJsonField(spec.jurisdictions_present);
      spec.spawning_season = parseJsonField(spec.spawning_season);
    });
    
    const stats = await dbService.get(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN econcrete_compatibility = 'excellent' THEN 1 END) as excellent_compatibility,
        COUNT(CASE WHEN conservation_status IN ('vulnerable', 'endangered', 'critically_endangered') THEN 1 END) as protected_species,
        COUNT(DISTINCT category) as categories
      FROM species_database 
      WHERE is_active = 1
    `);
    
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT species database', duration, true);
    
    await dbService.logActivity('READ', 'species_database', null, {
      action: 'get_species_lookup',
      filters: { category, compatibility, conservation_status, jurisdiction_id, active_only },
      resultCount: species.length,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log(`Species database retrieved in ${duration}ms (${species.length} items)`);
    
    res.json({
      success: true,
      data: species,
      meta: {
        total: species.length,
        stats: stats,
        cached: false
      },
      performance: {
        queryTime: duration
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT species database', duration, false);
    throw new DatabaseError('Failed to fetch species database', error);
  }
}));

// GET /api/lookups/regulations
router.get('/regulations', cacheMiddleware(600000), asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { jurisdiction_id, requirement_type, category, mandatory_only, structure_type, active_only = 'true' } = req.query;
  
  const whereConditions = [];
  const params = [];
  
  if (jurisdiction_id) {
    whereConditions.push('r.jurisdiction_id = ?');
    params.push(parseInt(jurisdiction_id));
  }
  if (requirement_type) {
    whereConditions.push('r.requirement_type = ?');
    params.push(requirement_type);
  }
  if (category) {
    whereConditions.push('r.category = ?');
    params.push(category);
  }
  if (mandatory_only === 'true') {
    whereConditions.push('r.mandatory = 1');
  }
  if (structure_type) {
    whereConditions.push('r.applies_to_structure_types LIKE ?');
    params.push(`%${structure_type}%`);
  }
  if (active_only === 'true') {
    whereConditions.push('r.is_active = 1');
  }
  
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  
  try {
    const regulations = await dbService.all(`
      SELECT 
        r.*,
        j.name as jurisdiction_name,
        j.code as jurisdiction_code,
        j.regulatory_framework
      FROM regulatory_requirements r
      LEFT JOIN jurisdictions j ON r.jurisdiction_id = j.id
      ${whereClause}
      ORDER BY j.name ASC, r.sort_order ASC, r.title ASC
    `, params);
    
    regulations.forEach(reg => {
      reg.applies_to_structure_types = parseJsonField(reg.applies_to_structure_types);
      reg.trigger_conditions = parseJsonField(reg.trigger_conditions);
      reg.documentation_required = parseJsonField(reg.documentation_required);
      reg.contact_details = parseJsonField(reg.contact_details);
      reg.common_delays = parseJsonField(reg.common_delays);
      reg.related_requirements = parseJsonField(reg.related_requirements);
    });
    
    const jurisdictionSummary = await dbService.all(`
      SELECT 
        j.name as jurisdiction_name,
        j.id as jurisdiction_id,
        COUNT(r.id) as requirement_count,
        COUNT(CASE WHEN r.mandatory = 1 THEN 1 END) as mandatory_count,
        AVG(r.processing_time_days) as avg_processing_days,
        SUM(COALESCE(r.fees, 0)) as total_estimated_fees
      FROM jurisdictions j
      LEFT JOIN regulatory_requirements r ON j.id = r.jurisdiction_id AND r.is_active = 1
      WHERE j.is_active = 1
      GROUP BY j.id, j.name
      ORDER BY j.name
    `);
    
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT regulatory requirements', duration, true);
    
    await dbService.logActivity('READ', 'regulatory_requirements', null, {
      action: 'get_regulations_lookup',
      filters: { jurisdiction_id, requirement_type, category, mandatory_only, structure_type, active_only },
      resultCount: regulations.length,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log(`Regulatory requirements retrieved in ${duration}ms (${regulations.length} items)`);
    
    res.json({
      success: true,
      data: regulations,
      meta: {
        total: regulations.length,
        jurisdictionSummary: jurisdictionSummary,
        cached: false
      },
      performance: {
        queryTime: duration
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT regulatory requirements', duration, false);
    throw new DatabaseError('Failed to fetch regulatory requirements', error);
  }
}));

// GET /api/lookups/environmental-factors
router.get('/environmental-factors', cacheMiddleware(900000), asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { category, impact_level, regulatory_significance, active_only = 'true' } = req.query;
  
  const whereConditions = [];
  const params = [];
  
  if (category) {
    whereConditions.push('category = ?');
    params.push(category);
  }
  if (impact_level) {
    whereConditions.push('impact_on_design = ?');
    params.push(impact_level);
  }
  if (regulatory_significance) {
    whereConditions.push('regulatory_significance = ?');
    params.push(regulatory_significance);
  }
  if (active_only === 'true') {
    whereConditions.push('is_active = 1');
  }
  
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  
  try {
    const factors = await dbService.all(`
      SELECT * FROM environmental_factors 
      ${whereClause}
      ORDER BY sort_order ASC, name ASC
    `, params);
    
    factors.forEach(factor => {
      factor.measurement_methods = parseJsonField(factor.measurement_methods);
      factor.related_species = parseJsonField(factor.related_species);
      factor.mitigation_strategies = parseJsonField(factor.mitigation_strategies);
    });
    
    const categoryGroups = await dbService.all(`
      SELECT 
        category,
        COUNT(*) as factor_count,
        COUNT(CASE WHEN impact_on_design = 'high' THEN 1 END) as high_impact_count
      FROM environmental_factors 
      WHERE is_active = 1 
      GROUP BY category 
      ORDER BY category
    `);
    
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT environmental factors', duration, true);
    
    await dbService.logActivity('READ', 'environmental_factors', null, {
      action: 'get_environmental_factors_lookup',
      filters: { category, impact_level, regulatory_significance, active_only },
      resultCount: factors.length,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log(`Environmental factors retrieved in ${duration}ms (${factors.length} items)`);
    
    res.json({
      success: true,
      data: factors,
      meta: {
        total: factors.length,
        categoryGroups: categoryGroups,
        cached: false
      },
      performance: {
        queryTime: duration
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT environmental factors', duration, false);
    throw new DatabaseError('Failed to fetch environmental factors', error);
  }
}));

// GET /api/lookups/summary
router.get('/summary', cacheMiddleware(300000), asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  try {
    const [materials, structures, jurisdictions, species, regulations, factors] = await Promise.all([
      dbService.get('SELECT COUNT(*) as count FROM materials_catalog WHERE is_active = 1'),
      dbService.get('SELECT COUNT(*) as count FROM structure_types WHERE is_active = 1'),
      dbService.get('SELECT COUNT(*) as count FROM jurisdictions WHERE is_active = 1'),
      dbService.get('SELECT COUNT(*) as count FROM species_database WHERE is_active = 1'),
      dbService.get('SELECT COUNT(*) as count FROM regulatory_requirements WHERE is_active = 1'),
      dbService.get('SELECT COUNT(*) as count FROM environmental_factors WHERE is_active = 1')
    ]);
    
    const summary = {
      materials: materials.count,
      structures: structures.count,
      jurisdictions: jurisdictions.count,
      species: species.count,
      regulations: regulations.count,
      environmentalFactors: factors.count,
      lastUpdated: new Date().toISOString()
    };
    
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT lookup summary', duration, true);
    
    console.log(`Lookup summary retrieved in ${duration}ms`);
    
    res.json({
      success: true,
      data: summary,
      performance: {
        queryTime: duration,
        cached: false
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT lookup summary', duration, false);
    throw new DatabaseError('Failed to fetch lookup summary', error);
  }
}));

module.exports = router;