// frontend/src/components/ComplianceDashboard/ProjectSelector.js
import React from 'react';
import { Building, MapPin, Ruler } from 'lucide-react';

const ProjectSelector = ({ projects, selectedProject, onSelectProject, isLoading }) => {
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-6">
        <Building size={32} className="mx-auto text-gray-300 mb-2" />
        <p className="text-gray-500 text-sm">No projects available for analysis</p>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Project for Analysis
      </label>
      
      <select
        value={selectedProject?.id || ''}
        onChange={(e) => {
          const project = projects.find(p => p.id === parseInt(e.target.value));
          onSelectProject(project);
        }}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
      >
        <option value="">Choose a project...</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name} - {project.structure_type} ({project.country})
          </option>
        ))}
      </select>
      
      {selectedProject && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <MapPin size={16} className="text-gray-400" />
              <span className="text-gray-600">
                {selectedProject.lat?.toFixed(4)}°, {selectedProject.lon?.toFixed(4)}°
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Building size={16} className="text-gray-400" />
              <span className="text-gray-600 capitalize">
                {selectedProject.structure_type}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Ruler size={16} className="text-gray-400" />
              <span className="text-gray-600">
                {selectedProject.length}×{selectedProject.width}×{selectedProject.height}m
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSelector;