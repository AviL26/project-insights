import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { projectsAPI } from '../services/api';

const ProjectContext = createContext();

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
      return { ...state, currentProject: action.payload };
    default:
      return state;
  }
};

export const ProjectProvider = ({ children }) => {
  const [state, dispatch] = useReducer(projectReducer, initialState);

  // Load projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const response = await projectsAPI.getAll();
        dispatch({ type: 'SET_PROJECTS', payload: response.data });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    };

    loadProjects();
  }, []);

  const createProject = async (projectData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await projectsAPI.create(projectData);
      
      // Fetch the created project details
      const newProject = await projectsAPI.getById(response.data.id);
      dispatch({ type: 'ADD_PROJECT', payload: newProject.data });
      
      return newProject.data;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  return (
    <ProjectContext.Provider value={{ 
      state, 
      dispatch, 
      createProject 
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
