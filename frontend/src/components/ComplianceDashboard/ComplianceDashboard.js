// frontend/src/components/ComplianceDashboard/ComplianceDashboard.js - ENHANCED SAFETY
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useCompliance } from '../../context/ComplianceContext';
import ComplianceMap from './ComplianceMap';
import ComplianceChecklist from './ComplianceChecklist';
import RiskSummaryCards from './RiskSummaryCards';
import ProjectSelector from './ProjectSelector';
import ErrorAlert from '../common/ErrorAlert';
import { 
  Shield, 
  Clock, 
  FileText, 
  Download, 
  RefreshCw,
  MapPin,
  Wifi,
  WifiOff
} from 'lucide-react';

const ComplianceDashboard = () => {
  const { state: projectState } = useProject();
  const {
    isLoading,
    error,
    currentAnalysis,
    enhancedFeaturesAvailable,
    checkSystemStatus,
    checkCompliance,
    clearError,
    formatLocation
  } = useCompliance();

  const [selectedProject, setSelectedProject] = useState(null);
  const [manualCoordinates, setManualCoordinates] = useState({ lat: '', lon: '' });
  const [projectType, setProjectType] = useState('breakwater');
  const [analysisMode, setAnalysisMode] = useState('project');

  // Initialize system status once
  useEffect(() => {
    checkSystemStatus();
  }, [checkSystemStatus]);

  // Auto-select first project
  useEffect(() => {
    if (!selectedProject && projectState.activeProjects?.length > 0) {
      setSelectedProject(projectState.activeProjects[0]);
    }
  }, [projectState.activeProjects, selectedProject]);

  // ENHANCED: Create completely safe analysis data with guaranteed structure
  const safeAnalysisData = useMemo(() => {
    if (!currentAnalysis) {
      return {
        rules: [],
        riskSummary: {
          overallRisk: 'Unknown',
          totalPermits: 0,
          highRiskItems: 0,
          mediumRiskItems: 0,
          lowRiskItems: 0
        },
        recommendations: [],
        location: null,
        deadlines: []
      };
    }
    
    // CRITICAL FIX: Ensure riskSummary has all required properties
    const safRiskSummary = {
      overallRisk: currentAnalysis.riskSummary?.overallRisk || 'Unknown',
      totalPermits: Number(currentAnalysis.riskSummary?.totalPermits) || 0,
      highRiskItems: Number(currentAnalysis.riskSummary?.highRiskItems) || 0,
      mediumRiskItems: Number(currentAnalysis.riskSummary?.mediumRiskItems) || 0,
      lowRiskItems: Number(currentAnalysis.riskSummary?.lowRiskItems) || 0,
      // Additional safety properties that components might expect
      compliance_score: Number(currentAnalysis.riskSummary?.compliance_score) || 0,
      last_updated: currentAnalysis.riskSummary?.last_updated || null
    };
    
    return {
      rules: Array.isArray(currentAnalysis.rules) ? currentAnalysis.rules : [],
      riskSummary: safRiskSummary,
      recommendations: Array.isArray(currentAnalysis.recommendations) ? currentAnalysis.recommendations : [],
      location: currentAnalysis.location || null,
      deadlines: Array.isArray(currentAnalysis.deadlines) ? currentAnalysis.deadlines : []
    };
  }, [currentAnalysis]);

  // Analyze project when selected
  const handleAnalyzeProject = useCallback(async (project) => {
    // ENHANCED: More thorough validation before API call
    if (!project) {
      console.warn('No project provided for analysis');
      return;
    }

    const lat = Number(project.lat || project.latitude);
    const lon = Number(project.lon || project.longitude);
    const structureType = project.structure_type || project.type;

    if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
      console.warn('Project missing valid coordinates:', { lat, lon });
      return;
    }

    if (!structureType) {
      console.warn('Project missing structure type');
      return;
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      console.warn('Invalid coordinate ranges:', { lat, lon });
      return;
    }

    try {
      await checkCompliance({
        lat: lat,
        lon: lon,
        projectType: structureType,
        projectId: project.id
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      // Error is already handled by the context
    }
  }, [checkCompliance]);

  // Auto-analyze when project changes
  useEffect(() => {
    if (selectedProject && analysisMode === 'project') {
      handleAnalyzeProject(selectedProject);
    }
  }, [selectedProject, analysisMode, handleAnalyzeProject]);

  const handleManualAnalysis = useCallback(async () => {
    // ENHANCED: Better input validation
    const latStr = manualCoordinates.lat.trim();
    const lonStr = manualCoordinates.lon.trim();
    
    if (!latStr || !lonStr) {
      alert('Please enter both latitude and longitude coordinates');
      return;
    }

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (isNaN(lat) || isNaN(lon)) {
      alert('Please enter valid numeric coordinates');
      return;
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      alert('Coordinates out of valid range:\nLatitude: -90 to 90\nLongitude: -180 to 180');
      return;
    }

    if (!projectType || projectType.trim().length === 0) {
      alert('Please select a project type');
      return;
    }

    try {
      await checkCompliance({
        lat,
        lon,
        projectType: projectType.trim(),
        projectId: null
      });
    } catch (error) {
      console.error('Manual analysis failed:', error);
      // Error is already handled by the context
    }
  }, [manualCoordinates.lat, manualCoordinates.lon, projectType, checkCompliance]);

  const refreshAnalysis = useCallback(() => {
    if (analysisMode === 'project' && selectedProject) {
      handleAnalyzeProject(selectedProject);
    } else if (analysisMode === 'manual') {
      handleManualAnalysis();
    }
  }, [analysisMode, selectedProject, handleAnalyzeProject, handleManualAnalysis]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Compliance Command Center</h1>
              <p className="text-yellow-100">Regulatory oversight and risk management</p>
              
              <div className="flex items-center space-x-4 mt-3">
                <div className="flex items-center space-x-2">
                  {enhancedFeaturesAvailable ? (
                    <>
                      <Wifi size={16} className="text-green-300" />
                      <span className="text-sm text-green-200">Enhanced Features Active</span>
                    </>
                  ) : (
                    <>
                      <WifiOff size={16} className="text-orange-300" />
                      <span className="text-sm text-orange-200">Basic Mode</span>
                    </>
                  )}
                </div>
                
                {safeAnalysisData.location && (
                  <div className="flex items-center space-x-2">
                    <MapPin size={16} className="text-yellow-200" />
                    <span className="text-sm text-yellow-200">
                      {formatLocation(safeAnalysisData.location)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={refreshAnalysis}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-800 text-white rounded-lg hover:bg-yellow-900 disabled:opacity-50 transition-colors"
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
              
              <button 
                className="flex items-center space-x-2 px-4 py-2 bg-white text-yellow-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                disabled={!currentAnalysis}
              >
                <Download size={16} />
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ENHANCED: Error display with both context errors */}
      <ErrorAlert 
        error={error || projectState.error} 
        onDismiss={clearError}
        contextName="Compliance Analysis"
      />

      <div className="max-w-7xl mx-auto p-6">
        {/* Analysis Mode Toggle */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="analysisMode"
                value="project"
                checked={analysisMode === 'project'}
                onChange={(e) => setAnalysisMode(e.target.value)}
                className="text-yellow-600"
              />
              <span className="font-medium">Analyze Existing Project</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="analysisMode"
                value="manual"
                checked={analysisMode === 'manual'}
                onChange={(e) => setAnalysisMode(e.target.value)}
                className="text-yellow-600"
              />
              <span className="font-medium">Manual Coordinates</span>
            </label>
          </div>

          {analysisMode === 'project' ? (
            <div className="mt-4">
              <ProjectSelector
                projects={projectState.activeProjects || []}
                selectedProject={selectedProject}
                onSelectProject={setSelectedProject}
                isLoading={projectState.isLoading}
              />
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  placeholder="32.0853"
                  value={manualCoordinates.lat}
                  onChange={(e) => setManualCoordinates(prev => ({ ...prev, lat: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  placeholder="34.7818"
                  value={manualCoordinates.lon}
                  onChange={(e) => setManualCoordinates(prev => ({ ...prev, lon: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="breakwater">Breakwater</option>
                  <option value="seawall">Seawall</option>
                  <option value="pier">Pier</option>
                  <option value="jetty">Jetty</option>
                  <option value="artificial-reef">Artificial Reef</option>
                </select>
              </div>
              
              <div>
                <button
                  onClick={handleManualAnalysis}
                  disabled={isLoading || !manualCoordinates.lat || !manualCoordinates.lon}
                  className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
            <span className="ml-3 text-gray-600">Analyzing compliance requirements...</span>
          </div>
        )}

        {/* Analysis Results - SAFE: Always pass safe data structure */}
        {currentAnalysis && !isLoading && (
          <>
            <RiskSummaryCards 
              riskSummary={safeAnalysisData.riskSummary}
              location={safeAnalysisData.location}
              recommendations={safeAnalysisData.recommendations}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              <div className="lg:col-span-2 space-y-6">
                <ComplianceMap 
                  location={safeAnalysisData.location}
                  rules={safeAnalysisData.rules}
                />
                
                <ComplianceChecklist 
                  rules={safeAnalysisData.rules}
                  deadlines={safeAnalysisData.deadlines}
                />
              </div>

              <div className="space-y-6">
                {selectedProject && analysisMode === 'project' && (
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Project Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{selectedProject.name || 'Unnamed Project'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium">{selectedProject.structure_type || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-medium">{selectedProject.country || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <button className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm flex items-center space-x-2">
                      <FileText size={16} className="text-gray-400" />
                      <span>Download compliance checklist</span>
                    </button>
                    <button className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm flex items-center space-x-2">
                      <Clock size={16} className="text-gray-400" />
                      <span>Set deadline reminders</span>
                    </button>
                    <button className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm flex items-center space-x-2">
                      <Shield size={16} className="text-gray-400" />
                      <span>Request regulatory consultation</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {!currentAnalysis && !isLoading && !error && (
          <div className="text-center py-12">
            <Shield size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Ready for Compliance Analysis
            </h3>
            <p className="text-gray-500">
              {analysisMode === 'project' 
                ? 'Select a project above to begin compliance analysis'
                : 'Enter coordinates above to analyze compliance requirements'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplianceDashboard;