import React from 'react';
import { Settings, Package, FileText, BarChart3 } from 'lucide-react';

const Navigation = ({ currentView, setCurrentView }) => {
  const navItems = [
    { id: 'setup', label: 'Project Setup', icon: Settings },
    { id: 'materials', label: 'Materials', icon: Package },
    { id: 'compliance', label: 'Compliance', icon: FileText },
    { id: 'ecological', label: 'Ecological', icon: BarChart3 }
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-eco-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="font-bold text-gray-900">ECOncrete Insights</span>
          </div>
          
          <div className="flex space-x-8">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === item.id
                      ? 'bg-eco-blue-100 text-eco-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
