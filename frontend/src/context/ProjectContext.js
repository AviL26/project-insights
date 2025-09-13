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
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload, isLoading: false };
    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [...state.projects, action.payload],
        currentProject: action.payload,
        isLoading: false
      };
    case 'SET_CURRENT_PROJECT':
      if (!action.payload.lat || !action.payload.lon) {
        console.warn('Project missing lat/lon:', action.payload);
      }
      return { ...state, currentProject: action.payload };
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload),
        // Clear currentProject if it's the one being deleted
        currentProject: state.currentProject?.id === action.payload ? null : state.currentProject
      };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.id ? action.payload : project
        ),
        // Update currentProject if it's the one being updated
        currentProject: state.currentProject?.id === action.payload.id ? action.payload : state.currentProject
      };
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
        // Ensure lat/lon defaults if missing
        const projectsWithCoords = response.data.map(p => ({
          lat: 0,
          lon: 0,
          length: 0,
          width: 0,
          height: 0,
          ...p
        }));
        dispatch({ type: 'SET_PROJECTS', payload: projectsWithCoords });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
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

      const newProject = await projectsAPI.getById(response.data.id);
      const projectWithDefaults = { lat: 0, lon: 0, length: 0, width: 0, height: 0, ...newProject.data };
      dispatch({ type: 'ADD_PROJECT', payload: projectWithDefaults });

      return projectWithDefaults;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  /** @param {string} projectId */
  const deleteProject = async (projectId) => {
    try {
      // Delete from backend API
      await projectsAPI.delete(projectId);
      
      // Update local state
      dispatch({ type: 'DELETE_PROJECT', payload: projectId });
      
      return true;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  /** @param {Partial<Project>} updatedProject */
  const updateProject = async (updatedProject) => {
    try {
      // Update in backend API
      const response = await projectsAPI.update(updatedProject.id, updatedProject);
      
      // Update local state
      dispatch({ type: 'UPDATE_PROJECT', payload: response.data });
      
      return response.data;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const setCurrentProject = (project) => {
    // Enforce defaults on current project
    const projectWithDefaults = { lat: 0, lon: 0, length: 0, width: 0, height: 0, ...project };
    dispatch({ type: 'SET_CURRENT_PROJECT', payload: projectWithDefaults });
  };

  return (
    <ProjectContext.Provider value={{ 
      state, 
      dispatch, 
      createProject, 
      deleteProject, 
      updateProject, 
      setCurrentProject 
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