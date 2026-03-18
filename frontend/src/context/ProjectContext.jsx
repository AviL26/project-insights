import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { projectsApi } from '../services/api';

const ProjectContext = createContext(null);

const initialState = {
  projects: [],
  loading: true,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: true, error: null };
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload, loading: false };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'ADD_PROJECT':
      return { ...state, projects: [action.payload, ...state.projects] };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p => p.id === action.payload.id ? action.payload : p),
      };
    case 'REMOVE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.payload),
      };
    default:
      return state;
  }
}

export function ProjectProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadProjects = useCallback(async () => {
    dispatch({ type: 'SET_LOADING' });
    try {
      const data = await projectsApi.list({ status: 'all' });
      dispatch({ type: 'SET_PROJECTS', payload: data.projects });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const createProject = useCallback(async (data) => {
    const project = await projectsApi.create(data);
    dispatch({ type: 'ADD_PROJECT', payload: project });
    return project;
  }, []);

  const archiveProject = useCallback(async (id) => {
    await projectsApi.archive(id);
    dispatch({ type: 'UPDATE_PROJECT', payload: { ...state.projects.find(p => p.id === id), status: 'archived' } });
  }, [state.projects]);

  const restoreProject = useCallback(async (id) => {
    await projectsApi.restore(id);
    dispatch({ type: 'UPDATE_PROJECT', payload: { ...state.projects.find(p => p.id === id), status: 'active' } });
  }, [state.projects]);

  const deleteProject = useCallback(async (id) => {
    await projectsApi.remove(id);
    dispatch({ type: 'REMOVE_PROJECT', payload: id });
  }, []);

  return (
    <ProjectContext.Provider value={{
      ...state,
      loadProjects,
      createProject,
      archiveProject,
      restoreProject,
      deleteProject,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProjects must be used within ProjectProvider');
  return ctx;
}
