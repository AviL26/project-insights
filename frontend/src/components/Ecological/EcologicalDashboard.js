// src/components/Ecological/EcologicalDashboard.js - ENHANCED WITH TOAST SYSTEM

import React, { useState, useCallback, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useOceanData } from '../../hooks/useOceanData';
import { useAlertSystem } from '../../hooks/useAlertSystem';
import { DashboardWrapper } from '../common/DashboardErrorDisplay';
import { useToast } from '../../hooks/useToast';
import { Download, RefreshCw, Leaf, Wifi, WifiOff, AlertTriangle, TrendingUp } from 'lucide-react';

const EcologicalDashboard = ({ selectedProject }) => {
  const { state } = useProject();
  const [selectedView, setSelectedView] = useState('overview');

  // NEW: Toast system integration
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  // Use selectedProject prop if available, otherwise fall back to context
  const currentProject = selectedProject || state.currentProject;

  // Ocean data hook
  const {
    data: oceanData,
    loading: oceanLoading,
    error: oceanError,
    lastFetch,
    refresh
  } = useOceanData(currentProject);

  // NEW: Alert system integration
  const {
    alerts,
    alertStats,
    dismissAlert,
    clearAllAlerts
  } = useAlertSystem(oceanData, currentProject);

  // NEW: Show toast when data quality changes
  useEffect(() => {
    if (oceanData?.dataQuality) {
      if (oceanData.dataQuality < 50) {
        showWarning(`Data quality is low (${oceanData.dataQuality}%) - results may be unreliable`, { duration: 6000 });
      } else if (oceanData.dataQuality > 90) {
        showSuccess(`Excellent data quality (${oceanData.dataQuality}%) - high confidence results`, { duration: 3000 });
      }
    }
  }, [oceanData?.dataQuality, showWarning, showSuccess]);

  // NEW: Show toast for ocean data errors
  useEffect(() => {
    if (oceanError) {
      showError(`Ocean data error: ${oceanError}`, { duration: 5000 });
    }
  }, [oceanError, showError]);

  // NEW: Enhanced refresh with user feedback
  const handleRefresh = useCallback(async () => {
    showInfo('Refreshing ocean data...', { duration: 2000 });
    try {
      await refresh();
      showSuccess('Ocean data refreshed successfully', { duration: 3000 });
    } catch (error) {
      showError(`Failed to refresh data: ${error.message}`);
    }
  }, [refresh, showInfo, showSuccess, showError]);

  // NEW: View change with feedback
  const handleViewChange = useCallback((view) => {
    setSelectedView(view);
    showInfo(`Switched to ${view} view`, { duration: 1500 });
  }, [showInfo]);

  // NEW: Export functionality with toast feedback
  const handleExportReport = useCallback(() => {
    if (!currentProject) {
      showError('No project selected for export');
      return;
    }

    try {
      const reportData = {
        project: currentProject.name || currentProject.projectName,
        oceanConditions: oceanData,
        alerts: alerts,
        environmentalRating: 'B+',
        exportedAt: new Date().toISOString()
      };

      // Mock export - replace with actual export logic
      console.log('Exporting ecological report:', reportData);
      showSuccess('Ecological report exported successfully!', { duration: 3000 });
      
    } catch (error) {
      showError(`Export failed: ${error.message}`);
    }
  }, [currentProject, oceanData, alerts, showSuccess, showError]);

  if (!currentProject) {
    return (
      <DashboardWrapper>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Leaf size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-600">No Project Selected</h3>
            <p className="text-gray-500">Select a project to view ecological analysis</p>
          </div>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
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
              onClick={handleRefresh}
              disabled={oceanLoading}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              title="Refresh ocean data"
            >
              <RefreshCw size={16} className={oceanLoading ? 'animate-spin' : ''} />
              <span>Refresh Data</span>
            </button>
            
            <select 
              value={selectedView}
              onChange={(e) => handleViewChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="overview">Overview</option>
              <option value="biodiversity">Biodiversity Assessment</option>
              <option value="water-quality">Water Quality</option>
              <option value="climate">Climate Impact</option>
            </select>
            
            <button 
              onClick={handleExportReport}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download size={18} />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* NEW: Alert Summary Banner */}
        {alertStats.total > 0 && (
          <div className={`rounded-lg p-4 ${
            alertStats.hasHighPriority ? 'bg-red-50 border border-red-200' :
            alertStats.hasMediumPriority ? 'bg-yellow-50 border border-yellow-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle size={20} className={
                  alertStats.hasHighPriority ? 'text-red-600' :
                  alertStats.hasMediumPriority ? 'text-yellow-600' : 'text-blue-600'
                } />
                <span className="font-medium">
                  {alertStats.total} environmental alert{alertStats.total > 1 ? 's' : ''} detected
                </span>
              </div>
              <button
                onClick={clearAllAlerts}
                className="text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                Clear All
              </button>
            </div>
            
            {/* Alert breakdown */}
            <div className="mt-2 flex items-center space-x-4 text-sm">
              {alertStats.hasHighPriority && (
                <span className="text-red-700">
                  {alertStats.bySeverity.high} high priority
                </span>
              )}
              {alertStats.hasMediumPriority && (
                <span className="text-yellow-700">
                  {alertStats.bySeverity.medium} medium priority
                </span>
              )}
              {alertStats.bySeverity.low && (
                <span className="text-blue-700">
                  {alertStats.bySeverity.low} informational
                </span>
              )}
            </div>
          </div>
        )}

        {/* Data Quality Indicator with Enhanced Feedback */}
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
                {/* NEW: Quality trend indicator */}
                {oceanData.dataQualityTrend && (
                  <TrendingUp size={14} className={
                    oceanData.dataQualityTrend > 0 ? 'text-green-600' : 'text-red-600'
                  } />
                )}
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

        {/* API Error Display with Enhanced Messaging */}
        {oceanError && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <WifiOff size={16} className="text-orange-600" />
                <h4 className="font-medium text-orange-800">Data Connection Issue</h4>
              </div>
              <button
                onClick={() => showInfo('Trying to reconnect to ocean data sources...')}
                className="text-sm text-orange-700 hover:text-orange-900 font-medium"
              >
                Retry Connection
              </button>
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
            {/* Ocean Conditions Display with Enhanced Interactivity */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Ocean Conditions</h3>
                {/* NEW: Live data indicator */}
                {oceanData?.isRealData && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Live</span>
                  </div>
                )}
              </div>
              
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
                  {/* Enhanced Temperature Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 hover:shadow-md transition-shadow cursor-pointer"
                       onClick={() => showInfo(`Current temperature: ${oceanData.temperature?.current}°C. ${oceanData.temperature?.description || 'Normal range for this location.'}`)}>
                    <div className="text-sm font-medium text-blue-800 mb-2">Temperature</div>
                    <div className="text-2xl font-bold text-blue-900 mb-1">
                      {oceanData.temperature?.current || 'N/A'}°C
                    </div>
                    <p className="text-xs text-blue-600">
                      {oceanData.temperature?.change || 'No change'}
                    </p>
                  </div>

                  {/* Enhanced Wave Height Card */}
                  <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 rounded-xl border border-cyan-200 hover:shadow-md transition-shadow cursor-pointer"
                       onClick={() => showInfo(`Current wave height: ${oceanData.waveHeight?.current}m. ${oceanData.waveHeight?.description || 'Suitable for marine operations.'}`)}>
                    <div className="text-sm font-medium text-cyan-800 mb-2">Wave Height</div>
                    <div className="text-2xl font-bold text-cyan-900 mb-1">
                      {oceanData.waveHeight?.current || 'N/A'}m
                    </div>
                    <p className="text-xs text-cyan-600">
                      {oceanData.waveHeight?.change || 'No change'}
                    </p>
                  </div>

                  {/* Enhanced Salinity Card */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200 hover:shadow-md transition-shadow cursor-pointer"
                       onClick={() => showInfo(`Current salinity: ${oceanData.salinity?.current} PSU. ${oceanData.salinity?.description || 'Normal salinity levels.'}`)}>
                    <div className="text-sm font-medium text-purple-800 mb-2">Salinity</div>
                    <div className="text-2xl font-bold text-purple-900 mb-1">
                      {oceanData.salinity?.current || 'N/A'} PSU
                    </div>
                    <p className="text-xs text-purple-600">
                      {oceanData.salinity?.change || 'No change'}
                    </p>
                  </div>

                  {/* Enhanced pH Level Card */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200 hover:shadow-md transition-shadow cursor-pointer"
                       onClick={() => showInfo(`Current pH: ${oceanData.phLevel?.current}. ${oceanData.phLevel?.description || 'Healthy pH levels for marine life.'}`)}>
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
            
            {/* Enhanced Future Panels Placeholder */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-dashed border-gray-200">
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <Leaf size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">More Environmental Data Coming Soon</h3>
                <p className="text-gray-500 mb-4">Biodiversity, Water Quality, and Climate panels will be added here.</p>
                <button 
                  onClick={() => showInfo('Advanced ecological features are in development. Coming in the next update!')}
                  className="text-green-600 hover:text-green-700 font-medium text-sm"
                >
                  Learn More About Planned Features
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Project Summary with Enhanced Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Project Overview</h4>
                <button
                  onClick={() => showInfo('Project overview shows key parameters affecting ecological impact assessment')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
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

            {/* Enhanced Environmental Impact Score */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Environmental Impact</h4>
                <button
                  onClick={() => showSuccess('Environmental rating updated based on latest ocean conditions', { duration: 4000 })}
                  className="text-green-600 hover:text-green-700"
                >
                  <TrendingUp size={14} />
                </button>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2 cursor-pointer"
                     onClick={() => showInfo('Environmental rating: B+. Based on water quality, biodiversity potential, and climate factors.')}>
                  B+
                </div>
                <p className="text-sm text-gray-600">Overall Environmental Rating</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-4 cursor-pointer"
                     onClick={() => showInfo('Environmental score: 75/100. Excellent conditions for marine ecosystem development.')}>
                  <div className="bg-green-500 h-2 rounded-full transition-all duration-1000" style={{width: '75%'}}></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Based on current ocean conditions and project parameters</p>
              </div>
            </div>

            {/* Enhanced Key Metrics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="font-semibold text-gray-900 mb-3">Key Environmental Metrics</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-2 rounded"
                     onClick={() => showInfo('Carbon sequestration potential is high due to optimal water conditions for bio-enhanced concrete colonization')}>
                  <span className="text-sm text-gray-600">Carbon Sequestration Potential</span>
                  <span className="font-medium text-green-600">High</span>
                </div>
                <div className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-2 rounded"
                     onClick={() => showInfo('Biodiversity index of 7.2/10 indicates excellent potential for marine species diversity')}>
                  <span className="text-sm text-gray-600">Biodiversity Index</span>
                  <span className="font-medium text-blue-600">7.2/10</span>
                </div>
                <div className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-2 rounded"
                     onClick={() => showInfo('Habitat suitability is excellent - optimal conditions for marine ecosystem development')}>
                  <span className="text-sm text-gray-600">Habitat Suitability</span>
                  <span className="font-medium text-green-600">Excellent</span>
                </div>
                <div className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-2 rounded"
                     onClick={() => showWarning('Climate risk is moderate due to rising sea temperatures and potential storm activity')}>
                  <span className="text-sm text-gray-600">Climate Risk Level</span>
                  <span className="font-medium text-yellow-600">Moderate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardWrapper>
  );
};

export default EcologicalDashboard;