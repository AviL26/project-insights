// frontend/src/components/ProjectSetup/ProjectSetupWizard.js - FIXED INFINITE RE-RENDER
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useProject } from '../../context/ProjectContext';
import { validateProjectData, prepareProjectForAPI } from '../../utils/projectUtils';
import { CoordinateInput, NumericInput } from '../common/ValidatedInput';
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

const PRIMARY_GOALS = [
  'Biodiversity Enhancement',
  'Carbon Sequestration',
  'Fish Habitat Creation',
  'Coastal Protection',
  'Wave Energy Reduction',
  'Marine Research Platform',
  'Aquaculture Support',
  'Restoration of Natural Habitat',
  'Tourism and Recreation',
  'Water Quality Improvement'
];

const TARGET_SPECIES = [
  'Mediterranean Grouper',
  'Sea Bream',
  'Sea Bass',
  'Octopus',
  'Lobster',
  'Mussels',
  'Oysters',
  'Algae and Seaweed',
  'Coral',
  'Sponges',
  'Various Fish Species',
  'Crustaceans',
  'Mollusks'
];

const HABITAT_TYPES = [
  'Kelp/Algae Forests',
  'Subtidal Rocky Reef',
  'Filter Feeder Communities',
  'Soft Sediment Habitat',
  'Artificial Reef Structure',
  'Nursery Habitat',
  'Feeding Grounds',
  'Spawning Areas',
  'Mixed Habitat Complex'
];

const ProjectSetupWizard = ({ onComplete, isModal = false, onClose }) => {
  const { createProject } = useProject();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [validationWarnings, setValidationWarnings] = useState({});
  
  // Use ref to prevent validation from causing re-renders
  const lastValidatedStep = useRef(-1);
  const lastValidationData = useRef(null);
  
  // Form data state
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    country: '',
    region: '',
    structure_type: '',
    
    // Location & Environment
    lat: null,
    lon: null,
    coordinates: '',
    water_depth: null,
    wave_exposure: '',
    seabed_type: '',
    water_temperature: '',
    salinity: null,
    
    // Technical Specifications
    length: null,
    width: null,
    height: null,
    design_life: 50,
    primary_function: '',
    
    // Project Goals
    regulatory_framework: [],
    environmental_assessment: '',
    permit_status: 'planning',
    stakeholders: [],
    primary_goals: [],
    target_species: [],
    habitat_types: [],
    carbon_targets: null,
    monitoring_plan: '',
    other_species: ''
  });

  // FIXED: Pure validation function that doesn't cause re-renders
  const validateStep = useCallback((stepIndex, data) => {
    const step = STEPS[stepIndex];
    const errors = {};
    const warnings = {};
    
    switch (step.id) {
      case 'basic':
        if (!data.name?.trim()) {
          errors.name = 'Project name is required';
        } else if (data.name.length < 3) {
          warnings.name = 'Project name is quite short';
        }
        
        if (!data.country?.trim()) {
          errors.country = 'Country is required';
        }
        
        if (!data.structure_type?.trim()) {
          errors.structure_type = 'Structure type is required';
        }
        break;
        
      case 'location':
        // Only require either coordinates OR a description, not both
        const hasCoordinates = (data.lat !== null && data.lat !== undefined) && 
                              (data.lon !== null && data.lon !== undefined);
        const hasLocationDescription = data.coordinates?.trim();
        
        if (!hasCoordinates && !hasLocationDescription) {
          errors.location = 'Please provide either coordinates or a location description';
        }
        
        // Validate coordinates if provided
        if (data.lat !== null && data.lat !== undefined) {
          if (data.lat < -90 || data.lat > 90) {
            errors.lat = 'Latitude must be between -90 and 90 degrees';
          }
        }
        
        if (data.lon !== null && data.lon !== undefined) {
          if (data.lon < -180 || data.lon > 180) {
            errors.lon = 'Longitude must be between -180 and 180 degrees';
          }
        }
        
        // Coordinate validation warnings
        if (hasCoordinates && data.lat === 0 && data.lon === 0) {
          warnings.coordinates = 'Coordinates appear to be default values (0,0) - please verify location';
        }
        
        if (data.water_depth !== null && data.water_depth < 0) {
          errors.water_depth = 'Water depth cannot be negative';
        } else if (data.water_depth > 1000) {
          warnings.water_depth = 'Unusually deep water - please verify';
        }
        
        if (data.salinity !== null) {
          if (data.salinity < 0 || data.salinity > 50) {
            errors.salinity = 'Salinity must be between 0 and 50 PSU';
          }
        }
        break;
        
      case 'technical':
        if (data.length !== null && data.length <= 0) {
          errors.length = 'Length must be greater than 0';
        } else if (data.length > 10000) {
          warnings.length = 'Extremely large structure - please verify dimensions';
        }
        
        if (data.width !== null && data.width <= 0) {
          errors.width = 'Width must be greater than 0';
        } else if (data.width > 10000) {
          warnings.width = 'Extremely large structure - please verify dimensions';
        }
        
        if (data.height !== null && data.height <= 0) {
          errors.height = 'Height must be greater than 0';
        } else if (data.height > 1000) {
          warnings.height = 'Extremely tall structure - please verify dimensions';
        }
        
        // Volume check
        if (data.length && data.width && data.height) {
          const volume = data.length * data.width * data.height;
          if (volume > 1000000) {
            warnings.dimensions = `Project volume (${volume.toLocaleString()}m³) is extremely large`;
          } else if (volume < 0.1) {
            warnings.dimensions = `Project volume (${volume}m³) is very small`;
          }
        }
        
        if (data.design_life < 1 || data.design_life > 200) {
          errors.design_life = 'Design life must be between 1 and 200 years';
        }
        break;
        
      case 'goals':
        if (data.primary_goals.length === 0) {
          warnings.primary_goals = 'Consider adding at least one project goal';
        }
        
        if (data.carbon_targets !== null && data.carbon_targets < 0) {
          errors.carbon_targets = 'Carbon targets cannot be negative';
        }
        break;
        
      case 'review':
        // Final comprehensive validation
        const fullValidation = validateProjectData(data);
        if (!fullValidation.isValid) {
          Object.assign(errors, fullValidation.errors);
        }
        if (fullValidation.warnings) {
          Object.assign(warnings, fullValidation.warnings);
        }
        break;
        
      default:
        break;
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      hasWarnings: Object.keys(warnings).length > 0,
      errors,
      warnings
    };
  }, []); // Pure function - no dependencies needed

  // FIXED: Only validate when explicitly requested, not on every render
  const validateCurrentStep = useCallback((stepIndex = currentStep) => {
    // Only validate if we haven't already validated this step with this data
    const dataKey = JSON.stringify(formData);
    if (lastValidatedStep.current === stepIndex && lastValidationData.current === dataKey) {
      return {
        isValid: Object.keys(validationErrors).length === 0,
        hasWarnings: Object.keys(validationWarnings).length > 0,
        errors: validationErrors,
        warnings: validationWarnings
      };
    }

    const validation = validateStep(stepIndex, formData);
    
    // Update validation state only if different
    if (JSON.stringify(validation.errors) !== JSON.stringify(validationErrors)) {
      setValidationErrors(validation.errors);
    }
    if (JSON.stringify(validation.warnings) !== JSON.stringify(validationWarnings)) {
      setValidationWarnings(validation.warnings);
    }
    
    // Cache this validation
    lastValidatedStep.current = stepIndex;
    lastValidationData.current = dataKey;
    
    return validation;
  }, [currentStep, formData, validationErrors, validationWarnings, validateStep]);

  // FIXED: Stable function that doesn't depend on validation state
  const canProceedToStep = useCallback((targetStep) => {
    if (targetStep <= currentStep) return true; // Can go backwards
    
    // Validate all steps up to target
    for (let i = 0; i < targetStep; i++) {
      const validation = validateStep(i, formData);
      if (!validation.isValid) {
        return false;
      }
    }
    return true;
  }, [currentStep, formData, validateStep]);

  const handleNext = useCallback(() => {
    const validation = validateCurrentStep(currentStep);
    
    if (!validation.isValid) {
      // Show error and don't proceed
      return;
    }
    
    if (validation.hasWarnings) {
      // Show warnings but allow proceeding
      console.warn('Step has warnings:', validation.warnings);
    }
    
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
      // Clear validation for next step
      lastValidatedStep.current = -1;
      lastValidationData.current = null;
    }
  }, [currentStep, validateCurrentStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setValidationErrors({});
      setValidationWarnings({});
      // Clear validation cache
      lastValidatedStep.current = -1;
      lastValidationData.current = null;
    }
  }, [currentStep]);

  const handleStepClick = useCallback((stepIndex) => {
    if (canProceedToStep(stepIndex)) {
      setCurrentStep(stepIndex);
      // Clear validation cache when switching steps
      lastValidatedStep.current = -1;
      lastValidationData.current = null;
    }
  }, [canProceedToStep]);

  const updateFormData = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation cache when data changes
    lastValidatedStep.current = -1;
    lastValidationData.current = null;
    
    // Clear validation errors for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const { [field]: removed, ...rest } = prev;
        return rest;
      });
    }
    if (validationWarnings[field]) {
      setValidationWarnings(prev => {
        const { [field]: removed, ...rest } = prev;
        return rest;
      });
    }
  }, [validationErrors, validationWarnings]);

  // Multi-select handler for dropdown options
  const handleMultiSelectChange = useCallback((field, selectedValue, optionsList) => {
    const currentValues = formData[field] || [];
    
    if (currentValues.includes(selectedValue)) {
      // Remove if already selected
      const newValues = currentValues.filter(val => val !== selectedValue);
      updateFormData(field, newValues);
    } else {
      // Add if not selected
      const newValues = [...currentValues, selectedValue];
      updateFormData(field, newValues);
    }
  }, [formData, updateFormData]);

  const handleSubmit = useCallback(async () => {
    // Final validation
    const validation = validateCurrentStep(STEPS.length - 1);
    
    if (!validation.isValid) {
      setSubmitError('Please fix all validation errors before submitting');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Prepare data for API
      const preparedData = prepareProjectForAPI(formData);
      
      // Create project
      const createdProject = await createProject(preparedData);
      
      // Success
      if (onComplete) {
        onComplete(createdProject);
      }
      
    } catch (error) {
      console.error('Project creation failed:', error);
      setSubmitError(error.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateCurrentStep, createProject, onComplete]);

  // FIXED: Stable step content that doesn't recreate on every render
  const stepContent = useMemo(() => {
    const step = STEPS[currentStep];
    
    switch (step.id) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter project name"
              />
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
              )}
              {validationWarnings.name && (
                <p className="mt-1 text-sm text-yellow-600">{validationWarnings.name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => updateFormData('country', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Cyprus, Israel, Greece"
                />
                {validationErrors.country && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.country}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region
                </label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) => updateFormData('region', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Limassol, Haifa Bay"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Structure Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.structure_type}
                onChange={(e) => updateFormData('structure_type', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select structure type</option>
                {STRUCTURE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {validationErrors.structure_type && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.structure_type}</p>
              )}
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-1">Location Information</h4>
              <p className="text-sm text-blue-700">
                Provide either exact coordinates OR a descriptive location. Both are not required.
              </p>
            </div>

            {validationErrors.location && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{validationErrors.location}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CoordinateInput
                coordinateType="latitude"
                label="Latitude (Optional)"
                value={formData.lat || ''}
                onChange={(value) => updateFormData('lat', value)}
                error={validationErrors.lat}
              />

              <CoordinateInput
                coordinateType="longitude" 
                label="Longitude (Optional)"
                value={formData.lon || ''}
                onChange={(value) => updateFormData('lon', value)}
                error={validationErrors.lon}
              />
            </div>

            {validationWarnings.coordinates && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">{validationWarnings.coordinates}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Description
              </label>
              <input
                type="text"
                value={formData.coordinates}
                onChange={(e) => updateFormData('coordinates', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 500m offshore from Limassol Marina, or Near Haifa Port entrance"
              />
              <p className="mt-1 text-sm text-gray-500">
                If you don't have exact coordinates, describe the general location
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <NumericInput
                label="Water Depth (m)"
                value={formData.water_depth || ''}
                onChange={(value) => updateFormData('water_depth', value)}
                min={0}
                max={12000}
                error={validationErrors.water_depth}
                warning={validationWarnings.water_depth}
                helper="Depth of water at project location"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wave Exposure
                </label>
                <select
                  value={formData.wave_exposure}
                  onChange={(e) => updateFormData('wave_exposure', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select exposure level</option>
                  {WAVE_EXPOSURE_OPTIONS.map(exposure => (
                    <option key={exposure} value={exposure}>
                      {exposure.charAt(0).toUpperCase() + exposure.slice(1).replace('-', ' ')}
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
                  onChange={(e) => updateFormData('seabed_type', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select seabed type</option>
                  {SEABED_TYPES.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Water Temperature Range
                </label>
                <input
                  type="text"
                  value={formData.water_temperature}
                  onChange={(e) => updateFormData('water_temperature', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 18-28°C"
                />
              </div>

              <NumericInput
                label="Salinity (PSU)"
                value={formData.salinity || ''}
                onChange={(value) => updateFormData('salinity', value)}
                min={0}
                max={50}
                step={0.1}
                error={validationErrors.salinity}
                helper="Practical Salinity Units"
              />
            </div>
          </div>
        );

      case 'technical':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <NumericInput
                label="Length (m)"
                value={formData.length || ''}
                onChange={(value) => updateFormData('length', value)}
                min={0.1}
                max={10000}
                error={validationErrors.length}
                warning={validationWarnings.length}
              />

              <NumericInput
                label="Width (m)"
                value={formData.width || ''}
                onChange={(value) => updateFormData('width', value)}
                min={0.1}
                max={10000}
                error={validationErrors.width}
                warning={validationWarnings.width}
              />

              <NumericInput
                label="Height (m)"
                value={formData.height || ''}
                onChange={(value) => updateFormData('height', value)}
                min={0.1}
                max={1000}
                error={validationErrors.height}
                warning={validationWarnings.height}
              />
            </div>

            {validationWarnings.dimensions && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">{validationWarnings.dimensions}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <NumericInput
                label="Design Life (years)"
                value={formData.design_life || ''}
                onChange={(value) => updateFormData('design_life', value)}
                min={1}
                max={200}
                error={validationErrors.design_life}
                helper="Expected operational lifespan"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Function
                </label>
                <input
                  type="text"
                  value={formData.primary_function}
                  onChange={(e) => updateFormData('primary_function', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Coastal protection, Harbor infrastructure"
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
                Primary Goals
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PRIMARY_GOALS.map(goal => (
                  <label key={goal} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.primary_goals.includes(goal)}
                      onChange={() => handleMultiSelectChange('primary_goals', goal, PRIMARY_GOALS)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{goal}</span>
                  </label>
                ))}
              </div>
              {validationWarnings.primary_goals && (
                <p className="mt-2 text-sm text-yellow-600">{validationWarnings.primary_goals}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Target Species
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TARGET_SPECIES.map(species => (
                  <label key={species} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.target_species.includes(species)}
                      onChange={() => handleMultiSelectChange('target_species', species, TARGET_SPECIES)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{species}</span>
                  </label>
                ))}
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Other Species (specify)
                </label>
                <input
                  type="text"
                  value={formData.other_species || ''}
                  onChange={(e) => updateFormData('other_species', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter any additional species not listed above"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Habitat Types
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {HABITAT_TYPES.map(habitat => (
                  <label key={habitat} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.habitat_types.includes(habitat)}
                      onChange={() => handleMultiSelectChange('habitat_types', habitat, HABITAT_TYPES)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{habitat}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <NumericInput
                label="Carbon Sequestration Target (tonnes/year)"
                value={formData.carbon_targets || ''}
                onChange={(value) => updateFormData('carbon_targets', value)}
                min={0}
                max={1000000}
                error={validationErrors.carbon_targets}
                helper="Expected carbon sequestration potential"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Environmental Assessment Status
                </label>
                <select
                  value={formData.environmental_assessment}
                  onChange={(e) => updateFormData('environmental_assessment', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select status</option>
                  <option value="not-started">Not Started</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monitoring Plan
              </label>
              <textarea
                value={formData.monitoring_plan}
                onChange={(e) => updateFormData('monitoring_plan', e.target.value)}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the planned monitoring approach for tracking ecological and structural performance..."
              />
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Project Summary</h3>
              <p className="text-blue-800">Please review all information before creating the project.</p>
            </div>

            {Object.keys(validationErrors).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                  <AlertTriangle size={16} className="mr-2" />
                  Validation Errors
                </h4>
                <ul className="text-sm text-red-800 space-y-1">
                  {Object.entries(validationErrors).map(([field, error]) => (
                    <li key={field}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {Object.keys(validationWarnings).length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2 flex items-center">
                  <AlertTriangle size={16} className="mr-2" />
                  Warnings
                </h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  {Object.entries(validationWarnings).map(([field, warning]) => (
                    <li key={field}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Name:</strong> {formData.name}</div>
                  <div><strong>Country:</strong> {formData.country}</div>
                  <div><strong>Region:</strong> {formData.region || 'Not specified'}</div>
                  <div><strong>Type:</strong> {formData.structure_type}</div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Location</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Coordinates:</strong> {formData.lat}°, {formData.lon}°</div>
                  <div><strong>Water Depth:</strong> {formData.water_depth || 'Not specified'}m</div>
                  <div><strong>Wave Exposure:</strong> {formData.wave_exposure || 'Not specified'}</div>
                  <div><strong>Seabed:</strong> {formData.seabed_type || 'Not specified'}</div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Technical Specs</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Dimensions:</strong> {formData.length || 0} × {formData.width || 0} × {formData.height || 0}m</div>
                  <div><strong>Design Life:</strong> {formData.design_life} years</div>
                  <div><strong>Function:</strong> {formData.primary_function || 'Not specified'}</div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Project Goals</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Primary Goals:</strong> {formData.primary_goals.length > 0 ? formData.primary_goals.join(', ') : 'None specified'}</div>
                  <div><strong>Target Species:</strong> {formData.target_species.length > 0 ? formData.target_species.join(', ') : 'None specified'}</div>
                  <div><strong>Carbon Target:</strong> {formData.carbon_targets || 'Not specified'} tonnes/year</div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Unknown step</div>;
    }
  }, [currentStep, formData, validationErrors, validationWarnings, updateFormData, handleMultiSelectChange]);

  const currentStepData = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Create New Project</h2>
          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          )}
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const canAccess = canProceedToStep(index);
            
            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => handleStepClick(index)}
                  disabled={!canAccess}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    isActive 
                      ? 'border-blue-600 bg-blue-600 text-white' 
                      : isCompleted
                        ? 'border-green-600 bg-green-600 text-white'
                        : canAccess
                          ? 'border-gray-300 bg-white text-gray-500 hover:border-blue-300'
                          : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle size={16} />
                  ) : (
                    <Icon size={16} />
                  )}
                </button>
                
                <div className="ml-3 mr-8">
                  <div className={`text-sm font-medium ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Display */}
      <ErrorAlert
        error={submitError}
        onDismiss={() => setSubmitError(null)}
        contextName="Project Creation"
      />

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <currentStepData.icon size={24} className="mr-3 text-blue-600" />
            {currentStepData.title}
          </h3>
        </div>

        {stepContent}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={isFirstStep}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Previous</span>
        </button>

        <div className="text-sm text-gray-500">
          Step {currentStep + 1} of {STEPS.length}
        </div>

        {isLastStep ? (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || Object.keys(validationErrors).length > 0}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>{isSubmitting ? 'Creating...' : 'Create Project'}</span>
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={Object.keys(validationErrors).length > 0}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span>Next</span>
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ProjectSetupWizard;