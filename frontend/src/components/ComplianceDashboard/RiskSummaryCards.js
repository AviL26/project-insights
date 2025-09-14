// frontend/src/components/ComplianceDashboard/RiskSummaryCards.js
import React from 'react';
import { useCompliance } from '../../context/ComplianceContext';
import { 
  AlertTriangle, 
  Shield, 
  Clock, 
  FileText, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

const RiskSummaryCards = ({ riskSummary, location, recommendations }) => {
  const { getRiskColor } = useCompliance();

  if (!riskSummary) return null;

  const cards = [
    {
      title: 'Overall Risk Level',
      value: riskSummary.overallRisk,
      icon: riskSummary.overallRisk === 'High' ? AlertTriangle : 
            riskSummary.overallRisk === 'Medium' ? AlertCircle : CheckCircle,
      color: riskSummary.overallRisk === 'High' ? 'red' : 
             riskSummary.overallRisk === 'Medium' ? 'yellow' : 'green',
      subtitle: `Based on ${riskSummary.totalPermits} regulatory requirements`
    },
    {
      title: 'Total Permits Required',
      value: riskSummary.totalPermits,
      icon: FileText,
      color: 'blue',
      subtitle: `${riskSummary.highRiskItems} high priority items`
    },
    {
      title: 'High Risk Items',
      value: riskSummary.highRiskItems,
      icon: AlertTriangle,
      color: riskSummary.highRiskItems > 0 ? 'red' : 'green',
      subtitle: riskSummary.highRiskItems > 0 ? 'Requires immediate attention' : 'No high-risk items'
    },
    {
      title: 'Medium Risk Items',
      value: riskSummary.mediumRiskItems,
      icon: Clock,
      color: riskSummary.mediumRiskItems > 0 ? 'yellow' : 'green',
      subtitle: riskSummary.mediumRiskItems > 0 ? 'Plan accordingly' : 'No medium-risk items'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Risk Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {cards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <div 
              key={index}
              className={`bg-gradient-to-br from-${card.color}-50 to-${card.color}-100 p-6 rounded-xl border border-${card.color}-200 shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-3 bg-${card.color}-200 rounded-lg`}>
                  <IconComponent size={24} className={`text-${card.color}-600`} />
                </div>
                
                {/* Risk trend indicator */}
                {card.title === 'Overall Risk Level' && (
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(card.value)}`}>
                    {card.value}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className={`text-2xl font-bold text-${card.color}-900`}>
                  {typeof card.value === 'string' ? card.value : card.value}
                </h3>
                <p className={`text-sm font-medium text-${card.color}-800`}>
                  {card.title}
                </p>
                <p className={`text-xs text-${card.color}-600`}>
                  {card.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Location and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Location Summary */}
        {location && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Shield size={20} className="text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Analysis Location</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Region:</span>
                <span className="font-medium text-gray-900">{location.region || 'Unknown'}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Coordinates:</span>
                <span className="font-medium text-gray-900">
                  {location.lat?.toFixed(4)}°, {location.lon?.toFixed(4)}°
                </span>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Regulatory analysis covers this jurisdiction's marine infrastructure requirements.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp size={20} className="text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Key Recommendations</h3>
            </div>
            
            <div className="space-y-3">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-green-600 text-xs font-bold">{index + 1}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {recommendation}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-800">
                  These recommendations are based on the regulatory complexity and risk profile of your project.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskSummaryCards;