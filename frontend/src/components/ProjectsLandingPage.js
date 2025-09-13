// src/components/ProjectsLandingPage.js
import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { 
  Plus, Search, Filter, MapPin, Calendar, Waves, Leaf, 
  MoreVertical, Edit3, Trash2, Eye, ArrowRight, Building2,
  Clock, TrendingUp, AlertCircle, CheckCircle
} from 'lucide-react';

const ProjectsLandingPage = ({ onNavigateToProject, onCreateNewProject }) => {
  const { state, dispatch, deleteProject } = useProject();
  const { projects, currentProject } = state;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [deletingProjectId, setDeletingProjectId] = useState(null);

  // Mock project status for demonstration
  const getProjectStatus = (project) => {
    const statuses = ['active', 'planning', 'completed', 'on-hold'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <TrendingUp className="text-green-500" size={16} />;
      case 'planning': return <Clock className="text-blue-500" size={16} />;
      case 'completed': return <CheckCircle className="text-gray-500" size={16} />;
      case 'on-hold': return <AlertCircle className="text-orange-500" size={16} />;
      default: return <Building2 className="text-gray-400" size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'on-hold': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Enhanced project data with additional metadata
  const enhancedProjects = projects.map(project => ({
    ...project,
    status: getProjectStatus(project),
    lastModified: new Date(project.updatedAt || Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    progress: Math.floor(Math.random() * 100),
    type: project.structureType || project.type || 'Marine Infrastructure',
    location: project.region ? 
      `${project.region}, ${project.country}` : 
      project.location || 
      `${project.latitude || project.lat || '32.0'}°N, ${project.longitude || project.lon || '34.0'}°E`
  }));

  // Filter and sort projects
  const filteredProjects = enhancedProjects
    .filter(project => {
      const matchesSearch = (project.projectName || project.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (project.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || project.status === filterType;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.projectName || a.name || '').localeCompare(b.projectName || b.name || '');
        case 'recent':
          return new Date(b.lastModified) - new Date(a.lastModified);
        case 'progress':
          return b.progress - a.progress;
        default:
          return 0;
      }
    });

  const handleSelectProject = (project) => {
    dispatch({ type: 'SET_CURRENT_PROJECT', payload: project });
    onNavigateToProject?.(project);
  };

  const handleDeleteProject = async (project, e) => {
    e.stopPropagation();
    
    const projectName = project.projectName || project.name || 'this project';
    const confirmMessage = `Are you sure you want to delete "${projectName}"?\n\nThis will permanently remove:\n• All project data and settings\n• Materials analysis data\n• Ecological monitoring data\n\nThis action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      setDeletingProjectId(project.id);
      
      try {
        await deleteProject(project.id);
        console.log(`Project "${projectName}" deleted successfully`);
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project. Please try again.');
      } finally {
        setDeletingProjectId(null);
      }
    }
  };

  const handleEditProject = (project, e) => {
    e.stopPropagation();
    // TODO: Implement edit functionality
    console.log('Edit project:', project);
    alert('Edit functionality coming soon!');
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
            <button
              onClick={onCreateNewProject}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus size={20} />
              <span>New Project</span>
            </button>
          </div>
          
          {/* Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Projects', value: projects.length, icon: Building2, color: 'blue' },
              { label: 'Active', value: enhancedProjects.filter(p => p.status === 'active').length, icon: TrendingUp, color: 'green' },
              { label: 'In Planning', value: enhancedProjects.filter(p => p.status === 'planning').length, icon: Clock, color: 'blue' },
              { label: 'Completed', value: enhancedProjects.filter(p => p.status === 'completed').length, icon: CheckCircle, color: 'gray' }
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
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Search and Filter */}
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
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="planning">Planning</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
            </select>
          </div>

          {/* Sort and View */}
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
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {searchTerm || filterType !== 'all' ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first project to get started with environmental monitoring'
              }
            </p>
            {!searchTerm && filterType === 'all' && (
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
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => handleSelectProject(project)}
              >
                {/* Project Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {project.projectName || project.name}
                        </h3>
                        {currentProject?.id === project.id && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(project.status)}
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <button 
                        className="p-2 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical size={16} className="text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin size={14} />
                      <span>{project.location}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Building2 size={14} />
                      <span>{project.type}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar size={14} />
                      <span>Modified {formatDate(project.lastModified)}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
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

                  {/* Quick Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
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

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => handleEditProject(project, e)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Edit project"
                      >
                        <Edit3 size={14} />
                      </button>
                      
                      <button
                        onClick={(e) => handleDeleteProject(project, e)}
                        disabled={deletingProjectId === project.id}
                        className={`p-1 transition-colors ${
                          deletingProjectId === project.id 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-gray-400 hover:text-red-500'
                        }`}
                        title="Delete project"
                      >
                        {deletingProjectId === project.id ? (
                          <div className="w-3.5 h-3.5 border border-gray-300 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                      
                      <ArrowRight size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
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