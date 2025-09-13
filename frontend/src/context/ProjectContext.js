// context/ProjectContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { projectsAPI } from '../services/api';

const ProjectContext = createContext();

/**
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} name
 * @property {number} lat
 * @property {number} lon
 * @property {number} length
 * @property {number} width
 * @property {number} height
 * @property {Date} createdAt
 * @property {Date|null} deletedAt
 */

/** @type {{projects: Project[], currentProject: Project|null, isLoading: boolean, error: string|null}} */
const initialState = {
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null
};

const projectReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload, isLoading: false, error: null };
    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [action.payload, ...state.projects],
        currentProject: action.payload,
        isLoading: false,
        error: null
      };
    case 'SET_CURRENT_PROJECT':
      if (!action.payload.lat && !action.payload.lon) {
        console.warn('Project missing lat/lon:', action.payload);
      }
      return { ...state, currentProject: action.payload };
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload),
        // Clear currentProject if it's the one being deleted
        currentProject: state.currentProject?.id === action.payload ? null : state.currentProject,
        error: null
      };
    case 'BULK_DELETE_PROJECTS':
      return {
        ...state,
        projects: state.projects.filter(project => !action.payload.includes(project.id)),
        // Clear currentProject if it's one of the deleted ones
        currentProject: action.payload.includes(state.currentProject?.id) ? null : state.currentProject,
        error: null
      };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.id ? action.payload : project
        ),
        // Update currentProject if it's the one being updated
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
        const response = await projectsAPI.getAll();
        
        // Handle different response formats - backend now returns {data: projects}
        const projects = response.data?.data || response.data || [];
        
        // Ensure lat/lon defaults if missing
        const projectsWithCoords = projects.map(p => ({
          lat: 0,
          lon: 0,
          length: 0,
          width: 0,
          height: 0,
          ...p
        }));
        
        dispatch({ type: 'SET_PROJECTS', payload: projectsWithCoords });
      } catch (error) {
        console.error('Failed to load projects:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to load projects' });
      }
    };

    loadProjects();
  }, []);

  /** @param {Partial<Project>} projectData */
  const createProject = async (projectData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Ensure defaults for coordinates
      const payload = { lat: 0, lon: 0, length: 0, width: 0, height: 0, ...projectData };
      const response = await projectsAPI.create(payload);

      // Handle different response formats
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

  /** @param {string} projectId */
  const deleteProject = async (projectId) => {
    // Optimistic update - remove from UI immediately
    const originalProjects = state.projects;
    dispatch({ type: 'DELETE_PROJECT', payload: projectId });
    
    try {
      // Call backend API
      const response = await projectsAPI.delete(projectId);
      
      // Check if deletion was successful
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to delete project');
      }
      
      console.log('Project deleted successfully:', response.data.message);
      return true;
    } catch (error) {
      // Revert optimistic update on error
      dispatch({ type: 'SET_PROJECTS', payload: originalProjects });
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete project';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  /** @param {number[]} projectIds */
  const bulkDeleteProjects = async (projectIds) => {
    // Validation
    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      throw new Error('Project IDs must be a non-empty array');
    }

    // Optimistic update - remove from UI immediately
    const originalProjects = state.projects;
    dispatch({ type: 'BULK_DELETE_PROJECTS', payload: projectIds });
    
    try {
      // Call backend API
      const response = await projectsAPI.bulkDelete(projectIds);
      
      // Check if deletion was successful
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to delete projects');
      }
      
      console.log('Projects bulk deleted successfully:', response.data.message);
      return {
        deletedCount: response.data.data.deletedCount,
        deletedProjects: response.data.data.deletedProjects
      };
    } catch (error) {
      // Revert optimistic update on error
      dispatch({ type: 'SET_PROJECTS', payload: originalProjects });
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete projects';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  /** @param {Partial<Project>} updatedProject */
  const updateProject = async (updatedProject) => {
    try {
      // Update in backend API
      const response = await projectsAPI.update(updatedProject.id, updatedProject);
      
      // Handle different response formats
      const updated = response.data?.data || response.data;
      
      dispatch({ type: 'UPDATE_PROJECT', payload: updated });
      
      return updated;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update project';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  /** @param {Project} project */
  const setCurrentProject = (project) => {
    // Enforce defaults on current project
    const projectWithDefaults = { lat: 0, lon: 0, length: 0, width: 0, height: 0, ...project };
    dispatch({ type: 'SET_CURRENT_PROJECT', payload: projectWithDefaults });
  };

  /** Clear any error state */
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <ProjectContext.Provider value={{ 
      state, 
      dispatch, 
      createProject, 
      deleteProject, 
      bulkDeleteProjects,
      updateProject, 
      setCurrentProject,
      clearError
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