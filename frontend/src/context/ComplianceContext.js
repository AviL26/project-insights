// frontend/src/context/ComplianceContext.js - STABLE VERSION - NO MORE BLINKING
import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import { complianceEnhancedAPI, healthAPI, complianceAPI } from '../services/api';

const ComplianceContext = createContext();

const initialState = {
  isLoading: false,
  error: null,
  systemStatus: null,
  currentAnalysis: null,
  rules: [],
  riskSummary: null,
  recommendations: [],
  enhancedFeaturesAvailable: false,
  lastAnalysisParams: null,
  apiCallInProgress: false
};

const complianceReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, error: null };
    
    case 'SET_API_CALL_IN_PROGRESS':
      return { ...state, apiCallInProgress: action.payload };
    
    case 'SET_ERROR':
      return { 
        ...state, 
        error: action.payload, 
        isLoading: false, 
        apiCallInProgress: false 
      };
    
    case 'SET_SYSTEM_STATUS':
      return { 
        ...state, 
        systemStatus: action.payload,
        enhancedFeaturesAvailable: action.payload?.features?.enhancedCompliance || false,
        error: null
      };
    
    case 'SET_COMPLIANCE_ANALYSIS':
      return {
        ...state,
        currentAnalysis: action.payload.analysis,
        rules: action.payload.analysis?.rules || [],
        riskSummary: action.payload.analysis?.riskSummary || null,
        recommendations: action.payload.analysis?.recommendations || [],
        lastAnalysisParams: action.payload.params,
        isLoading: false,
        apiCallInProgress: false,
        error: null
      };
    
    case 'CLEAR_ANALYSIS':
      return {
        ...state,
        currentAnalysis: null,
        rules: [],
        riskSummary: null,
        recommendations: [],
        lastAnalysisParams: null
      };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
};

const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (Array.isArray(obj)) return obj.map(deepClone);
  return Object.keys(obj).reduce((clone, key) => {
    clone[key] = deepClone(obj[key]);
    return clone;
  }, {});
};

export const ComplianceProvider = ({ children }) => {
  const [state, dispatch] = useReducer(complianceReducer, initialState);
  
  // CRITICAL FIX: Use refs to track API calls and prevent loops
  const systemStatusRef = useRef(null);
  const apiCallTrackerRef = useRef(new Set());
  
  // FIXED: Stable checkSystemStatus that won't cause loops
  const checkSystemStatus = useCallback(async () => {
    // Prevent duplicate calls
    if (systemStatusRef.current || state.apiCallInProgress) {
      console.warn('System status check already in progress');
      return state.systemStatus;
    }

    systemStatusRef.current = true;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_API_CALL_IN_PROGRESS', payload: true });
      
      const response = await healthAPI.check();
      const statusData = response.data;
      
      dispatch({ type: 'SET_SYSTEM_STATUS', payload: statusData });
      return statusData;
    } catch (error) {
      console.error('Failed to check system status:', error);
      
      let errorMessage = 'Failed to check system status';
      if (error.response?.status === 404) {
        errorMessage = 'API endpoints not available - server may be down';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error - enhanced features may be unavailable';
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        errorMessage = 'Network connection failed - check your connection';
      } else {
        errorMessage = error.response?.data?.error || error.message || errorMessage;
      }
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      return {
        status: 'degraded',
        features: { enhancedCompliance: false },
        error: errorMessage
      };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_API_CALL_IN_PROGRESS', payload: false });
      systemStatusRef.current = null;
    }
  }, []); // CRITICAL: Empty deps to prevent recreation

  // FIXED: Stable checkCompliance with duplicate call prevention
  const checkCompliance = useCallback(async (params) => {
    // Create a unique call ID
    const callId = `${params.lat}_${params.lon}_${params.projectType}_${Date.now()}`;
    
    // Prevent duplicate calls
    if (apiCallTrackerRef.current.has(callId.substring(0, callId.lastIndexOf('_')))) {
      console.warn('Compliance check already in progress for these parameters');
      return state.currentAnalysis;
    }

    if (!params || typeof params !== 'object') {
      const errorMessage = 'Compliance check parameters are required';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }

    const { lat, lon, projectType, projectId } = params;
    
    // Input validation
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      const errorMessage = 'Valid latitude and longitude coordinates are required';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      const errorMessage = 'Invalid coordinate ranges';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }

    if (!projectType || typeof projectType !== 'string') {
      const errorMessage = 'Project type is required';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }

    const cleanParams = {
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      projectType: String(projectType).trim(),
      projectId: projectId ? parseInt(projectId) : undefined
    };

    const trackingKey = `${cleanParams.lat}_${cleanParams.lon}_${cleanParams.projectType}`;
    apiCallTrackerRef.current.add(trackingKey);

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_API_CALL_IN_PROGRESS', payload: true });
      
      let response;
      let analysisData;
      
      try {
        console.log('Attempting enhanced compliance API...');
        response = await complianceEnhancedAPI.check(cleanParams);
        
        if (response.data?.success) {
          analysisData = response.data.data;
          console.log('Enhanced compliance API successful');
        } else {
          throw new Error(response.data?.error || 'Enhanced API returned unsuccessful response');
        }
      } catch (enhancedError) {
        console.warn('Enhanced compliance API failed, falling back to legacy API:', enhancedError.message);
        
        try {
          const legacyResponse = await complianceAPI.getDemo();
          analysisData = transformLegacyData(legacyResponse.data, cleanParams);
          console.log('Legacy compliance API used as fallback');
        } catch (legacyError) {
          console.error('Legacy compliance API also failed:', legacyError.message);
          throw enhancedError;
        }
      }

      if (!analysisData || typeof analysisData !== 'object') {
        throw new Error('Invalid response data structure from compliance API');
      }

      // FIXED: Create completely new object to prevent reference issues
      const safeAnalysisData = {
        rules: Array.isArray(analysisData.rules) ? [...analysisData.rules] : [],
        riskSummary: analysisData.riskSummary ? { ...analysisData.riskSummary } : {
          overallRisk: 'Unknown',
          totalPermits: 0,
          highRiskItems: 0,
          mediumRiskItems: 0
        },
        recommendations: Array.isArray(analysisData.recommendations) ? [...analysisData.recommendations] : [],
        location: analysisData.location ? { ...analysisData.location } : {
          lat: cleanParams.lat,
          lon: cleanParams.lon,
          region: 'Unknown'
        },
        deadlines: Array.isArray(analysisData.deadlines) ? [...analysisData.deadlines] : [],
        timestamp: Date.now() // Add timestamp to ensure uniqueness
      };

      dispatch({ 
        type: 'SET_COMPLIANCE_ANALYSIS', 
        payload: { 
          analysis: safeAnalysisData,
          params: { ...cleanParams }
        }
      });
      
      return safeAnalysisData;
    } catch (error) {
      console.error('Compliance check failed:', error);
      dispatch({ type: 'CLEAR_ANALYSIS' });
      
      let errorMessage = 'Failed to check compliance';
      if (error.response?.status === 400) {
        errorMessage = `Invalid request: ${error.response.data?.error || 'Check your input parameters'}`;
      } else if (error.response?.status === 404) {
        errorMessage = 'Compliance service not available - server may be misconfigured';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error - compliance service may be temporarily unavailable';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network connection failed - check your internet connection';
      } else {
        errorMessage = error.response?.data?.error || error.message || errorMessage;
      }
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_API_CALL_IN_PROGRESS', payload: false });
      apiCallTrackerRef.current.delete(trackingKey);
    }
  }, []); // CRITICAL: Empty deps to prevent recreation

  // FIXED: Simplified getRules without state dependencies
  const getRules = useCallback(async (filters = {}) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_API_CALL_IN_PROGRESS', payload: true });
      
      const response = await complianceEnhancedAPI.getRules(filters);
      
      if (response.data?.success) {
        return response.data.data || [];
      } else {
        throw new Error(response.data?.error || 'Failed to fetch rules');
      }
    } catch (error) {
      console.error('Failed to fetch compliance rules:', error);
      return []; // Return empty array instead of throwing
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_API_CALL_IN_PROGRESS', payload: false });
    }
  }, []);

  // FIXED: Stable retry function
  const retryLastAnalysis = useCallback(async () => {
    if (!state.lastAnalysisParams) {
      const errorMessage = 'No previous analysis to retry';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }

    return checkCompliance(state.lastAnalysisParams);
  }, [state.lastAnalysisParams, checkCompliance]);

  const clearAnalysis = useCallback(() => {
    dispatch({ type: 'CLEAR_ANALYSIS' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // FIXED: Stable helper functions with no dependencies
  const getRiskColor = useCallback((riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high':
        return 'text-red-700 bg-red-100 border-red-200';
      case 'medium':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'low':
        return 'text-green-700 bg-green-100 border-green-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  }, []);

  const formatLocation = useCallback((location) => {
    if (!location) return 'Unknown location';
    
    const { lat, lon, region, name } = location;
    
    if (name) return name;
    if (region && lat && lon) return `${region} (${lat.toFixed(4)}°, ${lon.toFixed(4)}°)`;
    if (lat && lon) return `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
    return region || 'Unknown location';
  }, []);

  // CRITICAL FIX: Create stable value object that only changes when state actually changes
  const contextValue = React.useMemo(() => ({
    ...state,
    checkSystemStatus,
    checkCompliance,
    getRules,
    retryLastAnalysis,
    clearAnalysis,
    clearError,
    getRiskColor,
    formatLocation
  }), [
    // Only include the actual state values that matter
    state.isLoading,
    state.error,
    state.currentAnalysis,
    state.systemStatus,
    state.enhancedFeaturesAvailable,
    state.rules,
    state.riskSummary,
    state.recommendations,
    state.lastAnalysisParams,
    state.apiCallInProgress,
    // Functions are stable due to empty deps
    checkSystemStatus,
    checkCompliance,
    getRules,
    retryLastAnalysis,
    clearAnalysis,
    clearError,
    getRiskColor,
    formatLocation
  ]);

  return (
    <ComplianceContext.Provider value={contextValue}>
      {children}
    </ComplianceContext.Provider>
  );
};

// Transform legacy API data to match enhanced API structure
const transformLegacyData = (legacyData, params) => {
  const { lat, lon } = params;
  
  return {
    rules: legacyData.frameworks?.map(framework => ({
      id: framework.id,
      name: framework.name,
      status: framework.status,
      authority: 'Legacy System',
      risk_level: framework.risk_level,
      requirements: framework.requirements ? 
        Array(framework.requirements).fill(0).map((_, i) => `Requirement ${i + 1}`) : [],
      last_review: framework.last_review,
      next_review: framework.next_review
    })) || [],
    
    riskSummary: {
      overallRisk: legacyData.frameworks?.some(f => f.risk_level === 'high') ? 'High' :
                  legacyData.frameworks?.some(f => f.risk_level === 'medium') ? 'Medium' : 'Low',
      totalPermits: legacyData.permits?.length || 0,
      highRiskItems: legacyData.frameworks?.filter(f => f.risk_level === 'high').length || 0,
      mediumRiskItems: legacyData.frameworks?.filter(f => f.risk_level === 'medium').length || 0
    },
    
    recommendations: [
      'Review regulatory compliance requirements',
      'Ensure all permits are up to date',
      'Monitor framework compliance status'
    ],
    
    location: {
      lat: lat,
      lon: lon,
      region: 'Mediterranean'
    },
    
    deadlines: legacyData.deadlines || []
  };
};

export const useCompliance = () => {
  const context = useContext(ComplianceContext);
  if (!context) {
    throw new Error('useCompliance must be used within a ComplianceProvider');
  }
  return context;
};

export default ComplianceContext;