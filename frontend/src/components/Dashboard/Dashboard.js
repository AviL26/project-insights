import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import ProjectSummaryPanel from './ProjectSummaryPanel';
import DashboardNavigation from './DashboardNavigation';
import MaterialsDashboard from '../Materials/MaterialsDashboard';
import ComplianceDashboard from '../Compliance/ComplianceDashboard';
import EcologicalDashboard from '../Ecological/EcologicalDashboard';
import { Settings, Download, Share2 } from 'lucide-react';

const IntegratedDashboard = ({ activeTab, onTabChange, onNewProject }) => {
  const { state } = useProject();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
        {/* Header with navigation and actions */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Project title and tabs */}
            <div>
              <h1 className="text-xl font-semibold text-gray-900 mb-3">
                {state.currentProject.name}
              </h1>
              <DashboardNavigation 
                activeTab={activeTab} 
                onTabChange={onTabChange} 
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Share2 size={18} />
                <span className="hidden md:inline">Share</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Download size={18} />
                <span className="hidden md:inline">Export</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Settings size={18} />
                <span className="hidden md:inline">Settings</span>
              </button>
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