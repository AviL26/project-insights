// src/hooks/useOceanData.js

import { useState, useEffect, useCallback } from 'react';
import oceanDataService from '../services/oceanDataService';

export const useOceanData = (currentProject) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchOceanData = useCallback(async (lat, lon) => {
    if (!lat || !lon) {
      console.log('No coordinates provided, skipping ocean data fetch');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching ocean data for:', { lat, lon });
      const oceanData = await oceanDataService.getOceanConditions(lat, lon);
      setData(oceanData);
      setLastFetch(new Date());
      console.log('Ocean data loaded successfully');
    } catch (err) {
      console.error('Failed to fetch ocean data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    if (currentProject) {
      const lat = currentProject.latitude || currentProject.lat || 32.0;
      const lon = currentProject.longitude || currentProject.lon || 34.0;
      fetchOceanData(lat, lon);
    }
  }, [currentProject, fetchOceanData]);

  // Auto-fetch when project changes
  useEffect(() => {
    if (currentProject) {
      const lat = currentProject.latitude || currentProject.lat || 32.0;
      const lon = currentProject.longitude || currentProject.lon || 34.0;
      
      console.log('Project changed, fetching ocean data for project:', currentProject.name);
      fetchOceanData(lat, lon);
    }
  }, [currentProject, fetchOceanData]);

  return {
    data,
    loading,
    error,
    lastFetch,
    refresh
  };
};