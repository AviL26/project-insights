// backend/src/services/GeographicService.js
const fetch = require('node-fetch');

class GeographicService {
  constructor(cacheManager) {
    this.cache = cacheManager;
    this.restCountriesUrl = process.env.REST_COUNTRIES_URL || 'https://restcountries.com/v3.1';
  }

  // Enhanced country fetching with better error handling
  async getCountries() {
    const cacheKey = 'countries:enhanced';
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      console.log('Returning cached countries data');
      return { data: cached, source: 'cache' };
    }

    try {
      console.log('Fetching countries from REST Countries API...');
      const response = await fetch(`${this.restCountriesUrl}/all?fields=name,cca2,flag,region,subregion`, {
        timeout: 5000, // 5 second timeout
        headers: {
          'User-Agent': 'ECOncrete-Wizard/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`REST Countries API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Filter and enhance coastal countries
      const coastalCountries = this.filterCoastalCountries(data);
      
      // Cache for 24 hours
      await this.cache.set(cacheKey, coastalCountries, 24 * 3600);
      
      console.log(`Successfully fetched ${coastalCountries.length} coastal countries`);
      return { data: coastalCountries, source: 'external' };
      
    } catch (error) {
      console.warn('REST Countries API failed:', error.message);
      return { data: this.getFallbackCountries(), source: 'fallback' };
    }
  }

  // Filter countries to coastal ones and add metadata
  filterCoastalCountries(countries) {
    const knownCoastalCodes = [
      'US', 'GB', 'AU', 'NL', 'IL', 'CA', 'ES', 'IT', 'FR', 'DE', 
      'DK', 'NO', 'SE', 'JP', 'KR', 'CN', 'IN', 'BR', 'MX', 'TH',
      'GR', 'TR', 'EG', 'MA', 'ZA', 'CL', 'AR', 'PE', 'ID', 'PH'
    ];

    return countries
      .filter(country => knownCoastalCodes.includes(country.cca2))
      .map(country => ({
        code: country.cca2,
        name: country.name.common,
        flag: country.flag,
        region: country.region,
        subregion: country.subregion
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // Enhanced fallback countries with more metadata
  getFallbackCountries() {
    return [
      { code: 'US', name: 'United States', flag: '🇺🇸', region: 'Americas', subregion: 'North America' },
      { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', region: 'Europe', subregion: 'Northern Europe' },
      { code: 'AU', name: 'Australia', flag: '🇦🇺', region: 'Oceania', subregion: 'Australia and New Zealand' },
      { code: 'NL', name: 'Netherlands', flag: '🇳🇱', region: 'Europe', subregion: 'Western Europe' },
      { code: 'IL', name: 'Israel', flag: '🇮🇱', region: 'Asia', subregion: 'Western Asia' },
      { code: 'CA', name: 'Canada', flag: '🇨🇦', region: 'Americas', subregion: 'North America' },
      { code: 'ES', name: 'Spain', flag: '🇪🇸', region: 'Europe', subregion: 'Southern Europe' },
      { code: 'IT', name: 'Italy', flag: '🇮🇹', region: 'Europe', subregion: 'Southern Europe' },
      { code: 'FR', name: 'France', flag: '🇫🇷', region: 'Europe', subregion: 'Western Europe' },
      { code: 'DE', name: 'Germany', flag: '🇩🇪', region: 'Europe', subregion: 'Western Europe' },
      { code: 'DK', name: 'Denmark', flag: '🇩🇰', region: 'Europe', subregion: 'Northern Europe' },
      { code: 'NO', name: 'Norway', flag: '🇳🇴', region: 'Europe', subregion: 'Northern Europe' },
      { code: 'SE', name: 'Sweden', flag: '🇸🇪', region: 'Europe', subregion: 'Northern Europe' },
      { code: 'JP', name: 'Japan', flag: '🇯🇵', region: 'Asia', subregion: 'Eastern Asia' },
      { code: 'KR', name: 'South Korea', flag: '🇰🇷', region: 'Asia', subregion: 'Eastern Asia' }
    ];
  }

  // Get coordinates for a city using fallback to approximate coordinates
  async getCityCoordinates(countryCode, cityName) {
    const cacheKey = `coordinates:${countryCode}:${cityName.toLowerCase()}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      // In a real implementation, you might use a geocoding service here
      // For now, we'll return null and rely on predefined city coordinates
      return null;
    } catch (error) {
      console.warn(`Failed to geocode ${cityName}, ${countryCode}:`, error);
      return null;
    }
  }
}

// backend/src/middleware/errorHandler.js
class ErrorHandler {
  static handleAsync(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  static globalErrorHandler(err, req, res, next) {
    console.error('Global error handler:', err);

    // Default error response
    let error = {
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    };

    // Handle specific error types
    if (err.name === 'ValidationError') {
      error.error = 'Validation failed';
      error.details = err.details;
      res.status(400);
    } else if (err.name === 'CacheError') {
      error.error = 'Cache service unavailable - using fallback data';
      res.status(503);
    } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      error.error = 'External service unavailable - using fallback data';
      res.status(503);
    } else {
      res.status(500);
    }

    // In development, include stack trace
    if (process.env.NODE_ENV === 'development') {
      error.stack = err.stack;
    }

    res.json(error);
  }

  static notFoundHandler(req, res) {
    res.status(404).json({
      success: false,
      error: 'Endpoint not found',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
}

// backend/src/middleware/validation.js
const Joi = require('joi');

const projectValidationSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required()
    .messages({
      'string.empty': 'Project name is required',
      'string.max': 'Project name must be less than 100 characters'
    }),
  
  countryCode: Joi.string().length(2).uppercase().required()
    .messages({
      'string.length': 'Country code must be exactly 2 characters',
      'any.required': 'Country selection is required'
    }),
  
  cityId: Joi.string().optional().allow(''),
  
  coordinates: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lon: Joi.number().min(-180).max(180).required()
  }).optional(),
  
  primaryGoal: Joi.string().required()
    .messages({ 'any.required': 'Primary goal is required' }),
  
  seabedType: Joi.string().required()
    .messages({ 'any.required': 'Seabed type is required' }),
  
  waveExposure: Joi.string().required()
    .messages({ 'any.required': 'Wave exposure is required' }),
  
  nearbyStructures: Joi.array().items(Joi.string()).default([]),
  structureTypes: Joi.array().items(Joi.string()).min(1).required()
    .messages({ 
      'array.min': 'At least one structure type is required',
      'any.required': 'Structure types are required'
    }),
  
  preferredMaterials: Joi.array().items(Joi.string()).default([]),
  targetSpecies: Joi.array().items(Joi.string()).default([]),
  environmentalFactors: Joi.array().items(Joi.string()).default([]),
  regulatoryNotes: Joi.string().allow('').default('')
});

const validateProject = (req, res, next) => {
  const { error, value } = projectValidationSchema.validate(req.body, {
    stripUnknown: true,
    abortEarly: false
  });

  if (error) {
    const validationError = new Error('Validation failed');
    validationError.name = 'ValidationError';
    validationError.details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    return next(validationError);
  }

  req.body = value;
  next();
};

// Enhanced routes with better error handling
// backend/src/routes/wizard-enhanced.js
const express = require('express');
const router = express.Router();
const GeographicService = require('../services/GeographicService');
const { validateProject } = require('../middleware/validation');
const { handleAsync } = require('../middleware/errorHandler');

// Enhanced bootstrap endpoint
router.get('/bootstrap', handleAsync(async (req, res) => {
  const geoService = new GeographicService(req.app.locals.cache);
  
  try {
    // Get countries with source information
    const countriesResult = await geoService.getCountries();
    
    // Get static data (always available)
    const staticData = getStaticLookupData();
    
    // Get enhanced city data
    const cities = getEnhancedCityData();
    
    const response = {
      success: true,
      data: {
        countries: countriesResult.data,
        cities,
        ...staticData
      },
      meta: {
        timestamp: new Date().toISOString(),
        sources: {
          countries: countriesResult.source,
          cities: 'static',
          lookups: 'static'
        },
        version: '1.0.0'
      }
    };
    
    // Set appropriate cache headers
    if (countriesResult.source === 'cache') {
      res.set('Cache-Control', 'public, max-age=3600'); // 1 hour
    } else {
      res.set('Cache-Control', 'public, max-age=86400'); // 24 hours for fresh data
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('Bootstrap endpoint error:', error);
    
    // Return fallback data even on complete failure
    const fallbackResponse = {
      success: false,
      error: 'Using fallback data due to service issues',
      data: {
        countries: geoService.getFallbackCountries(),
        cities: getEnhancedCityData(),
        ...getStaticLookupData()
      },
      meta: {
        timestamp: new Date().toISOString(),
        sources: {
          countries: 'fallback',
          cities: 'static',
          lookups: 'static'
        },
        degraded: true
      }
    };
    
    res.status(503).json(fallbackResponse);
  }
}));

// Enhanced city endpoint with better data
router.get('/cities/:countryCode', handleAsync(async (req, res) => {
  const { countryCode } = req.params;
  const cities = getEnhancedCityData();
  
  if (!countryCode || countryCode.length !== 2) {
    return res.status(400).json({
      success: false,
      error: 'Invalid country code. Must be 2-letter ISO code.'
    });
  }
  
  const countryCities = cities[countryCode.toUpperCase()] || [];
  
  res.json({
    success: true,
    data: countryCities,
    meta: {
      country: countryCode.toUpperCase(),
      count: countryCities.length,
      source: 'static'
    }
  });
}));

// Enhanced project creation with detailed recommendations
router.post('/projects', validateProject, handleAsync(async (req, res) => {
  const projectData = req.body;
  
  try {
    // Generate enhanced recommendations
    const recommendations = await generateEnhancedRecommendations(projectData);
    
    // In real implementation: save to database
    const project = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...projectData,
      recommendations,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    res.status(201).json({
      success: true,
      data: project,
      meta: {
        created: true,
        recommendationsGenerated: true
      }
    });
    
  } catch (error) {
    console.error('Project creation error:', error);
    throw error; // Let global error handler manage it
  }
}));

// Health check endpoint
router.get('/health', handleAsync(async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {}
  };

  // Check cache connectivity
  try {
    await req.app.locals.cache.get('health-check');
    health.services.cache = { status: 'healthy', responseTime: Date.now() };
  } catch (error) {
    health.services.cache = { status: 'degraded', error: error.message };
    health.status = 'degraded';
  }

  // Check external API connectivity
  try {
    const geoService = new GeographicService(req.app.locals.cache);
    const countriesResult = await geoService.getCountries();
    health.services.restCountries = { 
      status: countriesResult.source === 'fallback' ? 'degraded' : 'healthy',
      source: countriesResult.source
    };
    
    if (countriesResult.source === 'fallback') {
      health.status = 'degraded';
    }
  } catch (error) {
    health.services.restCountries = { status: 'down', error: error.message };
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
}));

// Enhanced city data with more coastal cities
function getEnhancedCityData() {
  return {
    'US': [
      { id: 'us-ny', name: 'New York', coordinates: { lat: 40.7128, lon: -74.0060 }, region: 'Northeast' },
      { id: 'us-la', name: 'Los Angeles', coordinates: { lat: 34.0522, lon: -118.2437 }, region: 'West Coast' },
      { id: 'us-miami', name: 'Miami', coordinates: { lat: 25.7617, lon: -80.1918 }, region: 'Southeast' },
      { id: 'us-boston', name: 'Boston', coordinates: { lat: 42.3601, lon: -71.0589 }, region: 'Northeast' },
      { id: 'us-seattle', name: 'Seattle', coordinates: { lat: 47.6062, lon: -122.3321 }, region: 'Northwest' },
      { id: 'us-sf', name: 'San Francisco', coordinates: { lat: 37.7749, lon: -122.4194 }, region: 'West Coast' },
      { id: 'us-charleston', name: 'Charleston', coordinates: { lat: 32.7765, lon: -79.9311 }, region: 'Southeast' },
      { id: 'us-portland', name: 'Portland', coordinates: { lat: 45.5152, lon: -122.6784 }, region: 'Northwest' },
      { id: 'us-sandiego', name: 'San Diego', coordinates: { lat: 32.7157, lon: -117.1611 }, region: 'West Coast' },
      { id: 'us-savannah', name: 'Savannah', coordinates: { lat: 32.0835, lon: -81.0998 }, region: 'Southeast' }
    ],
    'GB': [
      { id: 'gb-london', name: 'London', coordinates: { lat: 51.5074, lon: -0.1278 }, region: 'Southeast' },
      { id: 'gb-liverpool', name: 'Liverpool', coordinates: { lat: 53.4084, lon: -2.9916 }, region: 'Northwest' },
      { id: 'gb-brighton', name: 'Brighton', coordinates: { lat: 50.8225, lon: -0.1372 }, region: 'Southeast' },
      { id: 'gb-plymouth', name: 'Plymouth', coordinates: { lat: 50.3755, lon: -4.1427 }, region: 'Southwest' },
      { id: 'gb-portsmouth', name: 'Portsmouth', coordinates: { lat: 50.8198, lon: -1.0880 }, region: 'South' },
      { id: 'gb-bristol', name: 'Bristol', coordinates: { lat: 51.4545, lon: -2.5879 }, region: 'Southwest' },
      { id: 'gb-cardiff', name: 'Cardiff', coordinates: { lat: 51.4816, lon: -3.1791 }, region: 'Wales' },
      { id: 'gb-edinburgh', name: 'Edinburgh', coordinates: { lat: 55.9533, lon: -3.1883 }, region: 'Scotland' }
    ],
    'AU': [
      { id: 'au-sydney', name: 'Sydney', coordinates: { lat: -33.8688, lon: 151.2093 }, region: 'New South Wales' },
      { id: 'au-melbourne', name: 'Melbourne', coordinates: { lat: -37.8136, lon: 144.9631 }, region: 'Victoria' },
      { id: 'au-perth', name: 'Perth', coordinates: { lat: -31.9505, lon: 115.8605 }, region: 'Western Australia' },
      { id: 'au-brisbane', name: 'Brisbane', coordinates: { lat: -27.4698, lon: 153.0251 }, region: 'Queensland' },
      { id: 'au-adelaide', name: 'Adelaide', coordinates: { lat: -34.9285, lon: 138.6007 }, region: 'South Australia' },
      { id: 'au-goldcoast', name: 'Gold Coast', coordinates: { lat: -28.0167, lon: 153.4000 }, region: 'Queensland' },
      { id: 'au-newcastle', name: 'Newcastle', coordinates: { lat: -32.9283, lon: 151.7817 }, region: 'New South Wales' }
    ],
    'NL': [
      { id: 'nl-amsterdam', name: 'Amsterdam', coordinates: { lat: 52.3676, lon: 4.9041 }, region: 'North Holland' },
      { id: 'nl-rotterdam', name: 'Rotterdam', coordinates: { lat: 51.9244, lon: 4.4777 }, region: 'South Holland' },
      { id: 'nl-hague', name: 'The Hague', coordinates: { lat: 52.0705, lon: 4.3007 }, region: 'South Holland' },
      { id: 'nl-ijmuiden', name: 'IJmuiden', coordinates: { lat: 52.4597, lon: 4.6280 }, region: 'North Holland' },
      { id: 'nl-vlissingen', name: 'Vlissingen', coordinates: { lat: 51.4426, lon: 3.5734 }, region: 'Zeeland' }
    ],
    'IL': [
      { id: 'il-telaviv', name: 'Tel Aviv', coordinates: { lat: 32.0853, lon: 34.7818 }, region: 'Central District' },
      { id: 'il-haifa', name: 'Haifa', coordinates: { lat: 32.7940, lon: 34.9896 }, region: 'Haifa District' },
      { id: 'il-ashdod', name: 'Ashdod', coordinates: { lat: 31.7944, lon: 34.6544 }, region: 'Southern District' },
      { id: 'il-eilat', name: 'Eilat', coordinates: { lat: 29.5581, lon: 34.9482 }, region: 'Southern District' },
      { id: 'il-acre', name: 'Acre', coordinates: { lat: 32.9333, lon: 35.0833 }, region: 'Northern District' }
    ]
  };
}

// Enhanced static lookup data
function getStaticLookupData() {
  return {
    primaryGoals: [
      { 
        id: 'protection', 
        name: 'Coastal Protection', 
        description: 'Protect shoreline from erosion and waves',
        category: 'infrastructure',
        priority: 1
      },
      { 
        id: 'habitat', 
        name: 'Habitat Creation', 
        description: 'Create marine habitat for biodiversity',
        category: 'environmental',
        priority: 2
      },
      { 
        id: 'infrastructure', 
        name: 'Marine Infrastructure', 
        description: 'Ports, marinas, and marine facilities',
        category: 'infrastructure',
        priority: 3
      },
      { 
        id: 'restoration', 
        name: 'Ecosystem Restoration', 
        description: 'Restore damaged marine ecosystems',
        category: 'environmental',
        priority: 2
      },
      { 
        id: 'recreation', 
        name: 'Recreation & Tourism', 
        description: 'Enhance recreational marine activities',
        category: 'economic',
        priority: 4
      }
    ],
    
    seabedTypes: [
      { id: 'sand', name: 'Sand', description: 'Sandy bottom conditions', suitability: ['all'] },
      { id: 'clay', name: 'Clay', description: 'Clay or mud bottom', suitability: ['protection', 'infrastructure'] },
      { id: 'rock', name: 'Rock', description: 'Rocky or bedrock bottom', suitability: ['all'] },
      { id: 'gravel', name: 'Gravel', description: 'Gravel or pebble bottom', suitability: ['protection'] },
      { id: 'mixed', name: 'Mixed', description: 'Mixed bottom conditions', suitability: ['all'] }
    ],
    
    waveExposure: [
      { id: 'sheltered', name: 'Sheltered', description: 'Protected from waves (0-0.5m)', maxHeight: 0.5 },
      { id: 'moderate', name: 'Moderate', description: 'Moderate wave exposure (0.5-1.5m)', maxHeight: 1.5 },
      { id: 'exposed', name: 'Exposed', description: 'High wave exposure (1.5-3m)', maxHeight: 3.0 },
      { id: 'very-exposed', name: 'Very Exposed', description: 'Extreme wave exposure (3m+)', maxHeight: 10.0 }
    ],
    
    structureTypes: [
      { 
        id: 'breakwater', 
        name: 'Breakwater', 
        description: 'Wave protection structure', 
        category: 'protection',
        suitableFor: ['protection', 'habitat'],
        complexity: 'high'
      },
      { 
        id: 'seawall', 
        name: 'Seawall', 
        description: 'Coastal protection wall', 
        category: 'protection',
        suitableFor: ['protection'],
        complexity: 'medium'
      },
      { 
        id: 'pier', 
        name: 'Pier', 
        description: 'Extending structure for access', 
        category: 'infrastructure',
        suitableFor: ['infrastructure', 'recreation'],
        complexity: 'medium'
      },
      { 
        id: 'jetty', 
        name: 'Jetty', 
        description: 'Structure extending into water', 
        category: 'infrastructure',
        suitableFor: ['infrastructure', 'protection'],
        complexity: 'high'
      },
      { 
        id: 'reef', 
        name: 'Artificial Reef', 
        description: 'Habitat creation structure', 
        category: 'habitat',
        suitableFor: ['habitat', 'restoration'],
        complexity: 'low'
      },
      { 
        id: 'living-shoreline', 
        name: 'Living Shoreline', 
        description: 'Natural-hybrid protection', 
        category: 'habitat',
        suitableFor: ['habitat', 'protection', 'restoration'],
        complexity: 'medium'
      }
    ],
    
    materials: [
      { 
        id: 'econcrete', 
        name: 'ECOncrete Bio-Enhanced', 
        description: 'Bio-enhanced concrete for marine life',
        categories: ['protection', 'habitat'],
        cost: 'high',
        sustainability: 'high',
        durability: 'high'
      },
      { 
        id: 'concrete', 
        name: 'Standard Concrete', 
        description: 'Traditional marine concrete',
        categories: ['protection', 'infrastructure'],
        cost: 'medium',
        sustainability: 'medium',
        durability: 'high'
      },
      { 
        id: 'rock', 
        name: 'Rock Armor', 
        description: 'Natural rock protection',
        categories: ['protection'],
        cost: 'medium',
        sustainability: 'high',
        durability: 'high'
      },
      { 
        id: 'steel', 
        name: 'Steel Structures', 
        description: 'Steel pilings and frameworks',
        categories: ['infrastructure'],
        cost: 'high',
        sustainability: 'low',
        durability: 'medium'
      },
      { 
        id: 'timber', 
        name: 'Timber', 
        description: 'Treated marine timber',
        categories: ['infrastructure'],
        cost: 'low',
        sustainability: 'medium',
        durability: 'low'
      },
      { 
        id: 'geotextile', 
        name: 'Geotextile', 
        description: 'Fabric-based solutions',
        categories: ['protection'],
        cost: 'low',
        sustainability: 'medium',
        durability: 'medium'
      }
    ],
    
    species: [
      { 
        id: 'coral', 
        name: 'Coral', 
        type: 'Cnidarian', 
        habitat: ['reef', 'hard-substrate'],
        requirements: ['warm-water', 'clear-water'],
        benefits: ['biodiversity', 'tourism']
      },
      { 
        id: 'oyster', 
        name: 'Oysters', 
        type: 'Mollusk', 
        habitat: ['hard-substrate', 'intertidal'],
        requirements: ['moderate-salinity'],
        benefits: ['water-filtration', 'food']
      },
      { 
        id: 'mussel', 
        name: 'Mussels', 
        type: 'Mollusk', 
        habitat: ['hard-substrate', 'intertidal'],
        requirements: ['various-salinity'],
        benefits: ['water-filtration', 'food']
      },
      { 
        id: 'seagrass', 
        name: 'Seagrass', 
        type: 'Plant', 
        habitat: ['sandy', 'shallow'],
        requirements: ['sunlight', 'nutrients'],
        benefits: ['carbon-sequestration', 'fish-nursery']
      },
      { 
        id: 'kelp', 
        name: 'Kelp', 
        type: 'Algae', 
        habitat: ['rocky', 'subtidal'],
        requirements: ['cold-water', 'nutrients'],
        benefits: ['carbon-sequestration', 'fish-habitat']
      },
      { 
        id: 'fish-juvenile', 
        name: 'Juvenile Fish', 
        type: 'Fish', 
        habitat: ['reef', 'seagrass'],
        requirements: ['shelter', 'food'],
        benefits: ['fisheries', 'biodiversity']
      }
    ]
  };
}

// Enhanced recommendation engine
async function generateEnhancedRecommendations(projectData) {
  const recommendations = {
    materials: [],
    species: [],
    compliance: [],
    sustainability: {},
    costEstimate: {},
    timeline: {}
  };
  
  const staticData = getStaticLookupData();
  
  // Material recommendations based on multiple factors
  const selectedStructures = projectData.structureTypes || [];
  const structureCategories = selectedStructures.map(st => 
    staticData.structureTypes.find(type => type.id === st)?.category
  ).filter(Boolean);
  
  recommendations.materials = staticData.materials
    .filter(material => material.categories.some(cat => structureCategories.includes(cat)))
    .map(material => ({
      ...material,
      recommendation: calculateMaterialScore(material, projectData),
      reasons: getMaterialReasons(material, projectData)
    }))
    .sort((a, b) => b.recommendation - a.recommendation)
    .slice(0, 3);
  
  // Species recommendations based on environment and goals
  const seabedType = projectData.seabedType;
  const waveExposure = projectData.waveExposure;
  
  recommendations.species = staticData.species
    .filter(species => {
      // Filter by habitat compatibility
      if (seabedType === 'sand' && species.habitat.includes('sandy')) return true;
      if (seabedType === 'rock' && species.habitat.includes('rocky')) return true;
      if (structureCategories.includes('habitat') && species.habitat.includes('hard-substrate')) return true;
      return false;
    })
    .filter(species => {
      // Filter by wave exposure tolerance
      if (waveExposure === 'very-exposed' && species.habitat.includes('intertidal')) return false;
      return true;
    })
    .slice(0, 3);
  
  // Compliance recommendations
  recommendations.compliance = generateComplianceRecommendations(projectData);
  
  // Sustainability assessment
  recommendations.sustainability = {
    score: calculateSustainabilityScore(projectData, recommendations.materials),
    factors: ['material-choice', 'biodiversity-impact', 'carbon-footprint'],
    improvements: getSustainabilityImprovements(projectData)
  };
  
  // Cost estimate (rough)
  recommendations.costEstimate = {
    range: calculateCostRange(projectData, recommendations.materials),
    factors: ['material-costs', 'construction-complexity', 'site-preparation'],
    currency: 'USD'
  };
  
  // Timeline estimate
  recommendations.timeline = {
    phases: [
      { name: 'Planning & Permits', duration: '3-6 months' },
      { name: 'Design & Engineering', duration: '2-4 months' },
      { name: 'Construction', duration: getDurationEstimate(projectData) },
      { name: 'Monitoring & Maintenance', duration: 'Ongoing' }
    ],
    total: getTotalDuration(projectData)
  };
  
  return recommendations;
}

// Helper functions for recommendation engine
function calculateMaterialScore(material, projectData) {
  let score = 0;
  
  // Base compatibility score
  const structureCategories = projectData.structureTypes.map(st => 
    getStaticLookupData().structureTypes.find(type => type.id === st)?.category
  ).filter(Boolean);
  
  if (material.categories.some(cat => structureCategories.includes(cat))) score += 40;
  
  // Sustainability bonus
  if (material.sustainability === 'high') score += 30;
  if (material.sustainability === 'medium') score += 15;
  
  // Durability factor
  if (material.durability === 'high') score += 20;
  if (material.durability === 'medium') score += 10;
  
  // Cost consideration (lower cost = higher score for this factor)
  if (material.cost === 'low') score += 10;
  if (material.cost === 'medium') score += 5;
  
  return score;
}

function getMaterialReasons(material, projectData) {
  const reasons = [];
  
  if (material.sustainability === 'high') {
    reasons.push('High sustainability rating');
  }
  if (material.durability === 'high') {
    reasons.push('Excellent durability in marine environment');
  }
  if (material.id === 'econcrete' && projectData.primaryGoal === 'habitat') {
    reasons.push('Bio-enhanced properties support marine life');
  }
  
  return reasons;
}

function generateComplianceRecommendations(projectData) {
  const recommendations = [];
  
  // Basic environmental compliance
  recommendations.push({
    type: 'environmental',
    priority: 'high',
    description: 'Environmental impact assessment likely required',
    timeline: '2-4 months',
    authority: 'Environmental agency'
  });
  
  // Coastal permits
  recommendations.push({
    type: 'coastal',
    priority: 'high',
    description: 'Coastal development permit required',
    timeline: '1-3 months',
    authority: 'Coastal commission'
  });
  
  // Additional based on structure type
  if (projectData.structureTypes.includes('breakwater') || projectData.structureTypes.includes('jetty')) {
    recommendations.push({
      type: 'navigation',
      priority: 'medium',
      description: 'Navigation safety assessment may be required',
      timeline: '1-2 months',
      authority: 'Maritime authority'
    });
  }
  
  if (projectData.primaryGoal === 'habitat') {
    recommendations.push({
      type: 'biodiversity',
      priority: 'medium',
      description: 'Marine biodiversity impact study recommended',
      timeline: '3-6 months',
      authority: 'Fisheries department'
    });
  }
  
  return recommendations;
}

function calculateSustainabilityScore(projectData, materials) {
  let score = 50; // Base score
  
  // Material sustainability impact
  const avgSustainability = materials.reduce((acc, mat) => {
    const sustainabilityScores = { high: 30, medium: 15, low: 0 };
    return acc + (sustainabilityScores[mat.sustainability] || 0);
  }, 0) / materials.length;
  
  score += avgSustainability;
  
  // Goal-based bonus
  if (projectData.primaryGoal === 'habitat' || projectData.primaryGoal === 'restoration') {
    score += 20;
  }
  
  // Species targeting bonus
  if (projectData.targetSpecies && projectData.targetSpecies.length > 0) {
    score += 10;
  }
  
  return Math.min(100, Math.round(score));
}

function getSustainabilityImprovements(projectData) {
  const improvements = [];
  
  if (!projectData.targetSpecies || projectData.targetSpecies.length === 0) {
    improvements.push('Consider targeting specific marine species for habitat enhancement');
  }
  
  if (!projectData.preferredMaterials.includes('econcrete')) {
    improvements.push('Consider bio-enhanced concrete for improved marine life support');
  }
  
  if (projectData.structureTypes.includes('seawall') && !projectData.structureTypes.includes('living-shoreline')) {
    improvements.push('Consider living shoreline elements to combine protection with habitat');
  }
  
  return improvements;
}

function calculateCostRange(projectData, materials) {
  // Very rough cost estimation based on complexity
  const baseRanges = {
    'reef': { min: 50000, max: 200000 },
    'living-shoreline': { min: 100000, max: 300000 },
    'pier': { min: 200000, max: 800000 },
    'seawall': { min: 300000, max: 1000000 },
    'breakwater': { min: 500000, max: 2000000 },
    'jetty': { min: 800000, max: 3000000 }
  };
  
  let totalMin = 0;
  let totalMax = 0;
  
  projectData.structureTypes.forEach(structureId => {
    const range = baseRanges[structureId] || { min: 100000, max: 500000 };
    totalMin += range.min;
    totalMax += range.max;
  });
  
  // Material cost multiplier
  const avgCostMultiplier = materials.reduce((acc, mat) => {
    const costMultipliers = { high: 1.3, medium: 1.0, low: 0.8 };
    return acc + (costMultipliers[mat.cost] || 1.0);
  }, 0) / (materials.length || 1);
  
  return {
    min: Math.round(totalMin * avgCostMultiplier),
    max: Math.round(totalMax * avgCostMultiplier),
    confidence: 'rough-estimate'
  };
}

function getDurationEstimate(projectData) {
  const complexStructures = ['breakwater', 'jetty'];
  const hasComplexStructure = projectData.structureTypes.some(st => complexStructures.includes(st));
  
  if (hasComplexStructure) return '6-12 months';
  if (projectData.structureTypes.length > 2) return '4-8 months';
  return '2-6 months';
}

function getTotalDuration(projectData) {
  const complexStructures = ['breakwater', 'jetty'];
  const hasComplexStructure = projectData.structureTypes.some(st => complexStructures.includes(st));
  
  if (hasComplexStructure) return '12-24 months';
  if (projectData.structureTypes.length > 2) return '8-18 months';
  return '6-12 months';
}

module.exports = {
  router,
  GeographicService,
  ErrorHandler,
  validateProject
};

// backend/src/app.js - Enhanced main application file
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const redis = require('redis');
const { ErrorHandler } = require('./middleware/errorHandler');
const wizardRoutes = require('./routes/wizard-enhanced');

const app = express();
const port = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://app.econcrete.com', 'https://econcrete.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Redis cache
async function initializeCache() {
  const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    retry_strategy: (options) => {
      if (options.error && options.error.code === 'ECONNREFUSED') {
        console.error('Redis connection refused');
        return new Error('Redis connection refused');
      }
      if (options.total_retry_time > 1000 * 60 * 60) {
        return new Error('Redis retry time exhausted');
      }
      if (options.attempt > 10) {
        return undefined;
      }
      return Math.min(options.attempt * 100, 3000);
    }
  });

  try {
    await client.connect();
    console.log('Connected to Redis cache');
    return client;
  } catch (error) {
    console.warn('Redis connection failed, using in-memory cache:', error.message);
    // Fallback to in-memory cache
    return {
      get: async (key) => app.locals.memoryCache?.[key] || null,
      set: async (key, value, ttl) => {
        if (!app.locals.memoryCache) app.locals.memoryCache = {};
        app.locals.memoryCache[key] = value;
        if (ttl) {
          setTimeout(() => {
            delete app.locals.memoryCache[key];
          }, ttl * 1000);
        }
      },
      setEx: async (key, ttl, value) => {
        return this.set(key, value, ttl);
      }
    };
  }
}

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Routes
app.use('/api/wizard', wizardRoutes.router);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling
app.use(ErrorHandler.notFoundHandler);
app.use(ErrorHandler.globalErrorHandler);

// Start server
async function startServer() {
  try {
    // Initialize cache
    const cache = await initializeCache();
    app.locals.cache = cache;
    
    // Start listening
    app.listen(port, () => {
      console.log(`\n🚀 ECOncrete Wizard API Server`);
      console.log(`📍 http://localhost:${port}`);
      console.log(`🌊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 Cache: ${cache.constructor.name === 'Object' ? 'Memory (fallback)' : 'Redis'}`);
      console.log(`⏰ Started at: ${new Date().toLocaleString()}\n`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  try {
    if (app.locals.cache && app.locals.cache.quit) {
      await app.locals.cache.quit();
    }
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  try {
    if (app.locals.cache && app.locals.cache.quit) {
      await app.locals.cache.quit();
    }
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  process.exit(0);
});

if (require.main === module) {
  startServer();
}

module.exports = app;