// frontend/src/components/ProjectSetup/ProjectSetupWizard.js - ENHANCED VALIDATION
import React, { useState, useCallback, useMemo } from 'react';
import { useProject } from '../../context/ProjectContext';
import { validateProjectData, prepareProjectForAPI } from '../../utils/projectUtils';
import ErrorAlert from '../common/ErrorAlert';
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
  X
} from 'lucide-react';

const STEPS = [
  { id: 'basic', title: 'Basic Information', icon: Building },
  { id: 'location', title: 'Location & Environment', icon: MapPin },
  { id: 'technical', title: 'Technical Specifications', icon: Settings },
  { id: 'goals', title: 'Project Goals', icon: Target },
  { id: 'review', title: 'Review & Create', icon: CheckCircle }
];

const STRUCTURE_TYPES = [
  'Breakwater',
  'Seawall', 
  'Pier',
  'Jetty',
  'Artificial Reef',
  'Coastal Protection',
  'Marine Infrastructure'
];

const WAVE_EXPOSURE_OPTIONS = [
  'sheltered',
  'moderate', 
  'exposed',
  'very-exposed'
];

const SEABED_TYPES = [
  'sand',
  'clay',
  'rock',
  'gravel',
  'mixed'
];

const ProjectSetupWizard = ({ onComplete, isModal = false, onClose }) => {
  const { createProject } = useProject();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  // ENHANCED: Separate validation state tracking
  const [validationErrors, setValidationErrors] = useState({});
  const [validationWarnings, setValidationWarnings] = useState({});
  const [stepValidation, setStepValidation] = useState({});
  
  // Form data with proper defaults
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    region: '',
    structure_type: '',
    lat: '',
    lon: '',
    length: '',
    width: '',
    height: '',
    water_depth: '',
    wave_exposure: '',
    seabed_type: '',
    primary_function: '',
    design_life: '50',
    primary_goals: [],
    regulatory_framework: [],
    stakeholders: [],
    target_species: [],
    habitat_types: []
  });

  // ENHANCED: Real-time validation with debouncing
  const validateStep = useCallback((stepIndex, data = formData) => {
    const stepConfig = STEPS[stepIndex];
    const stepErrors = {};
    const stepWarnings = {};
    
    switch (stepConfig.id) {
      case 'basic':
        if (!data.name?.trim()) {
          stepErrors.name = 'Project name is required';
        } else if (data.name.trim().length < 3) {
          stepWarnings.name = 'Project name should be at least 3 characters';
        }
        
        if (!data.country?.trim()) {
          stepErrors.country = 'Country is required';
        }
        
        if (!data.structure_type) {
          stepErrors.structure_type = 'Structure type is required';
        }
        break;
        
      case 'location':
        const lat = parseFloat(data.lat);
        const lon = parseFloat(data.lon);
        
        if (!data.lat || isNaN(lat)) {
          stepErrors.lat = 'Valid latitude is required';
        } else if (lat < -90 || lat > 90) {
          stepErrors.lat = 'Latitude must be between -90 and 90';
        }
        
        if (!data.lon || isNaN(lon)) {
          stepErrors.lon = 'Valid longitude is required';
        } else if (lon < -180 || lon > 180) {
          stepErrors.lon = 'Longitude must be between -180 and 180';
        }
        
        // Check if coordinates are likely in water
        if (!isNaN(lat) && !isNaN(lon) && lat === 0 && lon === 0) {
          stepWarnings.coordinates = 'Coordinates (0,0) may not be your intended location';
        }
        break;
        
      case 'technical':
        const length = parseFloat(data.length);
        const width = parseFloat(data.width);
        const height = parseFloat(data.height);
        const waterDepth = parseFloat(data.water_depth);
        
        if (data.length && isNaN(length)) {
          stepErrors.length = 'Length must be a valid number';
        } else if (length && (length <= 0 || length > 10000)) {
          stepErrors.length = 'Length must be between 0 and 10,000 meters';
        }
        
        if (data.width && isNaN(width)) {
          stepErrors.width = 'Width must be a valid number';
        } else if (width && (width <= 0 || width > 10000)) {
          stepErrors.width = 'Width must be between 0 and 10,000 meters';
        }
        
        if (data.height && isNaN(height)) {
          stepErrors.height = 'Height must be a valid number';
        } else if (height && (height <= 0 || height > 1000)) {
          stepErrors.height = 'Height must be between 0 and 1,000 meters';
        }
        
        if (data.water_depth && isNaN(waterDepth)) {
          stepErrors.water_depth = 'Water depth must be a valid number';
        } else if (waterDepth && (waterDepth < 0 || waterDepth > 12000)) {
          stepErrors.water_depth = 'Water depth must be between 0 and 12,000 meters';
        }
        
        // Business logic validation
        if (length && width && height) {
          const volume = length * width * height;
          if (volume > 1000000) {
            stepWarnings.volume = `Large project volume (${volume.toLocaleString()}m³) - please verify dimensions`;
          }
          if (volume < 0.1) {
            stepWarnings.volume = `Small project volume (${volume}m³) - please verify dimensions`;
          }
        }
        break;
        
      case 'goals':
        if (data.primary_goals?.length === 0) {
          stepWarnings.primary_goals = 'Consider selecting at least one primary goal';
        }
        break;
        
      case 'review':
        // Full validation for final review
        const fullValidation = validateProjectData(data);
        if (!fullValidation.isValid) {
          fullValidation.errors.forEach((error, index) => {
            stepErrors[`validation_${index}`] = error;
          });
        }
        if (fullValidation.warnings?.length > 0) {
          fullValidation.warnings.forEach((warning, index) => {
            stepWarnings[`validation_${index}`] = warning;
          });
        }
        break;
        
      default:
        // No specific validation for unknown steps
        break;
    }
    
    const isValid = Object.keys(stepErrors).length === 0;
    
    setStepValidation(prev => ({
      ...prev,
      [stepIndex]: {
        isValid,
        errors: stepErrors,
        warnings: stepWarnings
      }
    }));
    
    return { isValid, errors: stepErrors, warnings: stepWarnings };
  }, [formData]);

  // ENHANCED: Validate current step before proceeding
  const canProceedToNextStep = useMemo(() => {
    const currentValidation = stepValidation[currentStep];
    return currentValidation?.isValid !== false; // Allow if not validated yet or if valid
  }, [stepValidation, currentStep]);

  const canSubmit = useMemo(() => {
    // All steps must be valid for submission
    const allStepsValid = STEPS.every((_, index) => {
      const validation = stepValidation[index];
      return validation?.isValid !== false;
    });
    
    // Final validation check
    const finalValidation = validateProjectData(formData);
    return allStepsValid && finalValidation.isValid;
  }, [stepValidation, formData]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field-specific errors when user starts typing
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
    
    // Re-validate current step with new data
    setTimeout(() => {
      const newData = { ...formData, [field]: value };
      validateStep(currentStep, newData);
    }, 300); // Debounce validation
  }, [formData, currentStep, validateStep]);

  const handleArrayFieldChange = useCallback((field, values) => {
    setFormData(prev => ({
      ...prev,
      [field]: Array.isArray(values) ? values : []
    }));
  }, []);

  const handleNextStep = useCallback(() => {
    // Validate current step before proceeding
    const validation = validateStep(currentStep);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setValidationWarnings(validation.warnings);
      return;
    }
    
    setValidationErrors({});
    setValidationWarnings({});
    
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      // Pre-validate next step
      setTimeout(() => validateStep(currentStep + 1), 100);
    }
  }, [currentStep, validateStep]);

  const handlePrevStep = useCallback(() => {
    setValidationErrors({});
    setValidationWarnings({});
    
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // ENHANCED: Comprehensive submission validation
  const handleSubmit = useCallback(async () => {
    setSubmitError(null);
    setIsSubmitting(true);
    
    try {
      // CRITICAL: Validate before API submission
      const validation = validateProjectData(formData);
      
      if (!validation.isValid) {
        setValidationErrors({
          submission: 'Please fix all validation errors before submitting',
          ...validation.errors.reduce((acc, error, index) => {
            acc[`error_${index}`] = error;
            return acc;
          }, {})
        });
        setIsSubmitting(false);
        return;
      }
      
      if (validation.warnings?.length > 0) {
        setValidationWarnings({
          ...validation.warnings.reduce((acc, warning, index) => {
            acc[`warning_${index}`] = warning;
            return acc;
          }, {})
        });
      }
      
      // CRITICAL: Prepare data for API - this ensures proper formatting
      const preparedData = prepareProjectForAPI(formData);
      
      if (!preparedData) {
        throw new Error('Failed to prepare project data for submission');
      }
      
      // CRITICAL: Final safety check on prepared data
      const preparedValidation = validateProjectData(preparedData);
      if (!preparedValidation.isValid) {
        throw new Error(`Data preparation failed validation: ${preparedValidation.errors.join(', ')}`);
      }
      
      console.log('Submitting project data:', preparedData);
      
      // Submit to API
      const newProject = await createProject(preparedData);
      
      console.log('Project created successfully:', newProject);
      
      // Clear form and close
      setFormData({
        name: '',
        country: '',
        region: '',
        structure_type: '',
        lat: '',
        lon: '',
        length: '',
        width: '',
        height: '',
        water_depth: '',
        wave_exposure: '',
        seabed_type: '',
        primary_function: '',
        design_life: '50',
        primary_goals: [],
        regulatory_framework: [],
        stakeholders: [],
        target_species: [],
        habitat_types: []
      });
      
      setValidationErrors({});
      setValidationWarnings({});
      setStepValidation({});
      
      onComplete?.(newProject);
      
    } catch (error) {
      console.error('Project creation failed:', error);
      setSubmitError(error.message || 'Failed to create project. Please check your data and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, createProject, onComplete]);

  // Render step content
  const renderStepContent = () => {
    const currentStepConfig = STEPS[currentStep];
    const stepErrors = validationErrors;
    const stepWarnings = validationWarnings;
    
    switch (currentStepConfig.id) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  stepErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter project name..."
              />
              {stepErrors.name && (
                <p className="mt-1 text-sm text-red-600">{stepErrors.name}</p>
              )}
              {stepWarnings.name && (
                <p className="mt-1 text-sm text-orange-600">{stepWarnings.name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    stepErrors.country ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Israel, Cyprus..."
                />
                {stepErrors.country && (
                  <p className="mt-1 text-sm text-red-600">{stepErrors.country}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region
                </label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) => handleInputChange('region', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Mediterranean Coast..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Structure Type *
              </label>
              <select
                value={formData.structure_type}
                onChange={(e) => handleInputChange('structure_type', e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  stepErrors.structure_type ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              >
                <option value="">Select structure type...</option>
                {STRUCTURE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {stepErrors.structure_type && (
                <p className="mt-1 text-sm text-red-600">{stepErrors.structure_type}</p>
              )}
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude * (decimal degrees)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.lat}
                  onChange={(e) => handleInputChange('lat', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    stepErrors.lat ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 32.0853"
                />
                {stepErrors.lat && (
                  <p className="mt-1 text-sm text-red-600">{stepErrors.lat}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude * (decimal degrees)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.lon}
                  onChange={(e) => handleInputChange('lon', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    stepErrors.lon ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 34.7818"
                />
                {stepErrors.lon && (
                  <p className="mt-1 text-sm text-red-600">{stepErrors.lon}</p>
                )}
              </div>
            </div>
            
            {stepWarnings.coordinates && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex">
                  <AlertTriangle size={16} className="text-orange-600 mt-0.5 mr-2" />
                  <p className="text-sm text-orange-700">{stepWarnings.coordinates}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wave Exposure
                </label>
                <select
                  value={formData.wave_exposure}
                  onChange={(e) => handleInputChange('wave_exposure', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select wave exposure...</option>
                  {WAVE_EXPOSURE_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seabed Type
                </label>
                <select
                  value={formData.seabed_type}
                  onChange={(e) => handleInputChange('seabed_type', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select seabed type...</option>
                  {SEABED_TYPES.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 'technical':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Length (meters)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.length}
                  onChange={(e) => handleInputChange('length', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    stepErrors.length ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 100"
                />
                {stepErrors.length && (
                  <p className="mt-1 text-sm text-red-600">{stepErrors.length}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Width (meters)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.width}
                  onChange={(e) => handleInputChange('width', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    stepErrors.width ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 20"
                />
                {stepErrors.width && (
                  <p className="mt-1 text-sm text-red-600">{stepErrors.width}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (meters)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    stepErrors.height ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 5"
                />
                {stepErrors.height && (
                  <p className="mt-1 text-sm text-red-600">{stepErrors.height}</p>
                )}
              </div>
            </div>

            {stepWarnings.volume && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex">
                  <AlertTriangle size={16} className="text-orange-600 mt-0.5 mr-2" />
                  <p className="text-sm text-orange-700">{stepWarnings.volume}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Water Depth (meters)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.water_depth}
                  onChange={(e) => handleInputChange('water_depth', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    stepErrors.water_depth ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 15"
                />
                {stepErrors.water_depth && (
                  <p className="mt-1 text-sm text-red-600">{stepErrors.water_depth}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Design Life (years)
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={formData.design_life}
                  onChange={(e) => handleInputChange('design_life', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="50"
                />
              </div>
            </div>
          </div>
        );

      case 'goals':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Primary Goals (select all that apply)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  'Coastal Protection',
                  'Biodiversity Enhancement', 
                  'Carbon Sequestration',
                  'Fish Habitat Creation',
                  'Coral Restoration',
                  'Tourism Development',
                  'Research Platform',
                  'Commercial Infrastructure'
                ].map(goal => (
                  <label key={goal} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.primary_goals.includes(goal)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleArrayFieldChange('primary_goals', [...formData.primary_goals, goal]);
                        } else {
                          handleArrayFieldChange('primary_goals', formData.primary_goals.filter(g => g !== goal));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{goal}</span>
                  </label>
                ))}
              </div>
              {stepWarnings.primary_goals && (
                <p className="mt-2 text-sm text-orange-600">{stepWarnings.primary_goals}</p>
              )}
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Name:</dt>
                      <dd className="font-medium">{formData.name || 'Not specified'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Country:</dt>
                      <dd className="font-medium">{formData.country || 'Not specified'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Type:</dt>
                      <dd className="font-medium">{formData.structure_type || 'Not specified'}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Location & Technical</h4>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Coordinates:</dt>
                      <dd className="font-medium">
                        {formData.lat && formData.lon 
                          ? `${parseFloat(formData.lat).toFixed(4)}°, ${parseFloat(formData.lon).toFixed(4)}°`
                          : 'Not specified'
                        }
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Dimensions:</dt>
                      <dd className="font-medium">
                        {formData.length && formData.width && formData.height
                          ? `${formData.length}×${formData.width}×${formData.height}m`
                          : 'Not specified'
                        }
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Water Depth:</dt>
                      <dd className="font-medium">{formData.water_depth ? `${formData.water_depth}m` : 'Not specified'}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {formData.primary_goals.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Primary Goals</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.primary_goals.map(goal => (
                      <span key={goal} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {goal}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Validation errors and warnings */}
            {Object.keys(stepErrors).length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2">Please fix the following issues:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {Object.values(stepErrors).map((error, index) => (
                    <li key={index} className="text-sm text-red-700">{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {Object.keys(stepWarnings).length > 0 && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-medium text-orange-900 mb-2">Please review:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {Object.values(stepWarnings).map((warning, index) => (
                    <li key={index} className="text-sm text-orange-700">{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                index < currentStep 
                  ? 'bg-green-500 text-white' 
                  : index === currentStep 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
              }`}>
                {index < currentStep ? (
                  <CheckCircle size={20} />
                ) : (
                  <step.icon size={20} />
                )}
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-12 h-1 mx-2 ${
                  index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="mt-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Step {currentStep + 1}: {STEPS[currentStep].title}
          </h2>
        </div>
      </div>

      {/* Submit error */}
      {submitError && (
        <ErrorAlert 
          error={submitError} 
          onDismiss={() => setSubmitError(null)}
          contextName="Project Creation"
        />
      )}

      {/* Step content */}
      <div className="mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevStep}
          disabled={currentStep === 0}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft size={16} />
          <span>Previous</span>
        </button>

        <div className="flex items-center space-x-4">
          {isModal && (
            <button
              onClick={onClose}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              <X size={16} />
              <span>Cancel</span>
            </button>
          )}

          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={handleNextStep}
              disabled={!canProceedToNextStep}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span>Next</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
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
    </div>
  );
};

export default ProjectSetupWizard;