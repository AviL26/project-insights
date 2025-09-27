// File Location: /Users/avilapp/econcrete/frontend/src/components/ProjectSetup/ProjectSetupWizard.js
// Fixed version with proper API integration using your axios service

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle, 
  MapPin, 
  Building, 
  Settings,
  Target,
  Save,
  Loader,
  Info
} from 'lucide-react';
import api from '../../services/api';

// Step configuration
const STEPS = [
  { 
    id: 'basics', 
    title: 'Project Basics', 
    icon: Building, 
    description: 'Project name, location, and primary goals' 
  },
  { 
    id: 'environment', 
    title: 'Environment', 
    icon: MapPin, 
    description: 'Seabed conditions and wave exposure' 
  },
  { 
    id: 'design', 
    title: 'Design Choices', 
    icon: Settings, 
    description: 'Structure types and materials' 
  },
  { 
    id: 'context', 
    title: 'Additional Context', 
    icon: Target, 
    description: 'Optional species and environmental factors' 
  },
  { 
    id: 'review', 
    title: 'Review & Submit', 
    icon: CheckCircle, 
    description: 'Review and confirm your project' 
  }
];

// Main wizard component
const ProjectSetupWizard = ({ onComplete, isModal = false }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    projectName: '', // For compatibility with your existing app
    countryCode: '',
    cityId: '',
    primaryGoal: '',
    seabedType: '',
    waveExposure: '',
    nearbyStructures: [],
    structureTypes: [],
    structureType: '', // For compatibility
    preferredMaterials: [],
    targetSpecies: [],
    environmentalFactors: [],
    regulatoryNotes: '',
    coordinates: null,
    // Additional fields for compatibility with your existing system
    region: '',
    country: '',
    water_depth: '',
    wave_exposure: '',
    dimensions: { length: '', width: '', height: '' }
  });

  // Load wizard data on mount
  useEffect(() => {
    loadWizardData();
  }, []);

  const loadWizardData = async () => {
    try {
      console.log('Loading wizard data from API...');
      const response = await api.get('/wizard/bootstrap');
      const result = response.data;
      
      console.log('Wizard API response:', result);
      
      if (result.success) {
        setWizardData(result.data);
        console.log('Wizard data loaded successfully');
      } else {
        throw new Error(result.error || 'Failed to load wizard data');
      }
    } catch (err) {
      console.error('Failed to load wizard data:', err);
      setError(`Failed to load wizard: ${err.message}. Please check if the backend server is running on port 3001.`);
    } finally {
      setLoading(false);
    }
  };

  // Update coordinates when city changes
  useEffect(() => {
    if (formData.cityId && wizardData?.cities[formData.countryCode]) {
      const selectedCity = wizardData.cities[formData.countryCode].find(
        city => city.id === formData.cityId
      );
      if (selectedCity) {
        setFormData(prev => ({
          ...prev,
          coordinates: selectedCity.coordinates
        }));
      }
    }
  }, [formData.cityId, formData.countryCode, wizardData]);

  // Validation function
  const validateStep = (step) => {
    const errors = {};
    
    switch (step) {
      case 0: // Basics
        if (!formData.name.trim()) errors.name = 'Project name is required';
        if (!formData.countryCode) errors.countryCode = 'Country is required';
        if (!formData.primaryGoal) errors.primaryGoal = 'Primary goal is required';
        break;
        
      case 1: // Environment
        if (!formData.seabedType) errors.seabedType = 'Seabed type is required';
        if (!formData.waveExposure) errors.waveExposure = 'Wave exposure is required';
        break;
        
      case 2: // Design
        if (formData.structureTypes.length === 0) {
          errors.structureTypes = 'At least one structure type is required';
        }
        break;
        
      case 3: // Context (optional step)
        break;
        
      case 4: // Review
        // Re-validate all required fields
        if (!formData.name || !formData.countryCode || !formData.primaryGoal || 
            !formData.seabedType || !formData.waveExposure || 
            formData.structureTypes.length === 0) {
          errors.required = 'All required fields must be completed';
        }
        break;
      
      default:
        // No validation needed for unknown steps
        break;
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // Sync compatible fields
      if (field === 'name') {
        newData.projectName = value;
      } else if (field === 'projectName') {
        newData.name = value;
      } else if (field === 'countryCode') {
        newData.country = value;
      } else if (field === 'cityId') {
        newData.region = value;
      } else if (field === 'waveExposure') {
        newData.wave_exposure = value;
      }
      
      return newData;
    });
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle array field changes (for multi-select)
  const handleArrayChange = (field, value, checked) => {
    setFormData(prev => {
      const currentArray = prev[field] || [];
      const newArray = checked
        ? [...currentArray, value]
        : currentArray.filter(item => item !== value);
      
      const newData = {
        ...prev,
        [field]: newArray
      };
      
      // Set single structure type for compatibility
      if (field === 'structureTypes') {
        newData.structureType = newArray[0] || '';
      }
      
      return newData;
    });
  };

  // Navigation handlers
  const handleNext = () => {
    const validation = validateStep(currentStep);
    
    if (validation.isValid) {
      setValidationErrors({});
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      setValidationErrors(validation.errors);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setValidationErrors({});
    }
  };

  // Submit handler
  const handleSubmit = async () => {
    const validation = validateStep(4);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Submitting project data:', formData);
      const response = await api.post('/wizard/projects', formData);
      const result = response.data;
      
      console.log('Project creation response:', result);
      
      if (result.success) {
        // Call the onComplete callback with the project data
        if (onComplete) {
          onComplete(result.data);
        }
      } else {
        throw new Error(result.error || 'Failed to create project');
      }
    } catch (err) {
      console.error('Project submission failed:', err);
      setValidationErrors({ submit: 'Failed to create project. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader size={48} className="animate-spin text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Project Wizard</h3>
            <p className="text-gray-600">Initializing project configuration options...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex">
            <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-900">Error Loading Wizard</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!wizardData) return null;

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <BasicsStep 
          formData={formData} 
          wizardData={wizardData} 
          errors={validationErrors}
          onChange={handleInputChange} 
        />;
      case 1:
        return <EnvironmentStep 
          formData={formData} 
          wizardData={wizardData} 
          errors={validationErrors}
          onChange={handleInputChange}
          onArrayChange={handleArrayChange}
        />;
      case 2:
        return <DesignStep 
          formData={formData} 
          wizardData={wizardData} 
          errors={validationErrors}
          onChange={handleInputChange}
          onArrayChange={handleArrayChange}
        />;
      case 3:
        return <ContextStep 
          formData={formData} 
          wizardData={wizardData} 
          errors={validationErrors}
          onChange={handleInputChange}
          onArrayChange={handleArrayChange}
        />;
      case 4:
        return <ReviewStep 
          formData={formData} 
          wizardData={wizardData} 
          errors={validationErrors}
        />;
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                index < currentStep 
                  ? 'bg-green-500 text-white' 
                  : index === currentStep 
                    ? 'bg-blue-500 text-white scale-110' 
                    : 'bg-gray-200 text-gray-600'
              }`}>
                {index < currentStep ? (
                  <CheckCircle size={20} />
                ) : (
                  <step.icon size={20} />
                )}
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-12 h-1 mx-2 rounded transition-all duration-500 ${
                  index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            {STEPS[currentStep].title}
          </h2>
          <p className="text-gray-600 text-sm">
            {STEPS[currentStep].description}
          </p>
        </div>
      </div>

      {/* Step content */}
      <div className="mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft size={16} />
          <span>Previous</span>
        </button>

        <div className="text-sm text-gray-500">
          Step {currentStep + 1} of {STEPS.length}
        </div>

        {currentStep < STEPS.length - 1 ? (
          <button
            onClick={handleNext}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <span>Next</span>
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader size={16} className="animate-spin" />
                <span>Creating Project...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Create Project</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// Step 1: Basics
const BasicsStep = ({ formData, wizardData, errors, onChange }) => {
  const availableCities = formData.countryCode ? wizardData.cities[formData.countryCode] || [] : [];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => onChange('name', e.target.value)}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          placeholder="e.g., Marina Bay Breakwater"
          maxLength={100}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country *
          </label>
          <select
            value={formData.countryCode}
            onChange={(e) => {
              onChange('countryCode', e.target.value);
              onChange('cityId', ''); // Reset city when country changes
            }}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.countryCode ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          >
            <option value="">Select country...</option>
            {wizardData.countries.map(country => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
          {errors.countryCode && (
            <p className="mt-1 text-sm text-red-600">{errors.countryCode}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City (Optional)
          </label>
          <select
            value={formData.cityId}
            onChange={(e) => onChange('cityId', e.target.value)}
            disabled={!formData.countryCode || availableCities.length === 0}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">Select city...</option>
            {availableCities.map(city => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
          {availableCities.length === 0 && formData.countryCode && (
            <p className="mt-1 text-sm text-gray-500">No predefined cities available for this country</p>
          )}
        </div>
      </div>

      {formData.coordinates && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <MapPin size={16} className="text-blue-600 mr-2" />
            <span className="text-sm text-blue-800">
              Coordinates: {formData.coordinates.lat.toFixed(4)}°, {formData.coordinates.lon.toFixed(4)}°
            </span>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Primary Project Goal *
        </label>
        <div className="grid grid-cols-1 gap-3">
          {wizardData.primaryGoals.map(goal => (
            <label
              key={goal.id}
              className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                formData.primaryGoal === goal.id 
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500' 
                  : errors.primaryGoal 
                    ? 'border-red-300' 
                    : 'border-gray-200'
              }`}
            >
              <input
                type="radio"
                name="primaryGoal"
                value={goal.id}
                checked={formData.primaryGoal === goal.id}
                onChange={(e) => onChange('primaryGoal', e.target.value)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">{goal.name}</div>
                <div className="text-sm text-gray-600">{goal.description}</div>
              </div>
            </label>
          ))}
        </div>
        {errors.primaryGoal && (
          <p className="mt-2 text-sm text-red-600">{errors.primaryGoal}</p>
        )}
      </div>
    </div>
  );
};

