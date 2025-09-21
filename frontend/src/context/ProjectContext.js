// frontend/src/context/ProjectContext.js - ENHANCED BULK OPERATIONS SAFETY
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { projectsAPI } from '../services/api';
import { ensureProjectDefaults, ensureProjectsDefaults, prepareProjectForAPI, validateProjectData } from '../utils/projectUtils';

const ProjectContext = createContext();

const initialState = {
  activeProjects: [],
  archivedProjects: [],
  currentProject: null,
  currentView: 'active',
  isLoading: false,
  error: null,
  validationErrors: null, 
  operationInProgress: false, // Track ongoing operations
  lastOperation: null // Track last operation for retry
};

const projectReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, error: null };
    case 'SET_OPERATION_IN_PROGRESS':
      return { ...state, operationInProgress: action.payload };
    case 'SET_LAST_OPERATION':
      return { ...state, lastOperation: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false, operationInProgress: false };
    case 'SET_VALIDATION_ERROR':
      return { ...state, validationErrors: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null, validationErrors: null };
    case 'SET_ACTIVE_PROJECTS':
      return { 
        ...state, 
        activeProjects: ensureProjectsDefaults(action.payload), 
        isLoading: false, 
        error: null 
      };
    case 'SET_ARCHIVED_PROJECTS':
      return { 
        ...state, 
        archivedProjects: ensureProjectsDefaults(action.payload), 
        error: null 
      };
    case 'SET_CURRENT_VIEW':
      return { ...state, currentView: action.payload };
    case 'ADD_PROJECT':
      const newProject = ensureProjectDefaults(action.payload);
      return {
        ...state,
        activeProjects: [newProject, ...state.activeProjects],
        currentProject: newProject,
        isLoading: false,
        error: null,
        validationErrors: null
      };
    case 'SET_CURRENT_PROJECT':
      return { ...state, currentProject: ensureProjectDefaults(action.payload) };
    case 'ARCHIVE_PROJECT':
      const projectToArchive = state.activeProjects.find(p => p.id === action.payload.id);
      if (!projectToArchive) return state;
      
      return {
        ...state,
        activeProjects: state.activeProjects.filter(p => p.id !== action.payload.id),
        archivedProjects: [
          ensureProjectDefaults({ ...projectToArchive, status: 'archived' }), 
          ...state.archivedProjects
        ],
        currentProject: state.currentProject?.id === action.payload.id ? null : state.currentProject,
        error: null
      };
    case 'RESTORE_PROJECT':
      const projectToRestore = state.archivedProjects.find(p => p.id === action.payload.id);
      if (!projectToRestore) return state;
      
      return {
        ...state,
        archivedProjects: state.archivedProjects.filter(p => p.id !== action.payload.id),
        activeProjects: [
          ensureProjectDefaults({ ...projectToRestore, status: 'active' }), 
          ...state.activeProjects
        ],
        error: null
      };
    case 'BULK_ARCHIVE_PROJECTS':
      // ENHANCED: More robust validation and error handling
      const { validIds, invalidIds, totalRequested } = action.payload;
      
      if (validIds.length === 0) {
        return { 
          ...state, 
          error: `Cannot archive projects: ${invalidIds.length > 0 ? 'Invalid project IDs provided' : 'No projects selected'}`,
          operationInProgress: false
        };
      }
      
      const projectsToArchive = state.activeProjects.filter(p => validIds.includes(p.id));
      const remainingActive = state.activeProjects.filter(p => !validIds.includes(p.id));
      const newlyArchived = projectsToArchive.map(p => 
        ensureProjectDefaults({ ...p, status: 'archived' })
      );
      
      const warningMessage = invalidIds.length > 0 
        ? ` (${invalidIds.length} invalid IDs were skipped)`
        : '';
      
      return {
        ...state,
        activeProjects: remainingActive,
        archivedProjects: [...newlyArchived, ...state.archivedProjects],
        currentProject: validIds.includes(state.currentProject?.id) ? null : state.currentProject,
        error: null,
        operationInProgress: false,
        // Store operation result for user feedback
        lastOperationResult: {
          type: 'bulk_archive',
          successCount: validIds.length,
          totalRequested,
          message: `Successfully archived ${validIds.length} project${validIds.length !== 1 ? 's' : ''}${warningMessage}`
        }
      };
    case 'DELETE_PROJECT_PERMANENT':
      return {
        ...state,
        activeProjects: state.activeProjects.filter(p => p.id !== action.payload),
        archivedProjects: state.archivedProjects.filter(p => p.id !== action.payload),
        currentProject: state.currentProject?.id === action.payload ? null : state.currentProject,
        error: null
      };
    case 'BULK_DELETE_PERMANENT':
      // ENHANCED: Similar validation as bulk archive
      const { validIds: validDeleteIds, invalidIds: invalidDeleteIds, totalRequested: totalDeleteRequested } = action.payload;
      
      if (validDeleteIds.length === 0) {
        return { 
          ...state, 
          error: `Cannot delete projects: ${invalidDeleteIds.length > 0 ? 'Invalid project IDs provided' : 'No projects selected'}`,
          operationInProgress: false
        };
      }
      
      const deleteWarningMessage = invalidDeleteIds.length > 0 
        ? ` (${invalidDeleteIds.length} invalid IDs were skipped)`
        : '';
      
      return {
        ...state,
        activeProjects: state.activeProjects.filter(p => !validDeleteIds.includes(p.id)),
        archivedProjects: state.archivedProjects.filter(p => !validDeleteIds.includes(p.id)),
        currentProject: validDeleteIds.includes(state.currentProject?.id) ? null : state.currentProject,
        error: null,
        operationInProgress: false,
        lastOperationResult: {
          type: 'bulk_delete',
          successCount: validDeleteIds.length,
          totalRequested: totalDeleteRequested,
          message: `Permanently deleted ${validDeleteIds.length} project${validDeleteIds.length !== 1 ? 's' : ''}${deleteWarningMessage}`
        }
      };
    case 'UPDATE_PROJECT':
      const updatedProject = ensureProjectDefaults(action.payload);
      const isInActive = state.activeProjects.some(p => p.id === updatedProject.id);
      const isInArchived = state.archivedProjects.some(p => p.id === updatedProject.id);
      
      return {
        ...state,
        activeProjects: isInActive ? state.activeProjects.map(p => 
          p.id === updatedProject.id ? updatedProject : p
        ) : state.activeProjects,
        archivedProjects: isInArchived ? state.archivedProjects.map(p => 
          p.id === updatedProject.id ? updatedProject : p
        ) : state.archivedProjects,
        currentProject: state.currentProject?.id === updatedProject.id ? updatedProject : state.currentProject,
        error: null,
        validationErrors: null
      };
    case 'CLEAR_OPERATION_RESULT':
      return { ...state, lastOperationResult: null };
    default:
      return state;
  }
};

// ENHANCED: Deep clone utility for state backup
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (Array.isArray(obj)) return obj.map(deepClone);
  return Object.keys(obj).reduce((clone, key) => {
    clone[key] = deepClone(obj[key]);
    return clone;
  }, {});
};

// ENHANCED: Validation utilities for bulk operations
const validateProjectIds = (projectIds, availableProjects, operationType = 'operation') => {
  // Input validation
  if (!Array.isArray(projectIds)) {
    throw new Error(`Project IDs must be an array for ${operationType}`);
  }

  if (projectIds.length === 0) {
    throw new Error(`No projects selected for ${operationType}`);
  }

  // ENHANCED: Validate each ID and categorize
  const validIds = [];
  const invalidIds = [];
  
  projectIds.forEach(id => {
    // Check if ID is valid (number or string that can be converted to number)
    const numericId = Number(id);
    if (isNaN(numericId) || numericId <= 0) {
      invalidIds.push(id);
      return;
    }
    
    // Check if project exists in available projects
    const projectExists = availableProjects.some(p => Number(p.id) === numericId);
    if (projectExists) {
      validIds.push(numericId);
    } else {
      invalidIds.push(id);
    }
  });

  return {
    validIds,
    invalidIds,
    totalRequested: projectIds.length,
    isValid: validIds.length > 0
  };
};

export const ProjectProvider = ({ children }) => {
  const [state, dispatch] = useReducer(projectReducer, initialState);

  // Load projects from backend on mount
  useEffect(() => {
    const loadProjects = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const [activeResponse, archivedResponse] = await Promise.all([
          projectsAPI.getByStatus('active'),
          projectsAPI.getByStatus('archived')
        ]);
        
        const activeProjects = activeResponse.data?.data || [];
        const archivedProjects = archivedResponse.data?.data || [];
        
        dispatch({ type: 'SET_ACTIVE_PROJECTS', payload: activeProjects });
        dispatch({ type: 'SET_ARCHIVED_PROJECTS', payload: archivedProjects });
      } catch (error) {
        console.error('Failed to load projects:', error);
        dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error || error.message || 'Failed to load projects' });
      }
    };

    loadProjects();
  }, []);

  // Get current projects based on view
  const getCurrentProjects = () => {
    return state.currentView === 'active' ? state.activeProjects : state.archivedProjects;
  };

  // Switch between active and archived views
  const setCurrentView = (view) => {
    dispatch({ type: 'SET_CURRENT_VIEW', payload: view });
  };

  // ENHANCED: Create project with comprehensive validation
  const createProject = async (projectData) => {
    // CRITICAL: Always validate input data
    const validation = validateProjectData(projectData);
    if (!validation.isValid) {
      dispatch({ 
        type: 'SET_VALIDATION_ERROR', 
        payload: { 
          message: 'Project validation failed', 
          errors: validation.errors 
        } 
      });
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_OPERATION_IN_PROGRESS', payload: true });
    dispatch({ type: 'SET_LAST_OPERATION', payload: { type: 'create', data: projectData } });
    
    // Create state backup for potential rollback
    const stateBackup = deepClone(state);
    
    try {
      // CRITICAL: Always use prepareProjectForAPI to ensure proper formatting
      const preparedData = prepareProjectForAPI(projectData);
      
      if (!preparedData) {
        throw new Error('Failed to prepare project data for API submission');
      }
      
      // Final validation on prepared data
      const preparedValidation = validateProjectData(preparedData);
      if (!preparedValidation.isValid) {
        throw new Error(`Prepared data validation failed: ${preparedValidation.errors.join(', ')}`);
      }
      
      const response = await projectsAPI.create(preparedData);

      const newProject = response.data?.data || response.data;
      dispatch({ type: 'ADD_PROJECT', payload: newProject });
      return newProject;
    } catch (error) {
      // FIXED: Rollback on failure
      dispatch({ type: 'SET_ACTIVE_PROJECTS', payload: stateBackup.activeProjects });
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create project';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_OPERATION_IN_PROGRESS', payload: false });
    }
  };

  // ENHANCED: Bulk archive with comprehensive validation
  const bulkArchiveProjects = async (projectIds) => {
    dispatch({ type: 'SET_OPERATION_IN_PROGRESS', payload: true });
    dispatch({ type: 'SET_LAST_OPERATION', payload: { type: 'bulk_archive', data: projectIds } });
    
    try {
      // CRITICAL: Validate inputs before processing
      const validation = validateProjectIds(projectIds, state.activeProjects, 'bulk archive');
      
      if (!validation.isValid) {
        dispatch({ 
          type: 'SET_ERROR', 
          payload: validation.invalidIds.length > 0 
            ? `Invalid project IDs: ${validation.invalidIds.join(', ')}`
            : 'No valid projects found to archive'
        });
        throw new Error('Bulk archive validation failed');
      }

      const stateBackup = deepClone(state);
      
      // Optimistic update
      dispatch({ 
        type: 'BULK_ARCHIVE_PROJECTS', 
        payload: validation
      });
      
      try {
        const response = await projectsAPI.bulkArchive(validation.validIds);
        
        if (!response.data?.success) {
          throw new Error(response.data?.error || 'Failed to archive projects');
        }
        
        return {
          archivedCount: response.data.data.archivedCount || validation.validIds.length,
          archivedProjects: response.data.data.archivedProjects || [],
          skippedCount: validation.invalidIds.length,
          totalRequested: validation.totalRequested
        };
      } catch (apiError) {
        // FIXED: Complete state rollback on API failure
        dispatch({ type: 'SET_ACTIVE_PROJECTS', payload: stateBackup.activeProjects });
        dispatch({ type: 'SET_ARCHIVED_PROJECTS', payload: stateBackup.archivedProjects });
        dispatch({ type: 'SET_CURRENT_PROJECT', payload: stateBackup.currentProject });
        throw apiError;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to archive projects';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_OPERATION_IN_PROGRESS', payload: false });
    }
  };

  // ENHANCED: Bulk delete with comprehensive validation
  const bulkDeletePermanent = async (projectIds) => {
    dispatch({ type: 'SET_OPERATION_IN_PROGRESS', payload: true });
    dispatch({ type: 'SET_LAST_OPERATION', payload: { type: 'bulk_delete', data: projectIds } });
    
    try {
      // CRITICAL: Validate inputs - check both active and archived projects
      const allProjects = [...state.activeProjects, ...state.archivedProjects];
      const validation = validateProjectIds(projectIds, allProjects, 'bulk delete');
      
      if (!validation.isValid) {
        dispatch({ 
          type: 'SET_ERROR', 
          payload: validation.invalidIds.length > 0 
            ? `Invalid project IDs: ${validation.invalidIds.join(', ')}`
            : 'No valid projects found to delete'
        });
        throw new Error('Bulk delete validation failed');
      }

      const stateBackup = deepClone(state);
      
      // Optimistic update
      dispatch({ 
        type: 'BULK_DELETE_PERMANENT', 
        payload: validation
      });
      
      try {
        const response = await projectsAPI.bulkDeletePermanent(validation.validIds);
        
        if (!response.data?.success) {
          throw new Error(response.data?.error || 'Failed to permanently delete projects');
        }
        
        return {
          deletedCount: response.data.data.deletedCount || validation.validIds.length,
          deletedProjects: response.data.data.deletedProjects || [],
          skippedCount: validation.invalidIds.length,
          totalRequested: validation.totalRequested
        };
      } catch (apiError) {
        // FIXED: Complete state rollback on API failure
        dispatch({ type: 'SET_ACTIVE_PROJECTS', payload: stateBackup.activeProjects });
        dispatch({ type: 'SET_ARCHIVED_PROJECTS', payload: stateBackup.archivedProjects });
        dispatch({ type: 'SET_CURRENT_PROJECT', payload: stateBackup.currentProject });
        throw apiError;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to permanently delete projects';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_OPERATION_IN_PROGRESS', payload: false });
    }
  };

  // ENHANCED: Archive single project with validation
  const archiveProject = async (projectId) => {
    // CRITICAL: Validate project ID exists
    const numericId = Number(projectId);
    if (!projectId || isNaN(numericId) || !state.activeProjects.some(p => Number(p.id) === numericId)) {
      const errorMessage = 'Project not found or already archived';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }

    dispatch({ type: 'SET_OPERATION_IN_PROGRESS', payload: true });
    const stateBackup = deepClone(state);
    dispatch({ type: 'ARCHIVE_PROJECT', payload: { id: numericId } });
    
    try {
      const response = await projectsAPI.archive(numericId);
      
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to archive project');
      }
      
      return true;
    } catch (error) {
      // FIXED: Complete state rollback
      dispatch({ type: 'SET_ACTIVE_PROJECTS', payload: stateBackup.activeProjects });
      dispatch({ type: 'SET_ARCHIVED_PROJECTS', payload: stateBackup.archivedProjects });
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to archive project';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_OPERATION_IN_PROGRESS', payload: false });
    }
  };

  // Continue with other methods following the same enhanced pattern...
  const restoreProject = async (projectId) => {
    const numericId = Number(projectId);
    if (!projectId || isNaN(numericId) || !state.archivedProjects.some(p => Number(p.id) === numericId)) {
      const errorMessage = 'Project not found or not archived';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }

    dispatch({ type: 'SET_OPERATION_IN_PROGRESS', payload: true });
    const stateBackup = deepClone(state);
    dispatch({ type: 'RESTORE_PROJECT', payload: { id: numericId } });
    
    try {
      const response = await projectsAPI.restore(numericId);
      
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to restore project');
      }
      
      return true;
    } catch (error) {
      dispatch({ type: 'SET_ACTIVE_PROJECTS', payload: stateBackup.activeProjects });
      dispatch({ type: 'SET_ARCHIVED_PROJECTS', payload: stateBackup.archivedProjects });
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to restore project';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_OPERATION_IN_PROGRESS', payload: false });
    }
  };

  const deleteProjectPermanent = async (projectId) => {
    const numericId = Number(projectId);
    const projectExists = state.activeProjects.some(p => Number(p.id) === numericId) || 
                         state.archivedProjects.some(p => Number(p.id) === numericId);
    
    if (!projectId || isNaN(numericId) || !projectExists) {
      const errorMessage = 'Project not found';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }

    dispatch({ type: 'SET_OPERATION_IN_PROGRESS', payload: true });
    const stateBackup = deepClone(state);
    dispatch({ type: 'DELETE_PROJECT_PERMANENT', payload: numericId });
    
    try {
      const response = await projectsAPI.deletePermanent(numericId);
      
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to permanently delete project');
      }
      
      return true;
    } catch (error) {
      dispatch({ type: 'SET_ACTIVE_PROJECTS', payload: stateBackup.activeProjects });
      dispatch({ type: 'SET_ARCHIVED_PROJECTS', payload: stateBackup.archivedProjects });
      dispatch({ type: 'SET_CURRENT_PROJECT', payload: stateBackup.currentProject });
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to permanently delete project';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_OPERATION_IN_PROGRESS', payload: false });
    }
  };

  const updateProject = async (updatedProject) => {
    if (!updatedProject || !updatedProject.id) {
      const errorMessage = 'Project ID is required for updates';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }

    const validation = validateProjectData(updatedProject);
    if (!validation.isValid) {
      dispatch({ 
        type: 'SET_VALIDATION_ERROR', 
        payload: { 
          message: 'Project validation failed', 
          errors: validation.errors 
        } 
      });
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    dispatch({ type: 'SET_OPERATION_IN_PROGRESS', payload: true });
    const stateBackup = deepClone(state);
    
    try {
      const preparedData = prepareProjectForAPI(updatedProject);
      const response = await projectsAPI.update(updatedProject.id, preparedData);
      const updated = response.data?.data || response.data;
      
      dispatch({ type: 'UPDATE_PROJECT', payload: updated });
      return updated;
    } catch (error) {
      dispatch({ type: 'SET_ACTIVE_PROJECTS', payload: stateBackup.activeProjects });
      dispatch({ type: 'SET_ARCHIVED_PROJECTS', payload: stateBackup.archivedProjects });
      dispatch({ type: 'SET_CURRENT_PROJECT', payload: stateBackup.currentProject });
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update project';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_OPERATION_IN_PROGRESS', payload: false });
    }
  };

  const setCurrentProject = (project) => {
    dispatch({ type: 'SET_CURRENT_PROJECT', payload: project });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const clearOperationResult = () => {
    dispatch({ type: 'CLEAR_OPERATION_RESULT' });
  };

  // Legacy compatibility methods
  const deleteProject = archiveProject;
  const bulkDeleteProjects = bulkArchiveProjects;

  return (
    <ProjectContext.Provider value={{
      state,
      dispatch,
      getCurrentProjects,
      setCurrentView,
      createProject,
      archiveProject,
      restoreProject,
      deleteProjectPermanent,
      bulkArchiveProjects,
      bulkDeletePermanent,
      updateProject,
      setCurrentProject,
      clearError,
      clearOperationResult,
      // Legacy methods for backward compatibility
      deleteProject,
      bulkDeleteProjects
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};