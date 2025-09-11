import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Clock, FileText, Users, Calendar, ExternalLink } from 'lucide-react';

const ComplianceDashboard = () => {
  const [selectedFramework, setSelectedFramework] = useState('all');
  const [selectedProject, setSelectedProject] = useState('Marina Breakwater - Tel Aviv');

  const projects = [
    'Marina Breakwater - Tel Aviv',
    'Coastal Protection - Haifa', 
    'Port Expansion - Ashdod'
  ];

  const complianceFrameworks = [
    {
      id: 'eu-water',
      name: 'EU Water Framework Directive',
      status: 'compliant',
      lastReview: '2024-02-15',
      nextReview: '2025-02-15',
      requirements: 8,
      completed: 8,
      riskLevel: 'low'
    },
    {
      id: 'marine-strategy',
      name: 'Marine Strategy Framework Directive',
      status: 'in-progress',
      lastReview: '2024-01-20',
      nextReview: '2024-12-20',
      requirements: 12,
      completed: 9,
      riskLevel: 'medium'
    },
    {
      id: 'eia',
      name: 'Environmental Impact Assessment',
      status: 'pending',
      lastReview: '2024-03-10',
      nextReview: '2024-09-10',
      requirements: 15,
      completed: 6,
      riskLevel: 'high'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Compliance Command Center</h1>
            <p className="text-yellow-100">Regulatory oversight and risk management</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-yellow-200">Active Frameworks</p>
              <p className="text-xl font-bold">{complianceFrameworks.length}</p>
            </div>
            <button className="px-4 py-2 bg-white text-yellow-700 rounded-lg hover:bg-gray-100 flex items-center space-x-2 font-medium">
              <FileText size={16} />
              <span>Generate Report</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Compliance Score</p>
                <p className="text-2xl font-bold text-green-600">87%</p>
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
                <p className="text-2xl font-bold text-gray-900">3</p>
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
                <p className="text-2xl font-bold text-red-600">1</p>
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
                <p className="text-2xl font-bold text-yellow-600">3</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock size={24} className="text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Regulatory Frameworks</h2>
          
          <div className="space-y-4">
            {complianceFrameworks.map(framework => (
              <div key={framework.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{framework.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    framework.status === 'compliant' ? 'text-green-800 bg-green-100' :
                    framework.status === 'in-progress' ? 'text-yellow-800 bg-yellow-100' :
                    'text-red-800 bg-red-100'
                  }`}>
                    {framework.status.replace('-', ' ')}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Progress</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(framework.completed / framework.requirements) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{framework.completed}/{framework.requirements}</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Risk Level</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      framework.riskLevel === 'high' ? 'text-red-700 bg-red-100' :
                      framework.riskLevel === 'medium' ? 'text-yellow-700 bg-yellow-100' :
                      'text-green-700 bg-green-100'
                    }`}>
                      {framework.riskLevel}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceDashboard;