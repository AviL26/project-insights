// hooks/useEcologicalData.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { GBIFService, NOAAService, ProtectedPlanetService, WaterQualityService } from '../services/api-services';
import { EcologicalImpactCalculator } from '../services/calculation-engine';

// Main hook for coordinating all ecological data
export const useEcologicalData = (currentProject, options = {}) => {
  const {
    autoFetch = true,
    cacheTimeout = 300000, // 5 minutes
    retryAttempts = 3
  } = options;

  const [data, setData] = useState({
    biodiversity: null,
    ocean: null,
    waterQuality: null,
    climate: null,
    protectedAreas: null
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [lastFetch, setLastFetch] = useState(null);
  
  const abortControllerRef = useRef(null);

  const fetchAllData = useCallback(async (forceRefresh = false) => {
    if (!currentProject?.lat || !currentProject?.lon) {
      return;
    }

    // Check cache validity
    if (!forceRefresh && lastFetch && (Date.now() - lastFetch < cacheTimeout)) {
      return;
    }

    // Abort previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setErrors({});

    try {
      const fetchPromises = [
        GBIFService.fetchSpeciesOccurrences(currentProject.lat, currentProject.lon)
          .catch(err => ({ error: err.message, type: 'biodiversity' })),
        NOAAService.fetchOceanConditions(currentProject.lat, currentProject.lon)
          .catch(err => ({ error: err.message, type: 'ocean' })),
        WaterQualityService.fetchWaterQuality(currentProject.lat, currentProject.lon)
          .catch(err => ({ error: err.message, type: 'waterQuality' })),
        ProtectedPlanetService.fetchProtectedAreas(currentProject.lat, currentProject.lon)
          .catch(err => ({ error: err.message, type: 'protectedAreas' }))
      ];

      const results = await Promise.allSettled(fetchPromises);
      
      const newData = { ...data };
      const newErrors = {};

      results.forEach((result, index) => {
        const types = ['biodiversity', 'ocean', 'waterQuality', 'protectedAreas'];
        const type = types[index];

        if (result.status === 'fulfilled') {
          if (result.value.error) {
            newErrors[type] = result.value.error;
          } else {
            newData[type] = result.value;
          }
        } else {
          newErrors[type] = result.reason?.message || 'Unknown error';
        }
      });

      // Add climate data (mock for now - would integrate with climate APIs)
      newData.climate = {
        sst_anomaly: 1.2,
        trend_10year: 0.8,
        seasonal_variation: 6.2,
        extreme_events: {
          heatwaves_annual: 3,
          storm_intensity: 'moderate',
          sea_level_rise_rate: 3.2
        },
        projections_2050: {
          temperature_increase: 2.1,
          sea_level_rise: 15.0,
          acidification: -0.2
        }
      };

      setData(newData);
      setErrors(newErrors);
      setLastFetch(Date.now());

    } catch (error) {
      if (error.name !== 'AbortError') {
        setErrors({ general: error.message });
      }
    } finally {
      setLoading(false);
    }
  }, [currentProject?.lat, currentProject?.lon, cacheTimeout, lastFetch, data]);

  // Auto-fetch when project changes
  useEffect(() => {
    if (autoFetch && currentProject) {
      fetchAllData();
    }
  }, [currentProject, autoFetch, fetchAllData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const refresh = useCallback(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  const hasErrors = Object.keys(errors).length > 0;
  const isDataComplete = Object.values(data).every(d => d !== null);

  return {
    data,
    loading,
    errors,
    hasErrors,
    isDataComplete,
    refresh,
    lastFetch: lastFetch ? new Date(lastFetch) : null
  };
};

// Hook for biodiversity-specific data and calculations
export const useBiodiversityData = (currentProject) => {
  const [biodiversityData, setBiodiversityData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBiodiversityData = useCallback(async () => {
    if (!currentProject?.lat || !currentProject?.lon) return;

    setLoading(true);
    setError(null);

    try {
      const data = await GBIFService.fetchSpeciesOccurrences(
        currentProject.lat, 
        currentProject.lon
      );
      setBiodiversityData(data);
    } catch (err) {
      setError(err.message);
      setBiodiversityData(GBIFService.getFallbackBiodiversityData());
    } finally {
      setLoading(false);
    }
  }, [currentProject?.lat, currentProject?.lon]);

  useEffect(() => {
    fetchBiodiversityData();
  }, [fetchBiodiversityData]);

  return {
    biodiversityData,
    loading,
    error,
    refresh: fetchBiodiversityData
  };
};

// Hook for ocean conditions
export const useOceanData = (currentProject, timeRange = '1year') => {
  const [oceanData, setOceanData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOceanData = useCallback(async () => {
    if (!currentProject?.lat || !currentProject?.lon) return;

    setLoading(true);
    setError(null);

    try {
      const data = await NOAAService.fetchOceanConditions(
        currentProject.lat, 
        currentProject.lon,
        timeRange
      );
      setOceanData(data);
    } catch (err) {
      setError(err.message);
      setOceanData(NOAAService.getFallbackOceanData());
    } finally {
      setLoading(false);
    }
  }, [currentProject?.lat, currentProject?.lon, timeRange]);

  useEffect(() => {
    fetchOceanData();
  }, [fetchOceanData]);

  return {
    oceanData,
    loading,
    error,
    refresh: fetchOceanData
  };
};

// Hook for ecological calculations and insights
export const useEcologicalCalculations = (projectData, environmentalData) => {
  const [calculations, setCalculations] = useState({
    impactScore: 0,
    carbonSequestration: 0,
    insights: null
  });

  const [loading, setLoading] = useState(false);

  const calculateMetrics = useCallback(async () => {
    if (!projectData) return;

    setLoading(true);

    try {
      // Run calculations in a web worker if available, otherwise synchronously
      const impactScore = EcologicalImpactCalculator.calculateOverallScore(
        projectData,
        environmentalData?.ocean,
        environmentalData?.biodiversity,
        environmentalData?.waterQuality,
        environmentalData?.climate
      );

      const insights = EcologicalImpactCalculator.generateInsights(
        projectData,
        environmentalData?.ocean,
        environmentalData?.biodiversity,
        environmentalData?.waterQuality,
        environmentalData?.climate
      );

      setCalculations({
        impactScore,
        carbonSequestration: insights.metrics.carbonSequestration,
        insights
      });

    } catch (error) {
      console.error('Calculation error:', error);
      setCalculations({
        impactScore: 0,
        carbonSequestration: 0,
        insights: null
      });
    } finally {
      setLoading(false);
    }
  }, [projectData, environmentalData]);

  useEffect(() => {
    calculateMetrics();
  }, [calculateMetrics]);

  return {
    ...calculations,
    loading,
    recalculate: calculateMetrics
  };
};

// Hook for managing data refresh and synchronization
export const useDataSync = (initialData = {}) => {
  const [syncState, setSyncState] = useState({
    lastSync: null,
    pendingUpdates: 0,
    syncErrors: []
  });

  const [data, setData] = useState(initialData);

  const updateData = useCallback((key, newData) => {
    setData(prev => ({
      ...prev,
      [key]: newData
    }));
    
    setSyncState(prev => ({
      ...prev,
      lastSync: new Date(),
      pendingUpdates: Math.max(0, prev.pendingUpdates - 1)
    }));
  }, []);

  const addSyncError = useCallback((error) => {
    setSyncState(prev => ({
      ...prev,
      syncErrors: [...prev.syncErrors, {
        error,
        timestamp: new Date(),
        id: Math.random().toString(36).substr(2, 9)
      }]
    }));
  }, []);

  const clearSyncErrors = useCallback(() => {
    setSyncState(prev => ({
      ...prev,
      syncErrors: []
    }));
  }, []);

  const startUpdate = useCallback(() => {
    setSyncState(prev => ({
      ...prev,
      pendingUpdates: prev.pendingUpdates + 1
    }));
  }, []);

  return {
    data,
    syncState,
    updateData,
    addSyncError,
    clearSyncErrors,
    startUpdate
  };
};

// Hook for batch data operations
export const useBatchDataManager = (batchSize = 5) => {
  const [queue, setQueue] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);

  const addToQueue = useCallback((operation) => {
    setQueue(prev => [...prev, {
      ...operation,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    }]);
  }, []);

  const processBatch = useCallback(async () => {
    if (processing || queue.length === 0) return;

    setProcessing(true);
    const batch = queue.slice(0, batchSize);
    
    try {
      const promises = batch.map(async (operation) => {
        try {
          const result = await operation.fn();
          return { ...operation, result, success: true };
        } catch (error) {
          return { ...operation, error: error.message, success: false };
        }
      });

      const batchResults = await Promise.allSettled(promises);
      
      setResults(prev => [...prev, ...batchResults.map(r => r.value)]);
      setQueue(prev => prev.slice(batchSize));
      
    } catch (error) {
      console.error('Batch processing error:', error);
    } finally {
      setProcessing(false);
    }
  }, [queue, processing, batchSize]);

  useEffect(() => {
    if (queue.length > 0 && !processing) {
      const timer = setTimeout(processBatch, 1000); // Batch delay
      return () => clearTimeout(timer);
    }
  }, [queue.length, processing, processBatch]);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return {
    queue,
    processing,
    results,
    addToQueue,
    clearQueue,
    clearResults,
    queueSize: queue.length,
    successCount: results.filter(r => r.success).length,
    errorCount: results.filter(r => !r.success).length
  };
};

export default useEcologicalData;