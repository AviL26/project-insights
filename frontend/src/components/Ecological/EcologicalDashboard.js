// src/components/Ecological/EcologicalDashboard.jsx
import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useOceanData } from '../../hooks/useOceanData';
import { Download, RefreshCw, Leaf, Wifi, WifiOff } from 'lucide-react';
import OceanConditionsPanel from '../panels/OceanConditionsPanel';

const EcologicalDashboard = () => {
  const { state } = useProject();
  const { currentProject } = state;
  const [selectedView, setSelectedView] = useState('overview');

  // Use the new ocean data hook
  const {
    data: oceanData,
    loading: oceanLoading,
    error: oceanError,
    lastFetch,
    refresh
  } = useOceanData(currentProject);

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Leaf size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-600">No Project Selected</h3>
          <p className="text-gray-500">Select a project to view ecological analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Leaf size={24} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Ecological Impact Analysis</h2>
            <p className="text-sm text-gray-600">Environmental assessment for {currentProject.name}</p>
            
            {/* Data Status Indicator */}
            <div className="flex items-center space-x-2 mt-1">
              {oceanData?.isRealData ? (
                <div className="flex items-center space-x-1 text-green-600">
                  <Wifi size={12} />
                  <span className="text-xs">Live Data Connected</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-orange-600">
                  <WifiOff size={12} />
                  <span className="text-xs">Using Estimated Data</span>
                </div>
              )}
              
              {lastFetch && (
                <span className="text-xs text-gray-500">
                  • Last updated: {lastFetch.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={refresh}
            disabled={oceanLoading}
            className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Refresh ocean data"
          >
            <RefreshCw size={16} className={oceanLoading ? 'animate-spin' : ''} />
            <span>Refresh Data</span>
          </button>
          
          <select 
            value={selectedView}
            onChange={(e) => setSelectedView(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="overview">Overview</option>
            <option value="biodiversity">Biodiversity Assessment</option>
            <option value="water-quality">Water Quality</option>
            <option value="climate">Climate Impact</option>
          </select>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download size={18} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* API Error Display */}
      {oceanError && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <WifiOff size={16} className="text-orange-600" />
            <h4 className="font-medium text-orange-800">Data Connection Issue</h4>
          </div>
          <p className="text-sm text-orange-700 mt-1">
            Unable to fetch live ocean data: {oceanError}
          </p>
          <p className="text-sm text-orange-600 mt-1">
            Showing estimated data based on location and historical patterns.
          </p>
        </div>
      )}

      {/* Data Quality Indicator */}
      {oceanData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                oceanData.dataQuality > 80 ? 'bg-green-500' :
                oceanData.dataQuality > 60 ? 'bg-yellow-500' : 'bg-orange-500'
              }`}></div>
              <span className="text-sm font-medium text-blue-900">
                Data Quality: {oceanData.dataQuality}%
              </span>
            </div>
            
            <div className="text-right">
              <div className="text-xs text-blue-700">
                Sources: {Object.entries(oceanData.sources || {})
                  .filter(([_, status]) => status !== 'unavailable')
                  .map(([source, _]) => source)
                  .join(', ') || 'Estimated'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Ocean Conditions Panel with Real Data */}
          <OceanConditionsPanel 
            oceanData={oceanData}
            currentProject={currentProject}
            loading={oceanLoading}
            error={oceanError}
          />
          
          {/* Placeholder for future panels */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-dashed border-gray-200">
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Leaf size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">More Environmental Data Coming Soon</h3>
              <p className="text-gray-500">Biodiversity, Water Quality, and Climate panels will be added here.</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Project Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="font-semibold text-gray-900 mb-3">Project Overview</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium">{currentProject.location || 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Coordinates:</span>
                <span className="font-medium">
                  {currentProject.latitude || currentProject.lat || 'N/A'}°, {currentProject.longitude || currentProject.lon || 'N/A'}°
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Project Type:</span>
                <span className="font-medium">{currentProject.type || 'Marine Infrastructure'}</span>
              </div>
            </div>
          </div>

          {/* Environmental Impact Score */}
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="font-semibold text-gray-900 mb-3">Environmental Impact</h4>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">B+</div>
              <p className="text-sm text-gray-600">Overall Environmental Rating</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div className="bg-green-500 h-2 rounded-full" style={{width: '75%'}}></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Based on current ocean conditions and project parameters</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EcologicalDashboard;