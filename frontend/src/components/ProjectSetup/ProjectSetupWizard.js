import React, { useState } from 'react';
import { MapPin, Building, Shield, Leaf, ChevronRight, ChevronLeft, Save, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

const ProjectSetupWizard = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const { createProject } = useProject();
  
  const [projectData, setProjectData] = useState({
    // Geography & Site
    projectName: '',
    country: 'Israel',
    region: '',
    coordinates: '',
    waterDepth: '',
    waveExposure: 'moderate',
    seabedType: '',
    waterTemperature: '',
    salinity: '',
    
    // Structure Type
    structureType: '',
    primaryFunction: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    designLife: '50',
    
    // Regulatory
    regulatoryFramework: [],
    environmentalAssessment: '',
    permitStatus: 'planning',
    stakeholders: [],
    
    // Ecological Goals
    primaryGoals: [],
    targetSpecies: [],
    habitatTypes: [],
    carbonTargets: '',
    monitoringPlan: ''
  });

  const steps = [
    { id: 1, title: 'Geography & Site', icon: MapPin, description: 'Location and environmental conditions' },
    { id: 2, title: 'Structure Type', icon: Building, description: 'Project specifications and design parameters' },
    { id: 3, title: 'Regulatory Framework', icon: Shield, description: 'Compliance requirements and permits' },
    { id: 4, title: 'Ecological Goals', icon: Leaf, description: 'Environmental objectives and targets' }
  ];

  const countries = ['Israel', 'Cyprus', 'Greece', 'Malta', 'Croatia', 'Spain', 'Italy'];
  const structureTypes = [
    'Breakwater', 'Seawall', 'Jetty', 'Pier', 'Artificial Reef', 'Coastal Protection', 'Port Infrastructure'
  ];
  const waveExposures = [
    { value: 'low', label: 'Low (< 1m significant wave height)' },
    { value: 'moderate', label: 'Moderate (1-3m significant wave height)' },
    { value: 'high', label: 'High (3-5m significant wave height)' },
    { value: 'extreme', label: 'Extreme (> 5m significant wave height)' }
  ];

  const updateProjectData = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProjectData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setProjectData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleComplete = async () => {
    try {
      setSaving(true);
      
      // Prepare data for backend API
      const apiData = {
        name: projectData.projectName,
        country: projectData.country,
        region: projectData.region,
        coordinates: projectData.coordinates,
        water_depth: parseFloat(projectData.waterDepth) || null,
        wave_exposure: projectData.waveExposure,
        seabed_type: projectData.seabedType,
        water_temperature: projectData.waterTemperature,
        salinity: parseFloat(projectData.salinity) || null,
        structure_type: projectData.structureType,
        primary_function: projectData.primaryFunction,
        length: parseFloat(projectData.dimensions.length) || null,
        width: parseFloat(projectData.dimensions.width) || null,
        height: parseFloat(projectData.dimensions.height) || null,
        design_life: parseInt(projectData.designLife) || 50,
        regulatory_framework: projectData.regulatoryFramework,
        environmental_assessment: projectData.environmentalAssessment,
        permit_status: projectData.permitStatus,
        stakeholders: projectData.stakeholders,
        primary_goals: projectData.primaryGoals,
        target_species: projectData.targetSpecies,
        habitat_types: projectData.habitatTypes,
        carbon_targets: parseFloat(projectData.carbonTargets) || null,
        monitoring_plan: projectData.monitoringPlan
      };

      const savedProject = await createProject(apiData);
      
      if (onComplete) {
        onComplete(savedProject);
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      alert('Failed to save project. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={projectData.projectName}
                  onChange={(e) => updateProjectData('projectName', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-blue-500 focus:border-transparent"
                  placeholder="e.g., Marina Breakwater Extension"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <select
                  value={projectData.country}
                  onChange={(e) => updateProjectData('country', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-blue-500 focus:border-transparent"
                >
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region/City *
                </label>
                <input
                  type="text"
                  value={projectData.region}
                  onChange={(e) => updateProjectData('region', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-blue-500 focus:border-transparent"
                  placeholder="e.g., Tel Aviv, Haifa Bay"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coordinates
                  <Info size={16} className="inline ml-1 text-gray-400" />
                </label>
                <input
                  type="text"
                  value={projectData.coordinates}
                  onChange={(e) => updateProjectData('coordinates', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-blue-500 focus:border-transparent"
                  placeholder="32.0853°N, 34.7818°E"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Water Depth (m) *
                </label>
                <input
                  type="number"
                  value={projectData.waterDepth}
                  onChange={(e) => updateProjectData('waterDepth', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-blue-500 focus:border-transparent"
                  placeholder="e.g., 8"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Water Temperature (°C)
                </label>
                <input
                  type="text"
                  value={projectData.waterTemperature}
                  onChange={(e) => updateProjectData('waterTemperature', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-blue-500 focus:border-transparent"
                  placeholder="e.g., 18-26"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salinity (ppt)
                </label>
                <input
                  type="number"
                  value={projectData.salinity}
                  onChange={(e) => updateProjectData('salinity', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-blue-500 focus:border-transparent"
                  placeholder="e.g., 39"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wave Exposure *
              </label>
              <div className="space-y-2">
                {waveExposures.map(exposure => (
                  <label key={exposure.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="waveExposure"
                      value={exposure.value}
                      checked={projectData.waveExposure === exposure.value}
                      onChange={(e) => updateProjectData('waveExposure', e.target.value)}
                      className="text-eco-blue-600"
                    />
                    <span className="text-gray-900">{exposure.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seabed Type
              </label>
              <input
                type="text"
                value={projectData.seabedType}
                onChange={(e) => updateProjectData('seabedType', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-blue-500 focus:border-transparent"
                placeholder="e.g., Sandy, Rocky, Mixed sediment"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Structure Type *
                </label>
                <select
                  value={projectData.structureType}
                  onChange={(e) => updateProjectData('structureType', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-blue-500 focus:border-transparent"
                >
                  <option value="">Select structure type</option>
                  {structureTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Function *
                </label>
                <input
                  type="text"
                  value={projectData.primaryFunction}
                  onChange={(e) => updateProjectData('primaryFunction', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-blue-500 focus:border-transparent"
                  placeholder="e.g., Wave protection, Habitat creation"
                />
              </div>
            </div>

            <div className="bg-eco-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-eco-blue-900 mb-3">Structure Dimensions</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-eco-blue-700 mb-1">
                    Length (m) *
                  </label>
                  <input
                    type="number"
                    value={projectData.dimensions.length}
                    onChange={(e) => updateProjectData('dimensions.length', e.target.value)}
                    className="w-full p-2 border border-eco-blue-200 rounded-md focus:ring-2 focus:ring-eco-blue-500"
                    placeholder="200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-eco-blue-700 mb-1">
                    Width (m) *
                  </label>
                  <input
                    type="number"
                    value={projectData.dimensions.width}
                    onChange={(e) => updateProjectData('dimensions.width', e.target.value)}
                    className="w-full p-2 border border-eco-blue-200 rounded-md focus:ring-2 focus:ring-eco-blue-500"
                    placeholder="15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-eco-blue-700 mb-1">
                    Height (m) *
                  </label>
                  <input
                    type="number"
                    value={projectData.dimensions.height}
                    onChange={(e) => updateProjectData('dimensions.height', e.target.value)}
                    className="w-full p-2 border border-eco-blue-200 rounded-md focus:ring-2 focus:ring-eco-blue-500"
                    placeholder="8"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Design Life (years)
              </label>
              <select
                value={projectData.designLife}
                onChange={(e) => updateProjectData('designLife', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-blue-500 focus:border-transparent"
              >
                <option value="25">25 years</option>
                <option value="50">50 years</option>
                <option value="75">75 years</option>
                <option value="100">100 years</option>
              </select>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle size={20} className="text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Preliminary Volume Calculation</h4>
                  <p className="text-yellow-700 text-sm mt-1">
                    Based on dimensions: ~{(projectData.dimensions.length || 0) * (projectData.dimensions.width || 0) * (projectData.dimensions.height || 0)} m³
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Regulatory Framework *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  'EU Water Framework Directive',
                  'Marine Strategy Framework Directive',
                  'Environmental Impact Assessment',
                  'Local Coastal Management Plan',
                  'NATURA 2000 Requirements',
                  'National Marine Protection Laws'
                ].map(framework => (
                  <label key={framework} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={projectData.regulatoryFramework.includes(framework)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateProjectData('regulatoryFramework', [...projectData.regulatoryFramework, framework]);
                        } else {
                          updateProjectData('regulatoryFramework', projectData.regulatoryFramework.filter(f => f !== framework));
                        }
                      }}
                      className="text-eco-blue-600"
                    />
                    <span className="text-gray-900 text-sm">{framework}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Environmental Assessment Required
              </label>
              <select
                value={projectData.environmentalAssessment}
                onChange={(e) => updateProjectData('environmentalAssessment', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-blue-500 focus:border-transparent"
              >
                <option value="">Select assessment type</option>
                <option value="none">No assessment required</option>
                <option value="screening">Environmental Screening</option>
                <option value="eia">Full Environmental Impact Assessment</option>
                <option value="aa">Appropriate Assessment (NATURA 2000)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Permit Status
              </label>
              <div className="space-y-2">
                {[
                  { value: 'planning', label: 'Planning Phase' },
                  { value: 'application', label: 'Application Submitted' },
                  { value: 'review', label: 'Under Review' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'conditions', label: 'Approved with Conditions' }
                ].map(status => (
                  <label key={status.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="permitStatus"
                      value={status.value}
                      checked={projectData.permitStatus === status.value}
                      onChange={(e) => updateProjectData('permitStatus', e.target.value)}
                      className="text-eco-blue-600"
                    />
                    <span className="text-gray-900">{status.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Stakeholders
              </label>
              <textarea
                value={projectData.stakeholders.join('\n')}
                onChange={(e) => updateProjectData('stakeholders', e.target.value.split('\n').filter(s => s.trim()))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-blue-500 focus:border-transparent"
                rows="4"
                placeholder="Enter stakeholders (one per line)&#10;e.g., Port Authority&#10;Ministry of Environment&#10;Local Fishermen Association"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Primary Ecological Goals *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  'Biodiversity Enhancement',
                  'Carbon Sequestration',
                  'Fish Habitat Creation',
                  'Coral Restoration',
                  'Marine Protected Area Support',
                  'Coastal Erosion Control'
                ].map(goal => (
                  <label key={goal} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={projectData.primaryGoals.includes(goal)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateProjectData('primaryGoals', [...projectData.primaryGoals, goal]);
                        } else {
                          updateProjectData('primaryGoals', projectData.primaryGoals.filter(g => g !== goal));
                        }
                      }}
                      className="text-eco-blue-600"
                    />
                    <span className="text-gray-900 text-sm">{goal}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Species/Groups
              </label>
              <textarea
                value={projectData.targetSpecies.join(', ')}
                onChange={(e) => updateProjectData('targetSpecies', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-blue-500 focus:border-transparent"
                rows="3"
                placeholder="e.g., Bream, Sea bass, Mussels, Barnacles, Algae"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Habitat Types to Support
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  'Subtidal Rocky Reef',
                  'Soft Sediment Communities',
                  'Kelp/Algae Forests',
                  'Fish Aggregation Areas',
                  'Nursery Habitats',
                  'Filter Feeder Communities'
                ].map(habitat => (
                  <label key={habitat} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={projectData.habitatTypes.includes(habitat)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateProjectData('habitatTypes', [...projectData.habitatTypes, habitat]);
                        } else {
                          updateProjectData('habitatTypes', projectData.habitatTypes.filter(h => h !== habitat));
                        }
                      }}
                      className="text-eco-blue-600"
                    />
                    <span className="text-gray-900 text-sm">{habitat}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Carbon Sequestration Target (tonnes CO₂/year)
              </label>
              <input
                type="number"
                value={projectData.carbonTargets}
                onChange={(e) => updateProjectData('carbonTargets', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-blue-500 focus:border-transparent"
                placeholder="e.g., 50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monitoring Plan
              </label>
              <select
                value={projectData.monitoringPlan}
                onChange={(e) => updateProjectData('monitoringPlan', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-blue-500 focus:border-transparent"
              >
                <option value="">Select monitoring approach</option>
                <option value="basic">Basic (Annual surveys)</option>
                <option value="standard">Standard (Bi-annual + key indicators)</option>
                <option value="comprehensive">Comprehensive (Quarterly + full ecosystem)</option>
                <option value="research">Research Grade (Continuous monitoring)</option>
              </select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">New Project Setup</h1>
          <p className="text-gray-600">Configure your project parameters for analysis and insights</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center space-x-3 ${
                    isActive ? 'text-eco-blue-600' : isCompleted ? 'text-eco-green-600' : 'text-gray-400'
                  }`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                      isActive ? 'border-eco-blue-600 bg-eco-blue-50' : 
                      isCompleted ? 'border-eco-green-600 bg-eco-green-50' : 
                      'border-gray-300 bg-white'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle size={24} className="text-eco-green-600" />
                      ) : (
                        <StepIcon size={20} />
                      )}
                    </div>
                    <div className="hidden md:block">
                      <p className="font-medium">{step.title}</p>
                      <p className="text-sm text-gray-500">{step.description}</p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight size={20} className="text-gray-300 mx-4" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {steps[currentStep - 1].title}
            </h2>
            <p className="text-gray-600">{steps[currentStep - 1].description}</p>
          </div>
          
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg ${
              currentStep === 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <ChevronLeft size={20} />
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              <Save size={20} />
              <span>Save Draft</span>
            </button>
            
            {currentStep === 4 ? (
              <button 
                onClick={handleComplete}
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-3 bg-eco-blue-600 text-white rounded-lg hover:bg-eco-blue-700 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Create Project</span>
                    <CheckCircle size={20} />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="flex items-center space-x-2 px-6 py-3 bg-eco-blue-600 text-white rounded-lg hover:bg-eco-blue-700"
              >
                <span>Next</span>
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSetupWizard;