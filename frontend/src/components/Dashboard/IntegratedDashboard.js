import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import MaterialsDashboard from '../Materials/MaterialsDashboard';
import EcologicalDashboard from '../Ecological/EcologicalDashboard';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  DollarSign, 
  Shield, 
  Leaf, 
  MapPin, 
  Building, 
  Waves,
  Users,
  Settings,
  Download,
  Share2
} from 'lucide-react';

const IntegratedDashboard = ({ activeTab, onTabChange, onNewProject }) => {
  const { state } = useProject();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'materials':
        return <MaterialsDashboard />;
      case 'ecological':
        return <EcologicalDashboard />;
      case 'compliance':
        return (
          <div className="p-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold mb-2">Compliance Dashboard</h2>
              <p className="text-gray-600">Compliance content will go here.</p>
            </div>
          </div>
        );
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
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create New Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Enhanced collapsible sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col h-full`}>
        {sidebarCollapsed ? (
          // Collapsed sidebar content
          <div className="p-4 flex flex-col items-center space-y-4">
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
            
            {/* Mini status indicators */}
            <div className="space-y-2">
              <div className="w-8 h-2 bg-blue-200 rounded-full">
                <div className="w-6 h-2 bg-blue-600 rounded-full"></div>
              </div>
              <div className="w-8 h-2 bg-yellow-200 rounded-full">
                <div className="w-4 h-2 bg-yellow-600 rounded-full"></div>
              </div>
              <div className="w-8 h-2 bg-green-200 rounded-full">
                <div className="w-7 h-2 bg-green-600 rounded-full"></div>
              </div>
            </div>
            
            <button
              onClick={onNewProject}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
        ) : (
          // Expanded sidebar content
          <div className="p-6 flex flex-col h-full">
            {/* Header with collapse button */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Project Overview</h2>
                <p className="text-xs text-gray-500">Updated 2 hours ago</p>
              </div>
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
            </div>

            {/* Project Basic Info with Icons */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <MapPin size={18} className="text-gray-400 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Location</p>
                    <p className="text-sm text-gray-600">{state.currentProject.country}, {state.currentProject.region}</p>
                    {state.currentProject.coordinates && (
                      <p className="text-xs text-gray-500">{state.currentProject.coordinates}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Building size={18} className="text-gray-400 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Structure</p>
                    <p className="text-sm text-gray-600">{state.currentProject.structure_type}</p>
                    <p className="text-xs text-gray-500">
                      {state.currentProject.length}m × {state.currentProject.width}m × {state.currentProject.height}m
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Waves size={18} className="text-gray-400 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Environment</p>
                    <p className="text-sm text-gray-600 capitalize">{state.currentProject.wave_exposure} exposure</p>
                    <p className="text-xs text-gray-500">{state.currentProject.water_depth}m depth</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics with Icons */}
            <div className="space-y-3 mb-6">
              <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Key Metrics
              </h3>

              {/* Cost Card */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <DollarSign size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Estimated Cost</span>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">↘ 15% lower</span>
                </div>
                <p className="text-xl font-bold text-blue-900 mb-1">₪2,350,000</p>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-blue-700">1,250m³ concrete</span>
                  <span className="text-green-600 font-medium">vs similar projects</span>
                </div>
              </div>

              {/* Compliance Card */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-2 mb-3">
                  <Shield size={16} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Compliance Status</span>
                </div>
                
                <div className="space-y-2">
                  <div className="inline-flex items-center space-x-1 px-3 py-2 rounded-full text-xs font-medium text-yellow-600 bg-yellow-100">
                    <span>Caution</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="text-center p-2 bg-white rounded border">
                      <p className="text-lg font-semibold text-gray-900">3</p>
                      <p className="text-xs text-gray-600">Permits</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded border">
                      <p className="text-lg font-semibold text-gray-900">2</p>
                      <p className="text-xs text-gray-600">Reviews</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ecological Card */}
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2 mb-3">
                  <Leaf size={16} className="text-green-600" />
                  <span className="text-sm font-medium text-green-900">Ecological Impact</span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-green-900">85%</span>
                    <span className="text-xs text-green-700 bg-green-200 px-2 py-1 rounded-full">
                      High Potential
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-green-700">Biodiversity Score</span>
                      <span className="text-green-800 font-medium">85%</span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center">
                      <p className="font-semibold text-green-800">1,200m²</p>
                      <p className="text-green-600">Habitat Area</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-green-800">8</p>
                      <p className="text-green-600">Target Species</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Info */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Users size={14} className="text-gray-500" />
                  <span className="text-xs font-medium text-gray-700">Project Team</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs bg-white px-2 py-1 rounded text-gray-600">Engineering</span>
                  <span className="text-xs bg-white px-2 py-1 rounded text-gray-600">Environmental</span>
                  <span className="text-xs bg-white px-2 py-1 rounded text-gray-600">Regulatory</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-auto space-y-2">
              <button
                onClick={onNewProject}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} />
                <span>New Project</span>
              </button>
              <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Edit Project
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Enhanced Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-3">
                <h1 className="text-2xl font-bold text-gray-900">{state.currentProject.name}</h1>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  Planning Phase
                </span>
              </div>
              
              {/* Tab Navigation */}
              <div className="flex space-x-1">
                <button 
                  onClick={() => onTabChange('materials')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'materials' 
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-200' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  Materials
                </button>
                <button 
                  onClick={() => onTabChange('compliance')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'compliance' 
                      ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-200' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  Compliance
                </button>
                <button 
                  onClick={() => onTabChange('ecological')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'ecological' 
                      ? 'bg-green-100 text-green-700 border-2 border-green-200' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  Ecological
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Share2 size={18} />
                <span className="hidden md:inline">Share</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors">
                <Download size={18} />
                <span className="hidden md:inline">Export</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings size={18} />
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