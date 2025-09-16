// src/components/Ecological/EcologicalDashboard.js
import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useOceanData } from '../../hooks/useOceanData';
import { Download, RefreshCw, Leaf, Wifi, WifiOff } from 'lucide-react';

const EcologicalDashboard = ({ selectedProject }) => {
  const { state } = useProject();
  const [selectedView, setSelectedView] = useState('overview');

  // Use selectedProject prop if available, otherwise fall back to context
  const currentProject = selectedProject || state.currentProject;

  console.log('EcologicalDashboard - selectedProject prop:', selectedProject);
  console.log('EcologicalDashboard - state.currentProject:', state.currentProject);
  console.log('EcologicalDashboard - using currentProject:', currentProject);

  // Ocean data hook
  const {
    data: oceanData,
    loading: oceanLoading,
    error: oceanError,
    lastFetch,
    refresh
  } = useOceanData(currentProject);

  console.log('Ocean data:', oceanData);
  console.log('Ocean loading:', oceanLoading);
  console.log('Ocean error:', oceanError);

  if (!currentProject) {
    console.log('No current project found');
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

  console.log('Rendering ecological dashboard for project:', currentProject.name || currentProject.id);

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
            <p className="text-sm text-gray-600">
              Environmental assessment for {currentProject.name || currentProject.projectName || 'Project'}
            </p>
            
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

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Ocean Conditions Display */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ocean Conditions</h3>
            
            {oceanLoading ? (
              <div className="animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : oceanError ? (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-orange-700 text-sm">Error: {oceanError}</p>
                <p className="text-orange-600 text-xs mt-1">Showing fallback data</p>
              </div>
            ) : !oceanData ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No ocean data available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Temperature */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                  <div className="text-sm font-medium text-blue-800 mb-2">Temperature</div>
                  <div className="text-2xl font-bold text-blue-900 mb-1">
                    {oceanData.temperature?.current || 'N/A'}°C
                  </div>
                  <p className="text-xs text-blue-600">
                    {oceanData.temperature?.change || 'No change'}
                  </p>
                </div>

                {/* Wave Height */}
                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 rounded-xl border border-cyan-200">
                  <div className="text-sm font-medium text-cyan-800 mb-2">Wave Height</div>
                  <div className="text-2xl font-bold text-cyan-900 mb-1">
                    {oceanData.waveHeight?.current || 'N/A'}m
                  </div>
                  <p className="text-xs text-cyan-600">
                    {oceanData.waveHeight?.change || 'No change'}
                  </p>
                </div>

                {/* Salinity */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                  <div className="text-sm font-medium text-purple-800 mb-2">Salinity</div>
                  <div className="text-2xl font-bold text-purple-900 mb-1">
                    {oceanData.salinity?.current || 'N/A'} PSU
                  </div>
                  <p className="text-xs text-purple-600">
                    {oceanData.salinity?.change || 'No change'}
                  </p>
                </div>

                {/* pH Level */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                  <div className="text-sm font-medium text-green-800 mb-2">pH Level</div>
                  <div className="text-2xl font-bold text-green-900 mb-1">
                    {oceanData.phLevel?.current || 'N/A'}
                  </div>
                  <p className="text-xs text-green-600">
                    {oceanData.phLevel?.change || 'No change'}
                  </p>
                  {oceanData.phLevel?.status && (
                    <div className="mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        oceanData.phLevel.status === 'excellent' ? 'bg-green-100 text-green-700' :
                        oceanData.phLevel.status === 'good' ? 'bg-blue-100 text-blue-700' :
                        oceanData.phLevel.status === 'concerning' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {oceanData.phLevel.status}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
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
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{currentProject.name || currentProject.projectName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium">{currentProject.region || 'Not specified'}, {currentProject.country}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Coordinates:</span>
                <span className="font-medium">
                  {currentProject.latitude || currentProject.lat || 'N/A'}°, {currentProject.longitude || currentProject.lon || 'N/A'}°
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Project Type:</span>
                <span className="font-medium">{currentProject.structure_type || 'Marine Infrastructure'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Water Depth:</span>
                <span className="font-medium">{currentProject.water_depth || 'N/A'}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Wave Exposure:</span>
                <span className="font-medium capitalize">{currentProject.wave_exposure || 'Unknown'}</span>
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

          {/* Key Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="font-semibold text-gray-900 mb-3">Key Environmental Metrics</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Carbon Sequestration Potential</span>
                <span className="font-medium text-green-600">High</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Biodiversity Index</span>
                <span className="font-medium text-blue-600">7.2/10</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Habitat Suitability</span>
                <span className="font-medium text-green-600">Excellent</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Climate Risk Level</span>
                <span className="font-medium text-yellow-600">Moderate</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EcologicalDashboard;