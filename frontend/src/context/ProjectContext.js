// frontend/src/context/ProjectContext.js - Updated with Archive System
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { projectsAPI } from '../services/api';

const ProjectContext = createContext();

const initialState = {
  activeProjects: [],
  archivedProjects: [],
  currentProject: null,
  currentView: 'active', // 'active' or 'archived'
  isLoading: false,
  error: null
};

const projectReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_ACTIVE_PROJECTS':
      return { ...state, activeProjects: action.payload, isLoading: false, error: null };
    case 'SET_ARCHIVED_PROJECTS':
      return { ...state, archivedProjects: action.payload, error: null };
    case 'SET_CURRENT_VIEW':
      return { ...state, currentView: action.payload };
    case 'ADD_PROJECT':
      return {
        ...state,
        activeProjects: [action.payload, ...state.activeProjects],
        currentProject: action.payload,
        isLoading: false,
        error: null
      };
    case 'SET_CURRENT_PROJECT':
      if (action.payload.lat == null || action.payload.lon == null) {
        console.warn('Project missing lat/lon:', action.payload);
      }
      return { ...state, currentProject: action.payload };
    case 'ARCHIVE_PROJECT':
      const projectToArchive = state.activeProjects.find(p => p.id === action.payload.id);
      if (!projectToArchive) return state;
      
      return {
        ...state,
        activeProjects: state.activeProjects.filter(p => p.id !== action.payload.id),
        archivedProjects: [{ ...projectToArchive, status: 'archived' }, ...state.archivedProjects],
        currentProject: state.currentProject?.id === action.payload.id ? null : state.currentProject,
        error: null
      };
    case 'RESTORE_PROJECT':
      const projectToRestore = state.archivedProjects.find(p => p.id === action.payload.id);
      if (!projectToRestore) return state;
      
      return {
        ...state,
        archivedProjects: state.archivedProjects.filter(p => p.id !== action.payload.id),
        activeProjects: [{ ...projectToRestore, status: 'active' }, ...state.activeProjects],
        error: null
      };
    case 'BULK_ARCHIVE_PROJECTS':
      const projectsToArchive = state.activeProjects.filter(p => action.payload.includes(p.id));
      const remainingActive = state.activeProjects.filter(p => !action.payload.includes(p.id));
      const newlyArchived = projectsToArchive.map(p => ({ ...p, status: 'archived' }));
      
      return {
        ...state,
        activeProjects: remainingActive,
        archivedProjects: [...newlyArchived, ...state.archivedProjects],
        currentProject: action.payload.includes(state.currentProject?.id) ? null : state.currentProject,
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
      return {
        ...state,
        activeProjects: state.activeProjects.filter(p => !action.payload.includes(p.id)),
        archivedProjects: state.archivedProjects.filter(p => !action.payload.includes(p.id)),
        currentProject: action.payload.includes(state.currentProject?.id) ? null : state.currentProject,
        error: null
      };
    case 'UPDATE_PROJECT':
      const isInActive = state.activeProjects.some(p => p.id === action.payload.id);
      const isInArchived = state.archivedProjects.some(p => p.id === action.payload.id);
      
      return {
        ...state,
        activeProjects: isInActive ? state.activeProjects.map(p => 
          p.id === action.payload.id ? action.payload : p
        ) : state.activeProjects,
        archivedProjects: isInArchived ? state.archivedProjects.map(p => 
          p.id === action.payload.id ? action.payload : p
        ) : state.archivedProjects,
        currentProject: state.currentProject?.id === action.payload.id ? action.payload : state.currentProject,
        error: null
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

export const ProjectProvider = ({ children }) => {
  const [state, dispatch] = useReducer(projectReducer, initialState);

  // Load projects from backend on mount
  useEffect(() => {
    const loadProjects = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        // Load both active and archived projects
        const [activeResponse, archivedResponse] = await Promise.all([
          projectsAPI.getByStatus('active'),
          projectsAPI.getByStatus('archived')
        ]);
        
        const activeProjects = activeResponse.data?.data || [];
        const archivedProjects = archivedResponse.data?.data || [];
        
        // Ensure lat/lon defaults if missing
        const processProjects = (projects) => projects.map(p => ({
          lat: 0,
          lon: 0,
          length: 0,
          width: 0,
          height: 0,
          ...p
        }));
        
        dispatch({ type: 'SET_ACTIVE_PROJECTS', payload: processProjects(activeProjects) });
        dispatch({ type: 'SET_ARCHIVED_PROJECTS', payload: processProjects(archivedProjects) });
      } catch (error) {
        console.error('Failed to load projects:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to load projects' });
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

  const createProject = async (projectData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const payload = { lat: 0, lon: 0, length: 0, width: 0, height: 0, ...projectData };
      const response = await projectsAPI.create(payload);

      const newProject = response.data?.data || response.data;
      const projectWithDefaults = { lat: 0, lon: 0, length: 0, width: 0, height: 0, ...newProject };
      
      dispatch({ type: 'ADD_PROJECT', payload: projectWithDefaults });
      return projectWithDefaults;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create project';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const archiveProject = async (projectId) => {
    const originalActiveProjects = state.activeProjects;
    dispatch({ type: 'ARCHIVE_PROJECT', payload: { id: projectId } });
    
    try {
      const response = await projectsAPI.archive(projectId);
      
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to archive project');
      }
      
      return true;
    } catch (error) {
      // Revert optimistic update on error
      dispatch({ type: 'SET_ACTIVE_PROJECTS', payload: originalActiveProjects });
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to archive project';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const restoreProject = async (projectId) => {
    const originalArchivedProjects = state.archivedProjects;
    dispatch({ type: 'RESTORE_PROJECT', payload: { id: projectId } });
    
    try {
      const response = await projectsAPI.restore(projectId);
      
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to restore project');
      }
      
      return true;
    } catch (error) {
      // Revert optimistic update on error
      dispatch({ type: 'SET_ARCHIVED_PROJECTS', payload: originalArchivedProjects });
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to restore project';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const deleteProjectPermanent = async (projectId) => {
    const originalActiveProjects = state.activeProjects;
    const originalArchivedProjects = state.archivedProjects;
    dispatch({ type: 'DELETE_PROJECT_PERMANENT', payload: projectId });
    
    try {
      const response = await projectsAPI.deletePermanent(projectId);
      
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to permanently delete project');
      }
      
      return true;
    } catch (error) {
      // Revert optimistic update on error
      dispatch({ type: 'SET_ACTIVE_PROJECTS', payload: originalActiveProjects });
      dispatch({ type: 'SET_ARCHIVED_PROJECTS', payload: originalArchivedProjects });
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to permanently delete project';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const bulkArchiveProjects = async (projectIds) => {
    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      throw new Error('Project IDs must be a non-empty array');
    }

    const originalActiveProjects = state.activeProjects;
    dispatch({ type: 'BULK_ARCHIVE_PROJECTS', payload: projectIds });
    
    try {
      const response = await projectsAPI.bulkArchive(projectIds);
      
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to archive projects');
      }
      
      return {
        archivedCount: response.data.data.archivedCount,
        archivedProjects: response.data.data.archivedProjects
      };
    } catch (error) {
      // Revert optimistic update on error
      dispatch({ type: 'SET_ACTIVE_PROJECTS', payload: originalActiveProjects });
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to archive projects';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const bulkDeletePermanent = async (projectIds) => {
    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      throw new Error('Project IDs must be a non-empty array');
    }

    const originalActiveProjects = state.activeProjects;
    const originalArchivedProjects = state.archivedProjects;
    dispatch({ type: 'BULK_DELETE_PERMANENT', payload: projectIds });
    
    try {
      const response = await projectsAPI.bulkDeletePermanent(projectIds);
      
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to permanently delete projects');
      }
      
      return {
        deletedCount: response.data.data.deletedCount,
        deletedProjects: response.data.data.deletedProjects
      };
    } catch (error) {
      // Revert optimistic update on error
      dispatch({ type: 'SET_ACTIVE_PROJECTS', payload: originalActiveProjects });
      dispatch({ type: 'SET_ARCHIVED_PROJECTS', payload: originalArchivedProjects });
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to permanently delete projects';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const updateProject = async (updatedProject) => {
    try {
      const response = await projectsAPI.update(updatedProject.id, updatedProject);
      const updated = response.data?.data || response.data;
      
      dispatch({ type: 'UPDATE_PROJECT', payload: updated });
      return updated;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update project';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const setCurrentProject = (project) => {
    const projectWithDefaults = { lat: 0, lon: 0, length: 0, width: 0, height: 0, ...project };
    dispatch({ type: 'SET_CURRENT_PROJECT', payload: projectWithDefaults });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Legacy compatibility - map old methods to new archive methods
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