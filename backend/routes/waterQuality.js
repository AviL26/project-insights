// backend/routes/waterQuality.js - Enhanced with Phase 3 Caching & Performance Monitoring
const express = require('express');
const axios = require('axios');
const router = express.Router();

// Import Phase 3 utilities
const { CacheService, PerformanceMonitor } = require('../utils/pagination');
const { 
  asyncHandler, 
  ValidationError, 
  DatabaseError 
} = require('../middleware/error-handler');

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

// Enhanced cache middleware for external API calls (longer TTL since water quality data changes slowly)
const waterQualityCacheMiddleware = (ttl = 3600000) => { // 1 hour cache
  return (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = cacheService.generateKey('water_quality', {
      lat: req.query.lat,
      lon: req.query.lon,
      radius: req.query.radius || 5,
      limit: req.query.limit || 10
    });

    const cached = cacheService.get(cacheKey);
    if (cached) {
      console.log(`Water quality cache hit for: ${req.query.lat}, ${req.query.lon}`);
      return res.json({
        ...cached,
        cached: true,
        cache_timestamp: new Date().toISOString()
      });
    }

    // Override res.json to cache successful responses
    const originalJson = res.json;
    res.json = (data) => {
      if (res.statusCode === 200 && data.samples) {
        cacheService.set(cacheKey, data, ttl);
        console.log(`Cached water quality response for: ${req.query.lat}, ${req.query.lon}`);
      }
      return originalJson.call(res, data);
    };

    next();
  };
};

// Input validation helper
const validateWaterQualityInput = (query) => {
  const errors = [];
  
  const lat = parseFloat(query.lat);
  const lon = parseFloat(query.lon);
  
  if (!query.lat || isNaN(lat)) {
    errors.push({
      field: 'lat',
      message: 'Latitude is required and must be a valid number'
    });
  } else if (lat < -90 || lat > 90) {
    errors.push({
      field: 'lat',
      message: 'Latitude must be between -90 and 90'
    });
  }
  
  if (!query.lon || isNaN(lon)) {
    errors.push({
      field: 'lon',
      message: 'Longitude is required and must be a valid number'
    });
  } else if (lon < -180 || lon > 180) {
    errors.push({
      field: 'lon',
      message: 'Longitude must be between -180 and 180'
    });
  }
  
  if (query.radius) {
    const radius = parseFloat(query.radius);
    if (isNaN(radius) || radius <= 0 || radius > 100) {
      errors.push({
        field: 'radius',
        message: 'Radius must be a positive number between 1 and 100 miles'
      });
    }
  }
  
  if (query.limit) {
    const limit = parseInt(query.limit);
    if (isNaN(limit) || limit <= 0 || limit > 100) {
      errors.push({
        field: 'limit',
        message: 'Limit must be a positive integer between 1 and 100'
      });
    }
  }
  
  return errors;
};

// GET water quality by latitude & longitude with enhanced features
router.get('/', waterQualityCacheMiddleware(3600000), asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  // Validate input
  const validationErrors = validateWaterQualityInput(req.query);
  if (validationErrors.length > 0) {
    throw new ValidationError('Invalid water quality request parameters', validationErrors);
  }
  
  const { lat, lon, radius = 5, limit = 10, characteristic } = req.query;
  
  try {
    console.log(`Fetching water quality data for ${lat}, ${lon} (radius: ${radius} miles)`);
    
    // Build EPA API parameters
    const apiParams = {
      latitude: lat,
      longitude: lon,
      within: radius,
      mimeType: 'json',
      sorted: 'no'
    };
    
    // Add characteristic filter if specified
    if (characteristic) {
      apiParams.characteristicName = characteristic;
    }
    
    // Query the EPA WQP API with timeout
    const response = await axios.get('https://www.waterqualitydata.us/data/Result/search', {
      params: apiParams,
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'ECOncrete-Marine-Infrastructure-Tool/1.0'
      }
    });
    
    const results = response.data?.Results || [];
    
    // Enhanced data processing and filtering
    const processedResults = results
      .slice(0, parseInt(limit))
      .map(r => ({
        site: r.MonitoringLocationName || 'Unknown Site',
        siteId: r.MonitoringLocationIdentifier,
        characteristic: r.CharacteristicName,
        value: r.ResultMeasureValue,
        unit: r.ResultMeasure?.MeasureUnitCode,
        date: r.ActivityStartDate,
        organization: r.OrganizationFormalName,
        method: r.ResultAnalyticalMethod?.MethodName,
        detectionLimit: r.DetectionQuantitationLimitMeasure?.MeasureValue,
        sampleDepth: r.ActivityDepthHeightMeasure?.MeasureValue,
        qualityControl: r.ResultLaboratoryCommentText
      }))
      .filter(r => r.value && r.value !== '' && r.value !== 'Not Reported'); // Filter out empty values
    
    // Calculate summary statistics
    const summary = {
      total_samples: processedResults.length,
      unique_sites: new Set(processedResults.map(r => r.siteId)).size,
      unique_characteristics: new Set(processedResults.map(r => r.characteristic)).size,
      date_range: {
        earliest: processedResults.reduce((earliest, r) => 
          !earliest || (r.date && r.date < earliest) ? r.date : earliest, null),
        latest: processedResults.reduce((latest, r) => 
          !latest || (r.date && r.date > latest) ? r.date : latest, null)
      },
      organizations: [...new Set(processedResults.map(r => r.organization).filter(Boolean))]
    };
    
    // Group results by characteristic for better organization
    const groupedResults = processedResults.reduce((acc, result) => {
      const char = result.characteristic;
      if (!acc[char]) {
        acc[char] = [];
      }
      acc[char].push(result);
      return acc;
    }, {});
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('EPA Water Quality API', duration, true);
    
    console.log(`Water quality data retrieved in ${duration}ms for ${lat}, ${lon}`);
    
    res.json({
      success: true,
      location: { 
        latitude: parseFloat(lat), 
        longitude: parseFloat(lon),
        search_radius_miles: parseFloat(radius)
      },
      summary,
      samples: processedResults,
      grouped_by_characteristic: groupedResults,
      metadata: {
        source: 'EPA Water Quality Portal',
        api_url: 'https://www.waterqualitydata.us',
        query_timestamp: new Date().toISOString(),
        cached: false
      },
      performance: {
        queryTime: duration,
        api_response_size: results.length
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('EPA Water Quality API', duration, false);
    
    console.error('Water quality API error:', error.message);
    
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new DatabaseError('Water quality service timeout. Please try again later.', error);
    } else if (error.response?.status === 429) {
      throw new DatabaseError('Water quality service rate limit exceeded. Please try again later.', error);
    } else if (error.response?.status >= 500) {
      throw new DatabaseError('Water quality service temporarily unavailable.', error);
    } else {
      throw new DatabaseError('Failed to fetch water quality data', error);
    }
  }
}));

