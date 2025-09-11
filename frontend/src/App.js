import React, { useState } from 'react';
import { ProjectProvider } from './context/ProjectContext';
import ProjectSetupWizard from './components/ProjectSetup/ProjectSetupWizard';
import IntegratedDashboard from './components/Dashboard/IntegratedDashboard';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('setup');
  const [activeTab, setActiveTab] = useState('materials');

  const handleProjectComplete = (projectData) => {
    console.log('Project created:', projectData);
    setCurrentView('dashboard');
    setActiveTab('materials'); // Start with materials tab
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <ProjectProvider>
      <div className="min-h-screen bg-gray-50">
        {currentView === 'setup' ? (
          <ProjectSetupWizard onComplete={handleProjectComplete} />
        ) : (
          <IntegratedDashboard 
            activeTab={activeTab} 
            onTabChange={handleTabChange}
            onNewProject={() => setCurrentView('setup')}
          />
        )}
      </div>
    </ProjectProvider>
  );
}

export default App;