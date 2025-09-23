// frontend/src/context/ComplianceContext.js - TARGETED UPDATES FOR REVIEWER FIXES
// Based on your existing stable version with minimal changes

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
  apiCallInProgress: false,
  // NEW: Add API type tracking for Issue #5
  preferredApiType: 'enhanced', // Default to enhanced
  lastSuccessfulApiType: null
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
        // NEW: Track successful API type
        lastSuccessfulApiType: action.payload.apiType,
        isLoading: false,
        apiCallInProgress: false,
        error: null
      };
    
    // NEW: Add state rollback capability for Issue #4
    case 'ROLLBACK_STATE':
      return action.payload;
    
    // NEW: Add API type management for Issue #5  
    case 'SET_API_PREFERENCE':
      return { ...state, preferredApiType: action.payload };
    
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
  
  // Keep your existing refs - they're excellent!
  const systemStatusRef = useRef(null);
  const apiCallTrackerRef = useRef(new Set());

  // NEW: Helper to create state snapshot for rollback - Issue #4
  const createStateSnapshot = useCallback(() => {
    return deepClone(state);
  }, [state]);

  // NEW: Enhanced API selection logic - Issue #5 Fix
  const selectAPI = useCallback((forceType = null) => {
    // If forced to use specific type
    if (forceType === 'enhanced') {
      return { api: complianceEnhancedAPI, type: 'enhanced' };
    }
    if (forceType === 'legacy') {
      return { api: complianceAPI, type: 'legacy' };
    }

    // Smart selection based on availability and preference
    if (state.preferredApiType === 'enhanced' && state.enhancedFeaturesAvailable) {
      return { api: complianceEnhancedAPI, type: 'enhanced' };
    }
    
    // Fallback to last successful API type
    if (state.lastSuccessfulApiType === 'enhanced' && state.enhancedFeaturesAvailable) {
      return { api: complianceEnhancedAPI, type: 'enhanced' };
    }
    
    // Default fallback
    return { api: complianceAPI, type: 'legacy' };
  }, [state.preferredApiType, state.enhancedFeaturesAvailable, state.lastSuccessfulApiType]);

  // Keep your existing checkSystemStatus - it's excellent!
  const checkSystemStatus = useCallback(async () => {
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
  }, []);

  // ENHANCED: Your existing checkCompliance with targeted improvements
  const checkCompliance = useCallback(async (params) => {
    const callId = `${params.lat}_${params.lon}_${params.projectType}_${Date.now()}`;
    
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
    
    // Your existing validation is excellent - keep it!
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

    // NEW: Create state snapshot for rollback - Issue #4
    const stateSnapshot = createStateSnapshot();

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_API_CALL_IN_PROGRESS', payload: true });
      
      let response;
      let analysisData;
      let usedApiType;
      
      // NEW: Use smart API selection - Issue #5
      try {
        const { api: primaryApi, type: primaryType } = selectAPI();
        console.log(`Attempting ${primaryType} compliance API...`);
        
        if (primaryType === 'enhanced') {
          response = await complianceEnhancedAPI.check(cleanParams);
        } else {
          response = await complianceAPI.getDemo();
        }
        
        if (primaryType === 'enhanced' && response.data?.success) {
          analysisData = response.data.data;
          usedApiType = 'enhanced';
          console.log('Enhanced compliance API successful');
        } else if (primaryType === 'legacy') {
          analysisData = transformLegacyData(response.data, cleanParams);
          usedApiType = 'legacy';
          console.log('Legacy compliance API used');
        } else {
          throw new Error(response.data?.error || 'API returned unsuccessful response');
        }
      } catch (primaryError) {
        console.warn(`Primary API (${selectAPI().type}) failed, attempting fallback:`, primaryError.message);
        
        // Smart fallback
        const { api: fallbackApi, type: fallbackType } = selectAPI(
          selectAPI().type === 'enhanced' ? 'legacy' : 'enhanced'
        );
        
        try {
          if (fallbackType === 'enhanced') {
            const fallbackResponse = await complianceEnhancedAPI.check(cleanParams);
            if (fallbackResponse.data?.success) {
              analysisData = fallbackResponse.data.data;
              usedApiType = 'enhanced';
              console.log('Enhanced API successful on fallback');
            } else {
              throw new Error('Enhanced API fallback failed');
            }
          } else {
            const legacyResponse = await complianceAPI.getDemo();
            analysisData = transformLegacyData(legacyResponse.data, cleanParams);
            usedApiType = 'legacy';
            console.log('Legacy API used as fallback');
          }
        } catch (fallbackError) {
          console.error('Both APIs failed:', fallbackError.message);
          // Rollback state on complete failure - Issue #4
          dispatch({ type: 'ROLLBACK_STATE', payload: stateSnapshot });
          throw primaryError;
        }
      }

      if (!analysisData || typeof analysisData !== 'object') {
        dispatch({ type: 'ROLLBACK_STATE', payload: stateSnapshot });
        throw new Error('Invalid response data structure from compliance API');
      }

      // ENHANCED: More defensive data handling - addresses reviewer concerns
      const safeAnalysisData = {
        rules: Array.isArray(analysisData.rules) ? analysisData.rules.map(rule => ({
          id: rule?.id || `rule_${Date.now()}_${Math.random()}`,
          name: rule?.name || 'Unknown Rule',
          status: rule?.status || 'unknown',
          authority: rule?.authority || 'Unknown Authority',
          risk_level: rule?.risk_level || 'medium',
          requirements: Array.isArray(rule?.requirements) ? rule.requirements : [],
          last_review: rule?.last_review || null,
          next_review: rule?.next_review || null
        })) : [],
        
        riskSummary: analysisData.riskSummary ? {
          overallRisk: analysisData.riskSummary.overallRisk || 'Unknown',
          totalPermits: typeof analysisData.riskSummary.totalPermits === 'number' ? 
            analysisData.riskSummary.totalPermits : 0,
          highRiskItems: typeof analysisData.riskSummary.highRiskItems === 'number' ? 
            analysisData.riskSummary.highRiskItems : 0,
          mediumRiskItems: typeof analysisData.riskSummary.mediumRiskItems === 'number' ? 
            analysisData.riskSummary.mediumRiskItems : 0,
          description: analysisData.riskSummary.description || 'No risk assessment available',
          score: typeof analysisData.riskSummary.score === 'number' ? 
            analysisData.riskSummary.score : 0,
          factors: Array.isArray(analysisData.riskSummary.factors) ? 
            analysisData.riskSummary.factors : []
        } : {
          overallRisk: 'Unknown',
          totalPermits: 0,
          highRiskItems: 0,
          mediumRiskItems: 0,
          description: 'No risk assessment available',
          score: 0,
          factors: []
        },
        
        recommendations: Array.isArray(analysisData.recommendations) ? 
          analysisData.recommendations.filter(rec => rec && typeof rec === 'string') : [],
        
        location: analysisData.location ? {
          lat: typeof analysisData.location.lat === 'number' ? analysisData.location.lat : cleanParams.lat,
          lon: typeof analysisData.location.lon === 'number' ? analysisData.location.lon : cleanParams.lon,
          region: analysisData.location.region || 'Unknown',
          name: analysisData.location.name || null
        } : {
          lat: cleanParams.lat,
          lon: cleanParams.lon,
          region: 'Unknown'
        },
        
        deadlines: Array.isArray(analysisData.deadlines) ? analysisData.deadlines : [],
        permits: Array.isArray(analysisData.permits) ? analysisData.permits : [],
        timeline: analysisData.timeline ? {
          estimated_weeks: typeof analysisData.timeline.estimated_weeks === 'number' ? 
            analysisData.timeline.estimated_weeks : 0,
          phases: Array.isArray(analysisData.timeline.phases) ? analysisData.timeline.phases : []
        } : { estimated_weeks: 0, phases: [] },
        timestamp: Date.now(),
        apiType: usedApiType
      };

      dispatch({ 
        type: 'SET_COMPLIANCE_ANALYSIS', 
        payload: { 
          analysis: safeAnalysisData,
          params: { ...cleanParams },
          apiType: usedApiType
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
  }, [selectAPI, createStateSnapshot]);

  // Keep your existing getRules - it's excellent!
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
      return [];
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_API_CALL_IN_PROGRESS', payload: false });
    }
  }, []);

  // NEW: API preference management - Issue #5
  const setAPIPreference = useCallback((apiType) => {
    if (!['enhanced', 'legacy'].includes(apiType)) {
      dispatch({ type: 'SET_ERROR', payload: 'Invalid API type. Must be "enhanced" or "legacy"' });
      return;
    }
    dispatch({ type: 'SET_API_PREFERENCE', payload: apiType });
  }, []);

  // Keep all your existing functions - they're excellent!
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

  // ENHANCED: Context value with new functions
  const contextValue = React.useMemo(() => ({
    ...state,
    checkSystemStatus,
    checkCompliance,
    getRules,
    retryLastAnalysis,
    clearAnalysis,
    clearError,
    getRiskColor,
    formatLocation,
    // NEW functions for reviewer fixes
    setAPIPreference,
    selectAPI: () => selectAPI(), // Expose for debugging
    currentApiType: selectAPI().type
  }), [
    // Your existing dependencies are perfect
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
    // NEW dependencies
    state.preferredApiType,
    state.lastSuccessfulApiType,
    // Functions
    checkSystemStatus,
    checkCompliance,
    getRules,
    retryLastAnalysis,
    clearAnalysis,
    clearError,
    getRiskColor,
    formatLocation,
    setAPIPreference,
    selectAPI
  ]);

  return (
    <ComplianceContext.Provider value={contextValue}>
      {children}
    </ComplianceContext.Provider>
  );
};

// Keep your existing transformLegacyData - it's excellent!
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