import React, { createContext, useContext, useReducer } from 'react';

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

  return (
    <ProjectContext.Provider value={{ state, dispatch }}>
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
