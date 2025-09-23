// frontend/src/hooks/useLookupData.js
import { useState, useEffect, useCallback } from 'react';
import { LocationLookupService } from '../services/locationLookupService';

export const useLookupData = () => {
  const [lookupData, setLookupData] = useState({
    countries: [],
    regions: [],
    marineZones: [],
    structureTypes: [],
    waveExposure: [],
    seabedTypes: [],
    primaryGoals: [],
    isLoading: true,
    error: null
  });

  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  // Initialize lookup data
  useEffect(() => {
    const initializeLookupData = async () => {
      try {
        setLookupData(prev => ({ ...prev, isLoading: true, error: null }));
        
        const data = await LocationLookupService.getAllLookupData();
        
        setLookupData(prev => ({
          ...prev,
          countries: data.countries,
          structureTypes: data.structureTypes,
          waveExposure: data.waveExposure,
          seabedTypes: data.seabedTypes,
          primaryGoals: data.primaryGoals,
          isLoading: false
        }));
      } catch (error) {
        console.error('Failed to load lookup data:', error);
        setLookupData(prev => ({
          ...prev,
          error: 'Failed to load reference data. Please refresh the page.',
          isLoading: false
        }));
      }
    };

    initializeLookupData();
  }, []);

  // Load regions when country changes
  const loadRegions = useCallback(async (countryCode) => {
    if (!countryCode) {
      setLookupData(prev => ({ ...prev, regions: [], marineZones: [] }));
      setSelectedRegion('');
      return;
    }

    try {
      const regions = await LocationLookupService.getRegionsByCountry(countryCode);
      setLookupData(prev => ({ 
        ...prev, 
        regions, 
        marineZones: [] // Clear marine zones when country changes
      }));
      setSelectedCountry(countryCode);
      setSelectedRegion('');
    } catch (error) {
      console.error('Failed to load regions:', error);
    }
  }, []);

  // Load marine zones when region changes
  const loadMarineZones = useCallback(async (countryCode, regionId) => {
    if (!countryCode || !regionId) {
      setLookupData(prev => ({ ...prev, marineZones: [] }));
      return;
    }

    try {
      const marineZones = await LocationLookupService.getMarineZonesByRegion(countryCode, regionId);
      setLookupData(prev => ({ ...prev, marineZones }));
      setSelectedRegion(regionId);
    } catch (error) {
      console.error('Failed to load marine zones:', error);
    }
  }, []);

  // Helper functions
  const getCountryByCode = useCallback((code) => {
    return lookupData.countries.find(country => country.code === code);
  }, [lookupData.countries]);

  const getRegionById = useCallback((regionId) => {
    return lookupData.regions.find(region => region.id === regionId);
  }, [lookupData.regions]);

  const getMarineZoneById = useCallback((zoneId) => {
    return lookupData.marineZones.find(zone => zone.id === zoneId);
  }, [lookupData.marineZones]);

  const getStructureTypeById = useCallback((typeId) => {
    return lookupData.structureTypes.find(type => type.id === typeId);
  }, [lookupData.structureTypes]);

  const getPrimaryGoalById = useCallback((goalId) => {
    return lookupData.primaryGoals.find(goal => goal.id === goalId);
  }, [lookupData.primaryGoals]);

  return {
    // Data
    ...lookupData,
    
    // State
    selectedCountry,
    selectedRegion,
    
    // Actions  
    loadRegions,
    loadMarineZones,
    
    // Helpers
    getCountryByCode,
    getRegionById,
    getMarineZoneById,
    getStructureTypeById,
    getPrimaryGoalById
  };
};