// src/components/ProjectsLandingPage.js - Updated with Archive System
import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { 
  Plus, Search, Filter, MapPin, Calendar, Waves, Leaf, 
  MoreVertical, Edit3, Trash2, Eye, ArrowRight, Building2,
  Clock, TrendingUp, AlertCircle, CheckCircle, X, Archive,
  ArchiveRestore, AlertTriangle as Warning
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
    bulkDeletePermanent 
  } = useProject();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  
  // Multi-select state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const currentProjects = getCurrentProjects();
  const isArchivedView = state.currentView === 'archived';

  // Enhanced project data with additional metadata
  const enhancedProjects = currentProjects.map(project => ({
    ...project,
    lastModified: new Date(project.updated_at || Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    progress: Math.floor(Math.random() * 100),
    type: project.structure_type || project.type || 'Marine Infrastructure',
    location: project.region ? 
      `${project.region}, ${project.country}` : 
      project.location || 
      `${project.latitude || project.lat || '32.0'}°N, ${project.longitude || project.lon || '34.0'}°E`
  }));

  // Filter and sort projects
  const filteredProjects = enhancedProjects
    .filter(project => {
      const matchesSearch = (project.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (project.description || '').toLowerCase().includes(searchTerm.toLowerCase());
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

  const handleArchiveProject = async (project, e) => {
    e.stopPropagation();
    
    const projectName = project.name || 'this project';
    if (window.confirm(`Archive "${projectName}"?\n\nThe project will be moved to the Archive folder and can be restored later.`)) {
      setDeletingProjectId(project.id);
      
      try {
        await archiveProject(project.id);
        console.log(`Project "${projectName}" archived successfully`);
      } catch (error) {
        console.error('Error archiving project:', error);
        alert('Failed to archive project. Please try again.');
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
        console.log(`Project "${projectName}" restored successfully`);
      } catch (error) {
        console.error('Error restoring project:', error);
        alert('Failed to restore project. Please try again.');
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
        console.log(`Project "${projectName}" permanently deleted`);
      } catch (error) {
        console.error('Error permanently deleting project:', error);
        alert('Failed to permanently delete project. Please try again.');
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
        console.log(`Bulk archive successful: ${result.archivedCount} projects archived`);
        setSelectedProjects(new Set());
        setSelectionMode(false);
      } catch (error) {
        console.error('Error in bulk archive:', error);
        alert('Failed to archive projects. Please try again.');
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
        console.log(`Bulk permanent delete successful: ${result.deletedCount} projects deleted`);
        setSelectedProjects(new Set());
        setSelectionMode(false);
      } catch (error) {
        console.error('Error in bulk permanent delete:', error);
        alert('Failed to permanently delete projects. Please try again.');
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

  return (
    <div className="min-h-screen bg-gray-50">
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
                        <Warning size={16} />
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            {isArchivedView ? <Archive size={48} className="mx-auto text-gray-300 mb-4" /> : <Building2 size={48} className="mx-auto text-gray-300 mb-4" />}
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {searchTerm || filterType !== 'all' ? 'No projects found' : 
               isArchivedView ? 'No archived projects' : 'No active projects yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : isArchivedView 
                  ? 'Archived projects will appear here when you archive active projects'
                  : 'Create your first project to get started'
              }
            </p>
            {!searchTerm && filterType === 'all' && !isArchivedView && (
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
              <div
                key={project.id}
                className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-all cursor-pointer group relative ${
                  selectedProjects.has(project.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                } ${selectionMode ? 'hover:ring-2 hover:ring-blue-300' : ''}`}
                onClick={() => selectionMode ? toggleProjectSelection(project.id, { stopPropagation: () => {} }) : handleSelectProject(project)}
              >
                {/* Selection Checkbox */}
                {selectionMode && (
                  <div className="absolute top-4 left-4 z-10">
                    <input
                      type="checkbox"
                      checked={selectedProjects.has(project.id)}
                      onChange={(e) => toggleProjectSelection(project.id, e)}
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
                            onClick={(e) => handleRestoreProject(project, e)}
                            disabled={deletingProjectId === project.id}
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
                              handleSelectProject(project);
                            }}
                            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                          >
                            <Waves size={14} />
                            <span>Ocean Data</span>
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectProject(project);
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
                            onClick={(e) => handleDeletePermanent(project, e)}
                            disabled={deletingProjectId === project.id}
                            className={`p-1 transition-colors ${
                              deletingProjectId === project.id 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-gray-400 hover:text-red-500'
                            }`}
                            title="Delete permanently"
                          >
                            {deletingProjectId === project.id ? (
                              <div className="w-3.5 h-3.5 border border-gray-300 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={(e) => handleArchiveProject(project, e)}
                            disabled={deletingProjectId === project.id}
                            className={`p-1 transition-colors ${
                              deletingProjectId === project.id 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-gray-400 hover:text-orange-500'
                            }`}
                            title="Archive project"
                          >
                            {deletingProjectId === project.id ? (
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsLandingPage;