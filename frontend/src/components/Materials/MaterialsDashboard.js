import React, { useState, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import { 
  Package, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  Download, 
  Truck,
  Clock,
  DollarSign,
  BarChart3,
  Calculator,
  Factory,
  MapPin,
  Calendar,
  CheckCircle,
  AlertCircle,
  Info,
  Filter,
  Search
} from 'lucide-react';

const MaterialsDashboard = () => {
  const { state } = useProject();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('summary');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock loading effect
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Calculate materials based on actual project dimensions
  const calculateMaterialsFromProject = () => {
    if (!state.currentProject) return null;
    
    const { length, width, height } = state.currentProject;
    const volume = length * width * height;
    const surfaceArea = (2 * length * width) + (2 * length * height) + (2 * width * height);
    
    return {
      volume: Math.round(volume),
      surfaceArea: Math.round(surfaceArea),
      reinforcement: Math.round(volume * 0.1), // 10% of volume in tonnes
      formwork: Math.round(surfaceArea * 1.2) // 20% more than surface area
    };
  };

  const projectCalcs = calculateMaterialsFromProject();

  // Enhanced materials data with project-specific calculations
  const materialsData = {
    summary: {
      totalCost: projectCalcs ? projectCalcs.volume * 1880 : 2350000,
      currency: '₪',
      totalVolume: projectCalcs?.volume || 1250,
      deliveryWeeks: 8,
      costPerM3: 1880,
      savings: 15.3,
      carbonFootprint: projectCalcs ? Math.round(projectCalcs.volume * 0.2) : 250
    },
    breakdown: [
      { 
        id: 'concrete',
        category: 'ECOncrete Bio-Enhanced Mix', 
        volume: projectCalcs?.volume || 1250, 
        unit: 'm³', 
        unitCost: 1650, 
        total: (projectCalcs?.volume || 1250) * 1650,
        trend: 'stable',
        description: 'Marine-grade bio-enhanced concrete with calcium carbonate additives',
        supplier: 'ECOncrete Tech Ltd.',
        leadTime: '3-4 weeks',
        availability: 'in-stock',
        sustainability: 'high'
      },
      { 
        id: 'steel',
        category: 'Marine Grade Reinforcement Steel', 
        volume: projectCalcs?.reinforcement || 120, 
        unit: 'tonnes', 
        unitCost: 1800, 
        total: (projectCalcs?.reinforcement || 120) * 1800,
        trend: 'up',
        description: 'Corrosion-resistant rebar with enhanced marine coating',
        supplier: 'Mediterranean Steel Co.',
        leadTime: '2-3 weeks',
        availability: 'limited',
        sustainability: 'medium'
      },
      { 
        id: 'formwork',
        category: 'Aluminum Formwork System', 
        volume: projectCalcs?.formwork || 1500, 
        unit: 'm²', 
        unitCost: 35, 
        total: (projectCalcs?.formwork || 1500) * 35,
        trend: 'down',
        description: 'Reusable precision-formed aluminum panels',
        supplier: 'FormTech Solutions',
        leadTime: '4-6 weeks',
        availability: 'in-stock',
        sustainability: 'high'
      },
      { 
        id: 'additives',
        category: 'Bio-Enhancement Additives', 
        volume: Math.round((projectCalcs?.volume || 1250) * 0.02), 
        unit: 'tonnes', 
        unitCost: 2500, 
        total: Math.round((projectCalcs?.volume || 1250) * 0.02) * 2500,
        trend: 'stable',
        description: 'Proprietary biological growth enhancers',
        supplier: 'ECOncrete Tech Ltd.',
        leadTime: '1-2 weeks',
        availability: 'in-stock',
        sustainability: 'high'
      },
      { 
        id: 'transport',
        category: 'Transport & Logistics', 
        volume: 1, 
        unit: 'project', 
        unitCost: 19000, 
        total: 19000,
        trend: 'stable',
        description: 'Specialized marine transport and on-site delivery',
        supplier: 'Marine Transport Ltd.',
        leadTime: '1 week',
        availability: 'scheduled',
        sustainability: 'low'
      }
    ]
  };

  const filteredMaterials = materialsData.breakdown.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.id === selectedCategory;
    const matchesSearch = item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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

  const MetricCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue', info }) => (
    <div className={`bg-gradient-to-br from-${color}-50 to-${color}-100 p-6 rounded-xl border border-${color}-200 hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`p-2 bg-${color}-200 rounded-lg`}>
            <Icon size={20} className={`text-${color}-600`} />
          </div>
          {info && <Info size={16} className="text-gray-400 cursor-help" title={info} />}
        </div>
        {trend && (
          <div className="flex items-center space-x-1">
            {trend === 'up' ? <TrendingUp size={16} className="text-red-500" /> : 
             trend === 'down' ? <TrendingDown size={16} className="text-green-500" /> :
             <div className="w-4 h-4 bg-gray-300 rounded-full"></div>}
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              trend === 'up' ? 'bg-red-100 text-red-700' :
              trend === 'down' ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {trend === 'up' ? 'Rising' : trend === 'down' ? 'Falling' : 'Stable'}
            </span>
          </div>
        )}
      </div>
      <h3 className={`text-2xl font-bold text-${color}-900 mb-1`}>{value}</h3>
      <p className={`text-sm font-medium text-${color}-800 mb-1`}>{title}</p>
      {subtitle && <p className={`text-xs text-${color}-600`}>{subtitle}</p>}
    </div>
  );

  const getAvailabilityColor = (availability) => {
    switch (availability) {
      case 'in-stock': return 'text-green-700 bg-green-100';
      case 'limited': return 'text-yellow-700 bg-yellow-100';
      case 'scheduled': return 'text-blue-700 bg-blue-100';
      case 'backordered': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getSustainabilityColor = (level) => {
    switch (level) {
      case 'high': return 'text-green-700 bg-green-100';
      case 'medium': return 'text-yellow-700 bg-yellow-100';
      case 'low': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Package size={24} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-400">Loading Materials Analysis...</h2>
            <p className="text-sm text-gray-500">Calculating project requirements</p>
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
          <div className="p-2 bg-blue-100 rounded-lg">
            <Package size={24} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Materials Analysis</h2>
            <p className="text-sm text-gray-600">Bill of materials for {state.currentProject?.name}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <select 
              value={selectedView}
              onChange={(e) => setSelectedView(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="summary">Summary View</option>
              <option value="detailed">Detailed Breakdown</option>
              <option value="procurement">Procurement Plan</option>
              <option value="sustainability">Sustainability Report</option>
            </select>
            
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download size={18} />
              <span>Export BOM</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Project Cost"
          value={`₪${materialsData.summary.totalCost.toLocaleString()}`}
          subtitle={`₪${materialsData.summary.costPerM3}/m³ • ${materialsData.summary.savings}% savings`}
          icon={DollarSign}
          trend="down"
          color="blue"
          info="Compared to traditional concrete solutions"
        />
        <MetricCard
          title="Concrete Volume"
          value={`${materialsData.summary.totalVolume.toLocaleString()} m³`}
          subtitle="Bio-enhanced marine concrete with growth enhancers"
          icon={Factory}
          color="green"
          info="Volume calculated from project dimensions"
        />
        <MetricCard
          title="Delivery Timeline"
          value={`${materialsData.summary.deliveryWeeks} weeks`}
          subtitle="Critical path: Formwork delivery (4-6 weeks)"
          icon={Clock}
          color="orange"
          info="From order confirmation to site delivery"
        />
        <MetricCard
          title="Carbon Footprint"
          value={`${materialsData.summary.carbonFootprint} tonnes`}
          subtitle={`CO₂ equivalent • 30% lower than traditional`}
          icon={Truck}
          trend="down"
          color="purple"
          info="Including transport and production emissions"
        />
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter size={18} className="text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border-0 bg-transparent text-sm focus:ring-0 focus:outline-none"
              >
                <option value="all">All Materials</option>
                <option value="concrete">Concrete</option>
                <option value="steel">Steel & Reinforcement</option>
                <option value="formwork">Formwork</option>
                <option value="additives">Additives</option>
                <option value="transport">Transport</option>
              </select>
            </div>
            
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            {filteredMaterials.length} of {materialsData.breakdown.length} items
          </div>
        </div>
      </div>

      {/* Materials Breakdown Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Materials Breakdown</h3>
            <span className="text-sm text-gray-600">{selectedView.charAt(0).toUpperCase() + selectedView.slice(1)} View</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Material
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Cost
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Cost
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Availability
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sustainability
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMaterials.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.category}</div>
                      <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                      <div className="text-xs text-blue-600 mt-1">{item.supplier}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-medium">{item.volume.toLocaleString()} {item.unit}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₪{item.unitCost.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₪{item.total.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAvailabilityColor(item.availability)}`}>
                      {item.availability.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.leadTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSustainabilityColor(item.sustainability)}`}>
                      {item.sustainability}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cost Distribution and Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Distribution */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Cost Distribution</h3>
            <BarChart3 size={20} className="text-gray-400" />
          </div>
          <div className="space-y-3">
            {materialsData.breakdown.map((item, index) => {
              const percentage = (item.total / materialsData.summary.totalCost) * 100;
              return (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{item.category}</span>
                    <span className="font-medium">{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        index === 0 ? 'bg-blue-600' :
                        index === 1 ? 'bg-green-600' :
                        index === 2 ? 'bg-yellow-600' :
                        index === 3 ? 'bg-purple-600' : 'bg-gray-600'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Procurement Timeline */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Procurement Timeline</h3>
            <Calendar size={20} className="text-gray-400" />
          </div>
          <div className="space-y-4">
            {materialsData.breakdown
              .sort((a, b) => parseInt(a.leadTime) - parseInt(b.leadTime))
              .map((item, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-3 h-3 rounded-full ${
                    item.availability === 'in-stock' ? 'bg-green-500' :
                    item.availability === 'limited' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.category}</p>
                    <p className="text-xs text-gray-600">{item.leadTime} • {item.supplier}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">₪{item.total.toLocaleString()}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Action Items and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle size={20} className="text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 mb-2">Action Items</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Steel prices trending upward - consider early procurement</li>
                <li>• Formwork lead time is critical path - order immediately</li>
                <li>• Confirm bio-additive availability for project start date</li>
                <li>• Schedule marine transport coordination meeting</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <CheckCircle size={20} className="text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800 mb-2">Optimization Opportunities</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• 15.3% cost savings vs traditional concrete achieved</li>
                <li>• 30% lower carbon footprint with bio-enhanced mix</li>
                <li>• Bulk ordering discount available for concrete volume</li>
                <li>• Reusable formwork reduces waste by 80%</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialsDashboard;