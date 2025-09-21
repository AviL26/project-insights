// src/hooks/useOceanData.js - FIXED VERSION
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import oceanDataService from '../services/oceanDataService';

// PERFORMANCE: Cache for ocean data to prevent redundant API calls
const oceanDataCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// PERFORMANCE: Request tracking to prevent duplicate API calls
const ongoingRequests = new Map();

export const useOceanData = (currentProject) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  
  // FIXED: Better abort controller management
  const abortControllerRef = useRef(null);
  const lastProjectRef = useRef(null);
  const isMountedRef = useRef(true);

  // PERFORMANCE: Memoized coordinates to prevent unnecessary effect triggers
  const coordinates = useMemo(() => {
    if (!currentProject) return null;
    
    const lat = currentProject.latitude || currentProject.lat;
    const lon = currentProject.longitude || currentProject.lon;
    
    if (!lat || !lon || isNaN(Number(lat)) || isNaN(Number(lon))) {
      return null;
    }
    
    return {
      lat: Number(lat),
      lon: Number(lon),
      cacheKey: `${Number(lat).toFixed(4)}_${Number(lon).toFixed(4)}`
    };
  }, [currentProject]);

  // FIXED: Improved fetch function that handles aborts better
  const fetchOceanData = useCallback(async (lat, lon, cacheKey) => {
    if (!isMountedRef.current) {
      console.log('Component unmounted, skipping fetch');
      return;
    }

    // Validate inputs
    if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
      console.log('Invalid coordinates provided, skipping ocean data fetch');
      return;
    }

    // PERFORMANCE: Check cache first
    const cachedData = oceanDataCache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
      console.log('Using cached ocean data for', cacheKey);
      if (isMountedRef.current) {
        setData(cachedData.data);
        setLastFetch(new Date(cachedData.timestamp));
      }
      return;
    }

    // PERFORMANCE: Check if request is already in progress
    const ongoingRequest = ongoingRequests.get(cacheKey);
    if (ongoingRequest) {
      console.log('Ocean data request already in progress for', cacheKey);
      try {
        const result = await ongoingRequest;
        if (isMountedRef.current) {
          setData(result);
          setLastFetch(new Date());
        }
      } catch (err) {
        if (isMountedRef.current && err.name !== 'AbortError') {
          setError(err.message);
        }
      }
      return;
    }

    // FIXED: Only abort if we're starting a NEW request for DIFFERENT coordinates
    const currentCacheKey = abortControllerRef.current?.cacheKey;
    if (abortControllerRef.current && currentCacheKey !== cacheKey) {
      console.log('Aborting request for different coordinates:', currentCacheKey, '->', cacheKey);
      abortControllerRef.current.abort();
    }

    // Create new abort controller only if we don't have one or we aborted the old one
    if (!abortControllerRef.current || abortControllerRef.current.signal.aborted) {
      abortControllerRef.current = new AbortController();
      abortControllerRef.current.cacheKey = cacheKey; // Track what this controller is for
    }

    const { signal } = abortControllerRef.current;

    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }

    // Create and track the request promise
    const requestPromise = (async () => {
      try {
        console.log('Fetching ocean data for coordinates:', { lat, lon, cacheKey });
        
        // Check if request was aborted
        if (signal.aborted) {
          throw new Error('Request aborted');
        }

        const oceanData = await oceanDataService.getOceanConditions(lat, lon);
        
        // FIXED: Only check abort status if we're still working on the same request
        if (signal.aborted && abortControllerRef.current?.cacheKey === cacheKey) {
          console.log('Request aborted after completion for', cacheKey);
          throw new Error('Request aborted');
        }

        if (!oceanData) {
          throw new Error('No data returned from ocean service');
        }

        // PERFORMANCE: Cache the result
        oceanDataCache.set(cacheKey, {
          data: oceanData,
          timestamp: Date.now()
        });

        console.log('Ocean data loaded successfully for', cacheKey);
        return oceanData;
      } catch (err) {
        if (err.name === 'AbortError' || err.message === 'Request aborted') {
          console.log('Ocean data request was aborted for', cacheKey);
          throw err;
        }
        console.error('Ocean data request failed:', err);
        throw err;
      }
    })();

    // Track the ongoing request
    ongoingRequests.set(cacheKey, requestPromise);

    try {
      const oceanData = await requestPromise;
      
      // FIXED: Only set data if component is still mounted AND this is for the current coordinates
      if (isMountedRef.current && abortControllerRef.current?.cacheKey === cacheKey) {
        console.log('Setting ocean data for', cacheKey);
        setData(oceanData);
        setLastFetch(new Date());
      } else {
        console.log('Skipping data update - component unmounted or different request');
      }
    } catch (err) {
      // FIXED: Only set error if component mounted and this is the current request
      if (isMountedRef.current && 
          err.name !== 'AbortError' && 
          err.message !== 'Request aborted' &&
          abortControllerRef.current?.cacheKey === cacheKey) {
        console.error('Setting error for', cacheKey, err);
        setError(err.message);
      }
    } finally {
      // FIXED: Only set loading false if this is still the current request
      if (isMountedRef.current && abortControllerRef.current?.cacheKey === cacheKey) {
        setLoading(false);
      }
      
      // Clean up the ongoing request tracking
      ongoingRequests.delete(cacheKey);
    }
  }, []);

  // Refresh function
  const refresh = useCallback(() => {
    if (coordinates) {
      // Clear cache for this location to force fresh data
      oceanDataCache.delete(coordinates.cacheKey);
      fetchOceanData(coordinates.lat, coordinates.lon, coordinates.cacheKey);
    }
  }, [coordinates, fetchOceanData]);

  // FIXED: Better cleanup - track mount status
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      console.log('useOceanData cleanup - component unmounting');
      isMountedRef.current = false;
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // FIXED: More stable effect that doesn't re-run unnecessarily
  useEffect(() => {
    // Skip if no coordinates
    if (!coordinates) {
      setData(null);
      return;
    }

    // Skip if project hasn't actually changed
    const currentRef = lastProjectRef.current;
    const hasChanged = !currentRef || 
                      currentRef.id !== currentProject?.id ||
                      currentRef.lat !== coordinates.lat ||
                      currentRef.lon !== coordinates.lon;

    if (!hasChanged) {
      console.log('Project coordinates unchanged, keeping existing data');
      return;
    }

    // Update project reference
    lastProjectRef.current = {
      id: currentProject?.id,
      lat: coordinates.lat,
      lon: coordinates.lon
    };

    console.log('Triggering ocean data fetch for changed project:', {
      project: currentProject?.name || currentProject?.id,
      coordinates: coordinates
    });
    
    fetchOceanData(coordinates.lat, coordinates.lon, coordinates.cacheKey);
  }, [coordinates, currentProject?.id, fetchOceanData]); // More specific dependencies

  // PERFORMANCE: Memoized return object to prevent unnecessary re-renders
  return useMemo(() => ({
    data,
    loading,
    error,
    lastFetch,
    refresh
  }), [data, loading, error, lastFetch, refresh]);
};

// Cache utilities
export const cleanupOceanDataCache = () => {
  const now = Date.now();
  const expiredKeys = [];
  
  for (const [key, value] of oceanDataCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      expiredKeys.push(key);
    }
  }
  
  expiredKeys.forEach(key => oceanDataCache.delete(key));
  console.log(`Cleaned up ${expiredKeys.length} expired ocean data cache entries`);
};

export const getOceanDataCacheStats = () => ({
  size: oceanDataCache.size,
  entries: Array.from(oceanDataCache.keys()),
  ongoingRequests: Array.from(ongoingRequests.keys())
});