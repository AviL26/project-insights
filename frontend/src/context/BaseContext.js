// frontend/src/context/base/BaseContext.js - STANDARDIZED PATTERN
import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';

/**
 * Base context factory that enforces consistent patterns across all contexts
 */
export const createBaseContext = (contextName, initialState, reducer, actions = {}) => {
  const Context = createContext();

  const Provider = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState);

    // Standardized error handling
    const setError = useCallback((error) => {
      const errorMessage = error?.message || error || 'Unknown error occurred';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }, []);

    const clearError = useCallback(() => {
      dispatch({ type: 'CLEAR_ERROR' });
    }, []);

    const setLoading = useCallback((loading) => {
      dispatch({ type: 'SET_LOADING', payload: loading });
    }, []);

    // Create action creators with consistent error handling
    const createActionCreator = useCallback((actionFn) => {
      return async (...args) => {
        try {
          setLoading(true);
          const result = await actionFn(dispatch, state, ...args);
          return result;
        } catch (error) {
          console.error(`${contextName} action failed:`, error);
          setError(error);
          throw error;
        } finally {
          setLoading(false);
        }
      };
    }, [setLoading, setError, state]);

    // Build enhanced actions with error handling
    const enhancedActions = useMemo(() => {
      const enhanced = {};
      Object.keys(actions).forEach(actionName => {
        if (typeof actions[actionName] === 'function') {
          enhanced[actionName] = createActionCreator(actions[actionName]);
        }
      });
      return enhanced;
    }, [actions, createActionCreator]);

    // Standardized context value
    const contextValue = useMemo(() => ({
      // State
      ...state,
      
      // Base actions (always available)
      setError,
      clearError,
      setLoading,
      dispatch,
      
      // Enhanced actions (context-specific)
      ...enhancedActions,
      
      // Meta information
      contextName,
      isReady: !state.isLoading && !state.error
    }), [
      state,
      setError,
      clearError,
      setLoading,
      enhancedActions,
      contextName
    ]);

    return (
      <Context.Provider value={contextValue}>
        {children}
      </Context.Provider>
    );
  };

  const useHook = () => {
    const context = useContext(Context);
    if (!context) {
      throw new Error(`use${contextName} must be used within a ${contextName}Provider`);
    }
    return context;
  };

  return { Provider, useHook, Context };
};

// Standardized reducer pattern
export const createStandardReducer = (contextName, customActions = {}) => {
  const baseActions = {
    SET_LOADING: (state, { payload }) => ({
      ...state,
      isLoading: payload,
      error: payload ? null : state.error // Clear error when loading starts
    }),
    SET_ERROR: (state, { payload }) => ({
      ...state,
      error: payload,
      isLoading: false
    }),
    CLEAR_ERROR: (state) => ({
      ...state,
      error: null
    }),
    RESET_STATE: (_, { payload }) => ({
      ...payload // Complete state reset
    })
  };

  return (state, action) => {
    // Handle base actions first
    if (baseActions[action.type]) {
      return baseActions[action.type](state, action);
    }

    // Handle custom actions
    if (customActions[action.type]) {
      return customActions[action.type](state, action);
    }

    // Log unhandled actions in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`${contextName}: Unhandled action type "${action.type}"`);
    }

    return state;
  };
};

// Standardized initial state pattern
export const createStandardInitialState = (customState = {}) => ({
  isLoading: false,
  error: null,
  lastUpdated: null,
  ...customState
});

// Example usage - ProjectContext refactored
// frontend/src/context/ProjectContext.js - REFACTORED USING STANDARD PATTERN
import { createBaseContext, createStandardReducer, createStandardInitialState } from './base/BaseContext';
import { projectsAPI } from '../services/api';
import { validateProjectData, prepareProjectForAPI } from '../utils/projectUtils';

const initialState = createStandardInitialState({
  activeProjects: [],
  archivedProjects: [],
  currentProject: null,
  currentView: 'active'
});

const projectActions = {
  SET_ACTIVE_PROJECTS: (state, { payload }) => ({
    ...state,
    activeProjects: payload,
    lastUpdated: new Date().toISOString()
  }),
  SET_ARCHIVED_PROJECTS: (state, { payload }) => ({
    ...state,
    archivedProjects: payload
  }),
  ADD_PROJECT: (state, { payload }) => ({
    ...state,
    activeProjects: [payload, ...state.activeProjects],
    currentProject: payload
  }),
  SET_CURRENT_PROJECT: (state, { payload }) => ({
    ...state,
    currentProject: payload
  }),
  ARCHIVE_PROJECT: (state, { payload }) => {
    const project = state.activeProjects.find(p => p.id === payload.id);
    if (!project) return state;
    
    return {
      ...state,
      activeProjects: state.activeProjects.filter(p => p.id !== payload.id),
      archivedProjects: [{ ...project, status: 'archived' }, ...state.archivedProjects],
      currentProject: state.currentProject?.id === payload.id ? null : state.currentProject
    };
  }
};

const reducer = createStandardReducer('Project', projectActions);

// Context-specific actions (passed to createBaseContext)
const contextActions = {
  loadProjects: async (dispatch, state) => {
    const [activeResponse, archivedResponse] = await Promise.all([
      projectsAPI.getByStatus('active'),
      projectsAPI.getByStatus('archived')
    ]);
    
    dispatch({ type: 'SET_ACTIVE_PROJECTS', payload: activeResponse.data?.data || [] });
    dispatch({ type: 'SET_ARCHIVED_PROJECTS', payload: archivedResponse.data?.data || [] });
    
    return { active: activeResponse.data?.data || [], archived: archivedResponse.data?.data || [] };
  },

  createProject: async (dispatch, state, projectData) => {
    const validation = validateProjectData(projectData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const preparedData = prepareProjectForAPI(projectData);
    const response = await projectsAPI.create(preparedData);
    const newProject = response.data?.data || response.data;
    
    dispatch({ type: 'ADD_PROJECT', payload: newProject });
    return newProject;
  },

  archiveProject: async (dispatch, state, projectId) => {
    const response = await projectsAPI.archive(projectId);
    if (response.data?.success) {
      dispatch({ type: 'ARCHIVE_PROJECT', payload: { id: projectId } });
    }
    return response.data;
  }
};

// Create the context
const { Provider: ProjectProvider, useHook: useProject } = createBaseContext(
  'Project',
  initialState,
  reducer,
  contextActions
);

export { ProjectProvider, useProject };