// GET water quality characteristics (available measurement types)
router.get('/characteristics', waterQualityCacheMiddleware(86400000), asyncHandler(async (req, res) => { // 24 hour cache
  const startTime = Date.now();
  
  try {
    console.log('Fetching available water quality characteristics');
    
    // Query EPA for available characteristics
    const response = await axios.get('https://www.waterqualitydata.us/data/Characteristic/search', {
      params: {
        mimeType: 'json'
      },
      timeout: 15000,
      headers: {
        'User-Agent': 'ECOncrete-Marine-Infrastructure-Tool/1.0'
      }
    });
    
    const characteristics = response.data?.Characteristics || [];
    
    // Process and categorize characteristics
    const processed = characteristics.map(c => ({
      name: c.CharacteristicName,
      type: c.CharacteristicType,
      description: c.CharacteristicDescription
    }));
    
    // Group by type for better organization
    const grouped = processed.reduce((acc, char) => {
      const type = char.type || 'Other';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(char);
      return acc;
    }, {});
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('EPA Characteristics API', duration, true);
    
    console.log(`Water quality characteristics retrieved in ${duration}ms`);
    
    res.json({
      success: true,
      total_characteristics: processed.length,
      characteristics: processed,
      grouped_by_type: grouped,
      metadata: {
        source: 'EPA Water Quality Portal',
        query_timestamp: new Date().toISOString(),
        cached: false
      },
      performance: {
        queryTime: duration
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('EPA Characteristics API', duration, false);
    
    console.error('Water quality characteristics API error:', error.message);
    throw new DatabaseError('Failed to fetch water quality characteristics', error);
  }
}));

// GET nearby monitoring sites
router.get('/sites', waterQualityCacheMiddleware(7200000), asyncHandler(async (req, res) => { // 2 hour cache
  const startTime = Date.now();
  
  // Validate input
  const validationErrors = validateWaterQualityInput(req.query);
  if (validationErrors.length > 0) {
    throw new ValidationError('Invalid site search parameters', validationErrors);
  }
  
  const { lat, lon, radius = 10 } = req.query;
  
  try {
    console.log(`Fetching monitoring sites near ${lat}, ${lon} (radius: ${radius} miles)`);
    
    // Query EPA for monitoring sites
    const response = await axios.get('https://www.waterqualitydata.us/data/Station/search', {
      params: {
        latitude: lat,
        longitude: lon,
        within: radius,
        mimeType: 'json'
      },
      timeout: 10000,
      headers: {
        'User-Agent': 'ECOncrete-Marine-Infrastructure-Tool/1.0'
      }
    });
    
    const sites = response.data?.Sites || [];
    
    // Process site data
    const processedSites = sites.map(s => ({
      id: s.MonitoringLocationIdentifier,
      name: s.MonitoringLocationName,
      type: s.MonitoringLocationTypeName,
      organization: s.OrganizationFormalName,
      coordinates: {
        latitude: parseFloat(s.LatitudeMeasure),
        longitude: parseFloat(s.LongitudeMeasure)
      },
      description: s.MonitoringLocationDescriptionText,
      county: s.CountyName,
      state: s.StateName,
      huc: s.HUCEightDigitCode, // Hydrologic Unit Code
      drainage_area: s.DrainageAreaMeasure?.MeasureValue,
      aquifer: s.AquiferName
    })).filter(s => s.coordinates.latitude && s.coordinates.longitude);
    
    // Calculate distances from query point
    const queryLat = parseFloat(lat);
    const queryLon = parseFloat(lon);
    
    processedSites.forEach(site => {
      const distance = calculateDistance(
        queryLat, queryLon,
        site.coordinates.latitude, site.coordinates.longitude
      );
      site.distance_miles = Math.round(distance * 100) / 100;
    });
    
    // Sort by distance
    processedSites.sort((a, b) => a.distance_miles - b.distance_miles);
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('EPA Sites API', duration, true);
    
    console.log(`Monitoring sites retrieved in ${duration}ms for ${lat}, ${lon}`);
    
    res.json({
      success: true,
      location: { 
        latitude: queryLat, 
        longitude: queryLon,
        search_radius_miles: parseFloat(radius)
      },
      total_sites: processedSites.length,
      sites: processedSites,
      metadata: {
        source: 'EPA Water Quality Portal',
        query_timestamp: new Date().toISOString(),
        cached: false
      },
      performance: {
        queryTime: duration
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('EPA Sites API', duration, false);
    
    console.error('Monitoring sites API error:', error.message);
    throw new DatabaseError('Failed to fetch monitoring sites', error);
  }
}));

// Clear water quality cache (admin endpoint)
router.post('/admin/cache/clear', asyncHandler(async (req, res) => {
  try {
    cacheService.invalidate('water_quality');
    
    res.json({
      success: true,
      message: 'Water quality cache cleared successfully'
    });
    
  } catch (error) {
    throw new DatabaseError('Failed to clear water quality cache', error);
  }
}));

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = router;