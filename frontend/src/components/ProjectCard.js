// frontend/src/components/ProjectCard.js
import React, { memo } from 'react';
import { 
  MapPin, Calendar, Waves, Leaf, ArrowRight, Archive,
  ArchiveRestore, Trash2
} from 'lucide-react';

const ProjectCard = memo(({
  project,
  isArchivedView,
  selectionMode,
  selectedProjects,
  deletingProjectId,
  onSelectProject,
  onToggleSelection,
  onArchive,
  onRestore,
  onDeletePermanent,
  formatDate
}) => {
  const isSelected = selectedProjects.has(project.id);
  const isDeleting = deletingProjectId === project.id;

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-all cursor-pointer group relative ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      } ${selectionMode ? 'hover:ring-2 hover:ring-blue-300' : ''}`}
      onClick={() => selectionMode ? onToggleSelection(project.id, { stopPropagation: () => {} }) : onSelectProject(project)}
    >
      {/* Selection Checkbox */}
      {selectionMode && (
        <div className="absolute top-4 left-4 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onToggleSelection(project.id, e)}
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
          />
        </div>
      )}

      {/* Archive Status Badge */}
      {isArchivedView && (
        <div className="absolute top-4 right-4 z-10">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
            <Archive size={12} className="mr-1" />
            Archived
          </span>
        </div>
      )}

      {/* Project Header */}
      <div className={`p-6 ${selectionMode ? 'pl-12' : ''}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {project.name || `Project ${project.id}`}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{project.type}</p>
          </div>
        </div>

        {/* Project Details */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPin size={14} />
            <span>{project.location}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar size={14} />
            <span>Modified {formatDate(project.lastModified)}</span>
          </div>
        </div>

        {/* Progress Bar - only for active projects */}
        {!isArchivedView && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Progress</span>
              <span className="text-gray-900 font-medium">{project.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        {!selectionMode && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            {isArchivedView ? (
              // Archived project actions
              <div className="flex items-center space-x-4">
                <button
                  onClick={(e) => onRestore(project, e)}
                  disabled={isDeleting}
                  className="flex items-center space-x-1 text-sm text-green-600 hover:text-green-700 disabled:opacity-50"
                >
                  <ArchiveRestore size={14} />
                  <span>Restore</span>
                </button>
              </div>
            ) : (
              // Active project actions
              <div className="flex items-center space-x-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectProject(project);
                  }}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Waves size={14} />
                  <span>Ocean Data</span>
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectProject(project);
                  }}
                  className="flex items-center space-x-1 text-sm text-green-600 hover:text-green-700"
                >
                  <Leaf size={14} />
                  <span>Ecological</span>
                </button>
              </div>
            )}

            <div className="flex items-center space-x-2">
              {isArchivedView ? (
                <button
                  onClick={(e) => onDeletePermanent(project, e)}
                  disabled={isDeleting}
                  className={`p-1 transition-colors ${
                    isDeleting 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-gray-400 hover:text-red-500'
                  }`}
                  title="Delete permanently"
                >
                  {isDeleting ? (
                    <div className="w-3.5 h-3.5 border border-gray-300 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              ) : (
                <button
                  onClick={(e) => onArchive(project, e)}
                  disabled={isDeleting}
                  className={`p-1 transition-colors ${
                    isDeleting 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-gray-400 hover:text-orange-500'
                  }`}
                  title="Archive project"
                >
                  {isDeleting ? (
                    <div className="w-3.5 h-3.5 border border-gray-300 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Archive size={14} />
                  )}
                </button>
              )}
              
              <ArrowRight size={16} className={`transition-colors ${
                isArchivedView ? 'text-gray-300' : 'text-gray-400 group-hover:text-blue-600'
              }`} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

ProjectCard.displayName = 'ProjectCard';

export default ProjectCard;