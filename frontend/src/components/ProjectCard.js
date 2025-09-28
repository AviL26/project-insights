// frontend/src/components/ProjectCard.js - ENHANCED WITH WIZARD INTEGRATION & TYPE SAFETY
import React, { memo, useCallback, useMemo } from 'react';
import { 
  MapPin, Calendar, Waves, Leaf, ArrowRight, Archive,
  ArchiveRestore, Trash2, Target, Fish, Anchor
} from 'lucide-react';

// PERFORMANCE: Memoized ProjectCard to prevent unnecessary re-renders
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

  // PERFORMANCE: Memoized card click handler
  const handleCardClick = useCallback(() => {
    if (selectionMode) {
      onToggleSelection(project.id, { stopPropagation: () => {} });
    } else {
      onSelectProject(project);
    }
  }, [selectionMode, onToggleSelection, onSelectProject, project]);

  // PERFORMANCE: Memoized checkbox change handler
  const handleCheckboxChange = useCallback((e) => {
    onToggleSelection(project.id, e);
  }, [onToggleSelection, project.id]);

  // PERFORMANCE: Memoized action handlers to prevent recreation on every render
  const handleArchive = useCallback((e) => {
    onArchive(project, e);
  }, [onArchive, project]);

  const handleRestore = useCallback((e) => {
    onRestore(project, e);
  }, [onRestore, project]);

  const handleDelete = useCallback((e) => {
    onDeletePermanent(project, e);
  }, [onDeletePermanent, project]);

  const handleProjectView = useCallback((e) => {
    e.stopPropagation();
    onSelectProject(project);
  }, [onSelectProject, project]);

  // ENHANCED: Memoized computed values including wizard data with type safety
  const computedValues = useMemo(() => {
    const hasWizardData = !!(project.primary_goals || project.target_species || project.habitat_types);
    const hasCoordinates = project.latitude && project.longitude;
    
    // Type-safe array splitting
    const targetSpecies = project.target_species && typeof project.target_species === 'string' 
      ? project.target_species.split(',').filter(Boolean) 
      : [];
    const habitatTypes = project.habitat_types && typeof project.habitat_types === 'string' 
      ? project.habitat_types.split(',').filter(Boolean) 
      : [];
    
    // Safe date handling
    const dateValue = project.lastModified || project.updated_at || new Date();
    
    return {
      projectName: project.name || `Project ${project.id}`,
      projectType: project.type || 'Marine Infrastructure',
      projectLocation: project.location || 'Location not specified',
      formattedDate: formatDate(dateValue),
      progressPercentage: Math.max(0, Math.min(100, project.progress || 0)),
      hasWizardData,
      hasCoordinates,
      // Safe coordinate parsing with fallbacks
      coordinates: hasCoordinates ? {
        lat: (parseFloat(project.latitude) || 0).toFixed(3),
        lng: (parseFloat(project.longitude) || 0).toFixed(3)
      } : null,
      primaryGoal: project.primary_goals,
      targetSpecies,
      habitatTypes,
      isWizardProject: hasWizardData || hasCoordinates
    };
  }, [project, formatDate]);

  // PERFORMANCE: Memoized CSS classes
  const cardClasses = useMemo(() => {
    let classes = "bg-white rounded-lg shadow-sm border hover:shadow-md transition-all cursor-pointer group relative";
    
    if (isSelected) {
      classes += " ring-2 ring-blue-500 bg-blue-50";
    }
    
    if (selectionMode) {
      classes += " hover:ring-2 hover:ring-blue-300";
    }
    
    return classes;
  }, [isSelected, selectionMode]);

  // PERFORMANCE: Memoized action buttons to prevent recreation
  const actionButtons = useMemo(() => {
    if (selectionMode) return null;

    if (isArchivedView) {
      return (
        <div className="flex items-center space-x-4">
          <button
            onClick={handleRestore}
            disabled={isDeleting}
            className="flex items-center space-x-1 text-sm text-green-600 hover:text-green-700 disabled:opacity-50"
          >
            <ArchiveRestore size={14} />
            <span>Restore</span>
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-4">
        <button
          onClick={handleProjectView}
          className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
        >
          <Waves size={14} />
          <span>Ocean Data</span>
        </button>
        
        <button
          onClick={handleProjectView}
          className="flex items-center space-x-1 text-sm text-green-600 hover:text-green-700"
        >
          <Leaf size={14} />
          <span>Ecological</span>
        </button>
      </div>
    );
  }, [selectionMode, isArchivedView, handleRestore, handleProjectView, isDeleting]);

  // PERFORMANCE: Memoized right-side actions
  const rightActions = useMemo(() => (
    <div className="flex items-center space-x-2">
      {isArchivedView ? (
        <button
          onClick={handleDelete}
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
          onClick={handleArchive}
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
  ), [isArchivedView, handleDelete, handleArchive, isDeleting]);

  return (
    <div className={cardClasses} onClick={handleCardClick}>
      {/* Selection Checkbox */}
      {selectionMode && (
        <div className="absolute top-4 left-4 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
          />
        </div>
      )}

      {/* Status Badges */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
        {/* Wizard Project Badge */}
        {computedValues.isWizardProject && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <Anchor size={12} className="mr-1" />
            Wizard
          </span>
        )}
        
        {/* Archive Status Badge */}
        {isArchivedView && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
            <Archive size={12} className="mr-1" />
            Archived
          </span>
        )}
      </div>

      {/* Project Header */}
      <div className={`p-6 ${selectionMode ? 'pl-12' : ''}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {computedValues.projectName}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{computedValues.projectType}</p>
          </div>
        </div>

        {/* Project Details */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPin size={14} />
            <span>{computedValues.projectLocation}</span>
          </div>
          
          {/* Coordinates Display */}
          {computedValues.hasCoordinates && (
            <div className="flex items-center space-x-2 text-sm text-blue-600">
              <Target size={14} />
              <span>{computedValues.coordinates.lat}°, {computedValues.coordinates.lng}°</span>
            </div>
          )}
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar size={14} />
            <span>Modified {computedValues.formattedDate}</span>
          </div>
        </div>

        {/* Wizard Data Display */}
        {computedValues.hasWizardData && (
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-100">
            <div className="text-xs font-medium text-blue-700 mb-2 flex items-center">
              <Anchor size={12} className="mr-1" />
              Wizard Configuration
            </div>
            
            {/* Primary Goal - Type-safe string handling */}
            {computedValues.primaryGoal && (
              <div className="mb-2">
                <div className="flex items-center text-xs text-blue-600 mb-1">
                  <Target size={10} className="mr-1" />
                  <span className="font-medium">Goal:</span>
                </div>
                <div className="text-xs text-blue-700 pl-3">
                  {typeof computedValues.primaryGoal === 'string' 
                    ? computedValues.primaryGoal.charAt(0).toUpperCase() + computedValues.primaryGoal.slice(1)
                    : computedValues.primaryGoal
                  }
                </div>
              </div>
            )}
            
            {/* Target Species */}
            {computedValues.targetSpecies.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center text-xs text-green-600 mb-1">
                  <Fish size={10} className="mr-1" />
                  <span className="font-medium">Target Species:</span>
                </div>
                <div className="text-xs text-green-700 pl-3">
                  {computedValues.targetSpecies.slice(0, 2).join(', ')}
                  {computedValues.targetSpecies.length > 2 && (
                    <span className="text-green-500"> +{computedValues.targetSpecies.length - 2} more</span>
                  )}
                </div>
              </div>
            )}
            
            {/* Habitat Types */}
            {computedValues.habitatTypes.length > 0 && (
              <div>
                <div className="flex items-center text-xs text-emerald-600 mb-1">
                  <Leaf size={10} className="mr-1" />
                  <span className="font-medium">Habitat Focus:</span>
                </div>
                <div className="text-xs text-emerald-700 pl-3">
                  {computedValues.habitatTypes.slice(0, 2).join(', ')}
                  {computedValues.habitatTypes.length > 2 && (
                    <span className="text-emerald-500"> +{computedValues.habitatTypes.length - 2} more</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progress Bar - only for active projects */}
        {!isArchivedView && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Progress</span>
              <span className="text-gray-900 font-medium">{computedValues.progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${computedValues.progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        {!selectionMode && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            {actionButtons}
            {rightActions}
          </div>
        )}
      </div>
    </div>
  );
});

ProjectCard.displayName = 'ProjectCard';

export default ProjectCard;