// backend/routes/geographic-lookups.js - Fixed for REST Countries API v3.1
const express = require('express');
const axios = require('axios');
const router = express.Router();

// Cache service for geographic data
const cache = new Map();
const CACHE_TTL = {
  COUNTRIES: 7 * 24 * 60 * 60 * 1000, // 7 days
  REGIONS: 3 * 24 * 60 * 60 * 1000,   // 3 days
  CITIES: 1 * 24 * 60 * 60 * 1000     // 1 day
};

// Helper functions
const setCache = (key, data, ttl) => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
};

const getCache = (key) => {
  const cached = cache.get(key);
  if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

// API timeout configuration
const API_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 2;

// Retry helper for API calls
const apiCallWithRetry = async (apiCall, retries = MAX_RETRIES) => {
  try {
    return await apiCall();
  } catch (error) {
    if (retries > 0 && (error.code === 'ECONNABORTED' || error.response?.status >= 500)) {
      console.log(`API call failed, retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return apiCallWithRetry(apiCall, retries - 1);
    }
    throw error;
  }
};

// GET /api/lookup/countries - Fixed for REST Countries API v3.1
router.get('/countries', async (req, res) => {
  try {
    console.log('Fetching countries from REST Countries API...');
    
    // Check cache first
    const cached = getCache('countries');
    if (cached) {
      console.log('Returning cached countries data');
      return res.json({
        success: true,
        data: cached,
        cached: true,
        source: 'cache'
      });
    }

    // Fetch from REST Countries API v3.1 with correct fields
    const response = await apiCallWithRetry(async () => {
      return await axios.get('https://restcountries.com/v3.1/all', {
        timeout: API_TIMEOUT,
        params: {
          fields: 'name,cca2,cca3,region,subregion,latlng,landlocked'
        }
      });
    });

    // Process countries - focus on coastal countries (not landlocked)
    const allCountries = response.data;
    const coastalCountries = allCountries
      .filter(country => {
        // Filter out landlocked countries for marine projects
        return !country.landlocked;
      })
      .map(country => ({
        id: country.cca2,
        code: country.cca2,
        code3: country.cca3,
        name: country.name.common,
        officialName: country.name.official,
        region: country.region,
        subregion: country.subregion,
        latlng: country.latlng,
        landlocked: country.landlocked || false
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Cache the result
    setCache('countries', coastalCountries, CACHE_TTL.COUNTRIES);
    
    console.log(`Fetched ${coastalCountries.length} coastal countries from ${allCountries.length} total`);
    
    res.json({
      success: true,
      data: coastalCountries,
      cached: false,
      source: 'REST Countries API',
      metadata: {
        totalCountries: allCountries.length,
        coastalCountries: coastalCountries.length,
        lastUpdated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Countries API error:', error.message);
    
    // Fallback to essential coastal countries if API fails
    const fallbackCountries = [
      { id: 'IL', code: 'IL', name: 'Israel', region: 'Asia', subregion: 'Western Asia' },
      { id: 'CY', code: 'CY', name: 'Cyprus', region: 'Asia', subregion: 'Western Asia' },
      { id: 'GR', code: 'GR', name: 'Greece', region: 'Europe', subregion: 'Southern Europe' },
      { id: 'ES', code: 'ES', name: 'Spain', region: 'Europe', subregion: 'Southern Europe' },
      { id: 'IT', code: 'IT', name: 'Italy', region: 'Europe', subregion: 'Southern Europe' },
      { id: 'FR', code: 'FR', name: 'France', region: 'Europe', subregion: 'Western Europe' },
      { id: 'US', code: 'US', name: 'United States', region: 'Americas', subregion: 'Northern America' },
      { id: 'AU', code: 'AU', name: 'Australia', region: 'Oceania', subregion: 'Australia and New Zealand' },
      { id: 'JP', code: 'JP', name: 'Japan', region: 'Asia', subregion: 'Eastern Asia' },
      { id: 'KR', code: 'KR', name: 'South Korea', region: 'Asia', subregion: 'Eastern Asia' },
      { id: 'GB', code: 'GB', name: 'United Kingdom', region: 'Europe', subregion: 'Northern Europe' },
      { id: 'DE', code: 'DE', name: 'Germany', region: 'Europe', subregion: 'Western Europe' },
      { id: 'NL', code: 'NL', name: 'Netherlands', region: 'Europe', subregion: 'Western Europe' },
      { id: 'DK', code: 'DK', name: 'Denmark', region: 'Europe', subregion: 'Northern Europe' },
      { id: 'NO', code: 'NO', name: 'Norway', region: 'Europe', subregion: 'Northern Europe' },
      { id: 'SE', code: 'SE', name: 'Sweden', region: 'Europe', subregion: 'Northern Europe' },
      { id: 'CA', code: 'CA', name: 'Canada', region: 'Americas', subregion: 'Northern America' },
      { id: 'BR', code: 'BR', name: 'Brazil', region: 'Americas', subregion: 'South America' }
    ];
    
    res.json({
      success: true,
      data: fallbackCountries,
      cached: false,
      source: 'fallback',
      error: 'API unavailable, using fallback data'
    });
  }
});

// GET /api/lookup/regions/:countryCode - Get regions using Nominatim
router.get('/regions/:countryCode', async (req, res) => {
  try {
    const { countryCode } = req.params;
    console.log(`Fetching regions for ${countryCode} from Nominatim API...`);
    
    // Check cache first
    const cacheKey = `regions_${countryCode}`;
    const cached = getCache(cacheKey);
    if (cached) {
      console.log(`Returning cached regions data for ${countryCode}`);
      return res.json({
        success: true,
        data: cached,
        cached: true,
        source: 'cache'
      });
    }

    // Fetch from Nominatim API
    const response = await apiCallWithRetry(async () => {
      return await axios.get('https://nominatim.openstreetmap.org/search', {
        timeout: API_TIMEOUT,
        params: {
          country: countryCode,
          format: 'json',
          addressdetails: 1,
          extratags: 1,
          limit: 50,
          'accept-language': 'en'
        },
        headers: {
          'User-Agent': 'ECOncrete-Marine-Infrastructure-Tool/1.0 (marine.projects@example.com)'
        }
      });
    });

    // Process regions
    const searchResults = response.data;
    const regions = searchResults
      .filter(result => {
        const adminLevel = result.extratags?.admin_level;
        const placeType = result.type;
        return (adminLevel && ['4', '5', '6'].includes(adminLevel)) || 
               ['state', 'province', 'region'].includes(placeType);
      })
      .map(result => ({
        id: `${countryCode.toLowerCase()}_${result.osm_id}`,
        name: result.display_name.split(',')[0].trim(),
        fullName: result.display_name,
        type: result.type,
        adminLevel: result.extratags?.admin_level,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        description: `${result.display_name.split(',')[0]} - Administrative region`
      }))
      .filter(region => region.name && region.name.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 20);

    // If no administrative regions found, try major cities
    if (regions.length === 0) {
      const cityResponse = await apiCallWithRetry(async () => {
        return await axios.get('https://nominatim.openstreetmap.org/search', {
          timeout: API_TIMEOUT,
          params: {
            country: countryCode,
            format: 'json',
            addressdetails: 1,
            limit: 15,
            'accept-language': 'en',
            featureType: 'city'
          },
          headers: {
            'User-Agent': 'ECOncrete-Marine-Infrastructure-Tool/1.0'
          }
        });
      });

      const cities = cityResponse.data
        .filter(city => ['city', 'town'].includes(city.type))
        .map(city => ({
          id: `${countryCode.toLowerCase()}_city_${city.osm_id}`,
          name: city.display_name.split(',')[0].trim(),
          fullName: city.display_name,
          type: 'city',
          latitude: parseFloat(city.lat),
          longitude: parseFloat(city.lon),
          description: `${city.display_name.split(',')[0]} - Major city`
        }))
        .slice(0, 10);

      regions.push(...cities);
    }

    // Cache the result
    setCache(cacheKey, regions, CACHE_TTL.REGIONS);
    
    console.log(`Fetched ${regions.length} regions for ${countryCode}`);
    
    res.json({
      success: true,
      data: regions,
      cached: false,
      source: 'Nominatim API',
      metadata: {
        countryCode,
        totalResults: searchResults.length,
        processedRegions: regions.length,
        lastUpdated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error(`Regions API error for ${req.params.countryCode}:`, error.message);
    
    // Fallback regions for common countries
    const fallbackRegions = {
      'IL': [
        { id: 'il_haifa', name: 'Haifa District', description: 'Northern coastal region', latitude: 32.8, longitude: 35.0 },
        { id: 'il_central', name: 'Central District', description: 'Tel Aviv metropolitan area', latitude: 32.1, longitude: 34.8 },
        { id: 'il_southern', name: 'Southern District', description: 'Southern coastal region', latitude: 31.3, longitude: 34.4 }
      ],
      'US': [
        { id: 'us_california', name: 'California', description: 'West Coast state', latitude: 36.7, longitude: -119.7 },
        { id: 'us_florida', name: 'Florida', description: 'Southeast coastal state', latitude: 27.7, longitude: -81.6 },
        { id: 'us_texas', name: 'Texas', description: 'Gulf Coast state', latitude: 31.9, longitude: -99.9 }
      ],
      'GR': [
        { id: 'gr_attica', name: 'Attica', description: 'Athens region', latitude: 38.0, longitude: 23.7 },
        { id: 'gr_crete', name: 'Crete', description: 'Largest Greek island', latitude: 35.2, longitude: 24.9 },
        { id: 'gr_macedonia', name: 'Central Macedonia', description: 'Northern Greece', latitude: 40.6, longitude: 22.9 }
      ]
    };
    
    const fallback = fallbackRegions[req.params.countryCode] || [];
    
    res.json({
      success: true,
      data: fallback,
      cached: false,
      source: 'fallback',
      error: 'API unavailable, using fallback data'
    });
  }
});

// Static data endpoints
router.get('/structure-types', (req, res) => {
  const structureTypes = [
    { id: 'breakwater', name: 'Breakwater', category: 'coastal_protection', description: 'Coastal structure designed to reduce wave energy and protect harbors' },
    { id: 'seawall', name: 'Seawall', category: 'coastal_protection', description: 'Vertical or sloped barrier designed to prevent coastal erosion' },
    { id: 'pier', name: 'Pier', category: 'infrastructure', description: 'Structure extending into water for vessel mooring or public access' },
    { id: 'jetty', name: 'Jetty', category: 'navigation', description: 'Structure projecting into water to influence water flow' },
    { id: 'artificial_reef', name: 'Artificial Reef', category: 'environmental', description: 'Submerged structure designed to enhance marine biodiversity' },
    { id: 'coastal_protection', name: 'Coastal Protection', category: 'coastal_protection', description: 'General coastal defense structures' },
    { id: 'marine_infrastructure', name: 'Marine Infrastructure', category: 'infrastructure', description: 'Other marine construction projects' }
  ];
  res.json({ success: true, data: structureTypes });
});

router.get('/wave-exposure', (req, res) => {
  const waveExposure = [
    { id: 'sheltered', name: 'Sheltered', description: 'Protected areas with minimal wave action', wave_height_range: '0.1 - 0.5m' },
    { id: 'moderate', name: 'Moderate', description: 'Some wave exposure but generally calm conditions', wave_height_range: '0.5 - 1.5m' },
    { id: 'exposed', name: 'Exposed', description: 'Significant wave action and energy', wave_height_range: '1.5 - 3.0m' },
    { id: 'very_exposed', name: 'Very Exposed', description: 'High energy environment with large waves', wave_height_range: '3.0m+' }
  ];
  res.json({ success: true, data: waveExposure });
});

router.get('/seabed-types', (req, res) => {
  const seabedTypes = [
    { id: 'sand', name: 'Sand', description: 'Fine to coarse sand sediment' },
    { id: 'clay', name: 'Clay', description: 'Fine-grained cohesive sediment' },
    { id: 'rock', name: 'Rock', description: 'Hard rocky substrate including bedrock' },
    { id: 'gravel', name: 'Gravel', description: 'Coarse sediment and pebbles' },
    { id: 'mixed', name: 'Mixed', description: 'Combination of sediment types' }
  ];
  res.json({ success: true, data: seabedTypes });
});

router.get('/primary-goals', (req, res) => {
  const primaryGoals = [
    { id: 'coastal_protection', name: 'Coastal Protection', category: 'Infrastructure', description: 'Primary focus on protecting coastlines from erosion' },
    { id: 'biodiversity_enhancement', name: 'Biodiversity Enhancement', category: 'Environmental', description: 'Creating and improving marine habitats' },
    { id: 'carbon_sequestration', name: 'Carbon Sequestration', category: 'Environmental', description: 'Promoting marine organisms that capture carbon' },
    { id: 'fish_habitat_creation', name: 'Fish Habitat Creation', category: 'Marine Life', description: 'Designed to attract and support fish populations' },
    { id: 'coral_restoration', name: 'Coral Restoration', category: 'Marine Life', description: 'Supporting coral growth and reef recovery' },
    { id: 'tourism_development', name: 'Tourism Development', category: 'Economic', description: 'Creating marine attractions and recreational sites' },
    { id: 'research_platform', name: 'Research Platform', category: 'Scientific', description: 'Controlled environment for marine research' },
    { id: 'commercial_infrastructure', name: 'Commercial Infrastructure', category: 'Economic', description: 'Supporting commercial marine activities' }
  ];
  res.json({ success: true, data: primaryGoals });
});

// Bulk endpoint for wizard
router.get('/all', async (req, res) => {
  try {
    // Get static data immediately
    const staticData = {
      structureTypes: [
        { id: 'breakwater', name: 'Breakwater', category: 'coastal_protection' },
        { id: 'artificial_reef', name: 'Artificial Reef', category: 'environmental' },
        { id: 'pier', name: 'Pier', category: 'infrastructure' },
        { id: 'seawall', name: 'Seawall', category: 'coastal_protection' }
      ],
      waveExposure: [
        { id: 'sheltered', name: 'Sheltered', description: 'Protected areas with minimal wave action' },
        { id: 'moderate', name: 'Moderate', description: 'Some wave exposure' },
        { id: 'exposed', name: 'Exposed', description: 'Significant wave action' },
        { id: 'very_exposed', name: 'Very Exposed', description: 'High energy environment' }
      ],
      seabedTypes: [
        { id: 'sand', name: 'Sand' },
        { id: 'clay', name: 'Clay' },
        { id: 'rock', name: 'Rock' },
        { id: 'gravel', name: 'Gravel' },
        { id: 'mixed', name: 'Mixed' }
      ],
      primaryGoals: [
        { id: 'coastal_protection', name: 'Coastal Protection', category: 'Infrastructure' },
        { id: 'biodiversity_enhancement', name: 'Biodiversity Enhancement', category: 'Environmental' },
        { id: 'fish_habitat_creation', name: 'Fish Habitat Creation', category: 'Marine Life' }
      ]
    };

    // Try to get countries from cache, otherwise use basic list
    let countries = getCache('countries');
    if (!countries) {
      countries = [
        { id: 'IL', code: 'IL', name: 'Israel', region: 'Asia' },
        { id: 'US', code: 'US', name: 'United States', region: 'Americas' },
        { id: 'GR', code: 'GR', name: 'Greece', region: 'Europe' },
        { id: 'GB', code: 'GB', name: 'United Kingdom', region: 'Europe' },
        { id: 'AU', code: 'AU', name: 'Australia', region: 'Oceania' }
      ];
    }

    res.json({
      success: true,
      data: {
        countries,
        ...staticData
      }
    });
    
  } catch (error) {
    console.error('Bulk lookup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lookup data'
    });
  }
});

module.exports = router;