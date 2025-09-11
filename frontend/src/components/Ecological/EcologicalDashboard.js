import React, { useState } from 'react';
import { Leaf, TrendingUp, Fish, Waves, TreePine, BarChart3, Target, Calendar, Zap, Award } from 'lucide-react';

const EcologicalDashboard = () => {
  const [selectedProject, setSelectedProject] = useState('Marina Breakwater - Tel Aviv');
  const [timeRange, setTimeRange] = useState('1-year');

  const projects = [
    'Marina Breakwater - Tel Aviv',
    'Coastal Protection - Haifa', 
    'Port Expansion - Ashdod'
  ];

  const ecoMetrics = {
    overallScore: 8.7,
    carbonSequestration: {
      annual: 125,
      projected5Year: 750,
      trend: 'increasing'
    },
    biodiversityIndex: {
      current: 7.2,
      baseline: 4.1,
      improvement: 75.6
    },
    habitatCreation: {
      totalArea: 2400,
      typesCovered: 6,
      speciesSupported: 34
    }
  };

  const targetSpecies = [
    {
      name: 'Mediterranean Grouper',
      scientificName: 'Epinephelus marginatus',
      status: 'thriving',
      population: 'increased',
      confidence: 'high',
      trend: 18
    },
    {
      name: 'Sea Bream',
      scientificName: 'Sparus aurata',
      status: 'stable',
      population: 'stable',
      confidence: 'medium',
      trend: 5
    },
    {
      name: 'Mediterranean Mussel',
      scientificName: 'Mytilus galloprovincialis',
      status: 'colonizing',
      population: 'increasing',
      confidence: 'high',
      trend: 42
    },
    {
      name: 'Brown Algae',
      scientificName: 'Cystoseira spp.',
      status: 'establishing',
      population: 'new',
      confidence: 'medium',
      trend: 15
    }
  ];

  const habitatTypes = [
    {
      type: 'Rocky Reef Community',
      area: 850,
      maturity: 85,
      keySpecies: 12,
      healthScore: 8.9
    },
    {
      type: 'Soft Sediment Areas',
      area: 600,
      maturity: 60,
      keySpecies: 8,
      healthScore: 7.2
    },
    {
      type: 'Algae Forest',
      area: 450,
      maturity: 40,
      keySpecies: 6,
      healthScore: 6.8
    },
    {
      type: 'Fish Aggregation Zones',
      area: 500,
      maturity: 70,
      keySpecies: 14,
      healthScore: 8.1
    }
  ];

  const monitoringData = [
    {
      metric: 'Water Quality Index',
      value: 8.4,
      unit: '/10',
      change: '+12%',
      status: 'improving'
    },
    {
      metric: 'Species Richness',
      value: 34,
      unit: 'species',
      change: '+41%',
      status: 'improving'
    },
    {
      metric: 'Biomass Density',
      value: 2.8,
      unit: 'kg/m²',
      change: '+23%',
      status: 'improving'
    },
    {
      metric: 'Substrate Complexity',
      value: 7.6,
      unit: '/10',
      change: '+8%',
      status: 'stable'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'thriving':
      case 'improving':
        return 'text-green-800 bg-green-100 border-green-200';
      case 'stable':
        return 'text-blue-800 bg-blue-100 border-blue-200';
      case 'colonizing':
      case 'establishing':
        return 'text-cyan-800 bg-cyan-100 border-cyan-200';
      default:
        return 'text-gray-800 bg-gray-100 border-gray-200';
    }
  };

  const getTrendIcon = (trend) => {
    if (trend > 10) return <TrendingUp size={16} className="text-green-600" />;
    if (trend > 0) return <TrendingUp size={16} className="text-blue-600" />;
    return <TrendingUp size={16} className="text-gray-400" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-cyan-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Ecological Impact Center</h1>
            <p className="text-green-100">Environmental monitoring and biodiversity tracking</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-green-200">Overall Eco Score</p>
              <p className="text-2xl font-bold">{ecoMetrics.overallScore}/10</p>
            </div>
            <button className="px-4 py-2 bg-white text-green-700 rounded-lg hover:bg-gray-100 flex items-center space-x-2 font-medium">
              <BarChart3 size={16} />
              <span>Impact Report</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
            <select 
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {projects.map(project => (
                <option key={project} value={project}>{project}</option>
              ))}
            </select>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="6-months">Last 6 Months</option>
              <option value="1-year">Last Year</option>
              <option value="2-years">Last 2 Years</option>
              <option value="all-time">All Time</option>
            </select>
          </div>
        </div>

        {/* Key Impact Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Carbon Sequestered</p>
                <p className="text-2xl font-bold text-green-600">{ecoMetrics.carbonSequestration.annual}</p>
                <p className="text-xs text-gray-500">tonnes CO₂/year</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Leaf size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Biodiversity Index</p>
                <p className="text-2xl font-bold text-cyan-600">{ecoMetrics.biodiversityIndex.current}</p>
                <p className="text-xs text-green-600">+{ecoMetrics.biodiversityIndex.improvement}% vs baseline</p>
              </div>
              <div className="p-3 bg-cyan-100 rounded-full">
                <Fish size={24} className="text-cyan-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Habitat Created</p>
                <p className="text-2xl font-bold text-blue-600">{ecoMetrics.habitatCreation.totalArea}</p>
                <p className="text-xs text-gray-500">m² new habitat</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Waves size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Species Supported</p>
                <p className="text-2xl font-bold text-emerald-600">{ecoMetrics.habitatCreation.speciesSupported}</p>
                <p className="text-xs text-gray-500">documented species</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <TreePine size={24} className="text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Species Monitoring */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border mb-6">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Target Species Monitoring</h2>
                <p className="text-gray-600">Key species population trends and health indicators</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {targetSpecies.map((species, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{species.name}</h3>
                          <p className="text-sm text-gray-500 italic">{species.scientificName}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getTrendIcon(species.trend)}
                          <span className="text-sm font-medium">+{species.trend}%</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-600">Status</p>
                          <span className={`inline-flex items-center px-2 py-1 rounded border text-xs font-medium ${getStatusColor(species.status)}`}>
                            {species.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Population</p>
                          <p className="text-sm font-medium text-gray-900">{species.population}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Confidence</p>
                          <p className="text-sm font-medium text-gray-900">{species.confidence}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Habitat Types */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Habitat Development</h2>
                <p className="text-gray-600">Created ecosystems and their maturity status</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {habitatTypes.map((habitat, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">{habitat.type}</h3>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Area</span>
                          <span className="text-sm font-medium">{habitat.area} m²</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Maturity</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-green-600 h-1.5 rounded-full" 
                                style={{ width: `${habitat.maturity}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{habitat.maturity}%</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Health Score</span>
                          <span className="text-sm font-bold text-green-600">{habitat.healthScore}/10</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* Environmental Monitoring */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <div className="flex items-center space-x-2">
                  <Target size={20} className="text-green-600" />
                  <h3 className="font-semibold text-gray-900">Live Monitoring</h3>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                {monitoringData.map((metric, index) => (
                  <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900">{metric.metric}</p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        metric.status === 'improving' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {metric.change}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">{metric.value}</span>
                      <span className="text-sm text-gray-500">{metric.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Carbon Impact */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <div className="flex items-center space-x-2">
                  <Zap size={20} className="text-green-600" />
                  <h3 className="font-semibold text-gray-900">Carbon Impact</h3>
                </div>
              </div>
              
              <div className="p-4">
                <div className="text-center mb-4">
                  <p className="text-2xl font-bold text-green-600">{ecoMetrics.carbonSequestration.annual}</p>
                  <p className="text-sm text-gray-600">tonnes CO₂ annually</p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">5-year projection:</span>
                    <span className="font-medium">{ecoMetrics.carbonSequestration.projected5Year} tonnes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Equivalent cars off road:</span>
                    <span className="font-medium">~{Math.round(ecoMetrics.carbonSequestration.annual * 2.3)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Achievement Badges */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <div className="flex items-center space-x-2">
                  <Award size={20} className="text-yellow-600" />
                  <h3 className="font-semibold text-gray-900">Achievements</h3>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                <div className="flex items-center space-x-3 p-2 bg-green-50 rounded">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Fish size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-900">Biodiversity Champion</p>
                    <p className="text-xs text-green-700">75% improvement vs baseline</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Waves size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Habitat Creator</p>
                    <p className="text-xs text-blue-700">2,400 m² new ecosystem</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-2 bg-cyan-50 rounded">
                  <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center">
                    <Leaf size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-cyan-900">Carbon Warrior</p>
                    <p className="text-xs text-cyan-700">125 tonnes CO₂ captured</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EcologicalDashboard;
