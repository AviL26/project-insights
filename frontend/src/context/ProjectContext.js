// frontend/src/context/ProjectContext.js - FIXED
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
  validationErrors: null // NEW: Track validation errors separately
};

const projectReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_VALIDATION_ERROR': // NEW
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
      // FIXED: Validate project IDs exist
      const validProjectIds = action.payload.filter(id => 
        state.activeProjects.some(p => p.id === id)
      );
      
      if (validProjectIds.length === 0) {
        return { ...state, error: 'No valid projects found to archive' };
      }
      
      const projectsToArchive = state.activeProjects.filter(p => validProjectIds.includes(p.id));
      const remainingActive = state.activeProjects.filter(p => !validProjectIds.includes(p.id));
      const newlyArchived = projectsToArchive.map(p => 
        ensureProjectDefaults({ ...p, status: 'archived' })
      );
      
      return {
        ...state,
        activeProjects: remainingActive,
        archivedProjects: [...newlyArchived, ...state.archivedProjects],
        currentProject: validProjectIds.includes(state.currentProject?.id) ? null : state.currentProject,
        error: null
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
      // FIXED: Validate project IDs exist
      const validDeleteIds = action.payload.filter(id => 
        state.activeProjects.some(p => p.id === id) || 
        state.archivedProjects.some(p => p.id === id)
      );
      
      if (validDeleteIds.length === 0) {
        return { ...state, error: 'No valid projects found to delete' };
      }
      
      return {
        ...state,
        activeProjects: state.activeProjects.filter(p => !validDeleteIds.includes(p.id)),
        archivedProjects: state.archivedProjects.filter(p => !validDeleteIds.includes(p.id)),
        currentProject: validDeleteIds.includes(state.currentProject?.id) ? null : state.currentProject,
        error: null
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
    default:
      return state;
  }
};

// FIXED: Deep clone utility for state backup
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (Array.isArray(obj)) return obj.map(deepClone);
  return Object.keys(obj).reduce((clone, key) => {
    clone[key] = deepClone(obj[key]);
    return clone;
  }, {});
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

  // FIXED: Enhanced validation before API calls
  const createProject = async (projectData) => {
    // Validate input before processing
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
    
    // Create state backup for potential rollback
    const stateBackup = deepClone(state);
    
    try {
      const preparedData = prepareProjectForAPI(projectData);
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
    }
  };

  const archiveProject = async (projectId) => {
    // FIXED: Validate project ID exists
    if (!projectId || !state.activeProjects.some(p => p.id === projectId)) {
      const errorMessage = 'Project not found or already archived';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }

    const stateBackup = deepClone(state);
    dispatch({ type: 'ARCHIVE_PROJECT', payload: { id: projectId } });
    
    try {
      const response = await projectsAPI.archive(projectId);
      
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
    }
  };

  const restoreProject = async (projectId) => {
    // FIXED: Validate project ID exists
    if (!projectId || !state.archivedProjects.some(p => p.id === projectId)) {
      const errorMessage = 'Project not found or not archived';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }

    const stateBackup = deepClone(state);
    dispatch({ type: 'RESTORE_PROJECT', payload: { id: projectId } });
    
    try {
      const response = await projectsAPI.restore(projectId);
      
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to restore project');
      }
      
      return true;
    } catch (error) {
      // FIXED: Complete state rollback
      dispatch({ type: 'SET_ACTIVE_PROJECTS', payload: stateBackup.activeProjects });
      dispatch({ type: 'SET_ARCHIVED_PROJECTS', payload: stateBackup.archivedProjects });
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to restore project';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const deleteProjectPermanent = async (projectId) => {
    // FIXED: Validate project ID exists
    const projectExists = state.activeProjects.some(p => p.id === projectId) || 
                         state.archivedProjects.some(p => p.id === projectId);
    
    if (!projectId || !projectExists) {
      const errorMessage = 'Project not found';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }

    const stateBackup = deepClone(state);
    dispatch({ type: 'DELETE_PROJECT_PERMANENT', payload: projectId });
    
    try {
      const response = await projectsAPI.deletePermanent(projectId);
      
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to permanently delete project');
      }
      
      return true;
    } catch (error) {
      // FIXED: Complete state rollback
      dispatch({ type: 'SET_ACTIVE_PROJECTS', payload: stateBackup.activeProjects });
      dispatch({ type: 'SET_ARCHIVED_PROJECTS', payload: stateBackup.archivedProjects });
      dispatch({ type: 'SET_CURRENT_PROJECT', payload: stateBackup.currentProject });
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to permanently delete project';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const bulkArchiveProjects = async (projectIds) => {
    // FIXED: Enhanced validation
    if (!Array.isArray(projectIds)) {
      const errorMessage = 'Project IDs must be an array';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }

    if (projectIds.length === 0) {
      const errorMessage = 'No projects selected for archiving';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }

    // Filter valid IDs
    const validIds = projectIds.filter(id => 
      id && state.activeProjects.some(p => p.id === id)
    );

    if (validIds.length === 0) {
      const errorMessage = 'No valid projects found to archive';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }

    const stateBackup = deepClone(state);
    dispatch({ type: 'BULK_ARCHIVE_PROJECTS', payload: validIds });
    
    try {
      const response = await projectsAPI.bulkArchive(validIds);
      
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to archive projects');
      }
      
      return {
        archivedCount: response.data.data.archivedCount,
        archivedProjects: response.data.data.archivedProjects,
        skippedCount: projectIds.length - validIds.length
      };
    } catch (error) {
      // FIXED: Complete state rollback
      dispatch({ type: 'SET_ACTIVE_PROJECTS', payload: stateBackup.activeProjects });
      dispatch({ type: 'SET_ARCHIVED_PROJECTS', payload: stateBackup.archivedProjects });
      dispatch({ type: 'SET_CURRENT_PROJECT', payload: stateBackup.currentProject });
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to archive projects';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const bulkDeletePermanent = async (projectIds) => {
    // FIXED: Enhanced validation
    if (!Array.isArray(projectIds)) {
      const errorMessage = 'Project IDs must be an array';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }

    if (projectIds.length === 0) {
      const errorMessage = 'No projects selected for deletion';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }

    // Filter valid IDs from both active and archived
    const validIds = projectIds.filter(id => 
      id && (state.activeProjects.some(p => p.id === id) || state.archivedProjects.some(p => p.id === id))
    );

    if (validIds.length === 0) {
      const errorMessage = 'No valid projects found to delete';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }

    const stateBackup = deepClone(state);
    dispatch({ type: 'BULK_DELETE_PERMANENT', payload: validIds });
    
    try {
      const response = await projectsAPI.bulkDeletePermanent(validIds);
      
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to permanently delete projects');
      }
      
      return {
        deletedCount: response.data.data.deletedCount,
        deletedProjects: response.data.data.deletedProjects,
        skippedCount: projectIds.length - validIds.length
      };
    } catch (error) {
      // FIXED: Complete state rollback
      dispatch({ type: 'SET_ACTIVE_PROJECTS', payload: stateBackup.activeProjects });
      dispatch({ type: 'SET_ARCHIVED_PROJECTS', payload: stateBackup.archivedProjects });
      dispatch({ type: 'SET_CURRENT_PROJECT', payload: stateBackup.currentProject });
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to permanently delete projects';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const updateProject = async (updatedProject) => {
    // FIXED: Validation and state backup
    if (!updatedProject || !updatedProject.id) {
      const errorMessage = 'Project ID is required for updates';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }

    // Validate the updated data
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

    const stateBackup = deepClone(state);
    
    try {
      const preparedData = prepareProjectForAPI(updatedProject);
      const response = await projectsAPI.update(updatedProject.id, preparedData);
      const updated = response.data?.data || response.data;
      
      dispatch({ type: 'UPDATE_PROJECT', payload: updated });
      return updated;
    } catch (error) {
      // FIXED: Complete state rollback
      dispatch({ type: 'SET_ACTIVE_PROJECTS', payload: stateBackup.activeProjects });
      dispatch({ type: 'SET_ARCHIVED_PROJECTS', payload: stateBackup.archivedProjects });
      dispatch({ type: 'SET_CURRENT_PROJECT', payload: stateBackup.currentProject });
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update project';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const setCurrentProject = (project) => {
    dispatch({ type: 'SET_CURRENT_PROJECT', payload: project });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
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