// Step 2: Environment
const EnvironmentStep = ({ formData, wizardData, errors, onChange, onArrayChange }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seabed Type *
          </label>
          <div className="space-y-2">
            {wizardData.seabedTypes.map(type => (
              <label
                key={type.id}
                className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                  formData.seabedType === type.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="seabedType"
                  value={type.id}
                  checked={formData.seabedType === type.id}
                  onChange={(e) => onChange('seabedType', e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900">{type.name}</div>
                  <div className="text-sm text-gray-600">{type.description}</div>
                </div>
              </label>
            ))}
          </div>
          {errors.seabedType && (
            <p className="mt-2 text-sm text-red-600">{errors.seabedType}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wave Exposure *
          </label>
          <div className="space-y-2">
            {wizardData.waveExposure.map(exposure => (
              <label
                key={exposure.id}
                className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                  formData.waveExposure === exposure.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="waveExposure"
                  value={exposure.id}
                  checked={formData.waveExposure === exposure.id}
                  onChange={(e) => onChange('waveExposure', e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900">{exposure.name}</div>
                  <div className="text-sm text-gray-600">{exposure.description}</div>
                </div>
              </label>
            ))}
          </div>
          {errors.waveExposure && (
            <p className="mt-2 text-sm text-red-600">{errors.waveExposure}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nearby Structures (Optional)
        </label>
        <p className="text-sm text-gray-600 mb-3">Select any existing structures near your project site</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {wizardData.structureTypes.map(structure => (
            <label
              key={structure.id}
              className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                formData.nearbyStructures.includes(structure.id)
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200'
              }`}
            >
              <input
                type="checkbox"
                checked={formData.nearbyStructures.includes(structure.id)}
                onChange={(e) => onArrayChange('nearbyStructures', structure.id, e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
              />
              <span className="text-sm font-medium text-gray-900">{structure.name}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

// Step 3: Design
const DesignStep = ({ formData, wizardData, errors, onChange, onArrayChange }) => {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Structure Types *
        </label>
        <p className="text-sm text-gray-600 mb-3">Select the types of structures you plan to build</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {wizardData.structureTypes.map(structure => (
            <label
              key={structure.id}
              className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                formData.structureTypes.includes(structure.id)
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500' 
                  : errors.structureTypes
                    ? 'border-red-300'
                    : 'border-gray-200'
              }`}
            >
              <input
                type="checkbox"
                checked={formData.structureTypes.includes(structure.id)}
                onChange={(e) => onArrayChange('structureTypes', structure.id, e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">{structure.name}</div>
                <div className="text-sm text-gray-600">{structure.description}</div>
                <div className="text-xs text-blue-600 mt-1">Category: {structure.category}</div>
              </div>
            </label>
          ))}
        </div>
        {errors.structureTypes && (
          <p className="mt-2 text-sm text-red-600">{errors.structureTypes}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preferred Materials (Optional)
        </label>
        <p className="text-sm text-gray-600 mb-3">Select materials you'd like to consider for your project</p>
        <div className="grid grid-cols-1 gap-3">
          {wizardData.materials.map(material => (
            <label
              key={material.id}
              className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                formData.preferredMaterials.includes(material.id)
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200'
              }`}
            >
              <input
                type="checkbox"
                checked={formData.preferredMaterials.includes(material.id)}
                onChange={(e) => onArrayChange('preferredMaterials', material.id, e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">{material.name}</div>
                <div className="text-sm text-gray-600">{material.description}</div>
                <div className="text-xs text-blue-600 mt-1">
                  Categories: {material.categories.join(', ')}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

// Step 4: Context
const ContextStep = ({ formData, wizardData, errors, onChange, onArrayChange }) => {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <Info size={20} className="text-blue-600 mt-0.5 mr-3" />
          <div>
            <h3 className="font-medium text-blue-900">Optional Information</h3>
            <p className="text-sm text-blue-700 mt-1">
              This information helps provide better recommendations but is not required to proceed.
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Target Species (Optional)
        </label>
        <p className="text-sm text-gray-600 mb-3">Select marine species you'd like to support with your project</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {wizardData.species.map(species => (
            <label
              key={species.id}
              className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                formData.targetSpecies.includes(species.id)
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200'
              }`}
            >
              <input
                type="checkbox"
                checked={formData.targetSpecies.includes(species.id)}
                onChange={(e) => onArrayChange('targetSpecies', species.id, e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">{species.name}</div>
                <div className="text-xs text-gray-600">{species.type}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Environmental Factors (Optional)
        </label>
        <p className="text-sm text-gray-600 mb-3">Select any additional environmental considerations</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {wizardData.environmentalFactors?.map(factor => (
            <label
              key={factor.id}
              className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                formData.environmentalFactors.includes(factor.id)
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200'
              }`}
            >
              <input
                type="checkbox"
                checked={formData.environmentalFactors.includes(factor.id)}
                onChange={(e) => onArrayChange('environmentalFactors', factor.id, e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
              />
              <span className="text-sm font-medium text-gray-900">{factor.name}</span>
            </label>
          )) || []}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Regulatory Notes (Optional)
        </label>
        <textarea
          value={formData.regulatoryNotes}
          onChange={(e) => onChange('regulatoryNotes', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
          placeholder="Any specific regulatory requirements, permits, or constraints for your project..."
        />
      </div>
    </div>
  );
};

// Step 5: Review
const ReviewStep = ({ formData, wizardData, errors }) => {
  const selectedCountry = wizardData.countries.find(c => c.code === formData.countryCode);
  const selectedCity = formData.cityId && wizardData.cities[formData.countryCode]?.find(c => c.id === formData.cityId);
  const selectedGoal = wizardData.primaryGoals.find(g => g.id === formData.primaryGoal);
  const selectedSeabed = wizardData.seabedTypes.find(s => s.id === formData.seabedType);
  const selectedWaveExposure = wizardData.waveExposure.find(w => w.id === formData.waveExposure);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Summary</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
            <div className="bg-gray-50 p-3 rounded">
              <p><strong>Name:</strong> {formData.name || 'Not specified'}</p>
              <p><strong>Country:</strong> {selectedCountry?.name || 'Not specified'}</p>
              {selectedCity && <p><strong>City:</strong> {selectedCity.name}</p>}
              {formData.coordinates && (
                <p><strong>Coordinates:</strong> {formData.coordinates.lat.toFixed(4)}°, {formData.coordinates.lon.toFixed(4)}°</p>
              )}
              <p><strong>Primary Goal:</strong> {selectedGoal?.name || 'Not specified'}</p>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Environment</h4>
            <div className="bg-gray-50 p-3 rounded">
              <p><strong>Seabed Type:</strong> {selectedSeabed?.name || 'Not specified'}</p>
              <p><strong>Wave Exposure:</strong> {selectedWaveExposure?.name || 'Not specified'}</p>
              {formData.nearbyStructures.length > 0 && (
                <p><strong>Nearby Structures:</strong> {formData.nearbyStructures.map(id => 
                  wizardData.structureTypes.find(s => s.id === id)?.name
                ).filter(Boolean).join(', ')}</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Design</h4>
            <div className="bg-gray-50 p-3 rounded">
              {formData.structureTypes.length > 0 ? (
                <p><strong>Structure Types:</strong> {formData.structureTypes.map(id => 
                  wizardData.structureTypes.find(s => s.id === id)?.name
                ).filter(Boolean).join(', ')}</p>
              ) : (
                <p><strong>Structure Types:</strong> Not specified</p>
              )}
              {formData.preferredMaterials.length > 0 && (
                <p><strong>Preferred Materials:</strong> {formData.preferredMaterials.map(id => 
                  wizardData.materials.find(m => m.id === id)?.name
                ).filter(Boolean).join(', ')}</p>
              )}
            </div>
          </div>

          {(formData.targetSpecies.length > 0 || formData.environmentalFactors.length > 0 || formData.regulatoryNotes) && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Additional Context</h4>
              <div className="bg-gray-50 p-3 rounded">
                {formData.targetSpecies.length > 0 && (
                  <p><strong>Target Species:</strong> {formData.targetSpecies.map(id => 
                    wizardData.species.find(s => s.id === id)?.name
                  ).filter(Boolean).join(', ')}</p>
                )}
                {formData.environmentalFactors.length > 0 && (
                  <p><strong>Environmental Factors:</strong> {formData.environmentalFactors.map(id => 
                    wizardData.environmentalFactors?.find(f => f.id === id)?.name
                  ).filter(Boolean).join(', ')}</p>
                )}
                {formData.regulatoryNotes && (
                  <p><strong>Regulatory Notes:</strong> {formData.regulatoryNotes}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-medium text-red-900 mb-2">Please fix the following issues:</h4>
          <ul className="list-disc list-inside space-y-1">
            {Object.values(errors).map((error, index) => (
              <li key={index} className="text-sm text-red-700">{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex">
          <CheckCircle size={20} className="text-green-600 mt-0.5 mr-3" />
          <div>
            <h3 className="font-medium text-green-900">Ready to Create Project</h3>
            <p className="text-sm text-green-700 mt-1">
              All required information has been provided. Click "Create Project" to proceed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSetupWizard;