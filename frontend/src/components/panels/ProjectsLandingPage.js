// src/components/panels/ProjectsLandingPage.js
import React, { useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import { Building2, Plus } from 'lucide-react';

const ProjectsLandingPage = ({ onNavigateToProject, onCreateNewProject }) => {
  const { projects, loadingProjects, fetchProjects } = useProject();

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loadingProjects) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Your Projects</h1>
        <button
          onClick={onCreateNewProject}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} />
          <span>New Project</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center mt-12 text-gray-500">
          <p>No projects found.</p>
          <p className="text-sm mt-2">Click "New Project" to create your first project.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white shadow-sm rounded-lg border p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onNavigateToProject(project)}
            >
              <div className="flex items-center space-x-3 mb-2">
                <Building2 size={20} className="text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900 truncate">{project.projectName || project.name}</h2>
              </div>
              <p className="text-sm text-gray-500 mb-1">{project.structureType || 'Marine Infrastructure Project'}</p>
              {project.region && (
                <p className="text-xs text-gray-400">
                  {project.region}, {project.country}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsLandingPage;
