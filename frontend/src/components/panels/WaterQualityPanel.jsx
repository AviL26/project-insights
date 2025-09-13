// src/App.js
import React, { useState } from 'react';
import { ProjectProvider } from './context/ProjectContext';
import ProjectsLandingPage from './components/ProjectsLandingPage';
import MaterialsDashboard from './components/Materials/MaterialsDashboard';
import EcologicalDashboard from './components/Ecological/EcologicalDashboard';
import Sidebar from './components/shared/Sidebar';
import Header from './components/shared/Header';
import CreateProjectModal from './components/shared/CreateProjectModal';
import { Home, ArrowLeft } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing', 'materials', 'ecological'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Navigation handlers
  const handleNavigateToProject = (project) => {
    setSelectedProject(project);
    setCurrentView('materials'); // Default to materials dashboard
  };

  const handleCreateNewProject = () => {
    setShowCreateModal(true);
  };

  const handleProjectCreated = (newProject) => {
    setSelectedProject(newProject);
    setCurrentView('materials');
    setShowCreateModal(false);
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    setSelectedProject(null);
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  // Navigation breadcrumb
  const getBreadcrumb = () => {
    if (currentView === 'landing') return 'Projects';
    
    const projectName = selectedProject?.name || 'Unknown Project';
    const viewName = currentView === 'materials' ? 'Materials Analysis' : 'Ecological Impact';
    
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={handleBackToLanding}
          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
        >
          <Home size={16} />
          <span>Projects</span>
        </button>
        <span className="text-gray-400">/</span>
        <span className="text-gray-600">{projectName}</span>
        <span className="text-gray-400">/</span>
        <span className="font-medium text-gray-900">{viewName}</span>
      </div>
    );
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
            <Sidebar 
              currentView={currentView}
              onViewChange={handleViewChange}
              selectedProject={selectedProject}
              onBackToLanding={handleBackToLanding}
            />
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <Header>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleBackToLanding}
                      className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ArrowLeft size={16} />
                      <span>Back to Projects</span>
                    </button>
                    <div className="text-sm text-gray-500">
                      {getBreadcrumb()}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {/* View Toggle Buttons */}
                    <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => handleViewChange('materials')}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          currentView === 'materials'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Materials
                      </button>
                      <button
                        onClick={() => handleViewChange('ecological')}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          currentView === 'ecological'
                            ? 'bg-white text-green-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Ecological
                      </button>
                    </div>
                    
                    <button
                      onClick={handleCreateNewProject}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      New Project
                    </button>
                  </div>
                </div>
              </Header>
              
              {/* Dashboard Content */}
              <main className="flex-1 overflow-auto bg-gray-50">
                {currentView === 'materials' && <MaterialsDashboard />}
                {currentView === 'ecological' && <EcologicalDashboard />}
              </main>
            </div>
          </div>
        )}

        {/* Create Project Modal */}
        {showCreateModal && (
          <CreateProjectModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onProjectCreated={handleProjectCreated}
          />
        )}
      </div>
    </ProjectProvider>
  );
}

export default App;