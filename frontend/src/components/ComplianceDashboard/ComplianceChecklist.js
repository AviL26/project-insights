// frontend/src/components/ComplianceDashboard/ComplianceChecklist.js
import React, { useState } from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Calendar,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Download
} from 'lucide-react';

const ComplianceChecklist = ({ rules, deadlines }) => {
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [filterStatus, setFilterStatus] = useState('all');

  if (!rules || rules.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center py-8">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No Compliance Rules Available
          </h3>
          <p className="text-gray-500">
            Rules will appear here when compliance analysis is complete
          </p>
        </div>
      </div>
    );
  }

  const toggleExpanded = (ruleId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId);
    } else {
      newExpanded.add(ruleId);
    }
    setExpandedItems(newExpanded);
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'compliant':
        return <CheckCircle size={20} className="text-green-600" />;
      case 'pending':
        return <Clock size={20} className="text-yellow-600" />;
      case 'non-compliant':
      case 'violation':
        return <AlertTriangle size={20} className="text-red-600" />;
      default:
        return <Clock size={20} className="text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'compliant':
        return 'text-green-700 bg-green-100 border-green-200';
      case 'pending':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'non-compliant':
      case 'violation':
        return 'text-red-700 bg-red-100 border-red-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'text-red-700 bg-red-50 border-l-red-500';
      case 'medium':
        return 'text-yellow-700 bg-yellow-50 border-l-yellow-500';
      case 'low':
        return 'text-green-700 bg-green-50 border-l-green-500';
      default:
        return 'text-gray-700 bg-gray-50 border-l-gray-500';
    }
  };

  const filteredRules = rules.filter(rule => {
    if (filterStatus === 'all') return true;
    return rule.status?.toLowerCase() === filterStatus;
  });

  const statusCounts = rules.reduce((acc, rule) => {
    const status = rule.status?.toLowerCase() || 'pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Regulatory Compliance Checklist
          </h3>
          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="all">All Rules ({rules.length})</option>
              <option value="compliant">Compliant ({statusCounts.compliant || 0})</option>
              <option value="pending">Pending ({statusCounts.pending || 0})</option>
              <option value="non-compliant">Non-Compliant ({statusCounts['non-compliant'] || 0})</option>
            </select>
          </div>

          {/* Status Summary */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-green-700">{statusCounts.compliant || 0} Compliant</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock size={16} className="text-yellow-600" />
              <span className="text-yellow-700">{statusCounts.pending || 0} Pending</span>
            </div>
            <div className="flex items-center space-x-1">
              <AlertTriangle size={16} className="text-red-600" />
              <span className="text-red-700">{statusCounts['non-compliant'] || 0} Issues</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rules List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredRules.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No rules match the selected filter
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRules.map((rule, index) => {
              const isExpanded = expandedItems.has(rule.id || index);
              const hasDeadline = rule.deadline || rule.next_review;
              
              return (
                <div 
                  key={rule.id || index}
                  className={`border-l-4 ${getPriorityColor(rule.priority)}`}
                >
                  <div className="p-4">
                    {/* Rule Header */}
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleExpanded(rule.id || index)}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        {getStatusIcon(rule.status)}
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">
                              {rule.name || rule.title || 'Unnamed Rule'}
                            </h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(rule.status)}`}>
                              {rule.status || 'Pending'}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            {rule.authority && (
                              <span>Authority: {rule.authority}</span>
                            )}
                            {rule.framework && (
                              <span>Framework: {rule.framework}</span>
                            )}
                            {hasDeadline && (
                              <div className="flex items-center space-x-1">
                                <Calendar size={14} />
                                <span>Due: {rule.deadline || rule.next_review}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {rule.risk_level && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            rule.risk_level === 'High' ? 'bg-red-100 text-red-700' :
                            rule.risk_level === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {rule.risk_level} Risk
                          </span>
                        )}
                        
                        {isExpanded ? (
                          <ChevronDown size={20} className="text-gray-400" />
                        ) : (
                          <ChevronRight size={20} className="text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="mt-4 pl-8 space-y-3">
                        {rule.description && (
                          <div>
                            <h5 className="font-medium text-gray-900 mb-1">Description</h5>
                            <p className="text-sm text-gray-700">{rule.description}</p>
                          </div>
                        )}

                        {rule.requirements && rule.requirements.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">Requirements</h5>
                            <ul className="space-y-1">
                              {rule.requirements.map((req, idx) => (
                                <li key={idx} className="flex items-start space-x-2 text-sm">
                                  <span className="text-gray-400 mt-1">•</span>
                                  <span className="text-gray-700">{req}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {rule.actions && rule.actions.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">Required Actions</h5>
                            <div className="space-y-2">
                              {rule.actions.map((action, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                  <span className="text-gray-700">{action.description || action}</span>
                                  {action.status && (
                                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(action.status)}`}>
                                      {action.status}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {rule.references && rule.references.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">References</h5>
                            <div className="space-y-1">
                              {rule.references.map((ref, idx) => (
                                <a 
                                  key={idx}
                                  href={ref.url || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                                >
                                  <ExternalLink size={14} />
                                  <span>{ref.title || ref}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Deadlines Summary */}
      {deadlines && deadlines.length > 0 && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-2">Upcoming Deadlines</h4>
          <div className="space-y-1">
            {deadlines.slice(0, 3).map((deadline, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{deadline.title}</span>
                <span className="text-gray-600">{deadline.date}</span>
              </div>
            ))}
            {deadlines.length > 3 && (
              <div className="text-sm text-gray-500">
                +{deadlines.length - 3} more deadlines
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceChecklist;