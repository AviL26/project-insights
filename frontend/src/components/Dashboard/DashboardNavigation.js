import React from 'react';
import { Package, Shield, Leaf, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

const DashboardNavigation = ({ activeTab, onTabChange }) => {
  // Mock status indicators for each tab
  const mockStatuses = {
    materials: { status: 'complete', count: 4, label: 'items calculated' },
    compliance: { status: 'warning', count: 2, label: 'issues found' },
    ecological: { status: 'good', count: 85, label: '% biodiversity score' }
  };

  const getStatusIndicator = (tabId) => {
    const status = mockStatuses[tabId];
    if (!status) return null;

    const statusConfig = {
      complete: { color: 'text-green-600', icon: CheckCircle },
      warning: { color: 'text-yellow-600', icon: AlertTriangle },
      good: { color: 'text-green-600', icon: TrendingUp }
    };

    const config = statusConfig[status.status];
    if (!config) return null;

    const StatusIcon = config.icon;
    
    return (
      <div className="flex items-center space-x-1 mt-1">
        <StatusIcon size={12} className={config.color} />
        <span className={`text-xs ${config.color}`}>
          {status.count} {status.label}
        </span>
      </div>
    );
  };

  const tabs = [
    {
      id: 'materials',
      label: 'Materials',
      icon: Package,
      description: 'Bill of materials and cost analysis',
      badge: '4'
    },
    {
      id: 'compliance',
      label: 'Compliance',
      icon: Shield,
      description: 'Regulatory requirements and permits',
      badge: '!'
    },
    {
      id: 'ecological',
      label: 'Ecological',
      icon: Leaf,
      description: 'Environmental impact and biodiversity',
      badge: '85%'
    }
  ];

  return (
    <nav className="flex space-x-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex flex-col items-start space-y-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 min-w-32 ${
              isActive
                ? 'bg-eco-blue-100 text-eco-blue-700 border-2 border-eco-blue-200 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-2 border-transparent'
            }`}
            title={tab.description}
          >
            {/* Tab header with icon and badge */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                <Icon size={18} />
                <span>{tab.label}</span>
              </div>
              
              {/* Status badge */}
              {tab.badge && (
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  isActive 
                    ? 'bg-eco-blue-200 text-eco-blue-800' 
                    : tab.id === 'compliance'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-700'
                }`}>
                  {tab.badge}
                </span>
              )}
            </div>
            
            {/* Status indicator */}
            {getStatusIndicator(tab.id)}
            
            {/* Active tab indicator */}
            {isActive && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-eco-blue-600 rounded-full"></div>
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default DashboardNavigation;