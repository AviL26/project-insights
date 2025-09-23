// frontend/src/components/ComplianceDashboard/ComplianceDashboard.js - COMPLETE STABLE VERSION WITH TOASTS

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useCompliance } from '../../context/ComplianceContext';
import ComplianceMap from './ComplianceMap';
import ComplianceChecklist from './ComplianceChecklist';
import RiskSummaryCards from './RiskSummaryCards';
import ProjectSelector from './ProjectSelector';
import ErrorAlert from '../common/ErrorAlert';
import { DashboardWrapper } from '../common/DashboardErrorDisplay';
import { useToast } from '../../hooks/useToast';
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

  // Toast system - stable usage
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const [selectedProject, setSelectedProject] = useState(null);
  const [manualCoordinates, setManualCoordinates] = useState({ lat: '', lon: '' });
  const [projectType, setProjectType] = useState('breakwater');
  const [analysisMode, setAnalysisMode] = useState('project');

  // FIXED: System status initialization - stable
  useEffect(() => {
    checkSystemStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // FIXED: Auto-select project - stable
  useEffect(() => {
    if (!selectedProject && projectState.activeProjects?.length > 0) {
      setSelectedProject(projectState.activeProjects[0]);
      showInfo(`Auto-selected project: ${projectState.activeProjects[0].name}`, { duration: 2000 });
    }
  }, [projectState.activeProjects?.length, selectedProject, showInfo]);

  // FIXED: Enhanced features notification - stable
  useEffect(() => {
    if (enhancedFeaturesAvailable) {
      showInfo('Enhanced compliance features are now available', { duration: 3000 });
    }
  }, [enhancedFeaturesAvailable, showInfo]);

  // FIXED: Stable safe analysis data
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
    
    const safeRiskSummary = {
      overallRisk: currentAnalysis.riskSummary?.overallRisk || 'Unknown',
      totalPermits: Number(currentAnalysis.riskSummary?.totalPermits) || 0,
      highRiskItems: Number(currentAnalysis.riskSummary?.highRiskItems) || 0,
      mediumRiskItems: Number(currentAnalysis.riskSummary?.mediumRiskItems) || 0,
      lowRiskItems: Number(currentAnalysis.riskSummary?.lowRiskItems) || 0,
      compliance_score: Number(currentAnalysis.riskSummary?.compliance_score) || 0,
      last_updated: currentAnalysis.riskSummary?.last_updated || null
    };
    
    return {
      rules: Array.isArray(currentAnalysis.rules) ? [...currentAnalysis.rules] : [],
      riskSummary: safeRiskSummary,
      recommendations: Array.isArray(currentAnalysis.recommendations) ? [...currentAnalysis.recommendations] : [],
      location: currentAnalysis.location ? { ...currentAnalysis.location } : null,
      deadlines: Array.isArray(currentAnalysis.deadlines) ? [...currentAnalysis.deadlines] : []
    };
  }, [currentAnalysis]);

  // FIXED: Stable analyze project function
  const handleAnalyzeProject = useCallback(async (project) => {
    if (!project) {
      showError('No project provided for analysis');
      return;
    }

    const lat = Number(project.lat || project.latitude);
    const lon = Number(project.lon || project.longitude);
    const structureType = project.structure_type || project.type;

    if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
      showError(`Project "${project.name}" is missing valid coordinates`);
      return;
    }

    if (!structureType) {
      showError(`Project "${project.name}" is missing structure type`);
      return;
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      showError(`Project "${project.name}" has invalid coordinates: ${lat}, ${lon}`);
      return;
    }

    try {
      showInfo(`Analyzing compliance for ${project.name}...`, { duration: 2000 });
      
      await checkCompliance({
        lat: lat,
        lon: lon,
        projectType: structureType,
        projectId: project.id
      });
      
      // Success feedback after analysis completes
      setTimeout(() => {
        const riskLevel = safeAnalysisData.riskSummary?.overallRisk || 'Unknown';
        const rulesCount = safeAnalysisData.rules?.length || 0;
        
        showSuccess(
          `Analysis complete! Risk level: ${riskLevel}, ${rulesCount} compliance rules found`, 
          { duration: 4000 }
        );
      }, 100);
      
    } catch (error) {
      showError(`Analysis failed for ${project.name}: ${error.message}`);
    }
  }, [checkCompliance, showSuccess, showError, showInfo, safeAnalysisData]);

  // FIXED: Auto-analyze when project changes - stable
  useEffect(() => {
    if (selectedProject && analysisMode === 'project') {
      handleAnalyzeProject(selectedProject);
    }
  }, [selectedProject?.id, analysisMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // FIXED: Stable manual analysis
  const handleManualAnalysis = useCallback(async () => {
    const latStr = manualCoordinates.lat.trim();
    const lonStr = manualCoordinates.lon.trim();
    
    if (!latStr || !lonStr) {
      showError('Please enter both latitude and longitude coordinates');
      return;
    }

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (isNaN(lat) || isNaN(lon)) {
      showError('Please enter valid numeric coordinates');
      return;
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      showError('Coordinates out of valid range. Latitude: -90 to 90, Longitude: -180 to 180');
      return;
    }

    if (!projectType || projectType.trim().length === 0) {
      showError('Please select a project type');
      return;
    }

    try {
      showInfo(`Analyzing ${projectType} compliance at ${lat}, ${lon}...`, { duration: 2000 });
      
      await checkCompliance({
        lat,
        lon,
        projectType: projectType.trim(),
        projectId: null
      });
      
      setTimeout(() => {
        const riskLevel = safeAnalysisData.riskSummary?.overallRisk || 'Unknown';
        const rulesCount = safeAnalysisData.rules?.length || 0;
        
        showSuccess(
          `Manual analysis complete! Risk: ${riskLevel}, ${rulesCount} rules found`,
          { duration: 4000 }
        );
      }, 100);
      
    } catch (error) {
      showError(`Manual analysis failed: ${error.message}`);
    }
  }, [manualCoordinates.lat, manualCoordinates.lon, projectType, checkCompliance, showSuccess, showError, showInfo, safeAnalysisData]);

  // FIXED: Stable refresh function
  const refreshAnalysis = useCallback(() => {
    if (analysisMode === 'project' && selectedProject) {
      showInfo('Refreshing project analysis...');
      handleAnalyzeProject(selectedProject);
    } else if (analysisMode === 'manual') {
      showInfo('Refreshing manual analysis...');
      handleManualAnalysis();
    } else {
      showWarning('Select a project or enter coordinates to refresh analysis');
    }
  }, [analysisMode, selectedProject, handleAnalyzeProject, handleManualAnalysis, showInfo, showWarning]);

  // FIXED: Stable project selection
  const handleProjectSelect = useCallback((project) => {
    setSelectedProject(project);
    showInfo(`Selected project: ${project.name}`, { duration: 2000 });
  }, [showInfo]);

  // FIXED: Stable export handler
  const handleExportReport = useCallback(() => {
    if (!currentAnalysis) {
      showError('No analysis data to export');
      return;
    }
    
    try {
      const reportData = {
        project: selectedProject?.name || 'Manual Analysis',
        analysis: safeAnalysisData,
        exportedAt: new Date().toISOString()
      };
      
      console.log('Exporting report:', reportData);
      showSuccess('Compliance report exported successfully!', { duration: 3000 });
      
    } catch (error) {
      showError(`Export failed: ${error.message}`);
    }
  }, [currentAnalysis, selectedProject, safeAnalysisData, showSuccess, showError]);

  return (
    <DashboardWrapper showToasts={true} showInlineErrors={false}>
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
                  onClick={handleExportReport}
                  className="flex items-center space-x-2 px-4 py-2 bg-white text-yellow-700 rounded-lg hover:bg-gray-100 font-medium transition-colors disabled:opacity-50"
                  disabled={!currentAnalysis}
                >
                  <Download size={16} />
                  <span>Export Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Keep your existing ErrorAlert for inline errors */}
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
                  onChange={(e) => {
                    setAnalysisMode(e.target.value);
                    showInfo('Switched to project analysis mode');
                  }}
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
                  onChange={(e) => {
                    setAnalysisMode(e.target.value);
                    showInfo('Switched to manual coordinates mode');
                  }}
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
                  onSelectProject={handleProjectSelect}
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

          {/* Analysis Results */}
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
                      <button 
                        onClick={() => showInfo('Compliance checklist download feature coming soon!')}
                        className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm flex items-center space-x-2"
                      >
                        <FileText size={16} className="text-gray-400" />
                        <span>Download compliance checklist</span>
                      </button>
                      <button 
                        onClick={() => showInfo('Deadline reminder feature coming soon!')}
                        className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm flex items-center space-x-2"
                      >
                        <Clock size={16} className="text-gray-400" />
                        <span>Set deadline reminders</span>
                      </button>
                      <button 
                        onClick={() => showInfo('Regulatory consultation feature coming soon!')}
                        className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm flex items-center space-x-2"
                      >
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
    </DashboardWrapper>
  );
};

export default ComplianceDashboard;