// src/components/panels/InteractiveOceanConditionsPanel.jsx
import React, { useState, useMemo } from 'react';
import { 
  MapPin, Thermometer, Waves, Activity, TrendingUp, TrendingDown, 
  AlertCircle, AlertTriangle, CheckCircle, Map, BarChart3, Clock,
  Download, Share, Info
} from 'lucide-react';

const InteractiveOceanConditionsPanel = ({ oceanData, currentProject, loading, error, onLocationChange }) => {
  const [viewMode, setViewMode] = useState('metrics'); // 'metrics', 'trends', 'map'
  const [showDetails, setShowDetails] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null);

  // Generate mock historical data for trends
  const historicalData = useMemo(() => {
    if (!oceanData) return [];
    
    const generateTrend = (current, trend) => {
      const data = [];
      const baseValue = current;
      
      for (let i = 23; i >= 0; i--) {
        let value = baseValue;
        if (trend === 'up') value += (Math.random() - 0.7) * 2;
        else if (trend === 'down') value += (Math.random() - 0.3) * 2;
        else value += (Math.random() - 0.5) * 1;
        
        data.push({
          hour: i,
          temperature: trend === 'up' && i < 12 ? value + i * 0.1 : value,
          waveHeight: trend === 'down' && i < 12 ? Math.max(0.1, value - i * 0.05) : Math.max(0.1, value),
          timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        });
      }
      return data.reverse();
    };
    
    return generateTrend(oceanData.temperature?.current || 20, oceanData.temperature?.trend || 'stable');
  }, [oceanData]);

  // Environmental alerts system
  const alerts = useMemo(() => {
    if (!oceanData) return [];
    
    const alerts = [];
    
    // Temperature alerts
    if (oceanData.temperature?.current > 28) {
      alerts.push({
        type: 'warning',
        metric: 'temperature',
        message: 'High water temperature detected',
        impact: 'May affect marine ecosystem',
        severity: 'medium'
      });
    }
    
    // Wave height alerts  
    if (oceanData.waveHeight?.current > 3) {
      alerts.push({
        type: 'alert',
        metric: 'waves',
        message: 'High wave conditions',
        impact: 'Construction operations may be affected',
        severity: 'high'
      });
    }
    
    // pH alerts
    if (oceanData.phLevel?.status === 'concerning' || oceanData.phLevel?.status === 'critical') {
      alerts.push({
        type: 'warning',
        metric: 'ph',
        message: 'Ocean acidification detected',
        impact: 'Long-term ecosystem impact possible',
        severity: oceanData.phLevel?.status === 'critical' ? 'high' : 'medium'
      });
    }
    
    return alerts;
  }, [oceanData]);

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <TrendingUp size={16} className="text-red-500" />;
      case 'down': return <TrendingDown size={16} className="text-blue-500" />;
      default: return <Activity size={16} className="text-gray-500" />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up': return 'text-red-600';
      case 'down': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'concerning': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="text-red-500" size={16} />;
      case 'medium': return <AlertCircle className="text-orange-500" size={16} />;
      default: return <Info className="text-blue-500" size={16} />;
    }
  };

  const exportData = () => {
    if (!oceanData) return;
    
    const exportObj = {
      project: currentProject?.name || 'Unknown Project',
      location: oceanData.location,
      timestamp: new Date().toISOString(),
      conditions: {
        temperature: oceanData.temperature,
        salinity: oceanData.salinity,
        waveHeight: oceanData.waveHeight,
        phLevel: oceanData.phLevel
      },
      dataQuality: oceanData.dataQuality,
      sources: oceanData.sources
    };
    
    const dataStr = JSON.stringify(exportObj, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ocean-conditions-${currentProject?.name || 'data'}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Waves size={24} className="text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Ocean Conditions</h3>
        </div>
        <div className="animate-pulse">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
                <div className="h-3 bg-gray-200 rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!oceanData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <Waves size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-600">No Ocean Data Available</h3>
          <p className="text-gray-500">Unable to load ocean conditions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header with Controls */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 border-b border-blue-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Waves size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Ocean Conditions</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin size={14} />
                <span>{oceanData.location?.name}</span>
                <span className="text-gray-400">•</span>
                <span>Updated: {oceanData.lastUpdated}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-3 py-1 text-sm border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
            <button
              onClick={exportData}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Download size={14} />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex space-x-1 bg-white rounded-lg p-1">
          {[
            { id: 'metrics', label: 'Current Data', icon: Activity },
            { id: 'trends', label: '24hr Trends', icon: BarChart3 },
            { id: 'alerts', label: `Alerts ${alerts.length > 0 ? `(${alerts.length})` : ''}`, icon: AlertCircle }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setViewMode(id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Based on View Mode */}
      <div className="p-6">
        {viewMode === 'metrics' && (
          <div className="space-y-6">
            {/* Main Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Temperature */}
              <div 
                className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-100 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedMetric(selectedMetric === 'temperature' ? null : 'temperature')}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Thermometer size={16} className="text-orange-600" />
                    <span className="text-sm font-medium text-gray-700">Temperature</span>
                  </div>
                  {getTrendIcon(oceanData.temperature?.trend)}
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-gray-900">
                    {oceanData.temperature?.current}°C
                  </p>
                  <p className={`text-sm ${getTrendColor(oceanData.temperature?.trend)}`}>
                    {oceanData.temperature?.change} from avg
                  </p>
                  {showDetails && (
                    <p className="text-xs text-gray-500">
                      Source: {oceanData.temperature?.source}
                    </p>
                  )}
                </div>
              </div>

              {/* Wave Height */}
              <div 
                className="p-4 bg-gradient-to-br from-teal-50 to-green-50 rounded-lg border border-teal-100 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedMetric(selectedMetric === 'waves' ? null : 'waves')}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Waves size={16} className="text-teal-600" />
                    <span className="text-sm font-medium text-gray-700">Wave Height</span>
                  </div>
                  {getTrendIcon(oceanData.waveHeight?.trend)}
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-gray-900">
                    {oceanData.waveHeight?.current}m
                  </p>
                  <p className={`text-sm ${getTrendColor(oceanData.waveHeight?.trend)}`}>
                    {oceanData.waveHeight?.change} from yesterday
                  </p>
                  {showDetails && (
                    <p className="text-xs text-gray-500">
                      Source: {oceanData.waveHeight?.source}
                    </p>
                  )}
                </div>
              </div>

              {/* Salinity */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Activity size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Salinity</span>
                  </div>
                  {getTrendIcon(oceanData.salinity?.trend)}
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-gray-900">
                    {oceanData.salinity?.current} PSU
                  </p>
                  <p className={`text-sm ${getTrendColor(oceanData.salinity?.trend)}`}>
                    {oceanData.salinity?.change} this week
                  </p>
                </div>
              </div>

              {/* pH Level */}
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Activity size={16} className="text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">pH Level</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(oceanData.phLevel?.trend)}
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(oceanData.phLevel?.status)}`}>
                      {oceanData.phLevel?.status}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-gray-900">
                    {oceanData.phLevel?.current}
                  </p>
                  <p className={`text-sm ${getTrendColor(oceanData.phLevel?.trend)}`}>
                    {oceanData.phLevel?.change} this month
                  </p>
                </div>
              </div>
            </div>

            {/* Selected Metric Details */}
            {selectedMetric && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  {selectedMetric === 'temperature' ? 'Temperature' : 'Wave Height'} Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Current Value:</span>
                    <p className="font-medium">
                      {selectedMetric === 'temperature' 
                        ? `${oceanData.temperature?.current}°C`
                        : `${oceanData.waveHeight?.current}m`
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">24hr Change:</span>
                    <p className="font-medium">
                      {selectedMetric === 'temperature' 
                        ? oceanData.temperature?.change
                        : oceanData.waveHeight?.change
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Data Source:</span>
                    <p className="font-medium">
                      {selectedMetric === 'temperature' 
                        ? oceanData.temperature?.source
                        : oceanData.waveHeight?.source
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {viewMode === 'trends' && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">24-Hour Trends</h4>
              
              {/* Simple Trend Visualization */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Temperature Trend */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Temperature (°C)</span>
                    <span className="text-xs text-gray-500">Last 24 hours</span>
                  </div>
                  <div className="h-32 bg-white rounded border flex items-end justify-between p-2">
                    {historicalData.slice(-12).map((point, index) => (
                      <div
                        key={index}
                        className="bg-orange-400 rounded-t w-4 flex-1 mx-0.5"
                        style={{
                          height: `${Math.max(10, (point.temperature / 30) * 100)}%`,
                        }}
                        title={`${point.timestamp}: ${point.temperature.toFixed(1)}°C`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>12h ago</span>
                    <span>Now</span>
                  </div>
                </div>

                {/* Wave Height Trend */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Wave Height (m)</span>
                    <span className="text-xs text-gray-500">Last 24 hours</span>
                  </div>
                  <div className="h-32 bg-white rounded border flex items-end justify-between p-2">
                    {historicalData.slice(-12).map((point, index) => (
                      <div
                        key={index}
                        className="bg-teal-400 rounded-t w-4 flex-1 mx-0.5"
                        style={{
                          height: `${Math.max(10, (point.waveHeight / 4) * 100)}%`,
                        }}
                        title={`${point.timestamp}: ${point.waveHeight.toFixed(1)}m`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>12h ago</span>
                    <span>Now</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'alerts' && (
          <div className="space-y-4">
            {alerts.length > 0 ? (
              alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    alert.severity === 'high'
                      ? 'bg-red-50 border-red-400'
                      : alert.severity === 'medium'
                      ? 'bg-orange-50 border-orange-400'
                      : 'bg-blue-50 border-blue-400'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.severity)}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{alert.message}</h4>
                      <p className="text-sm text-gray-600 mt-1">{alert.impact}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          alert.severity === 'high'
                            ? 'bg-red-100 text-red-700'
                            : alert.severity === 'medium'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {alert.severity.toUpperCase()} PRIORITY
                        </span>
                        <span className="text-xs text-gray-500">
                          Related to: {alert.metric}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CheckCircle size={48} className="mx-auto mb-4 text-green-400" />
                <h4 className="font-medium text-gray-900 mb-2">No Active Alerts</h4>
                <p className="text-gray-600">All ocean conditions are within normal parameters.</p>
              </div>
            )}
          </div>
        )}

        {/* Data Quality Footer */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Environmental Impact Assessment</h4>
              <p className="text-sm text-gray-600 mt-1">
                {alerts.length === 0 
                  ? "Ocean conditions are within normal parameters for this region and season."
                  : `${alerts.length} environmental alert${alerts.length > 1 ? 's' : ''} detected. Review alerts for details.`
                }
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Data Quality</p>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      oceanData.dataQuality > 80 ? 'bg-green-500' :
                      oceanData.dataQuality > 60 ? 'bg-yellow-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${oceanData.dataQuality}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">{oceanData.dataQuality}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveOceanConditionsPanel;