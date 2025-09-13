import React, { useState, useEffect, useCallback } from 'react';
import { Shield, AlertTriangle, Clock, FileText, Users, Calendar, ExternalLink } from 'lucide-react';
import { complianceAPI, projectsAPI } from '../../services/api';

const ComplianceDashboard = () => {
  const [selectedFramework, setSelectedFramework] = useState('all');
  const [selectedProject, setSelectedProject] = useState('');
  const [projects, setProjects] = useState([]);
  const [complianceData, setComplianceData] = useState({ 
    frameworks: [], 
    permits: [], 
    deadlines: [] 
  });
  const [loading, setLoading] = useState(true);

  // Load compliance data for selected project
  const loadComplianceData = useCallback(async (projectId) => {
    try {
      setLoading(true);
      const response = await complianceAPI.getByProject(projectId);
      setComplianceData(response.data);
    } catch (error) {
      console.error('Failed to load compliance data for project:', error);
      // Fallback to demo data
      loadDemoData();
    } finally {
      setLoading(false);
    }
  }, []);

  // Load demo data as fallback
  const loadDemoData = useCallback(async () => {
    try {
      const response = await complianceAPI.getDemo();
      setComplianceData(response.data);
    } catch (error) {
      console.error('Failed to load demo data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load projects on component mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await projectsAPI.getAll();
        setProjects(response.data);
        if (response.data.length > 0) {
          setSelectedProject(response.data[0].name);
          loadComplianceData(response.data[0].id);
        } else {
          // No projects, use demo data
          loadDemoData();
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
        loadDemoData();
      }
    };
    loadProjects();
  }, [loadComplianceData, loadDemoData]);

  // Handle project selection change
  const handleProjectChange = (projectName) => {
    setSelectedProject(projectName);
    const project = projects.find(p => p.name === projectName);
    if (project) {
      loadComplianceData(project.id);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'compliant':
      case 'approved':
        return 'text-green-800 bg-green-100';
      case 'in-progress':
      case 'under-review':
        return 'text-yellow-800 bg-yellow-100';
      case 'pending':
        return 'text-red-800 bg-red-100';
      default:
        return 'text-gray-800 bg-gray-100';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'medium':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'high':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const filteredFrameworks = selectedFramework === 'all' 
    ? complianceData.frameworks 
    : complianceData.frameworks.filter(f => f.id === selectedFramework);

  const calculateComplianceScore = () => {
    if (complianceData.frameworks.length === 0) return 0;
    const totalCompleted = complianceData.frameworks.reduce((sum, f) => sum + (f.completed || 0), 0);
    const totalRequired = complianceData.frameworks.reduce((sum, f) => sum + (f.requirements || 0), 0);
    return totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 0;
  };

  const getHighRiskCount = () => {
    return complianceData.frameworks.filter(f => f.risk_level === 'high').length;
  };

  const getApprovedPermits = () => {
    return complianceData.permits.filter(p => p.status === 'approved').length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading compliance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Compliance Command Center</h1>
            <p className="text-yellow-100">Regulatory oversight and risk management</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-yellow-200">Active Frameworks</p>
              <p className="text-xl font-bold">{complianceData.frameworks.length}</p>
            </div>
            <button className="px-4 py-2 bg-white text-yellow-700 rounded-lg hover:bg-gray-100 flex items-center space-x-2 font-medium">
              <FileText size={16} />
              <span>Generate Report</span>
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
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="">Select a project</option>
              {projects.map(project => (
                <option key={project.id} value={project.name}>{project.name}</option>
              ))}
            </select>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Framework Filter</label>
            <select 
              value={selectedFramework}
              onChange={(e) => setSelectedFramework(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="all">All Frameworks</option>
              {complianceData.frameworks.map(framework => (
                <option key={framework.id} value={framework.id}>{framework.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Compliance Score</p>
                <p className="text-2xl font-bold text-green-600">{calculateComplianceScore()}%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Shield size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Permits</p>
                <p className="text-2xl font-bold text-gray-900">{getApprovedPermits()}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">High Risk Items</p>
                <p className="text-2xl font-bold text-red-600">{getHighRiskCount()}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Upcoming Deadlines</p>
                <p className="text-2xl font-bold text-yellow-600">{complianceData.deadlines.length}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock size={24} className="text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Compliance Frameworks */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Regulatory Frameworks</h2>
                <p className="text-gray-600">Compliance status and requirements tracking</p>
              </div>
              
              <div className="p-6 space-y-4">
                {filteredFrameworks.length > 0 ? (
                  filteredFrameworks.map(framework => (
                    <div key={framework.id} className={`border rounded-lg p-4 ${getRiskColor(framework.risk_level)}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{framework.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(framework.status)}`}>
                          {framework.status.replace('-', ' ')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-600">Progress</p>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${((framework.completed || 0) / (framework.requirements || 1)) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{framework.completed || 0}/{framework.requirements || 0}</span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600">Risk Level</p>
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            framework.risk_level === 'high' ? 'text-red-700 bg-red-100' :
                            framework.risk_level === 'medium' ? 'text-yellow-700 bg-yellow-100' :
                            'text-green-700 bg-green-100'
                          }`}>
                            {framework.risk_level}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Last Review: {framework.last_review || 'N/A'}</span>
                        <span>Next Review: {framework.next_review || 'N/A'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Shield size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>No compliance frameworks found for this project</p>
                    <p className="text-sm">Data will appear here as frameworks are added</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <div className="flex items-center space-x-2">
                  <Calendar size={20} className="text-yellow-600" />
                  <h3 className="font-semibold text-gray-900">Upcoming Deadlines</h3>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                {complianceData.deadlines.length > 0 ? (
                  complianceData.deadlines.map((deadline, index) => (
                    <div key={index} className={`border-l-4 pl-3 py-2 ${getPriorityColor(deadline.priority)}`}>
                      <p className="font-medium text-gray-900 text-sm">{deadline.task}</p>
                      <p className="text-xs text-gray-600 mb-1">{deadline.framework}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Due: {deadline.due_date}</span>
                        <span className="text-xs font-medium text-gray-700">{deadline.priority}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <Clock size={24} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No upcoming deadlines</p>
                  </div>
                )}
              </div>
            </div>

            {/* Permits Status */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <div className="flex items-center space-x-2">
                  <FileText size={20} className="text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Permits & Licenses</h3>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                {complianceData.permits.length > 0 ? (
                  complianceData.permits.map(permit => (
                    <div key={permit.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900 text-sm">{permit.name}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(permit.status)}`}>
                          {permit.status.replace('-', ' ')}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-1">{permit.authority}</p>
                      
                      {permit.status === 'approved' ? (
                        <div className="text-xs text-gray-500">
                          <p>Issued: {permit.issue_date}</p>
                          <p>Expires: {permit.expiry_date}</p>
                          {permit.conditions > 0 && (
                            <p className="text-yellow-600">{permit.conditions} conditions</p>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500">
                          <p>Submitted: {permit.submission_date}</p>
                          <p>Expected: {permit.expected_decision}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <FileText size={24} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No permits found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900">Quick Actions</h3>
              </div>
              
              <div className="p-4 space-y-2">
                <button className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm flex items-center space-x-2">
                  <Users size={16} className="text-gray-400" />
                  <span>Schedule stakeholder meeting</span>
                </button>
                <button className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm flex items-center space-x-2">
                  <FileText size={16} className="text-gray-400" />
                  <span>Submit monitoring report</span>
                </button>
                <button className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm flex items-center space-x-2">
                  <ExternalLink size={16} className="text-gray-400" />
                  <span>View regulatory portal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceDashboard;