// src/components/Navigation/Sidebar.jsx
import React from 'react';
import { 
  Building2, Leaf, BarChart3, Settings, HelpCircle, 
  MapPin, Calendar, TrendingUp, Waves, Activity
} from 'lucide-react';

const Sidebar = ({ currentView, onViewChange, selectedProject }) => {
  const navigationItems = [
    {
      id: 'materials',
      label: 'Materials Analysis',
      icon: Building2,
      description: 'Material compatibility and environmental impact'
    },
    {
      id: 'ecological',
      label: 'Ecological Impact',
      icon: Leaf,
      description: 'Ocean conditions and environmental monitoring'
    }
  ];

  const quickStats = selectedProject ? [
    {
      label: 'Location',
      value: selectedProject.location || 'Not specified',
      icon: MapPin
    },
    {
      label: 'Created',
      value: new Date(selectedProject.createdAt || Date.now()).toLocaleDateString(),
      icon: Calendar
    },
    {
      label: 'Status',
      value: 'Active',
      icon: TrendingUp
    }
  ] : [];

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
      {/* Project Info */}
      {selectedProject && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 size={20} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {selectedProject.name}
              </h3>
              <p className="text-sm text-gray-500">
                Marine Infrastructure
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-2">
            {quickStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2 text-gray-600">
                  <stat.icon size={14} />
                  <span>{stat.label}</span>
                </div>
                <span className="text-gray-900 font-medium truncate ml-2">
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 p-4">
        <nav className="space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Analysis Tools
          </div>
          
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-start space-x-3 px-3 py-3 rounded-lg text-left transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-gray-500 mt-1 leading-tight">
                    {item.description}
                  </div>
                </div>
                {isActive && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Environmental Status */}
        {selectedProject && currentView === 'ecological' && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2 mb-3">
              <Waves size={16} className="text-green-600" />
              <span className="text-sm font-medium text-green-900">Ocean Status</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-green-700">Temperature</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-900 font-medium">Normal</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-700">Wave Conditions</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-green-900 font-medium">Moderate</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-700">Data Quality</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-900 font-medium">Good</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="space-y-2">
          <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
            <Settings size={18} />
            <span>Settings</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
            <HelpCircle size={18} />
            <span>Help & Support</span>
          </button>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            Project Insights Tool v1.0
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;