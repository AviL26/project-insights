import React, { useState } from 'react';
import { ProjectProvider } from './context/ProjectContext';
import Navigation from './components/shared/Navigation';
import MaterialsDashboard from './components/Materials/MaterialsDashboard';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('materials');

  const renderCurrentView = () => {
    switch (currentView) {
      case 'setup':
        return (
          <div className="p-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Project Setup Wizard</h2>
            <p className="text-gray-600 mb-8">Coming up next! This will be our comprehensive setup form.</p>
            <div className="bg-eco-blue-50 border border-eco-blue-200 rounded-lg p-6">
              <p className="text-eco-blue-800">✨ Ready to build the setup wizard component</p>
            </div>
          </div>
        );
      case 'materials':
        return <MaterialsDashboard />;
      case 'compliance':
        return (
          <div className="p-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Compliance Dashboard</h2>
            <p className="text-gray-600 mb-8">Regulatory tracking and approval workflows.</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <p className="text-yellow-800">⚖️ Compliance component planned</p>
            </div>
          </div>
        );
      case 'ecological':
        return (
          <div className="p-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ecological Impact</h2>
            <p className="text-gray-600 mb-8">Environmental benefits and biodiversity metrics.</p>
            <div className="bg-eco-cyan-50 border border-eco-cyan-200 rounded-lg p-6">
              <p className="text-eco-cyan-800">🌊 Ecological component planned</p>
            </div>
          </div>
        );
      default:
        return <MaterialsDashboard />;
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