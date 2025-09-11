import React from 'react';
import { 
  MapPin, 
  Building, 
  Waves, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  DollarSign,
  Shield,
  Leaf
} from 'lucide-react';

const ProjectSummaryPanel = ({ project, collapsed, onToggleCollapse, onNewProject }) => {
  if (collapsed) {
    return (
      <div className="p-4 flex flex-col items-center space-y-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight size={20} />
        </button>
        
        <button
          onClick={onNewProject}
          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Project Overview</h2>
          <p className="text-xs text-gray-500">Updated 2 hours ago</p>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Project Basic Info */}
      <div className="space-y-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-start space-x-3 mb-3">
            <MapPin size={18} className="text-gray-400 mt-1" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Location</p>
              <p className="text-sm text-gray-600">{project.country}, {project.region}</p>
              {project.coordinates && (
                <p className="text-xs text-gray-500 mt-1">{project.coordinates}</p>
              )}
            </div>
          </div>

          <div className="flex items-start space-x-3 mb-3">
            <Building size={18} className="text-gray-400 mt-1" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Structure</p>
              <p className="text-sm text-gray-600">{project.structure_type}</p>
              <p className="text-xs text-gray-500">
                {project.length}m × {project.width}m × {project.height}m
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Waves size={18} className="text-gray-400 mt-1" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Environment</p>
              <p className="text-sm text-gray-600 capitalize">{project.wave_exposure} exposure</p>
              <p className="text-xs text-gray-500">{project.water_depth}m depth</p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="space-y-3 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
          Key Metrics
        </h3>

        {/* Cost Summary */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign size={16} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Estimated Cost</span>
          </div>
          <p className="text-xl font-bold text-blue-900 mb-1">
            ₪2,350,000
          </p>
          <div className="flex justify-between items-center text-xs">
            <span className="text-blue-700">1,250m³ concrete</span>
            <span className="text-green-600 font-medium">15% lower than similar</span>
          </div>
        </div>

        {/* Compliance Status */}
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

        {/* Ecological Score */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
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
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
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
      </div>

      {/* Actions */}
      <div className="mt-auto space-y-2">
        <button
          onClick={onNewProject}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} />
          <span>New Project</span>
        </button>
        
        <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
          Edit Project
        </button>
      </div>
    </div>
  );
};

export default ProjectSummaryPanel;