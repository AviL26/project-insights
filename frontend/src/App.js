import React, { useState } from 'react';
import { ProjectProvider } from './context/ProjectContext';
import Navigation from './components/shared/Navigation';
import MaterialsDashboard from './components/Materials/MaterialsDashboard';
import ProjectSetupWizard from './components/ProjectSetup/ProjectSetupWizard';
import ComplianceDashboard from './components/Compliance/ComplianceDashboard';
import EcologicalDashboard from './components/Ecological/EcologicalDashboard';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('setup');

  const handleProjectComplete = (projectData) => {
    console.log('Project created:', projectData);
    setCurrentView('materials');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'setup':
        return <ProjectSetupWizard onComplete={handleProjectComplete} />;
      case 'materials':
        return <MaterialsDashboard />;
      case 'compliance':
        return <ComplianceDashboard />;
      case 'ecological':
        return <EcologicalDashboard />;
      default:
        return <ProjectSetupWizard onComplete={handleProjectComplete} />;
    }
  };

  return (
    <ProjectProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation currentView={currentView} setCurrentView={setCurrentView} />
        {renderCurrentView()}
      </div>
    </ProjectProvider>
  );
}

export default App;