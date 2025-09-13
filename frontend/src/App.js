// src/App.js
import React, { useState } from 'react';
import { ProjectProvider } from './context/ProjectContext';
import ProjectsLandingPage from './components/ProjectsLandingPage';
import MaterialsDashboard from './components/Materials/MaterialsDashboard';
import EcologicalDashboard from './components/Ecological/EcologicalDashboard';
import ComplianceDashboard from './components/Compliance/ComplianceDashboard'; // Add this import
import ProjectSetupWizard from './components/ProjectSetup/ProjectSetupWizard';
import { Home, ArrowLeft, Building2, Leaf, Shield, X } from 'lucide-react'; // Add Shield icon

function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing', 'materials', 'ecological', 'compliance'
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Navigation handlers
  const handleNavigateToProject = (project) => {
    setSelectedProject(project);
    setCurrentView('materials'); // Default to materials dashboard
  };

  const handleCreateNewProject = () => {
    setShowWizardModal(true); // Open wizard as modal
  };

  const handleWizardComplete = (newProject) => {
    setSelectedProject(newProject);
    setShowWizardModal(false); // Close modal
    setCurrentView('materials'); // Navigate to materials after project creation
  };

  const handleCloseWizard = () => {
    setShowWizardModal(false);
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    setSelectedProject(null);
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  // Simple Header Component (embedded)
  const SimpleHeader = ({ children }) => (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        {children}
      </div>
    </header>
  );

  // Simple Sidebar Component (embedded) - Updated with Compliance
  const SimpleSidebar = () => (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Project Info */}
      {selectedProject && (
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 truncate">
            {selectedProject.projectName || selectedProject.name}
          </h3>
          <p className="text-sm text-gray-500">
            {selectedProject.structureType || 'Marine Infrastructure Project'}
          </p>
          {selectedProject.region && (
            <p className="text-xs text-gray-400 mt-1">{selectedProject.region}, {selectedProject.country}</p>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 p-4">
        <nav className="space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Analysis Tools
          </div>
          
          <button
            onClick={() => handleViewChange('materials')}
            className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors ${
              currentView === 'materials'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Building2 size={18} />
            <div>
              <div className="font-medium">Materials Analysis</div>
              <div className="text-xs text-gray-500">Material compatibility and impact</div>
            </div>
          </button>
          
          <button
            onClick={() => handleViewChange('ecological')}
            className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors ${
              currentView === 'ecological'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Leaf size={18} />
            <div>
              <div className="font-medium">Ecological Impact</div>
              <div className="text-xs text-gray-500">Ocean conditions and monitoring</div>
            </div>
          </button>

          {/* Add Compliance Navigation Button */}
          <button
            onClick={() => handleViewChange('compliance')}
            className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors ${
              currentView === 'compliance'
                ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Shield size={18} />
            <div>
              <div className="font-medium">Compliance</div>
              <div className="text-xs text-gray-500">Regulatory frameworks and permits</div>
            </div>
          </button>
        </nav>

        {/* Project Details */}
        {selectedProject && (
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 text-sm mb-2">Project Details</h4>
            <div className="space-y-1 text-xs text-gray-600">
              {selectedProject.waterDepth && (
                <div>Water Depth: {selectedProject.waterDepth}m</div>
              )}
              {selectedProject.waveExposure && (
                <div>Wave Exposure: {selectedProject.waveExposure}</div>
              )}
              {selectedProject.dimensions && (
                <div>
                  Dimensions: {selectedProject.dimensions.length}×{selectedProject.dimensions.width}×{selectedProject.dimensions.height}m
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Back to Projects */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleBackToLanding}
          className="w-full flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Home size={16} />
          <span>Back to Projects</span>
        </button>
      </div>
    </div>
  );

  // Modal Wrapper for the Wizard
  const WizardModal = () => {
    if (!showWizardModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">New Project Setup</h2>
              <p className="text-sm text-gray-600">Configure your marine infrastructure project</p>
            </div>
            <button
              onClick={handleCloseWizard}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          
          {/* Wizard Content */}
          <div className="flex-1 overflow-auto">
            <ProjectSetupWizard 
              onComplete={handleWizardComplete}
              isModal={true} // Pass a flag to adjust wizard styling if needed
            />
          </div>
        </div>
      </div>
    );
  };

  const getCurrentViewTitle = () => {
    switch (currentView) {
      case 'materials': return 'Materials Analysis';
      case 'ecological': return 'Ecological Impact';
      case 'compliance': return 'Compliance Dashboard';
      default: return 'Dashboard';
    }
  };

  return (
    <ProjectProvider>
      <div className="App">
        {currentView === 'landing' ? (
          // Landing Page View
          <ProjectsLandingPage
            onNavigateToProject={handleNavigateToProject}
            onCreateNewProject={handleCreateNewProject}
          />
        ) : (
          // Dashboard Views with Navigation
          <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <SimpleSidebar />
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <SimpleHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleBackToLanding}
                      className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ArrowLeft size={16} />
                      <span>Projects</span>
                    </button>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-600">{selectedProject?.projectName || selectedProject?.name || 'Project'}</span>
                    <span className="text-gray-400">/</span>
                    <span className="font-medium text-gray-900">
                      {getCurrentViewTitle()}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewChange('materials')}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        currentView === 'materials'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Materials
                    </button>
                    <button
                      onClick={() => handleViewChange('ecological')}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        currentView === 'ecological'
                          ? 'bg-green-100 text-green-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Ecological
                    </button>
                    {/* Add Compliance Header Button */}
                    <button
                      onClick={() => handleViewChange('compliance')}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        currentView === 'compliance'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Compliance
                    </button>
                    
                    <button
                      onClick={handleCreateNewProject}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm ml-2"
                    >
                      New Project
                    </button>
                  </div>
                </div>
              </SimpleHeader>
              
              {/* Dashboard Content */}
              <main className="flex-1 overflow-auto bg-gray-50">
                {currentView === 'materials' && <MaterialsDashboard />}
                {currentView === 'ecological' && <EcologicalDashboard />}
                {currentView === 'compliance' && <ComplianceDashboard />}
              </main>
            </div>
          </div>
        )}

        {/* Wizard Modal Overlay */}
        <WizardModal />
      </div>
    </ProjectProvider>
  );
}

export default App;