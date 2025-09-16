// frontend/src/context/ComplianceContext.js
import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { complianceEnhancedAPI, healthAPI } from '../services/api';

const ComplianceContext = createContext();

const initialState = {
  isLoading: false,
  error: null,
  systemStatus: null,
  currentAnalysis: null,
  rules: [],
  riskSummary: null,
  recommendations: [],
  enhancedFeaturesAvailable: false
};

const complianceReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, error: null };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_SYSTEM_STATUS':
      return { 
        ...state, 
        systemStatus: action.payload,
        enhancedFeaturesAvailable: action.payload?.features?.enhancedCompliance || false
      };
    
    case 'SET_COMPLIANCE_ANALYSIS':
      return {
        ...state,
        currentAnalysis: action.payload,
        rules: action.payload?.rules || [],
        riskSummary: action.payload?.riskSummary || null,
        recommendations: action.payload?.recommendations || [],
        isLoading: false,
        error: null
      };
    
    case 'CLEAR_ANALYSIS':
      return {
        ...state,
        currentAnalysis: null,
        rules: [],
        riskSummary: null,
        recommendations: []
      };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
};

export const ComplianceProvider = ({ children }) => {
  const [state, dispatch] = useReducer(complianceReducer, initialState);

  // Check system status and enhanced features availability
  const checkSystemStatus = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await healthAPI.check();
      dispatch({ type: 'SET_SYSTEM_STATUS', payload: response.data });
      return response.data;
    } catch (error) {
      console.error('Failed to check system status:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to check system status' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Check compliance for a project location and type
  const checkCompliance = useCallback(async (params) => {
    const { lat, lon, projectType, projectId } = params;
    
    if (!lat || !lon || !projectType) {
      dispatch({ type: 'SET_ERROR', payload: 'Location coordinates and project type are required' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await complianceEnhancedAPI.check({
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        projectType,
        projectId: projectId ? parseInt(projectId) : undefined
      });

      if (response.data?.success) {
        dispatch({ type: 'SET_COMPLIANCE_ANALYSIS', payload: response.data.data });
        return response.data.data;
      } else {
        throw new Error(response.data?.error || 'Compliance check failed');
      }
    } catch (error) {
      console.error('Compliance check failed:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to check compliance';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  // Get compliance rules with optional filtering
  const getRules = useCallback(async (filters = {}) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await complianceEnhancedAPI.getRules(filters);
      
      if (response.data?.success) {
        return response.data.data;
      } else {
        throw new Error(response.data?.error || 'Failed to fetch rules');
      }
    } catch (error) {
      console.error('Failed to fetch compliance rules:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch compliance rules';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Clear current analysis
  const clearAnalysis = useCallback(() => {
    dispatch({ type: 'CLEAR_ANALYSIS' });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Helper function to get risk level color
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

  // Helper function to format location string
  const formatLocation = useCallback((location) => {
    if (!location) return 'Unknown location';
    const { lat, lon, region } = location;
    return `${lat}°, ${lon}° (${region})`;
  }, []);

  const value = {
    // State
    ...state,
    
    // Actions
    checkSystemStatus,
    checkCompliance,
    getRules,
    clearAnalysis,
    clearError,
    
    // Helpers
    getRiskColor,
    formatLocation
  };

  return (
    <ComplianceContext.Provider value={value}>
      {children}
    </ComplianceContext.Provider>
  );
};

export const useCompliance = () => {
  const context = useContext(ComplianceContext);
  if (!context) {
    throw new Error('useCompliance must be used within a ComplianceProvider');
  }
  return context;
};

export default ComplianceContext;