// frontend/src/components/ComplianceDashboard/ComplianceChecklist.js
import React, { useState } from 'react';
import { useCompliance } from '../../context/ComplianceContext';
import { 
  FileText, 
  Clock, 
  AlertTriangle, 
  Building, 
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

const ComplianceChecklist = ({ rules, deadlines }) => {
  const { getRiskColor } = useCompliance();
  const [expandedItems, setExpandedItems] = useState(new Set());

  const toggleExpanded = (ruleId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId);
    } else {
      newExpanded.add(ruleId);
    }
    setExpandedItems(newExpanded);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDeadlineColor = (dateString) => {
    if (!dateString) return 'text-gray-500';
    
    const deadline = new Date(dateString);
    const now = new Date();
    const daysUntil = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) return 'text-red-600'; // Overdue
    if (daysUntil <= 30) return 'text-orange-600'; // Due soon
    if (daysUntil <= 90) return 'text-yellow-600'; // Upcoming
    return 'text-green-600'; // Plenty of time
  };

  if (!rules || rules.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center py-8">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No Regulatory Requirements Found
          </h3>
          <p className="text-gray-500">
            No specific compliance requirements identified for this location and project type.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Regulatory Requirements Checklist
            </h2>
            <p className="text-gray-600">
              {rules.length} requirement{rules.length !== 1 ? 's' : ''} identified for this project
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-500">
              Risk levels: 
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-200 rounded-full"></div>
              <span className="text-xs text-gray-600">High</span>
              <div className="w-3 h-3 bg-yellow-200 rounded-full ml-2"></div>
              <span className="text-xs text-gray-600">Medium</span>
              <div className="w-3 h-3 bg-green-200 rounded-full ml-2"></div>
              <span className="text-xs text-gray-600">Low</span>
            </div>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {rules.map((rule) => {
          const isExpanded = expandedItems.has(rule.id);
          
          return (
            <div key={rule.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Rule Header */}
                  <div className="flex items-start space-x-4">
                    <button
                      onClick={() => toggleExpanded(rule.id)}
                      className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown size={16} className="text-gray-500" />
                      ) : (
                        <ChevronRight size={16} className="text-gray-500" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                            {rule.requirement}
                          </h3>
                          
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-2">
                              <Building size={16} className="text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {rule.agency || 'Regulatory Authority'}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Clock size={16} className="text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {rule.deadline_type || 'Timeline not specified'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0 ml-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(rule.risk_level)}`}>
                            {rule.risk_level || 'Unknown'} Risk
                          </span>
                        </div>
                      </div>
                      
                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-4 pl-6 space-y-4">
                          {rule.details && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                              <p className="text-gray-700 leading-relaxed">
                                {rule.details}
                              </p>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Jurisdiction</h4>
                              <p className="text-gray-700">{rule.region}</p>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Project Type</h4>
                              <p className="text-gray-700 capitalize">{rule.project_type}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
                            <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
                              <ExternalLink size={16} />
                              <span>View full requirements</span>
                            </button>
                            
                            <button className="flex items-center space-x-2 text-green-600 hover:text-green-700 text-sm font-medium">
                              <Calendar size={16} />
                              <span>Add to calendar</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deadlines Section */}
      {deadlines && deadlines.length > 0 && (
        <div className="border-t border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Calendar size={20} className="text-blue-600" />
              <span>Upcoming Deadlines</span>
            </h3>
            
            <div className="space-y-3">
              {deadlines.map((deadline, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{deadline.task}</p>
                    <p className="text-sm text-gray-600">{deadline.framework}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-medium ${getDeadlineColor(deadline.due_date)}`}>
                      {formatDate(deadline.due_date)}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">
                      {deadline.priority} priority
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="p-6 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Last updated: {new Date().toLocaleDateString()}
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Print checklist
            </button>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Export to PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceChecklist;