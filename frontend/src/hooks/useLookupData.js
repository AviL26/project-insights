// frontend/src/hooks/useLookupData.js - FIXED TO USE BACKEND API
import { useState, useEffect, useCallback } from 'react';
import { lookupAPI } from '../services/api';

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

  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitialData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Try to get all data at once first
      try {
        const response = await lookupAPI.getAll();
        const data = response.data;
        
        setState(prev => ({
          ...prev,
          countries: data.countries || [],
          structureTypes: data.structureTypes || [],
          waveExposure: data.waveExposure || [],
          seabedTypes: data.seabedTypes || [],
          primaryGoals: data.primaryGoals || [],
          isLoading: false,
          error: null
        }));
        return;
      } catch (bulkError) {
        console.warn('Bulk lookup API not available, loading individually:', bulkError.message);
      }

      // Fallback: Load individual endpoints
      const [
        countriesRes,
        structureTypesRes,
        waveExposureRes,
        seabedTypesRes,
        primaryGoalsRes
      ] = await Promise.allSettled([
        lookupAPI.getCountries().catch(() => ({ data: getFallbackCountries() })),
        lookupAPI.getStructureTypes().catch(() => ({ data: getFallbackStructureTypes() })),
        lookupAPI.getWaveExposure().catch(() => ({ data: getFallbackWaveExposure() })),
        lookupAPI.getSeabedTypes().catch(() => ({ data: getFallbackSeabedTypes() })),
        lookupAPI.getPrimaryGoals().catch(() => ({ data: getFallbackPrimaryGoals() }))
      ]);

      setState(prev => ({
        ...prev,
        countries: countriesRes.status === 'fulfilled' ? countriesRes.value.data : getFallbackCountries(),
        structureTypes: structureTypesRes.status === 'fulfilled' ? structureTypesRes.value.data : getFallbackStructureTypes(),
        waveExposure: waveExposureRes.status === 'fulfilled' ? waveExposureRes.value.data : getFallbackWaveExposure(),
        seabedTypes: seabedTypesRes.status === 'fulfilled' ? seabedTypesRes.value.data : getFallbackSeabedTypes(),
        primaryGoals: primaryGoalsRes.status === 'fulfilled' ? primaryGoalsRes.value.data : getFallbackPrimaryGoals(),
        isLoading: false,
        error: null
      }));

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

  // Load regions for a specific country
  const loadRegions = useCallback(async (countryCode) => {
    if (!countryCode) {
      setState(prev => ({ ...prev, regions: [], marineZones: [] }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await lookupAPI.getRegions(countryCode);
      setState(prev => ({
        ...prev,
        regions: response.data || [],
        marineZones: [], // Clear marine zones when country changes
        isLoading: false
      }));
    } catch (error) {
      console.error(`Failed to load regions for ${countryCode}:`, error);
      setState(prev => ({
        ...prev,
        regions: getFallbackRegions(countryCode),
        marineZones: [],
        isLoading: false
      }));
    }
  }, []);

  // Load marine zones for a specific region
  const loadMarineZones = useCallback(async (countryCode, regionId) => {
    if (!countryCode || !regionId) {
      setState(prev => ({ ...prev, marineZones: [] }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await lookupAPI.getMarineZones(countryCode, regionId);
      setState(prev => ({
        ...prev,
        marineZones: response.data || [],
        isLoading: false
      }));
    } catch (error) {
      console.error(`Failed to load marine zones for ${countryCode}/${regionId}:`, error);
      setState(prev => ({
        ...prev,
        marineZones: getFallbackMarineZones(countryCode, regionId),
        isLoading: false
      }));
    }
  }, []);

  // Helper functions to get specific items by ID
  const getCountryByCode = useCallback((code) => {
    return state.countries.find(country => country.code === code);
  }, [state.countries]);

  const getRegionById = useCallback((id) => {
    return state.regions.find(region => region.id === id);
  }, [state.regions]);

  const getMarineZoneById = useCallback((id) => {
    return state.marineZones.find(zone => zone.id === id);
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
    { id: 'IL', code: 'IL', name: 'Israel', region: 'Mediterranean' },
    { id: 'CY', code: 'CY', name: 'Cyprus', region: 'Mediterranean' },
    { id: 'GR', code: 'GR', name: 'Greece', region: 'Mediterranean' },
    { id: 'ES', code: 'ES', name: 'Spain', region: 'Mediterranean' },
    { id: 'IT', code: 'IT', name: 'Italy', region: 'Mediterranean' },
    { id: 'FR', code: 'FR', name: 'France', region: 'Mediterranean' },
    { id: 'TR', code: 'TR', name: 'Turkey', region: 'Mediterranean' }
  ];
}

function getFallbackStructureTypes() {
  return [
    { 
      id: 'breakwater', 
      name: 'Breakwater', 
      description: 'Coastal structure designed to reduce wave energy and protect harbors'
    },
    { 
      id: 'seawall', 
      name: 'Seawall', 
      description: 'Vertical or sloped barrier designed to prevent coastal erosion'
    },
    { 
      id: 'pier', 
      name: 'Pier', 
      description: 'Structure extending into water for vessel mooring or public access'
    },
    { 
      id: 'artificial_reef', 
      name: 'Artificial Reef', 
      description: 'Submerged structure designed to enhance marine biodiversity'
    }
  ];
}

function getFallbackWaveExposure() {
  return [
    { id: 'sheltered', name: 'Sheltered', description: 'Protected areas with minimal wave action' },
    { id: 'moderate', name: 'Moderate', description: 'Some wave exposure but generally calm conditions' },
    { id: 'exposed', name: 'Exposed', description: 'Significant wave action and energy' },
    { id: 'very_exposed', name: 'Very Exposed', description: 'High energy environment with large waves' }
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
    }
  ];
}

function getFallbackRegions(countryCode) {
  const regionLookup = {
    'IL': [
      { id: 'med_north', name: 'Northern Mediterranean Coast', description: 'Haifa to Lebanese border' },
      { id: 'med_central', name: 'Central Mediterranean Coast', description: 'Tel Aviv metropolitan area' },
      { id: 'med_south', name: 'Southern Mediterranean Coast', description: 'Ashkelon to Gaza border' }
    ],
    'CY': [
      { id: 'south_coast', name: 'Southern Coast', description: 'Limassol, Paphos area' },
      { id: 'east_coast', name: 'Eastern Coast', description: 'Larnaca, Ayia Napa area' }
    ]
  };
  
  return regionLookup[countryCode] || [];
}

function getFallbackMarineZones(countryCode, regionId) {
  const zoneLookup = {
    'IL': {
      'med_central': [
        { 
          id: 'tel_aviv', 
          name: 'Tel Aviv Marina Area', 
          lat: 32.0853, 
          lon: 34.7818, 
          depth_range: '5-20m', 
          characteristics: 'Urban coast, moderate protection' 
        }
      ]
    }
  };
  
  return zoneLookup[countryCode]?.[regionId] || [];
}