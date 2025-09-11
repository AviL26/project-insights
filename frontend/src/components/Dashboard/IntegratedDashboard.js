import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import ProjectSummaryPanel from './ProjectSummaryPanel';
import DashboardNavigation from './DashboardNavigation';
import MaterialsDashboard from '../Materials/MaterialsDashboard';
import ComplianceDashboard from '../Compliance/ComplianceDashboard';
import EcologicalDashboard from '../Ecological/EcologicalDashboard';
import { 
  Settings, 
  Download, 
  Share2, 
  Search, 
  Bell,
  ChevronDown,
  Home,
  FolderOpen,
  Filter,
  SortDesc
} from 'lucide-react';

const IntegratedDashboard = ({ activeTab, onTabChange, onNewProject }) => {
  const { state } = useProject();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications] = useState(3);

  const breadcrumbs = [
    { label: 'Projects', icon: Home },
    { label: 'Current Project', icon: FolderOpen },
    { label: state.currentProject?.name || 'Unknown', current: true }
  ];

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'materials':
        return <MaterialsDashboard />;
      case 'compliance':
        return <ComplianceDashboard />;
      case 'ecological':
        return <EcologicalDashboard />;
      default:
        return <MaterialsDashboard />;
    }
  };

  if (!state.currentProject) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">No Project Selected</h2>
          <p className="text-gray-600 mb-6">Create a new project to get started</p>
          <button
            onClick={onNewProject}
            className="px-6 py-3 bg-eco-blue-600 text-white rounded-lg hover:bg-eco-blue-700"
          >
            Create New Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Project Summary Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} bg-white border-r border-gray-200 transition-all duration-300`}>
        <ProjectSummaryPanel 
          project={state.currentProject}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onNewProject={onNewProject}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Enhanced Header with breadcrumbs and search */}
        <div className="bg-white border-b border-gray-200">
          {/* Top bar with breadcrumbs and notifications */}
          <div className="px-6 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              {/* Breadcrumb Navigation */}
              <nav className="flex items-center space-x-2 text-sm">
                {breadcrumbs.map((crumb, index) => {
                  const Icon = crumb.icon;
                  return (
                    <div key={index} className="flex items-center space-x-2">
                      {index > 0 && <span className="text-gray-400">/</span>}
                      <div className={`flex items-center space-x-1 ${
                        crumb.current ? 'text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-700'
                      }`}>
                        <Icon size={16} />
                        <span>{crumb.label}</span>
                      </div>
                    </div>
                  );
                })}
              </nav>

              {/* Notifications and user actions */}
              <div className="flex items-center space-x-3">
                {/* Search */}
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-eco-blue-500 focus:border-transparent w-64"
                  />
                </div>

                {/* Notifications */}
                <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Bell size={18} />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {notifications}
                    </span>
                  )}
                </button>

                {/* Project Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowProjectSelector(!showProjectSelector)}
                    className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  >
                    <span className="truncate max-w-32">{state.currentProject?.name}</span>
                    <ChevronDown size={16} />
                  </button>
                  
                  {showProjectSelector && (
                    <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-48">
                      <div className="p-2 border-b border-gray-100">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recent Projects</p>
                      </div>
                      {state.projects.slice(0, 5).map((project) => (
                        <button
                          key={project.id}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-b-0"
                        >
                          <div className="font-medium">{project.name}</div>
                          <div className="text-xs text-gray-500">{project.country}, {project.region}</div>
                        </button>
                      ))}
                      <div className="p-2 border-t border-gray-100">
                        <button
                          onClick={onNewProject}
                          className="w-full text-left px-2 py-1 text-sm text-eco-blue-600 hover:bg-eco-blue-50 rounded"
                        >
                          + Create New Project
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main header with project title and tabs */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Project title and tabs */}
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-3">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {state.currentProject.name}
                  </h1>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    Planning Phase
                  </span>
                </div>
                <DashboardNavigation 
                  activeTab={activeTab} 
                  onTabChange={onTabChange} 
                />
              </div>

              {/* Enhanced action buttons */}
              <div className="flex items-center space-x-2">
                <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <Filter size={18} />
                  <span className="hidden md:inline">Filter</span>
                </button>
                <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <SortDesc size={18} />
                  <span className="hidden md:inline">Sort</span>
                </button>
                <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <Share2 size={18} />
                  <span className="hidden md:inline">Share</span>
                </button>
                <button className="flex items-center space-x-2 px-3 py-2 bg-eco-blue-600 text-white hover:bg-eco-blue-700 rounded-lg transition-colors">
                  <Download size={18} />
                  <span className="hidden md:inline">Export All</span>
                </button>
                <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <Settings size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto">
          {renderActiveContent()}
        </div>
      </div>
    </div>
  );
};

export default IntegratedDashboard;