// backend/src/routes/wizard.js
const express = require('express');
const redis = require('redis');
const router = express.Router();

// Simple cache manager
class CacheManager {
  constructor() {
    this.client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    this.client.connect();
  }

  async get(key) {
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn(`Cache get failed for ${key}:`, error);
      return null;
    }
  }

  async set(key, data, ttlSeconds = 3600) {
    try {
      await this.client.setEx(key, ttlSeconds, JSON.stringify(data));
    } catch (error) {
      console.warn(`Cache set failed for ${key}:`, error);
    }
  }
}

const cache = new CacheManager();

// Static coastal cities data
const COASTAL_CITIES = {
  'US': [
    { id: 'us-ny', name: 'New York', coordinates: { lat: 40.7128, lon: -74.0060 } },
    { id: 'us-la', name: 'Los Angeles', coordinates: { lat: 34.0522, lon: -118.2437 } },
    { id: 'us-miami', name: 'Miami', coordinates: { lat: 25.7617, lon: -80.1918 } },
    { id: 'us-boston', name: 'Boston', coordinates: { lat: 42.3601, lon: -71.0589 } },
    { id: 'us-seattle', name: 'Seattle', coordinates: { lat: 47.6062, lon: -122.3321 } },
    { id: 'us-sf', name: 'San Francisco', coordinates: { lat: 37.7749, lon: -122.4194 } },
    { id: 'us-charleston', name: 'Charleston', coordinates: { lat: 32.7765, lon: -79.9311 } },
    { id: 'us-portland', name: 'Portland', coordinates: { lat: 45.5152, lon: -122.6784 } }
  ],
  'GB': [
    { id: 'gb-london', name: 'London', coordinates: { lat: 51.5074, lon: -0.1278 } },
    { id: 'gb-liverpool', name: 'Liverpool', coordinates: { lat: 53.4084, lon: -2.9916 } },
    { id: 'gb-brighton', name: 'Brighton', coordinates: { lat: 50.8225, lon: -0.1372 } },
    { id: 'gb-plymouth', name: 'Plymouth', coordinates: { lat: 50.3755, lon: -4.1427 } },
    { id: 'gb-portsmouth', name: 'Portsmouth', coordinates: { lat: 50.8198, lon: -1.0880 } }
  ],
  'AU': [
    { id: 'au-sydney', name: 'Sydney', coordinates: { lat: -33.8688, lon: 151.2093 } },
    { id: 'au-melbourne', name: 'Melbourne', coordinates: { lat: -37.8136, lon: 144.9631 } },
    { id: 'au-perth', name: 'Perth', coordinates: { lat: -31.9505, lon: 115.8605 } },
    { id: 'au-brisbane', name: 'Brisbane', coordinates: { lat: -27.4698, lon: 153.0251 } },
    { id: 'au-adelaide', name: 'Adelaide', coordinates: { lat: -34.9285, lon: 138.6007 } }
  ],
  'NL': [
    { id: 'nl-amsterdam', name: 'Amsterdam', coordinates: { lat: 52.3676, lon: 4.9041 } },
    { id: 'nl-rotterdam', name: 'Rotterdam', coordinates: { lat: 51.9244, lon: 4.4777 } },
    { id: 'nl-hague', name: 'The Hague', coordinates: { lat: 52.0705, lon: 4.3007 } }
  ],
  'IL': [
    { id: 'il-telaviv', name: 'Tel Aviv', coordinates: { lat: 32.0853, lon: 34.7818 } },
    { id: 'il-haifa', name: 'Haifa', coordinates: { lat: 32.7940, lon: 34.9896 } },
    { id: 'il-ashdod', name: 'Ashdod', coordinates: { lat: 31.7944, lon: 34.6544 } },
    { id: 'il-eilat', name: 'Eilat', coordinates: { lat: 29.5581, lon: 34.9482 } }
  ]
};

// Static lookup data
const STATIC_LOOKUPS = {
  primaryGoals: [
    { id: 'protection', name: 'Coastal Protection', description: 'Protect shoreline from erosion and waves' },
    { id: 'habitat', name: 'Habitat Creation', description: 'Create marine habitat for biodiversity' },
    { id: 'infrastructure', name: 'Marine Infrastructure', description: 'Ports, marinas, and marine facilities' },
    { id: 'restoration', name: 'Ecosystem Restoration', description: 'Restore damaged marine ecosystems' },
    { id: 'recreation', name: 'Recreation & Tourism', description: 'Enhance recreational marine activities' }
  ],
  
  seabedTypes: [
    { id: 'sand', name: 'Sand', description: 'Sandy bottom conditions' },
    { id: 'clay', name: 'Clay', description: 'Clay or mud bottom' },
    { id: 'rock', name: 'Rock', description: 'Rocky or bedrock bottom' },
    { id: 'gravel', name: 'Gravel', description: 'Gravel or pebble bottom' },
    { id: 'mixed', name: 'Mixed', description: 'Mixed bottom conditions' }
  ],
  
  waveExposure: [
    { id: 'sheltered', name: 'Sheltered', description: 'Protected from waves (0-0.5m)' },
    { id: 'moderate', name: 'Moderate', description: 'Moderate wave exposure (0.5-1.5m)' },
    { id: 'exposed', name: 'Exposed', description: 'High wave exposure (1.5-3m)' },
    { id: 'very-exposed', name: 'Very Exposed', description: 'Extreme wave exposure (3m+)' }
  ],
  
  structureTypes: [
    { id: 'breakwater', name: 'Breakwater', description: 'Wave protection structure', category: 'protection' },
    { id: 'seawall', name: 'Seawall', description: 'Coastal protection wall', category: 'protection' },
    { id: 'pier', name: 'Pier', description: 'Extending structure for access', category: 'infrastructure' },
    { id: 'jetty', name: 'Jetty', description: 'Structure extending into water', category: 'infrastructure' },
    { id: 'reef', name: 'Artificial Reef', description: 'Habitat creation structure', category: 'habitat' },
    { id: 'living-shoreline', name: 'Living Shoreline', description: 'Natural-hybrid protection', category: 'habitat' }
  ],
  
  materials: [
    { id: 'econcrete', name: 'ECOncrete Bio-Enhanced', description: 'Bio-enhanced concrete for marine life', categories: ['protection', 'habitat'] },
    { id: 'concrete', name: 'Standard Concrete', description: 'Traditional marine concrete', categories: ['protection', 'infrastructure'] },
    { id: 'rock', name: 'Rock Armor', description: 'Natural rock protection', categories: ['protection'] },
    { id: 'steel', name: 'Steel Structures', description: 'Steel pilings and frameworks', categories: ['infrastructure'] },
    { id: 'timber', name: 'Timber', description: 'Treated marine timber', categories: ['infrastructure'] },
    { id: 'geotextile', name: 'Geotextile', description: 'Fabric-based solutions', categories: ['protection'] }
  ],
  
  species: [
    { id: 'coral', name: 'Coral', type: 'Cnidarian', habitat: ['reef', 'hard-substrate'] },
    { id: 'oyster', name: 'Oysters', type: 'Mollusk', habitat: ['hard-substrate', 'intertidal'] },
    { id: 'mussel', name: 'Mussels', type: 'Mollusk', habitat: ['hard-substrate', 'intertidal'] },
    { id: 'seagrass', name: 'Seagrass', type: 'Plant', habitat: ['sandy', 'shallow'] },
    { id: 'kelp', name: 'Kelp', type: 'Algae', habitat: ['rocky', 'subtidal'] },
    { id: 'fish-juvenile', name: 'Juvenile Fish', type: 'Fish', habitat: ['reef', 'seagrass'] }
  ]
};

// Fallback coastal countries (in case REST Countries fails)
const FALLBACK_COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'IL', name: 'Israel' },
  { code: 'CA', name: 'Canada' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'DK', name: 'Denmark' },
  { code: 'NO', name: 'Norway' },
  { code: 'SE', name: 'Sweden' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' }
];

// Fetch countries from REST Countries API with fallback
async function fetchCountries() {
  const cacheKey = 'countries';
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2');
    if (!response.ok) throw new Error('REST Countries API failed');
    
    const data = await response.json();
    const coastalCountries = data
      .filter(country => FALLBACK_COUNTRIES.some(fc => fc.code === country.cca2))
      .map(country => ({
        code: country.cca2,
        name: country.name.common
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    await cache.set(cacheKey, coastalCountries, 24 * 3600); // 24 hours
    return coastalCountries;
  } catch (error) {
    console.warn('REST Countries API failed, using fallback:', error);
    return FALLBACK_COUNTRIES;
  }
}

// Bootstrap endpoint - loads all data needed for wizard
router.get('/bootstrap', async (req, res) => {
  try {
    const countries = await fetchCountries();
    
    const response = {
      success: true,
      data: {
        countries,
        cities: COASTAL_CITIES,
        ...STATIC_LOOKUPS
      },
      meta: {
        timestamp: new Date().toISOString(),
        cached: true
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Bootstrap failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load wizard data',
      data: {
        countries: FALLBACK_COUNTRIES,
        cities: COASTAL_CITIES,
        ...STATIC_LOOKUPS
      }
    });
  }
});

// Get cities for a specific country
router.get('/cities/:countryCode', async (req, res) => {
  const { countryCode } = req.params;
  const cities = COASTAL_CITIES[countryCode] || [];
  
  res.json({
    success: true,
    data: cities,
    meta: {
      country: countryCode,
      count: cities.length
    }
  });
});

// Project creation endpoint
router.post('/projects', async (req, res) => {
  try {
    const projectData = req.body;
    
    // Basic validation
    if (!projectData.name || !projectData.countryCode || !projectData.primaryGoal) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, countryCode, primaryGoal'
      });
    }
    
    // Generate recommendations based on selections
    const recommendations = generateRecommendations(projectData);
    
    // In real implementation, save to database here
    const project = {
      id: `proj_${Date.now()}`,
      ...projectData,
      recommendations,
      createdAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Project creation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project'
    });
  }
});

// Generate simple recommendations based on project data
function generateRecommendations(projectData) {
  const recommendations = {
    materials: [],
    species: [],
    compliance: []
  };
  
  // Material recommendations based on structure type and environment
  const selectedStructures = projectData.structureTypes || [];
  const structureCategories = selectedStructures.map(st => 
    STATIC_LOOKUPS.structureTypes.find(type => type.id === st)?.category
  ).filter(Boolean);
  
  recommendations.materials = STATIC_LOOKUPS.materials.filter(material =>
    material.categories.some(cat => structureCategories.includes(cat))
  ).slice(0, 3); // Top 3 recommendations
  
  // Species recommendations based on structure and seabed type
  const seabedType = projectData.seabedType;
  if (seabedType) {
    recommendations.species = STATIC_LOOKUPS.species.filter(species => {
      if (seabedType === 'sand' && species.habitat.includes('sandy')) return true;
      if (seabedType === 'rock' && species.habitat.includes('rocky')) return true;
      if (structureCategories.includes('habitat') && species.habitat.includes('hard-substrate')) return true;
      return false;
    }).slice(0, 3);
  }
  
  // Basic compliance recommendations
  recommendations.compliance = [
    { type: 'environmental', description: 'Environmental impact assessment may be required' },
    { type: 'permits', description: 'Coastal development permits typically needed' }
  ];
  
  return recommendations;
}

module.exports = router;