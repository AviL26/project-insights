// frontend/src/components/ComplianceDashboard/ComplianceMap.js
import React from 'react';
import { MapPin, Map } from 'lucide-react';

const ComplianceMap = ({ location, rules }) => {
  // For now, this is a placeholder component
  // Leaflet integration will be added in Day 4
  
  if (!location) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center py-12">
          <Map size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Map Visualization
          </h3>
          <p className="text-gray-500">
            Location data required for map display
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <MapPin size={20} className="text-blue-600" />
          <span>Project Location & Regulatory Zones</span>
        </h3>
      </div>
      
      <div className="p-6">
        {/* Placeholder map area */}
        <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg h-64 flex items-center justify-center border-2 border-dashed border-blue-300">
          <div className="text-center">
            <Map size={48} className="mx-auto text-blue-500 mb-4" />
            <h4 className="text-lg font-semibold text-blue-700 mb-2">
              Interactive Map Coming Soon
            </h4>
            <p className="text-blue-600 mb-4">
              Leaflet map integration in development
            </p>
            
            {/* Location details */}
            <div className="bg-white bg-opacity-75 rounded-lg p-4 max-w-sm mx-auto">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Region:</span>
                  <span className="font-medium text-gray-900">{location.region}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Latitude:</span>
                  <span className="font-medium text-gray-900">{location.lat?.toFixed(6)}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Longitude:</span>
                  <span className="font-medium text-gray-900">{location.lon?.toFixed(6)}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Regulations:</span>
                  <span className="font-medium text-gray-900">{rules?.length || 0} found</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Map legend */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Map Legend (Coming Soon)</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>High-risk regulatory zones</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>Medium-risk areas</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Project location</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceMap;