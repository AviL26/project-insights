// frontend/src/hooks/useLookupData.js - FIXED API RESPONSE HANDLING
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Direct API calls with proper response handling
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const lookupAPI = {
  async getAll() {
    const response = await axios.get(`${API_BASE_URL}/api/lookup/all`);
    return response.data.success ? response.data.data : response.data;
  },
  
  async getCountries() {
    const response = await axios.get(`${API_BASE_URL}/api/lookup/countries`);
    console.log('Countries API response:', response.data); // Debug log
    return response.data.success ? response.data.data : response.data;
  },
  
  async getStructureTypes() {
    const response = await axios.get(`${API_BASE_URL}/api/lookup/structure-types`);
    return response.data.success ? response.data.data : response.data;
  },
  
  async getWaveExposure() {
    const response = await axios.get(`${API_BASE_URL}/api/lookup/wave-exposure`);
    return response.data.success ? response.data.data : response.data;
  },
  
  async getSeabedTypes() {
    const response = await axios.get(`${API_BASE_URL}/api/lookup/seabed-types`);
    return response.data.success ? response.data.data : response.data;
  },
  
  async getPrimaryGoals() {
    const response = await axios.get(`${API_BASE_URL}/api/lookup/primary-goals`);
    return response.data.success ? response.data.data : response.data;
  },
  
  async getRegions(countryCode) {
    const response = await axios.get(`${API_BASE_URL}/api/lookup/regions/${countryCode}`);
    return response.data.success ? response.data.data : response.data;
  },
  
  async getMarineZones(countryCode, regionId) {
    // This endpoint might not exist yet, but we'll handle it gracefully
    try {
      const response = await axios.get(`${API_BASE_URL}/api/lookup/marine-zones/${countryCode}/${regionId}`);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return []; // Return empty array if endpoint doesn't exist
      }
      throw error;
    }
  }
};

export const useLookupData = () => {
  const [state, setState] = useState({
    countries: [],
    regions: [],
    marineZones: [],
    structureTypes: [],
    waveExposure: [],
    seabedTypes: [],
    primaryGoals: [],
    isLoading: false,
    error: null
  });

  // Define loadInitialData function first
  const loadInitialData = useCallback(async () => {
    console.log('Loading initial lookup data...');
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Try to get all data at once first
      try {
        console.log('Attempting to load all lookup data via bulk endpoint...');
        const bulkData = await lookupAPI.getAll();
        console.log('Bulk data loaded:', bulkData);
        
        setState(prev => ({
          ...prev,
          countries: bulkData.countries || [],
          structureTypes: bulkData.structureTypes || [],
          waveExposure: bulkData.waveExposure || [],
          seabedTypes: bulkData.seabedTypes || [],
          primaryGoals: bulkData.primaryGoals || [],
          isLoading: false,
          error: null
        }));
        
        console.log('Successfully loaded bulk data');
        return;
      } catch (bulkError) {
        console.warn('Bulk lookup API not available, loading individually:', bulkError.message);
      }

      // Fallback: Load individual endpoints
      console.log('Loading individual lookup endpoints...');
      
      try {
        const countries = await lookupAPI.getCountries();
        console.log('Countries loaded:', countries.length);
        setState(prev => ({ ...prev, countries: countries || [] }));
      } catch (error) {
        console.error('Failed to load countries:', error);
        setState(prev => ({ ...prev, countries: getFallbackCountries() }));
      }

      try {
        const structureTypes = await lookupAPI.getStructureTypes();
        console.log('Structure types loaded:', structureTypes.length);
        setState(prev => ({ ...prev, structureTypes: structureTypes || [] }));
      } catch (error) {
        console.error('Failed to load structure types:', error);
        setState(prev => ({ ...prev, structureTypes: getFallbackStructureTypes() }));
      }

      try {
        const waveExposure = await lookupAPI.getWaveExposure();
        setState(prev => ({ ...prev, waveExposure: waveExposure || [] }));
      } catch (error) {
        console.error('Failed to load wave exposure:', error);
        setState(prev => ({ ...prev, waveExposure: getFallbackWaveExposure() }));
      }

      try {
        const seabedTypes = await lookupAPI.getSeabedTypes();
        setState(prev => ({ ...prev, seabedTypes: seabedTypes || [] }));
      } catch (error) {
        console.error('Failed to load seabed types:', error);
        setState(prev => ({ ...prev, seabedTypes: getFallbackSeabedTypes() }));
      }

      try {
        const primaryGoals = await lookupAPI.getPrimaryGoals();
        setState(prev => ({ ...prev, primaryGoals: primaryGoals || [] }));
      } catch (error) {
        console.error('Failed to load primary goals:', error);
        setState(prev => ({ ...prev, primaryGoals: getFallbackPrimaryGoals() }));
      }

      setState(prev => ({ ...prev, isLoading: false }));
      console.log('Individual lookup data loading completed');

    } catch (error) {
      console.error('Failed to load lookup data:', error);
      
      // Use fallback data if everything fails
      setState(prev => ({
        ...prev,
        countries: getFallbackCountries(),
        structureTypes: getFallbackStructureTypes(),
        waveExposure: getFallbackWaveExposure(),
        seabedTypes: getFallbackSeabedTypes(),
        primaryGoals: getFallbackPrimaryGoals(),
        isLoading: false,
        error: `Failed to load configuration data: ${error.message}`
      }));
    }
  }, []);

  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]); // Fixed dependency

  // Load regions for a specific country
  const loadRegions = useCallback(async (countryCode) => {
    console.log(`Loading regions for country: ${countryCode}`);
    
    if (!countryCode) {
      setState(prev => ({ ...prev, regions: [], marineZones: [] }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const regions = await lookupAPI.getRegions(countryCode);
      console.log(`Loaded ${regions.length} regions for ${countryCode}:`, regions);
      
      setState(prev => ({
        ...prev,
        regions: regions || [],
        marineZones: [], // Clear marine zones when country changes
        isLoading: false
      }));
    } catch (error) {
      console.error(`Failed to load regions for ${countryCode}:`, error);
      const fallbackRegions = getFallbackRegions(countryCode);
      
      setState(prev => ({
        ...prev,
        regions: fallbackRegions,
        marineZones: [],
        isLoading: false
      }));
    }
  }, []);

  // Load marine zones for a specific region
  const loadMarineZones = useCallback(async (countryCode, regionId) => {
    console.log(`Loading marine zones for: ${countryCode}/${regionId}`);
    
    if (!countryCode || !regionId) {
      setState(prev => ({ ...prev, marineZones: [] }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const marineZones = await lookupAPI.getMarineZones(countryCode, regionId);
      console.log(`Loaded ${marineZones.length} marine zones for ${countryCode}/${regionId}:`, marineZones);
      
      setState(prev => ({
        ...prev,
        marineZones: marineZones || [],
        isLoading: false
      }));
    } catch (error) {
      console.error(`Failed to load marine zones for ${countryCode}/${regionId}:`, error);
      const fallbackZones = getFallbackMarineZones(countryCode, regionId);
      
      setState(prev => ({
        ...prev,
        marineZones: fallbackZones,
        isLoading: false
      }));
    }
  }, []);

  // Helper functions to get specific items by ID
  const getCountryByCode = useCallback((code) => {
    const country = state.countries.find(country => country.code === code || country.id === code);
    console.log(`Getting country by code ${code}:`, country);
    return country;
  }, [state.countries]);

  const getRegionById = useCallback((id) => {
    const region = state.regions.find(region => region.id === id);
    console.log(`Getting region by ID ${id}:`, region);
    return region;
  }, [state.regions]);

  const getMarineZoneById = useCallback((id) => {
    const zone = state.marineZones.find(zone => zone.id === id);
    console.log(`Getting marine zone by ID ${id}:`, zone);
    return zone;
  }, [state.marineZones]);

  return {
    ...state,
    loadRegions,
    loadMarineZones,
    getCountryByCode,
    getRegionById,
    getMarineZoneById,
    reload: loadInitialData
  };
};

// Fallback data functions (used when API is not available)
function getFallbackCountries() {
  return [
    { id: 'IL', code: 'IL', name: 'Israel', region: 'Asia', subregion: 'Western Asia' },
    { id: 'CY', code: 'CY', name: 'Cyprus', region: 'Asia', subregion: 'Western Asia' },
    { id: 'GR', code: 'GR', name: 'Greece', region: 'Europe', subregion: 'Southern Europe' },
    { id: 'ES', code: 'ES', name: 'Spain', region: 'Europe', subregion: 'Southern Europe' },
    { id: 'IT', code: 'IT', name: 'Italy', region: 'Europe', subregion: 'Southern Europe' },
    { id: 'FR', code: 'FR', name: 'France', region: 'Europe', subregion: 'Western Europe' },
    { id: 'US', code: 'US', name: 'United States', region: 'Americas', subregion: 'Northern America' },
    { id: 'AU', code: 'AU', name: 'Australia', region: 'Oceania', subregion: 'Australia and New Zealand' },
    { id: 'CA', code: 'CA', name: 'Canada', region: 'Americas', subregion: 'Northern America' },
    { id: 'GB', code: 'GB', name: 'United Kingdom', region: 'Europe', subregion: 'Northern Europe' }
  ];
}

function getFallbackStructureTypes() {
  return [
    { 
      id: 'breakwater', 
      name: 'Breakwater', 
      category: 'coastal_protection',
      description: 'Coastal structure designed to reduce wave energy and protect harbors'
    },
    { 
      id: 'seawall', 
      name: 'Seawall', 
      category: 'coastal_protection',
      description: 'Vertical or sloped barrier designed to prevent coastal erosion'
    },
    { 
      id: 'pier', 
      name: 'Pier', 
      category: 'infrastructure',
      description: 'Structure extending into water for vessel mooring or public access'
    },
    { 
      id: 'artificial_reef', 
      name: 'Artificial Reef', 
      category: 'environmental',
      description: 'Submerged structure designed to enhance marine biodiversity'
    },
    { 
      id: 'jetty', 
      name: 'Jetty', 
      category: 'navigation',
      description: 'Structure projecting into water to influence water flow'
    },
    { 
      id: 'coastal_protection', 
      name: 'Coastal Protection', 
      category: 'coastal_protection',
      description: 'General coastal defense structures'
    }
  ];
}

function getFallbackWaveExposure() {
  return [
    { id: 'sheltered', name: 'Sheltered', description: 'Protected areas with minimal wave action', wave_height_range: '0.1 - 0.5m' },
    { id: 'moderate', name: 'Moderate', description: 'Some wave exposure but generally calm conditions', wave_height_range: '0.5 - 1.5m' },
    { id: 'exposed', name: 'Exposed', description: 'Significant wave action and energy', wave_height_range: '1.5 - 3.0m' },
    { id: 'very_exposed', name: 'Very Exposed', description: 'High energy environment with large waves', wave_height_range: '3.0m+' }
  ];
}

function getFallbackSeabedTypes() {
  return [
    { id: 'sand', name: 'Sand', description: 'Fine to coarse sand sediment' },
    { id: 'clay', name: 'Clay', description: 'Fine-grained cohesive sediment' },
    { id: 'rock', name: 'Rock', description: 'Hard rocky substrate including bedrock' },
    { id: 'gravel', name: 'Gravel', description: 'Coarse sediment and pebbles' },
    { id: 'mixed', name: 'Mixed', description: 'Combination of sediment types' }
  ];
}

function getFallbackPrimaryGoals() {
  return [
    {
      id: 'coastal_protection',
      name: 'Coastal Protection',
      category: 'Infrastructure',
      description: 'Primary focus on protecting coastlines from erosion and storm damage'
    },
    {
      id: 'biodiversity_enhancement',
      name: 'Biodiversity Enhancement',
      category: 'Environmental',
      description: 'Creating and improving marine habitats to support diverse species'
    },
    {
      id: 'carbon_sequestration',
      name: 'Carbon Sequestration',
      category: 'Environmental',
      description: 'Promoting marine organisms that capture and store atmospheric carbon'
    },
    {
      id: 'fish_habitat_creation',
      name: 'Fish Habitat Creation',
      category: 'Marine Life',
      description: 'Specifically designed to attract and support fish populations'
    },
    {
      id: 'coral_restoration',
      name: 'Coral Restoration',
      category: 'Marine Life',
      description: 'Supporting coral growth and reef recovery'
    },
    {
      id: 'tourism_development',
      name: 'Tourism Development',
      category: 'Economic',
      description: 'Creating marine attractions and recreational sites'
    },
    {
      id: 'research_platform',
      name: 'Research Platform',
      category: 'Scientific',
      description: 'Controlled environment for marine research'
    },
    {
      id: 'commercial_infrastructure',
      name: 'Commercial Infrastructure',
      category: 'Economic',
      description: 'Supporting commercial marine activities'
    }
  ];
}

function getFallbackRegions(countryCode) {
  const regionLookup = {
    'IL': [
      { id: 'il_haifa', name: 'Haifa District', fullName: 'Haifa District, Israel', description: 'Northern coastal region', latitude: 32.8, longitude: 35.0 },
      { id: 'il_central', name: 'Central District', fullName: 'Central District, Israel', description: 'Tel Aviv metropolitan area', latitude: 32.1, longitude: 34.8 },
      { id: 'il_southern', name: 'Southern District', fullName: 'Southern District, Israel', description: 'Southern coastal region', latitude: 31.3, longitude: 34.4 }
    ],
    'US': [
      { id: 'us_california', name: 'California', fullName: 'California, United States', description: 'West Coast state', latitude: 36.7, longitude: -119.7 },
      { id: 'us_florida', name: 'Florida', fullName: 'Florida, United States', description: 'Southeast coastal state', latitude: 27.7, longitude: -81.6 },
      { id: 'us_texas', name: 'Texas', fullName: 'Texas, United States', description: 'Gulf Coast state', latitude: 31.9, longitude: -99.9 }
    ],
    'GR': [
      { id: 'gr_attica', name: 'Attica', fullName: 'Attica, Greece', description: 'Athens region', latitude: 38.0, longitude: 23.7 },
      { id: 'gr_crete', name: 'Crete', fullName: 'Crete, Greece', description: 'Largest Greek island', latitude: 35.2, longitude: 24.9 },
      { id: 'gr_macedonia', name: 'Central Macedonia', fullName: 'Central Macedonia, Greece', description: 'Northern Greece', latitude: 40.6, longitude: 22.9 }
    ]
  };
  
  return regionLookup[countryCode] || [];
}

function getFallbackMarineZones(countryCode, regionId) {
  const zoneLookup = {
    'IL': {
      'il_central': [
        { 
          id: 'il_tel_aviv_marina', 
          name: 'Tel Aviv Marina Area', 
          lat: 32.0853, 
          lon: 34.7818, 
          depth_range: '5-20m', 
          characteristics: 'Urban coast, moderate protection, sandy bottom' 
        },
        { 
          id: 'il_herzliya_marina', 
          name: 'Herzliya Marina', 
          lat: 32.1624, 
          lon: 34.8009, 
          depth_range: '3-15m', 
          characteristics: 'Protected marina, mixed substrate' 
        }
      ],
      'il_haifa': [
        { 
          id: 'il_haifa_bay', 
          name: 'Haifa Bay', 
          lat: 32.8176, 
          lon: 34.9885, 
          depth_range: '10-40m', 
          characteristics: 'Industrial port area, deep waters, mixed substrate' 
        }
      ]
    },
    'US': {
      'us_california': [
        { 
          id: 'us_san_francisco_bay', 
          name: 'San Francisco Bay', 
          lat: 37.7749, 
          lon: -122.4194, 
          depth_range: '5-100m', 
          characteristics: 'Strong currents, rocky bottom, urban waters' 
        }
      ]
    }
  };
  
  return zoneLookup[countryCode]?.[regionId] || [];
}