import React, { useState } from 'react';
import { Calculator, Package, MapPin, Layers, Download, BarChart3, Map, Maximize2 } from 'lucide-react';
import SimpleMap from '../shared/SimpleMap';

const MaterialsDashboard = () => {
  const [activeProject, setActiveProject] = useState('Marina Breakwater - Tel Aviv');
  const [selectedMaterial, setSelectedMaterial] = useState('bio-enhanced-concrete');
  const [mapExpanded, setMapExpanded] = useState(false);

  const projects = [
    {
      name: 'Marina Breakwater - Tel Aviv',
      coordinates: [32.0853, 34.7818],
      status: 'Active',
      progress: 75,
      type: 'Breakwater'
    },
    {
      name: 'Coastal Protection - Haifa',
      coordinates: [32.7940, 34.9896],
      status: 'Planning',
      progress: 25,
      type: 'Seawall'
    },
    {
      name: 'Port Expansion - Ashdod',
      coordinates: [31.7940, 34.6336],
      status: 'Approved',
      progress: 40,
      type: 'Port Infrastructure'
    }
  ];

  const materials = [
    {
      id: 'bio-enhanced-concrete',
      name: 'Bio-Enhanced Concrete',
      category: 'Primary Structure',
      quantity: 450,
      unit: 'm³',
      cost: 85000,
      availability: 'In Stock',
      ecological_benefit: 'High',
      color: 'bg-eco-blue-500'
    },
    {
      id: 'eco-armor-units',
      name: 'ECO Armor Units',
      category: 'Surface Enhancement',
      quantity: 120,
      unit: 'units',
      cost: 24000,
      availability: 'Made to Order',
      ecological_benefit: 'Very High',
      color: 'bg-eco-green-500'
    },
    {
      id: 'bio-aggregate',
      name: 'Bio-Aggregate Mix',
      category: 'Additive',
      quantity: 50,
      unit: 'tons',
      cost: 12000,
      availability: 'In Stock',
      ecological_benefit: 'Medium',
      color: 'bg-eco-cyan-500'
    },
    {
      id: 'calcium-carbonate',
      name: 'Marine Calcium Carbonate',
      category: 'Binding Agent',
      quantity: 25,
      unit: 'tons',
      cost: 8500,
      availability: 'Limited',
      ecological_benefit: 'High',
      color: 'bg-blue-500'
    }
  ];

  const projectStats = {
    totalCost: 129500,
    totalVolume: 645,
    ecoScore: 8.7,
    timelineWeeks: 12
  };

  const currentProject = projects.find(p => p.name === activeProject);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Command Center Header */}
      <div className="bg-gradient-to-r from-eco-blue-700 to-eco-blue-800 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">ECOncrete Command Center</h1>
            <p className="text-eco-blue-100">Real-time project oversight and material management</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-eco-blue-200">Active Projects</p>
              <p className="text-xl font-bold">{projects.length}</p>
            </div>
            <button className="px-4 py-2 bg-white text-eco-blue-700 rounded-lg hover:bg-gray-100 flex items-center space-x-2 font-medium">
              <Download size={16} />
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Top Row: Project Selector + Key Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          {/* Project Control Panel */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center space-x-2 mb-4">
                <MapPin size={20} className="text-eco-blue-600" />
                <span className="font-semibold text-gray-900">Project Control</span>
              </div>
              
              <select 
                value={activeProject} 
                onChange={(e) => setActiveProject(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-eco-blue-500 focus:border-transparent mb-4"
              >
                {projects.map(project => (
                  <option key={project.name} value={project.name}>{project.name}</option>
                ))}
              </select>

              {currentProject && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      currentProject.status === 'Active' ? 'bg-eco-green-100 text-eco-green-800' :
                      currentProject.status === 'Planning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-eco-blue-100 text-eco-blue-800'
                    }`}>
                      {currentProject.status}
                    </span>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-medium">{currentProject.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-eco-blue-600 h-2 rounded-full" 
                        style={{ width: `${currentProject.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600">Type: <span className="font-medium">{currentProject.type}</span></p>
                    <p className="text-sm text-gray-600">Location: <span className="font-medium">{currentProject.coordinates[0].toFixed(4)}, {currentProject.coordinates[1].toFixed(4)}</span></p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-xs">Total Cost</p>
                    <p className="text-lg font-bold text-gray-900">₪{projectStats.totalCost.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-eco-blue-100 rounded-full">
                    <Calculator size={16} className="text-eco-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-xs">Volume</p>
                    <p className="text-lg font-bold text-gray-900">{projectStats.totalVolume}m³</p>
                  </div>
                  <div className="p-2 bg-eco-green-100 rounded-full">
                    <Package size={16} className="text-eco-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-xs">Eco Score</p>
                    <p className="text-lg font-bold text-eco-green-600">{projectStats.ecoScore}/10</p>
                  </div>
                  <div className="p-2 bg-eco-cyan-100 rounded-full">
                    <BarChart3 size={16} className="text-eco-cyan-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-xs">Timeline</p>
                    <p className="text-lg font-bold text-gray-900">{projectStats.timelineWeeks}w</p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Layers size={16} className="text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Row */}
        <div className={`grid gap-6 ${mapExpanded ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
          
          {/* Map Panel */}
          <div className={`${mapExpanded ? 'col-span-1' : 'lg:col-span-1'}`}>
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Map size={20} className="text-eco-blue-600" />
                  <h3 className="font-semibold text-gray-900">Project Locations</h3>
                </div>
                <button 
                  onClick={() => setMapExpanded(!mapExpanded)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Maximize2 size={16} className="text-gray-500" />
                </button>
              </div>
              
              <div className="p-2">
                <SimpleMap 
                  projects={projects} 
                  activeProject={activeProject}
                  expanded={mapExpanded}
                />
              </div>
            </div>
          </div>

          {/* Materials Table */}
          <div className={`${mapExpanded ? 'hidden' : 'lg:col-span-2'}`}>
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900">Bill of Materials</h3>
                <p className="text-sm text-gray-600">Current project requirements</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 font-medium text-gray-900">Material</th>
                      <th className="text-right p-3 font-medium text-gray-900">Qty</th>
                      <th className="text-right p-3 font-medium text-gray-900">Cost</th>
                      <th className="text-center p-3 font-medium text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {materials.map((material) => (
                      <tr 
                        key={material.id} 
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedMaterial === material.id ? 'bg-eco-blue-50 border-l-4 border-eco-blue-500' : ''
                        }`}
                        onClick={() => setSelectedMaterial(material.id)}
                      >
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${material.color}`}></div>
                            <div>
                              <p className="font-medium text-gray-900">{material.name}</p>
                              <p className="text-xs text-gray-500">{material.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-right font-medium">{material.quantity} {material.unit}</td>
                        <td className="p-3 text-right font-medium">₪{(material.cost/1000).toFixed(0)}k</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            material.availability === 'In Stock' ? 'bg-eco-green-100 text-eco-green-800' :
                            material.availability === 'Made to Order' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {material.availability === 'In Stock' ? '✓' : 
                             material.availability === 'Made to Order' ? '⏱' : '⚠'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Material Detail Panel */}
        {selectedMaterial && !mapExpanded && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {materials.find(m => m.id === selectedMaterial)?.name} - Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-eco-blue-50 rounded-lg">
                <p className="text-sm text-eco-blue-600 font-medium">Technical Specs</p>
                <p className="text-eco-blue-900 text-sm mt-1">Marine-grade, pH optimized for coral growth</p>
              </div>
              <div className="p-4 bg-eco-green-50 rounded-lg">
                <p className="text-sm text-eco-green-600 font-medium">Ecological Impact</p>
                <p className="text-eco-green-900 text-sm mt-1">Supports biodiversity, carbon sequestration</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Delivery</p>
                <p className="text-purple-900 text-sm mt-1">2-3 weeks manufacturing + shipping</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialsDashboard;