import React, { useState, useEffect } from 'react';
import { 
  Package, 
  TrendingUp, 
  AlertCircle, 
  Download, 
  Calculator,
  Truck,
  Clock,
  DollarSign,
  BarChart3
} from 'lucide-react';

const MaterialsDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('summary');

  // Mock loading effect
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Mock materials data
  const materialsData = {
    summary: {
      totalCost: 2350000,
      currency: '₪',
      totalVolume: 1250,
      deliveryWeeks: 8,
      costPerM3: 1880
    },
    breakdown: [
      { 
        category: 'ECOncrete Mix', 
        volume: 1250, 
        unit: 'm³', 
        unitCost: 1650, 
        total: 2062500,
        trend: 'stable',
        description: 'Bio-enhanced marine concrete'
      },
      { 
        category: 'Reinforcement Steel', 
        volume: 120, 
        unit: 'tonnes', 
        unitCost: 1800, 
        total: 216000,
        trend: 'up',
        description: 'Marine-grade rebar'
      },
      { 
        category: 'Formwork', 
        volume: 1500, 
        unit: 'm²', 
        unitCost: 35, 
        total: 52500,
        trend: 'down',
        description: 'Reusable aluminum forms'
      },
      { 
        category: 'Transport & Logistics', 
        volume: 1, 
        unit: 'project', 
        unitCost: 19000, 
        total: 19000,
        trend: 'stable',
        description: 'Delivery to site'
      }
    ]
  };

  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
        ))}
      </div>
      <div className="bg-gray-200 h-64 rounded-lg"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-200 h-48 rounded-lg"></div>
        <div className="bg-gray-200 h-48 rounded-lg"></div>
      </div>
    </div>
  );

  const MetricCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) => (
    <div className={`bg-gradient-to-r from-${color}-50 to-${color}-100 p-4 rounded-lg border border-${color}-200`}>
      <div className="flex items-center justify-between mb-2">
        <Icon size={20} className={`text-${color}-600`} />
        {trend && (
          <span className={`text-xs px-2 py-1 rounded-full ${
            trend === 'up' ? 'bg-red-100 text-red-700' :
            trend === 'down' ? 'bg-green-100 text-green-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
          </span>
        )}
      </div>
      <h3 className={`text-lg font-bold text-${color}-900`}>{value}</h3>
      <p className={`text-sm text-${color}-700`}>{title}</p>
      {subtitle && <p className={`text-xs text-${color}-600 mt-1`}>{subtitle}</p>}
    </div>
  );

  const MaterialsBreakdownTable = () => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Materials Breakdown</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Material Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trend
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {materialsData.breakdown.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{item.category}</div>
                    <div className="text-sm text-gray-500">{item.description}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.volume.toLocaleString()} {item.unit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₪{item.unitCost.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ₪{item.total.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.trend === 'up' ? 'bg-red-100 text-red-800' :
                    item.trend === 'down' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {item.trend === 'up' ? 'Rising' : item.trend === 'down' ? 'Falling' : 'Stable'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Package size={24} className="text-gray-400" />
          <h2 className="text-2xl font-semibold text-gray-400">Loading Materials Analysis...</h2>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with view selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Package size={24} className="text-eco-blue-600" />
          <h2 className="text-2xl font-semibold text-gray-900">Materials Analysis</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <select 
            value={selectedView}
            onChange={(e) => setSelectedView(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="summary">Summary View</option>
            <option value="detailed">Detailed Breakdown</option>
            <option value="timeline">Delivery Timeline</option>
          </select>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-eco-blue-600 text-white rounded-lg hover:bg-eco-blue-700">
            <Download size={18} />
            <span>Export BOM</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Project Cost"
          value={`₪${materialsData.summary.totalCost.toLocaleString()}`}
          subtitle={`₪${materialsData.summary.costPerM3}/m³`}
          icon={DollarSign}
          color="blue"
        />
        <MetricCard
          title="Concrete Volume"
          value={`${materialsData.summary.totalVolume.toLocaleString()} m³`}
          subtitle="Bio-enhanced marine concrete"
          icon={Package}
          color="green"
        />
        <MetricCard
          title="Delivery Timeline"
          value={`${materialsData.summary.deliveryWeeks} weeks`}
          subtitle="From order confirmation"
          icon={Clock}
          color="orange"
        />
        <MetricCard
          title="Transport Cost"
          value="₪19,000"
          subtitle="Included in breakdown"
          icon={Truck}
          color="purple"
        />
      </div>

      {/* Cost Distribution Chart Placeholder */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Cost Distribution</h3>
          <BarChart3 size={20} className="text-gray-400" />
        </div>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 size={48} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Interactive cost breakdown chart</p>
            <p className="text-sm text-gray-400">Chart visualization will be implemented here</p>
          </div>
        </div>
      </div>

      {/* Materials Breakdown Table */}
      <MaterialsBreakdownTable />

      {/* Action Items */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle size={20} className="text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">Action Items</h4>
            <ul className="mt-2 text-sm text-yellow-700 space-y-1">
              <li>• Steel prices trending upward - consider early procurement</li>
              <li>• Confirm delivery schedule with ECOncrete production team</li>
              <li>• Site access requirements need verification for transport</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialsDashboard;