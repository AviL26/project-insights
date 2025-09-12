import React, { useState, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import { 
  Leaf, 
  TrendingUp, 
  TrendingDown,
  Fish, 
  Waves, 
  TreePine, 
  Target, 
  Zap, 
  Award,
  Activity,
  Eye,
  Download,
  Filter,
  Search,
  AlertCircle,
  CheckCircle,
  Info,
  Clock,
  AlertTriangle
} from 'lucide-react';

const EcologicalDashboard = () => {
  const { state } = useProject();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1-year');
  const [selectedView, setSelectedView] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock loading effect
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Calculate ecological metrics based on project dimensions
  const calculateEcologicalMetrics = () => {
    if (!state.currentProject) return null;
    
    const { length, width, height } = state.currentProject;
    const surfaceArea = (2 * length * width) + (2 * length * height) + (2 * width * height);
    const volume = length * width * height;
    
    return {
      habitatArea: Math.round(surfaceArea * 1.2), // 20% more than surface area
      carbonSequestration: Math.round(volume * 0.1), // 0.1 tonnes CO2 per m3
      biodiversityScore: Math.min(95, Math.round(60 + (surfaceArea / 100))), // Scale with surface area
      speciesCapacity: Math.round(surfaceArea / 50) // 1 species per 50m2
    };
  };

  const projectMetrics = calculateEcologicalMetrics();

  const ecoMetrics = {
    overallScore: projectMetrics?.biodiversityScore || 85,
    carbonSequestration: {
      annual: projectMetrics?.carbonSequestration || 125,
      projected5Year: (projectMetrics?.carbonSequestration || 125) * 5,
      trend: 'increasing'
    },
    biodiversityIndex: {
      current: (projectMetrics?.biodiversityScore || 85) / 10,
      baseline: 4.1,
      improvement: Math.round(((projectMetrics?.biodiversityScore || 85) / 10 - 4.1) / 4.1 * 100)
    },
    habitatCreation: {
      totalArea: projectMetrics?.habitatArea || 2400,
      typesCovered: 6,
      speciesSupported: projectMetrics?.speciesCapacity || 34
    },
    waterQuality: {
      index: 8.4,
      ph: 8.1,
      oxygenLevel: 7.8,
      turbidity: 'low'
    }
  };

  const targetSpecies = [
    {
      name: 'Mediterranean Grouper',
      scientificName: 'Epinephelus marginatus',
      status: 'thriving',
      population: 'increased',
      confidence: 'high',
      trend: 18,
      criticalHabitat: 'Rocky Reef',
      conservationStatus: 'vulnerable'
    },
    {
      name: 'Sea Bream',
      scientificName: 'Sparus aurata',
      status: 'stable',
      population: 'stable',
      confidence: 'medium',
      trend: 5,
      criticalHabitat: 'Mixed Substrate',
      conservationStatus: 'least concern'
    },
    {
      name: 'Mediterranean Mussel',
      scientificName: 'Mytilus galloprovincialis',
      status: 'colonizing',
      population: 'increasing',
      confidence: 'high',
      trend: 42,
      criticalHabitat: 'Hard Substrate',
      conservationStatus: 'least concern'
    },
    {
      name: 'Brown Algae',
      scientificName: 'Cystoseira spp.',
      status: 'establishing',
      population: 'new',
      confidence: 'medium',
      trend: 15,
      criticalHabitat: 'Rocky Surfaces',
      conservationStatus: 'near threatened'
    },
    {
      name: 'Sea Urchin',
      scientificName: 'Paracentrotus lividus',
      status: 'monitoring',
      population: 'controlled',
      confidence: 'high',
      trend: -5,
      criticalHabitat: 'Rocky Reef',
      conservationStatus: 'least concern'
    }
  ];

  const habitatTypes = [
    {
      type: 'Rocky Reef Community',
      area: Math.round((projectMetrics?.habitatArea || 2400) * 0.35),
      maturity: 85,
      keySpecies: 12,
      healthScore: 8.9,
      description: 'Primary colonization surface for sessile organisms'
    },
    {
      type: 'Soft Sediment Areas',
      area: Math.round((projectMetrics?.habitatArea || 2400) * 0.25),
      maturity: 60,
      keySpecies: 8,
      healthScore: 7.2,
      description: 'Benthic communities and burrowing organisms'
    },
    {
      type: 'Algae Forest',
      area: Math.round((projectMetrics?.habitatArea || 2400) * 0.20),
      maturity: 40,
      keySpecies: 6,
      healthScore: 6.8,
      description: 'Primary productivity and nursery habitat'
    },
    {
      type: 'Fish Aggregation Zones',
      area: Math.round((projectMetrics?.habitatArea || 2400) * 0.20),
      maturity: 70,
      keySpecies: 14,
      healthScore: 8.1,
      description: 'Mobile species congregation areas'
    }
  ];

  const monitoringData = [
    {
      metric: 'Water Quality Index',
      value: ecoMetrics.waterQuality.index,
      unit: '/10',
      change: '+12%',
      status: 'improving',
      target: 8.5
    },
    {
      metric: 'Species Richness',
      value: ecoMetrics.habitatCreation.speciesSupported,
      unit: 'species',
      change: '+41%',
      status: 'improving',
      target: 40
    },
    {
      metric: 'Biomass Density',
      value: 2.8,
      unit: 'kg/m²',
      change: '+23%',
      status: 'improving',
      target: 3.5
    },
    {
      metric: 'pH Level',
      value: ecoMetrics.waterQuality.ph,
      unit: 'pH',
      change: '+2%',
      status: 'stable',
      target: 8.2
    },
    {
      metric: 'Dissolved Oxygen',
      value: ecoMetrics.waterQuality.oxygenLevel,
      unit: 'mg/L',
      change: '+8%',
      status: 'improving',
      target: 8.0
    }
  ];

  const filteredSpecies = targetSpecies.filter(species => 
    species.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    species.scientificName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
        ))}
      </div>
      <div className="bg-gray-200 h-64 rounded-lg"></div>
      <div className="bg-gray-200 h-96 rounded-lg"></div>
    </div>
  );

  const MetricCard = ({ title, value, subtitle, icon: Icon, trend, color = 'green', progress, target }) => (
    <div className={`bg-gradient-to-br from-${color}-50 to-${color}-100 p-6 rounded-xl border border-${color}-200 hover:shadow-md transition-all duration-200`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`p-2 bg-${color}-200 rounded-lg`}>
            <Icon size={20} className={`text-${color}-600`} />
          </div>
          {target && <Info size={16} className="text-gray-400 cursor-help" title={`Target: ${target}`} />}
        </div>
        {trend && (
          <div className="flex items-center space-x-1">
            {trend > 0 ? <TrendingUp size={16} className="text-green-500" /> : 
             trend < 0 ? <TrendingDown size={16} className="text-red-500" /> :
             <Activity size={16} className="text-gray-400" />}
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              trend > 0 ? 'bg-green-100 text-green-700' :
              trend < 0 ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {trend > 0 ? `+${trend}%` : trend < 0 ? `${trend}%` : 'Stable'}
            </span>
          </div>
        )}
      </div>
      <h3 className={`text-2xl font-bold text-${color}-900 mb-1`}>{value}</h3>
      <p className={`text-sm font-medium text-${color}-800 mb-1`}>{title}</p>
      {subtitle && <p className={`text-xs text-${color}-600`}>{subtitle}</p>}
      {progress && (
        <div className="mt-3">
          <div className={`w-full bg-${color}-200 rounded-full h-2`}>
            <div 
              className={`bg-${color}-600 h-2 rounded-full transition-all duration-1000`} 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'thriving': return 'text-green-800 bg-green-100 border-green-200';
      case 'stable': return 'text-blue-800 bg-blue-100 border-blue-200';
      case 'colonizing': return 'text-cyan-800 bg-cyan-100 border-cyan-200';
      case 'establishing': return 'text-yellow-800 bg-yellow-100 border-yellow-200';
      case 'monitoring': return 'text-orange-800 bg-orange-100 border-orange-200';
      default: return 'text-gray-800 bg-gray-100 border-gray-200';
    }
  };

  const getConservationStatusColor = (status) => {
    switch (status) {
      case 'vulnerable': return 'text-red-700 bg-red-100';
      case 'near threatened': return 'text-yellow-700 bg-yellow-100';
      case 'least concern': return 'text-green-700 bg-green-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getTrendIcon = (trend) => {
    if (trend > 10) return <TrendingUp size={16} className="text-green-600" />;
    if (trend > 0) return <TrendingUp size={16} className="text-blue-600" />;
    if (trend < 0) return <TrendingDown size={16} className="text-red-600" />;
    return <Activity size={16} className="text-gray-400" />;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Leaf size={24} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-400">Loading Ecological Analysis...</h2>
            <p className="text-sm text-gray-500">Processing environmental data</p>
          </div>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Leaf size={24} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Ecological Impact Assessment</h2>
            <p className="text-sm text-gray-600">Environmental monitoring for {state.currentProject?.name}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <select 
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="6-months">Last 6 Months</option>
            <option value="1-year">Last Year</option>
            <option value="2-years">Last 2 Years</option>
            <option value="projection">5-Year Projection</option>
          </select>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download size={18} />
            <span>Impact Report</span>
          </button>
        </div>
      </div>

      {/* Key Impact Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Carbon Sequestered"
          value={`${ecoMetrics.carbonSequestration.annual} tonnes`}
          subtitle={`CO₂/year • ${ecoMetrics.carbonSequestration.projected5Year} tonnes projected`}
          icon={Zap}
          trend={15}
          color="green"
          target="150 tonnes"
        />
        <MetricCard
          title="Biodiversity Index"
          value={ecoMetrics.biodiversityIndex.current.toFixed(1)}
          subtitle={`+${ecoMetrics.biodiversityIndex.improvement}% vs baseline (${ecoMetrics.biodiversityIndex.baseline})`}
          icon={Fish}
          trend={12}
          color="cyan"
          progress={ecoMetrics.overallScore}
        />
        <MetricCard
          title="Habitat Created"
          value={`${ecoMetrics.habitatCreation.totalArea.toLocaleString()} m²`}
          subtitle={`${ecoMetrics.habitatCreation.typesCovered} habitat types established`}
          icon={Waves}
          trend={8}
          color="blue"
        />
        <MetricCard
          title="Species Supported"
          value={ecoMetrics.habitatCreation.speciesSupported}
          subtitle={`Active monitoring • ${filteredSpecies.length} key species tracked`}
          icon={TreePine}
          trend={25}
          color="emerald"
        />
      </div>

      {/* Filters and Controls */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter size={18} className="text-gray-400" />
              <select
                value={selectedView}
                onChange={(e) => setSelectedView(e.target.value)}
                className="border-0 bg-transparent text-sm focus:ring-0 focus:outline-none"
              >
                <option value="overview">Overview</option>
                <option value="species">Species Detail</option>
                <option value="habitats">Habitat Analysis</option>
                <option value="monitoring">Live Monitoring</option>
              </select>
            </div>
            
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search species..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Eye size={16} />
              <span>Live monitoring active</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock size={16} />
              <span>Updated 15 min ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Species Monitoring */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Target Species Monitoring</h3>
                  <p className="text-sm text-gray-600 mt-1">Population trends and ecological indicators</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                  {filteredSpecies.length} Species Active
                </span>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {filteredSpecies.map((species, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{species.name}</h4>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(species.status)}`}>
                            {species.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 italic mb-1">{species.scientificName}</p>
                        <p className="text-xs text-gray-600">Critical Habitat: {species.criticalHabitat}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getTrendIcon(species.trend)}
                        <span className={`text-sm font-medium ${
                          species.trend > 0 ? 'text-green-600' : 
                          species.trend < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {species.trend > 0 ? '+' : ''}{species.trend}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Population</p>
                        <p className="font-medium text-gray-900 capitalize">{species.population}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Confidence</p>
                        <p className="font-medium text-gray-900 capitalize">{species.confidence}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Conservation Status</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getConservationStatusColor(species.conservationStatus)}`}>
                          {species.conservationStatus}
                        </span>
                      </div>
                      <div className="text-right">
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          View Details →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Habitat Development */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-6">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900">Habitat Development</h3>
              <p className="text-sm text-gray-600 mt-1">Ecosystem establishment and maturity progression</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {habitatTypes.map((habitat, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{habitat.type}</h4>
                      <span className="text-sm font-bold text-green-600">{habitat.healthScore}/10</span>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-3">{habitat.description}</p>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Area Coverage</span>
                        <span className="font-medium">{habitat.area.toLocaleString()} m²</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Maturity</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full transition-all duration-1000" 
                              style={{ width: `${habitat.maturity}%` }}
                            ></div>
                          </div>
                          <span className="font-medium text-sm">{habitat.maturity}%</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Key Species</span>
                        <span className="font-medium">{habitat.keySpecies} species</span>
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
          
          {/* Live Environmental Monitoring */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Activity size={20} className="text-green-600" />
                <h3 className="font-semibold text-gray-900">Live Monitoring</h3>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              {monitoringData.map((metric, index) => (
                <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900">{metric.metric}</p>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      metric.status === 'improving' ? 'bg-green-100 text-green-800' : 
                      metric.status === 'stable' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {metric.change}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl font-bold text-gray-900">{metric.value}</span>
                    <span className="text-sm text-gray-500">{metric.unit}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-green-600 h-1.5 rounded-full" 
                      style={{ width: `${(metric.value / metric.target) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Target: {metric.target}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Carbon Impact */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Zap size={20} className="text-green-600" />
              <h3 className="font-semibold text-green-900">Carbon Impact</h3>
            </div>
            
            <div className="text-center mb-4">
              <p className="text-3xl font-bold text-green-600">{ecoMetrics.carbonSequestration.annual}</p>
              <p className="text-sm text-green-700">tonnes CO₂ annually</p>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">5-year projection:</span>
                <span className="font-medium text-green-900">{ecoMetrics.carbonSequestration.projected5Year} tonnes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Cars equivalent:</span>
                <span className="font-medium text-green-900">~{Math.round(ecoMetrics.carbonSequestration.annual * 2.3)} cars/year</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Tree equivalent:</span>
                <span className="font-medium text-green-900">~{Math.round(ecoMetrics.carbonSequestration.annual * 45)} mature trees</span>
              </div>
            </div>
          </div>

          {/* Achievement Badges */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Award size={20} className="text-yellow-600" />
                <h3 className="font-semibold text-gray-900">Sustainability Achievements</h3>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <Fish size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-900">Biodiversity Champion</p>
                  <p className="text-xs text-green-700">{ecoMetrics.biodiversityIndex.improvement}% improvement achieved</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Waves size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">Habitat Creator</p>
                  <p className="text-xs text-blue-700">{ecoMetrics.habitatCreation.totalArea.toLocaleString()} m² ecosystem established</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center">
                  <Leaf size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-cyan-900">Carbon Warrior</p>
                  <p className="text-xs text-cyan-700">{ecoMetrics.carbonSequestration.annual} tonnes CO₂ captured</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Target size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-yellow-900">Water Quality Guardian</p>
                  <p className="text-xs text-yellow-700">8.4/10 quality index maintained</p>
                </div>
              </div>
            </div>
          </div>

          {/* Environmental Alerts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Environmental Alerts</h3>
            </div>
            
            <div className="p-4 space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle size={16} className="text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">Species Migration</p>
                  <p className="text-xs text-green-700">New grouper colony established in reef zone</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <AlertCircle size={16} className="text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">Algae Growth</p>
                  <p className="text-xs text-yellow-700">Monitor brown algae expansion rates</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Info size={16} className="text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Seasonal Change</p>
                  <p className="text-xs text-blue-700">Water temperature optimal for spawning</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <CheckCircle size={20} className="text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800 mb-2">Environmental Successes</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Biodiversity index exceeds target by {ecoMetrics.biodiversityIndex.improvement}%</li>
                <li>• {ecoMetrics.habitatCreation.speciesSupported} species successfully colonizing new habitat</li>
                <li>• Carbon sequestration ahead of {ecoMetrics.carbonSequestration.annual} tonnes/year target</li>
                <li>• Water quality consistently above 8.0/10 threshold</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle size={20} className="text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 mb-2">Monitoring Priorities</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Schedule quarterly species population surveys</li>
                <li>• Monitor algae forest development progress</li>
                <li>• Track vulnerable species (Mediterranean Grouper) closely</li>
                <li>• Maintain water quality monitoring protocols</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EcologicalDashboard;