// src/components/ProjectsLandingPage.js - Corrected Version
import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { useToast, ToastContainer } from './Toast';
import useDebounce from '../hooks/useDebounce';
import ProjectCard from './ProjectCard';
import { formatProjectLocation } from '../utils/projectUtils';
import { 
  Plus, Search, Filter, Building2, Clock, TrendingUp, 
  Archive, X
} from 'lucide-react';

const ProjectsLandingPage = ({ onNavigateToProject, onCreateNewProject }) => {
  const { 
    state, 
    getCurrentProjects, 
    setCurrentView, 
    archiveProject, 
    restoreProject,
    deleteProjectPermanent, 
    bulkArchiveProjects, 
    bulkDeletePermanent,
    clearError  // Added clearError here
  } = useProject();
  
  // Toast notifications
  const { toasts, success, error, warning } = useToast();
  
  // Search and filter state
  const [searchInput, setSearchInput] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  
  // Multi-select state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Debounced search (300ms delay)
  const debouncedSearchTerm = useDebounce(searchInput, 300);

  const currentProjects = getCurrentProjects();
  const isArchivedView = state.currentView === 'archived';

  // Enhanced project data with additional metadata
  const enhancedProjects = currentProjects.map(project => ({
    ...project,
    lastModified: new Date(project.updated_at || Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    progress: Math.floor(Math.random() * 100),
    type: project.structure_type || project.type || 'Marine Infrastructure',
    location: formatProjectLocation(project)
  }));

  // Filter and sort projects using debounced search
  const filteredProjects = enhancedProjects
    .filter(project => {
      const matchesSearch = (project.name || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           (project.description || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || project.type?.toLowerCase().includes(filterType.toLowerCase());
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'recent':
          return new Date(b.lastModified) - new Date(a.lastModified);
        case 'progress':
          return b.progress - a.progress;
        default:
          return 0;
      }
    });

  // Selection handlers
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedProjects(new Set());
  };

  const toggleProjectSelection = (projectId, e) => {
    e.stopPropagation();
    const newSelected = new Set(selectedProjects);
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId);
    } else {
      newSelected.add(projectId);
    }
    setSelectedProjects(newSelected);
  };

  const selectAllProjects = () => {
    if (selectedProjects.size === filteredProjects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(filteredProjects.map(p => p.id)));
    }
  };

  const handleSelectProject = (project) => {
    if (selectionMode) return;
    onNavigateToProject?.(project);
  };

  // Project action handlers with toast notifications
  const handleArchiveProject = async (project, e) => {
    e.stopPropagation();
    
    const projectName = project.name || 'this project';
    if (window.confirm(`Archive "${projectName}"?\n\nThe project will be moved to the Archive folder and can be restored later.`)) {
      setDeletingProjectId(project.id);
      
      try {
        await archiveProject(project.id);
        success(`Project "${projectName}" archived successfully`);
      } catch (err) {
        console.error('Error archiving project:', err);
        error('Failed to archive project. Please try again.');
      } finally {
        setDeletingProjectId(null);
      }
    }
  };

  const handleRestoreProject = async (project, e) => {
    e.stopPropagation();
    
    const projectName = project.name || 'this project';
    if (window.confirm(`Restore "${projectName}" from archive?\n\nThe project will be moved back to active projects.`)) {
      setDeletingProjectId(project.id);
      
      try {
        await restoreProject(project.id);
        success(`Project "${projectName}" restored successfully`);
      } catch (err) {
        console.error('Error restoring project:', err);
        error('Failed to restore project. Please try again.');
      } finally {
        setDeletingProjectId(null);
      }
    }
  };

  const handleDeletePermanent = async (project, e) => {
    e.stopPropagation();
    
    const projectName = project.name || 'this project';
    const confirmMessage = `⚠️ PERMANENTLY DELETE "${projectName}"?\n\nThis will PERMANENTLY remove:\n• All project data and settings\n• Materials analysis data\n• Ecological monitoring data\n• Compliance records\n\n❌ THIS CANNOT BE UNDONE!\n\nType "DELETE" to confirm:`;
    
    const userInput = prompt(confirmMessage);
    if (userInput === 'DELETE') {
      setDeletingProjectId(project.id);
      
      try {
        await deleteProjectPermanent(project.id);
        warning(`Project "${projectName}" permanently deleted`, 6000);
      } catch (err) {
        console.error('Error permanently deleting project:', err);
        error('Failed to permanently delete project. Please try again.');
      } finally {
        setDeletingProjectId(null);
      }
    }
  };

  const handleBulkArchive = async () => {
    if (selectedProjects.size === 0) return;

    const selectedProjectsArray = Array.from(selectedProjects);
    const selectedProjectNames = filteredProjects
      .filter(p => selectedProjects.has(p.id))
      .map(p => p.name || `Project ${p.id}`)
      .join('", "');

    if (window.confirm(`Archive ${selectedProjects.size} project${selectedProjects.size === 1 ? '' : 's'}?\n\nProjects: "${selectedProjectNames}"\n\nThese projects will be moved to Archive and can be restored later.`)) {
      setBulkActionLoading(true);
      
      try {
        const result = await bulkArchiveProjects(selectedProjectsArray);
        success(`Successfully archived ${result.archivedCount} projects`);
        setSelectedProjects(new Set());
        setSelectionMode(false);
      } catch (err) {
        console.error('Error in bulk archive:', err);
        error('Failed to archive projects. Please try again.');
      } finally {
        setBulkActionLoading(false);
      }
    }
  };

  const handleBulkDeletePermanent = async () => {
    if (selectedProjects.size === 0) return;

    const selectedProjectsArray = Array.from(selectedProjects);
    const selectedProjectNames = filteredProjects
      .filter(p => selectedProjects.has(p.id))
      .map(p => p.name || `Project ${p.id}`)
      .join('", "');

    const confirmMessage = `⚠️ PERMANENTLY DELETE ${selectedProjects.size} project${selectedProjects.size === 1 ? '' : 's'}?\n\nProjects: "${selectedProjectNames}"\n\n❌ THIS CANNOT BE UNDONE!\n\nType "DELETE" to confirm:`;
    
    const userInput = prompt(confirmMessage);
    if (userInput === 'DELETE') {
      setBulkActionLoading(true);
      
      try {
        const result = await bulkDeletePermanent(selectedProjectsArray);
        warning(`Permanently deleted ${result.deletedCount} projects`, 6000);
        setSelectedProjects(new Set());
        setSelectionMode(false);
      } catch (err) {
        console.error('Error in bulk permanent delete:', err);
        error('Failed to permanently delete projects. Please try again.');
      } finally {
        setBulkActionLoading(false);
      }
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Empty state messages
  const noResultsMessage = debouncedSearchTerm || filterType !== 'all' ? 'No projects found' : 
                           isArchivedView ? 'No archived projects' : 'No active projects yet';
  
  const noResultsSubMessage = debouncedSearchTerm || filterType !== 'all' 
    ? 'Try adjusting your search or filter criteria'
    : isArchivedView 
      ? 'Archived projects will appear here when you archive active projects'
      : 'Create your first project to get started';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Project Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Manage and monitor your marine infrastructure projects
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={onCreateNewProject}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus size={20} />
                <span>New Project</span>
              </button>
            </div>
          </div>
          
          {/* View Tabs */}
          <div className="mt-6 flex items-center space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setCurrentView('active')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                !isArchivedView 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Active Projects ({state.activeProjects.length})
            </button>
            <button
              onClick={() => setCurrentView('archived')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isArchivedView 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Archived Projects ({state.archivedProjects.length})
            </button>
          </div>

          {/* Stats - only show for active view */}
          {!isArchivedView && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Active Projects', value: state.activeProjects.length, icon: Building2, color: 'blue' },
                { label: 'In Progress', value: Math.floor(state.activeProjects.length * 0.7), icon: TrendingUp, color: 'green' },
                { label: 'Planning', value: Math.floor(state.activeProjects.length * 0.2), icon: Clock, color: 'yellow' },
                { label: 'Archived', value: state.archivedProjects.length, icon: Archive, color: 'gray' }
              ].map((stat, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-${stat.color}-100`}>
                      <stat.icon size={20} className={`text-${stat.color}-600`} />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selection Controls */}
      {selectionMode && (
        <div className={`${isArchivedView ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'} border-b`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={selectAllProjects}
                  className={`text-sm ${isArchivedView ? 'text-orange-600 hover:text-orange-800' : 'text-blue-600 hover:text-blue-800'}`}
                >
                  {selectedProjects.size === filteredProjects.length ? 'Deselect All' : 'Select All'}
                </button>
                <span className="text-sm text-gray-600">
                  {selectedProjects.size} of {filteredProjects.length} projects selected
                </span>
              </div>
              
              {selectedProjects.size > 0 && (
                <div className="flex items-center space-x-2">
                  {!isArchivedView ? (
                    <button
                      onClick={handleBulkArchive}
                      disabled={bulkActionLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {bulkActionLoading ? (
                        <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Archive size={16} />
                      )}
                      <span>Archive Selected ({selectedProjects.size})</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleBulkDeletePermanent}
                      disabled={bulkActionLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {bulkActionLoading ? (
                        <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <X size={16} />
                      )}
                      <span>Delete Permanently ({selectedProjects.size})</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="breakwater">Breakwater</option>
              <option value="pier">Pier</option>
              <option value="jetty">Jetty</option>
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="recent">Recently Modified</option>
              <option value="name">Name (A-Z)</option>
              <option value="progress">Progress</option>
            </select>

            <button
              onClick={toggleSelectionMode}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                selectionMode 
                  ? 'bg-gray-600 text-white border-gray-600' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {selectionMode ? 'Cancel' : 'Select'}
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {state.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Loading projects...</span>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            {isArchivedView ? <Archive size={48} className="mx-auto text-gray-300 mb-4" /> : <Building2 size={48} className="mx-auto text-gray-300 mb-4" />}
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {noResultsMessage}
            </h3>
            <p className="text-gray-500 mb-6">
              {noResultsSubMessage}
            </p>
            {!debouncedSearchTerm && filterType === 'all' && !isArchivedView && (
              <button
                onClick={onCreateNewProject}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                <span>Create First Project</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isArchivedView={isArchivedView}
                selectionMode={selectionMode}
                selectedProjects={selectedProjects}
                deletingProjectId={deletingProjectId}
                onSelectProject={handleSelectProject}
                onToggleSelection={toggleProjectSelection}
                onArchive={handleArchiveProject}
                onRestore={handleRestoreProject}
                onDeletePermanent={handleDeletePermanent}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="fixed bottom-4 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg max-w-md mx-auto">
          <div className="flex">
            <div className="flex-1">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{state.error}</span>
            </div>
            <button
              onClick={clearError}
              className="flex-shrink-0 ml-4"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsLandingPage;