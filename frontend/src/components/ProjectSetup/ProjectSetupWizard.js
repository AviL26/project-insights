// frontend/src/components/ProjectSetup/ProjectSetupWizard.js - FIXED NUMERIC HANDLING
import React, { useState, useCallback, useMemo } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useLookupData } from '../../hooks/useLookupData';
import { validateProjectData, prepareProjectForAPI, handleNumericInput, displayNumericValue } from '../../utils/projectUtils';
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
  X,
  Info,
  Loader
} from 'lucide-react';

const STEPS = [
  { id: 'basic', title: 'Basic Information', icon: Building, description: 'Project name and location details' },
  { id: 'location', title: 'Location & Environment', icon: MapPin, description: 'Precise coordinates and environmental conditions' },
  { id: 'technical', title: 'Technical Specifications', icon: Settings, description: 'Dimensions and technical parameters' },
  { id: 'goals', title: 'Project Goals', icon: Target, description: 'Define objectives and target outcomes' },
  { id: 'review', title: 'Review & Create', icon: CheckCircle, description: 'Final review before project creation' }
];

const ProjectSetupWizard = ({ onComplete, isModal = false, onClose }) => {
  const { createProject } = useProject();
  const {
    countries,
    regions,
    marineZones,
    structureTypes,
    waveExposure,
    seabedTypes,
    primaryGoals,
    isLoading: lookupLoading,
    error: lookupError,
    loadRegions,
    loadMarineZones,
    getCountryByCode,
    getRegionById,
    getMarineZoneById
  } = useLookupData();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [validationWarnings, setValidationWarnings] = useState({});
  const [stepValidation, setStepValidation] = useState({});
  const [isValidating, setIsValidating] = useState(false);
  
  // FIXED: Form data with proper initial types
  const [formData, setFormData] = useState({
    name: '',
    country_code: '',
    region_id: '',
    marine_zone_id: '',
    structure_type_id: '',
    lat: null,      // FIXED: null instead of string
    lon: null,      // FIXED: null instead of string
    length: null,   // FIXED: null instead of string
    width: null,    // FIXED: null instead of string
    height: null,   // FIXED: null instead of string
    water_depth: null, // FIXED: null instead of string
    wave_exposure_id: '',
    seabed_type_id: '',
    primary_function: '',
    design_life: 50,  // FIXED: number instead of string
    primary_goal_ids: [],
    regulatory_framework: [],
    stakeholders: [],
    target_species: [],
    habitat_types: []
  });

  // Handle country selection and load regions
  const handleCountryChange = useCallback(async (countryCode) => {
    setFormData(prev => ({
      ...prev,
      country_code: countryCode,
      region_id: '',
      marine_zone_id: '',
      lat: null,
      lon: null
    }));
    
    if (countryCode) {
      await loadRegions(countryCode);
    }
  }, [loadRegions]);

  // Handle region selection and load marine zones  
  const handleRegionChange = useCallback(async (regionId) => {
    setFormData(prev => ({
      ...prev,
      region_id: regionId,
      marine_zone_id: '',
      lat: null,
      lon: null
    }));
    
    if (regionId && formData.country_code) {
      await loadMarineZones(formData.country_code, regionId);
    }
  }, [formData.country_code, loadMarineZones]);

  // Handle marine zone selection and set coordinates
  const handleMarineZoneChange = useCallback((zoneId) => {
    const selectedZone = getMarineZoneById(zoneId);
    
    setFormData(prev => ({
      ...prev,
      marine_zone_id: zoneId,
      lat: selectedZone ? selectedZone.lat : null,      // FIXED: store as number
      lon: selectedZone ? selectedZone.lon : null       // FIXED: store as number
    }));
  }, [getMarineZoneById]);

  // FIXED: Enhanced input change handler with proper type handling
  const handleInputChange = useCallback((field, value) => {
    console.log(`Updating ${field}:`, value, typeof value); // Debug log
    
    // Handle numeric fields with proper conversion
    const numericFields = ['lat', 'lon', 'length', 'width', 'height', 'water_depth', 'design_life'];
    
    if (numericFields.includes(field)) {
      const numericValue = handleNumericInput(value, field);
      console.log(`Converted ${field} from "${value}" to:`, numericValue, typeof numericValue); // Debug log
      
      setFormData(prev => ({
        ...prev,
        [field]: numericValue
      }));
    } else {
      // Handle string fields normally
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear validation error for this field
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
    
    // Validate after a short delay
    setTimeout(() => {
      const newData = { ...formData, [field]: numericFields.includes(field) ? handleNumericInput(value, field) : value };
      validateStep(currentStep, newData);
    }, 300);
  }, [formData, currentStep]);

  // FIXED: Display values properly in form inputs
  const getDisplayValue = useCallback((field) => {
    const value = formData[field];
    const numericFields = ['lat', 'lon', 'length', 'width', 'height', 'water_depth', 'design_life'];
    
    if (numericFields.includes(field)) {
      return displayNumericValue(value);
    }
    
    return value || '';
  }, [formData]);

  // Validation (keep your existing validation logic but with minor fixes)
  const validateStep = useCallback(async (stepIndex, data = formData) => {
    setIsValidating(true);
    
    const stepConfig = STEPS[stepIndex];
    const stepErrors = {};
    const stepWarnings = {};
    
    try {
      switch (stepConfig.id) {
        case 'basic':
          if (!data.name?.trim()) {
            stepErrors.name = 'Project name is required';
          } else if (data.name.trim().length < 3) {
            stepWarnings.name = 'Project name should be at least 3 characters for clarity';
          } else if (data.name.trim().length > 100) {
            stepErrors.name = 'Project name should not exceed 100 characters';
          }
          
          if (!data.country_code) {
            stepErrors.country_code = 'Country selection is required';
          }
          
          if (!data.structure_type_id) {
            stepErrors.structure_type_id = 'Structure type is required to proceed';
          }
          break;
          
        case 'location':
          const hasCoordinates = data.lat !== null && data.lon !== null;
          const hasMarineZone = data.marine_zone_id && data.marine_zone_id.trim() !== '';
          
          if (!hasCoordinates && !hasMarineZone) {
            stepErrors.location = 'Please select a marine zone or enter custom coordinates';
          } else if (hasCoordinates) {
            // FIXED: Proper numeric validation
            if (typeof data.lat !== 'number' || data.lat < -90 || data.lat > 90) {
              stepErrors.lat = 'Valid latitude is required (-90 to +90 degrees)';
            }
            
            if (typeof data.lon !== 'number' || data.lon < -180 || data.lon > 180) {
              stepErrors.lon = 'Valid longitude is required (-180 to +180 degrees)';
            }
            
            if (typeof data.lat === 'number' && typeof data.lon === 'number') {
              if (data.lat === 0 && data.lon === 0) {
                stepWarnings.coordinates = 'Coordinates (0,0) are in the Atlantic Ocean - please verify this is correct';
              } else if (Math.abs(data.lat) < 0.001 && Math.abs(data.lon) < 0.001) {
                stepWarnings.coordinates = 'Coordinates very close to (0,0) - please verify location';
              }
              
              if (data.lat > 85 || data.lat < -85) {
                stepWarnings.coordinates = 'Coordinates are in polar regions - unusual for marine infrastructure';
              }
            }
          }
          break;
          
        case 'technical':
          // FIXED: Proper numeric validation for technical fields
          const numericValidations = [
            { field: 'length', min: 0, max: 10000, unit: 'meters' },
            { field: 'width', min: 0, max: 10000, unit: 'meters' },
            { field: 'height', min: 0, max: 1000, unit: 'meters' },
            { field: 'water_depth', min: 0, max: 12000, unit: 'meters' }
          ];
          
          numericValidations.forEach(({ field, min, max, unit }) => {
            const value = data[field];
            if (value !== null && value !== undefined) {
              if (typeof value !== 'number' || isNaN(value)) {
                stepErrors[field] = `${field.replace('_', ' ')} must be a valid number`;
              } else if (value < min || value > max) {
                stepErrors[field] = `${field.replace('_', ' ')} must be between ${min} and ${max} ${unit}`;
              }
            }
          });
          break;
          
        case 'goals':
          if (data.primary_goal_ids?.length === 0) {
            stepWarnings.primary_goals = 'Selecting project goals helps tailor recommendations and compliance requirements';
          }
          break;
          
        case 'review':
          // FIXED: Check for required fields with proper types
          if (!data.name || !data.country_code || !data.structure_type_id || 
              (data.lat === null && !data.marine_zone_id)) {
            stepErrors.required_fields = 'All required fields must be completed before project creation';
          }
          break;
          
        default:
          break;
      }
    } finally {
      setIsValidating(false);
    }
    
    const isValid = Object.keys(stepErrors).length === 0;
    
    setStepValidation(prev => ({
      ...prev,
      [stepIndex]: {
        isValid,
        errors: stepErrors,
        warnings: stepWarnings,
        lastValidated: Date.now()
      }
    }));
    
    return { isValid, errors: stepErrors, warnings: stepWarnings };
  }, [formData]);

  const canProceedToNextStep = useMemo(() => {
    const currentValidation = stepValidation[currentStep];
    return currentValidation?.isValid !== false;
  }, [stepValidation, currentStep]);

  const canSubmit = useMemo(() => {
    const allStepsValid = STEPS.every((_, index) => {
      const validation = stepValidation[index];
      return validation?.isValid !== false;
    });
    
    return allStepsValid && !isSubmitting;
  }, [stepValidation, isSubmitting]);

  const handleArrayFieldChange = useCallback((field, values) => {
    setFormData(prev => ({
      ...prev,
      [field]: Array.isArray(values) ? values : []
    }));
    
    setTimeout(() => validateStep(currentStep), 100);
  }, [currentStep, validateStep]);

  const handleNextStep = useCallback(async () => {
    const validation = await validateStep(currentStep);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setValidationWarnings(validation.warnings);
      return;
    }
    
    setValidationErrors({});
    setValidationWarnings({});
    
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setTimeout(() => validateStep(currentStep + 1), 200);
    }
  }, [currentStep, validateStep]);

  const handlePrevStep = useCallback(() => {
    setValidationErrors({});
    setValidationWarnings({});
    
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // FIXED: Enhanced submit with better logging
  const handleSubmit = useCallback(async () => {
    console.log('Submitting project with data:', formData); // Debug log
    
    setSubmitError(null);
    setIsSubmitting(true);
    
    try {
      // Log the data before preparation
      console.log('Form data before preparation:', JSON.stringify(formData, null, 2));
      
      const preparedData = prepareProjectForAPI(formData);
      
      // Log the prepared data
      console.log('Prepared data for API:', JSON.stringify(preparedData, null, 2));
      
      if (!preparedData) {
        throw new Error('Failed to prepare project data for submission');
      }
      
      const newProject = await createProject(preparedData);
      
      // Reset form
      setFormData({
        name: '',
        country_code: '',
        region_id: '',
        marine_zone_id: '',
        structure_type_id: '',
        lat: null,
        lon: null,
        length: null,
        width: null,
        height: null,
        water_depth: null,
        wave_exposure_id: '',
        seabed_type_id: '',
        primary_function: '',
        design_life: 50,
        primary_goal_ids: [],
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
      console.error('Error response:', error.response?.data); // Log the full error response
      
      let errorMessage = 'Failed to create project. Please check your data and try again.';
      
      if (error.response?.status === 400) {
        const apiError = error.response.data;
        if (apiError?.error) {
          errorMessage = `Validation Error: ${apiError.error}`;
        } else if (apiError?.errors) {
          errorMessage = `Validation Errors: ${JSON.stringify(apiError.errors)}`;
        }
      }
      
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, createProject, onComplete]);

  // Show loading state
  if (lookupLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader size={48} className="animate-spin text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Project Setup</h3>
            <p className="text-gray-600">Initializing location data and project options...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (lookupError) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <ErrorAlert 
          error={lookupError}
          onDismiss={() => window.location.reload()}
          contextName="Project Setup Initialization"
        />
      </div>
    );
  }

  const renderStepContent = () => {
    const stepErrors = validationErrors;
    const stepWarnings = validationWarnings;
    
    switch (STEPS[currentStep].id) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                value={getDisplayValue('name')}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  stepErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="e.g., Haifa Port Breakwater Extension"
                maxLength={100}
              />
              {stepErrors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertTriangle size={14} className="mr-1" />
                  {stepErrors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country *
              </label>
              <select
                value={formData.country_code}
                onChange={(e) => handleCountryChange(e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  stepErrors.country_code ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              >
                <option value="">Select country...</option>
                {countries.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.name} ({country.region})
                  </option>
                ))}
              </select>
              {stepErrors.country_code && (
                <p className="mt-1 text-sm text-red-600">
                  {stepErrors.country_code}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Structure Type *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {structureTypes.map(type => (
                  <label
                    key={type.id}
                    className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                      formData.structure_type_id === type.id 
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500' 
                        : stepErrors.structure_type_id 
                          ? 'border-red-300' 
                          : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="structure_type_id"
                      value={type.id}
                      checked={formData.structure_type_id === type.id}
                      onChange={(e) => handleInputChange('structure_type_id', e.target.value)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{type.name}</div>
                      <div className="text-sm text-gray-600">{type.description}</div>
                    </div>
                  </label>
                ))}
              </div>
              {stepErrors.structure_type_id && (
                <p className="mt-2 text-sm text-red-600">
                  {stepErrors.structure_type_id}
                </p>
              )}
            </div>
          </div>
        );

      case 'location':
        const selectedCountry = getCountryByCode(formData.country_code);
        const selectedMarineZone = getMarineZoneById(formData.marine_zone_id);
        
        return (
          <div className="space-y-6">
            {selectedCountry && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Region
                  </label>
                  <select
                    value={formData.region_id}
                    onChange={(e) => handleRegionChange(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select region...</option>
                    {regions.map(region => (
                      <option key={region.id} value={region.id}>
                        {region.name} - {region.description}
                      </option>
                    ))}
                  </select>
                </div>

                {marineZones.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marine Zone
                    </label>
                    <select
                      value={formData.marine_zone_id}
                      onChange={(e) => handleMarineZoneChange(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select marine zone...</option>
                      {marineZones.map(zone => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name} - {zone.depth_range}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {selectedMarineZone && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900">{selectedMarineZone.name}</h4>
                <p className="text-sm text-blue-700">{selectedMarineZone.characteristics}</p>
              </div>
            )}

            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-3">Or Enter Custom Coordinates</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude (decimal degrees)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={getDisplayValue('lat')}
                    onChange={(e) => handleInputChange('lat', e.target.value)}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
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
                    Longitude (decimal degrees)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={getDisplayValue('lon')}
                    onChange={(e) => handleInputChange('lon', e.target.value)}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      stepErrors.lon ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="e.g., 34.7818"
                  />
                  {stepErrors.lon && (
                    <p className="mt-1 text-sm text-red-600">{stepErrors.lon}</p>
                  )}
                </div>
              </div>
            </div>

            {stepErrors.location && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{stepErrors.location}</p>
              </div>
            )}

            {stepWarnings.coordinates && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-700">{stepWarnings.coordinates}</p>
              </div>
            )}
          </div>
        );

      case 'technical':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Length (meters)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={getDisplayValue('length')}
                  onChange={(e) => handleInputChange('length', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 100"
                />
                {stepErrors.length && <p className="mt-1 text-sm text-red-600">{stepErrors.length}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Width (meters)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={getDisplayValue('width')}
                  onChange={(e) => handleInputChange('width', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 20"
                />
                {stepErrors.width && <p className="mt-1 text-sm text-red-600">{stepErrors.width}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Height (meters)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={getDisplayValue('height')}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 5"
                />
                {stepErrors.height && <p className="mt-1 text-sm text-red-600">{stepErrors.height}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Water Depth (meters)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={getDisplayValue('water_depth')}
                  onChange={(e) => handleInputChange('water_depth', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 15"
                />
                {stepErrors.water_depth && <p className="mt-1 text-sm text-red-600">{stepErrors.water_depth}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Design Life (years)</label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={getDisplayValue('design_life')}
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
              
              {['Infrastructure', 'Environmental', 'Marine Life', 'Economic', 'Scientific'].map(category => {
                const categoryGoals = primaryGoals.filter(goal => goal.category === category);
                
                if (categoryGoals.length === 0) return null;
                
                return (
                  <div key={category} className="mb-6">
                    <h4 className="font-medium text-gray-800 mb-3 text-sm uppercase tracking-wide">
                      {category}
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {categoryGoals.map(goal => (
                        <label 
                          key={goal.id} 
                          className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                            formData.primary_goal_ids.includes(goal.id) 
                              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500' 
                              : 'border-gray-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.primary_goal_ids.includes(goal.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleArrayFieldChange('primary_goal_ids', [...formData.primary_goal_ids, goal.id]);
                              } else {
                                handleArrayFieldChange('primary_goal_ids', formData.primary_goal_ids.filter(g => g !== goal.id));
                              }
                            }}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 mb-1">{goal.name}</div>
                            <div className="text-sm text-gray-600">{goal.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'review':
        const selectedCountryForReview = getCountryByCode(formData.country_code);
        const selectedStructureType = structureTypes.find(t => t.id === formData.structure_type_id);
        
        return (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Summary</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Basic Information</h4>
                  <p><strong>Name:</strong> {formData.name || 'Not specified'}</p>
                  <p><strong>Country:</strong> {selectedCountryForReview?.name || 'Not specified'}</p>
                  <p><strong>Structure:</strong> {selectedStructureType?.name || 'Not specified'}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900">Location</h4>
                  <p><strong>Coordinates:</strong> {formData.lat !== null && formData.lon !== null ? `${formData.lat}°, ${formData.lon}°` : 'Not specified'}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900">Technical Specifications</h4>
                  {formData.length !== null && (
                    <p><strong>Length:</strong> {formData.length}m</p>
                  )}
                  {formData.width !== null && (
                    <p><strong>Width:</strong> {formData.width}m</p>
                  )}
                  {formData.height !== null && (
                    <p><strong>Height:</strong> {formData.height}m</p>
                  )}
                  {formData.water_depth !== null && (
                    <p><strong>Water Depth:</strong> {formData.water_depth}m</p>
                  )}
                  <p><strong>Design Life:</strong> {formData.design_life} years</p>
                </div>

                {formData.primary_goal_ids.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900">Goals</h4>
                    <div className="flex flex-wrap gap-2">
                      {formData.primary_goal_ids.map(goalId => {
                        const goal = primaryGoals.find(g => g.id === goalId);
                        return goal ? (
                          <span key={goalId} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {goal.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* ADDED: Debug information for troubleshooting */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Data Types (Debug Info)</h4>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p><strong>lat:</strong> {typeof formData.lat} ({formData.lat})</p>
                    <p><strong>lon:</strong> {typeof formData.lon} ({formData.lon})</p>
                    <p><strong>length:</strong> {typeof formData.length} ({formData.length})</p>
                    <p><strong>width:</strong> {typeof formData.width} ({formData.width})</p>
                    <p><strong>height:</strong> {typeof formData.height} ({formData.height})</p>
                    <p><strong>water_depth:</strong> {typeof formData.water_depth} ({formData.water_depth})</p>
                    <p><strong>design_life:</strong> {typeof formData.design_life} ({formData.design_life})</p>
                  </div>
                </div>
              </div>
            </div>

            {Object.keys(stepErrors).length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2">Issues Found</h4>
                <ul className="list-disc list-inside space-y-1">
                  {Object.values(stepErrors).map((error, index) => (
                    <li key={index} className="text-sm text-red-700">{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {canSubmit && Object.keys(stepErrors).length === 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex">
                  <CheckCircle size={16} className="text-green-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="font-medium text-green-900">Ready to Create</h4>
                    <p className="text-sm text-green-700 mt-1">
                      All required information has been provided. Click "Create Project" to continue.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                index < currentStep 
                  ? 'bg-green-500 text-white ring-4 ring-green-100' 
                  : index === currentStep 
                    ? 'bg-blue-500 text-white ring-4 ring-blue-100 scale-110' 
                    : 'bg-gray-200 text-gray-600'
              }`}>
                {index < currentStep ? (
                  <CheckCircle size={24} />
                ) : (
                  <step.icon size={24} />
                )}
                {isValidating && index === currentStep && (
                  <div className="absolute inset-0 rounded-full border-2 border-white border-t-transparent animate-spin" />
                )}
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-16 h-2 mx-3 rounded-full transition-all duration-500 ${
                  index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {STEPS[currentStep].title}
          </h2>
          <p className="text-gray-600 text-sm">
            {STEPS[currentStep].description}
          </p>
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
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={handlePrevStep}
          disabled={currentStep === 0}
          className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="font-medium">Previous</span>
        </button>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {STEPS.length}
          </div>

          {isModal && (
            <button
              onClick={onClose}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <X size={16} />
              <span>Cancel</span>
            </button>
          )}

          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={handleNextStep}
              disabled={!canProceedToNextStep || isValidating}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
            >
              {isValidating ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  <span>Validating...</span>
                </>
              ) : (
                <>
                  <span>Next Step</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="flex items-center space-x-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  <span>Creating Project...</span>
                </>
              ) : (
                <>
                  <Save size={20} />
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