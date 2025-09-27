// frontend/src/utils/projectUtils.js - COMPLETE ENHANCED VERSION FOR 400 ERROR FIX

export const PROJECT_DEFAULTS = {
  lat: 32.0,
  lon: 34.0,
  length: 0,
  width: 0,
  height: 0,
  status: 'active',
  design_life: 50,
  water_depth: null,
  salinity: null,
  carbon_targets: null
};

// ENHANCED: More robust numeric parsing with edge case handling - Issue #6 Fix
const parseNumericField = (value, defaultValue = null, fieldName = 'field') => {
  // Handle null, undefined, or empty string
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  // If already a number, validate it
  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) {
      console.warn(`Invalid numeric value for ${fieldName}:`, value);
      return defaultValue;
    }
    return value;
  }
  
  // Handle string input with better validation
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return defaultValue;
    
    // Handle common input issues
    const cleanedValue = trimmed
      .replace(/[^\d.-]/g, '') // Remove non-numeric chars except decimal and minus
      .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
      .replace(/^-+/, '-')     // Replace multiple minus with single minus
      .replace(/-(?!^)/g, ''); // Remove minus signs that aren't at the start
    
    if (cleanedValue === '' || cleanedValue === '-' || cleanedValue === '.') {
      console.warn(`Cannot parse "${value}" as number for ${fieldName}`);
      return defaultValue;
    }
    
    const parsed = parseFloat(cleanedValue);
    
    if (isNaN(parsed) || !isFinite(parsed)) {
      console.warn(`Cannot parse "${value}" as number for ${fieldName}`);
      return defaultValue;
    }
    
    return parsed;
  }
  
  // Handle other types
  console.warn(`Unexpected type for numeric field ${fieldName}:`, typeof value, value);
  return defaultValue;
};

// ENHANCED: Better integer parsing with validation
const parseIntegerField = (value, defaultValue = 50, fieldName = 'field') => {
  const numericValue = parseNumericField(value, defaultValue, fieldName);
  if (numericValue === null || numericValue === defaultValue) {
    return defaultValue;
  }
  
  // Ensure it's a positive integer for fields like design_life
  const intValue = Math.floor(Math.abs(numericValue));
  return intValue > 0 ? intValue : defaultValue;
};

// ENHANCED: Better coordinate parsing with validation - Issue #6 Fix
const parseCoordinates = (latValue, lonValue) => {
  const latitude = parseNumericField(latValue, null, 'latitude');
  const longitude = parseNumericField(lonValue, null, 'longitude');
  
  // Validate coordinate ranges
  const validLatitude = latitude !== null && latitude >= -90 && latitude <= 90 ? latitude : null;
  const validLongitude = longitude !== null && longitude >= -180 && longitude <= 180 ? longitude : null;
  
  if (latitude !== null && validLatitude === null) {
    console.warn(`Latitude ${latitude} is out of valid range (-90 to 90)`);
  }
  
  if (longitude !== null && validLongitude === null) {
    console.warn(`Longitude ${longitude} is out of valid range (-180 to 180)`);
  }
  
  return {
    latitude: validLatitude,
    longitude: validLongitude
  };
};

// ENHANCED: Better dimension parsing with validation
const parseDimensions = (project) => {
  const length = parseNumericField(
    project.length ?? project.dimensions?.length, 
    PROJECT_DEFAULTS.length,
    'length'
  );
  const width = parseNumericField(
    project.width ?? project.dimensions?.width, 
    PROJECT_DEFAULTS.width,
    'width'
  );
  const height = parseNumericField(
    project.height ?? project.dimensions?.height, 
    PROJECT_DEFAULTS.height,
    'height'
  );
  
  // Ensure positive values for dimensions
  const validLength = length !== null && length > 0 ? length : null;
  const validWidth = width !== null && width > 0 ? width : null;
  const validHeight = height !== null && height > 0 ? height : null;
  
  return {
    length: validLength,
    width: validWidth, 
    height: validHeight,
    // Calculate volume only if all dimensions are valid
    volume: validLength && validWidth && validHeight ? validLength * validWidth * validHeight : null
  };
};

// Keep your excellent ensureArray function
const ensureArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value.split(',').map(item => item.trim()).filter(Boolean);
    }
  }
  return [];
};

// ENHANCED: Your ensureProjectDefaults with better numeric handling
export const ensureProjectDefaults = (project) => {
  if (!project) return null;
  
  // Parse coordinates with validation
  const { latitude, longitude } = parseCoordinates(
    project.lat ?? project.latitude,
    project.lon ?? project.longitude
  );
  
  // Parse dimensions with validation
  const { length, width, height, volume } = parseDimensions(project);
  
  const ensured = {
    ...PROJECT_DEFAULTS,
    ...project,
    
    // ENHANCED: Use validated coordinates
    lat: latitude !== null ? latitude : PROJECT_DEFAULTS.lat,
    lon: longitude !== null ? longitude : PROJECT_DEFAULTS.lon,
    latitude: latitude, // Keep both formats for compatibility
    longitude: longitude,
    
    // ENHANCED: Use validated dimensions
    length: length !== null ? length : PROJECT_DEFAULTS.length,
    width: width !== null ? width : PROJECT_DEFAULTS.width,  
    height: height !== null ? height : PROJECT_DEFAULTS.height,
    volume: volume, // Calculated volume
    
    // ENHANCED: Better numeric field parsing with validation
    water_depth: parseNumericField(project.water_depth, null, 'water_depth'),
    salinity: parseNumericField(project.salinity, null, 'salinity'),
    carbon_targets: parseNumericField(project.carbon_targets, null, 'carbon_targets'),
    design_life: parseIntegerField(project.design_life, PROJECT_DEFAULTS.design_life, 'design_life'),
    
    // ENHANCED: Additional numeric fields that might come from forms
    wave_height: parseNumericField(project.wave_height, null, 'wave_height'),
    temperature: parseNumericField(project.temperature, null, 'temperature'),
    ph_level: parseNumericField(project.ph_level, null, 'ph_level'),
    budget: parseNumericField(project.budget, null, 'budget'),
    
    // Keep your excellent array field handling
    regulatory_framework: ensureArray(project.regulatory_framework),
    stakeholders: ensureArray(project.stakeholders),
    primary_goals: ensureArray(project.primary_goals),
    target_species: ensureArray(project.target_species),
    habitat_types: ensureArray(project.habitat_types),
    
    // Keep your excellent string field handling
    name: project.name ? String(project.name).trim() : '',
    country: project.country ? String(project.country).trim() : '',
    region: project.region ? String(project.region).trim() : '',
    structure_type: project.structure_type ? String(project.structure_type).trim() : '',
    wave_exposure: project.wave_exposure ? String(project.wave_exposure).trim() : '',
    seabed_type: project.seabed_type ? String(project.seabed_type).trim() : '',
    water_temperature: project.water_temperature ? String(project.water_temperature).trim() : '',
    primary_function: project.primary_function ? String(project.primary_function).trim() : '',
    environmental_assessment: project.environmental_assessment ? String(project.environmental_assessment).trim() : '',
    permit_status: project.permit_status ? String(project.permit_status).trim() : '',
    monitoring_plan: project.monitoring_plan ? String(project.monitoring_plan).trim() : '',
    coordinates: project.coordinates ? String(project.coordinates).trim() : '',
    status: project.status ? String(project.status).trim() : PROJECT_DEFAULTS.status,
    
    // ENHANCED: Ensure dimensions object exists for backward compatibility
    dimensions: {
      length: length,
      width: width,
      height: height
    }
  };
  
  return ensured;
};

// Keep your excellent ensureProjectsDefaults
export const ensureProjectsDefaults = (projects) => {
  if (!Array.isArray(projects)) return [];
  return projects.map(ensureProjectDefaults).filter(Boolean);
};

// Keep your excellent formatProjectLocation
export const formatProjectLocation = (project) => {
  if (!project) return 'Unknown location';
  
  if (project.region && project.country) {
    return `${project.region}, ${project.country}`;
  }
  if (project.location) {
    return project.location;
  }
  
  const lat = parseNumericField(project.lat ?? project.latitude, PROJECT_DEFAULTS.lat, 'latitude');
  const lon = parseNumericField(project.lon ?? project.longitude, PROJECT_DEFAULTS.lon, 'longitude');
  
  return `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`;
};

// ENHANCED: Your validateProjectData with better numeric validation
export const validateProjectData = (projectData) => {
  const errors = [];
  const warnings = [];
  
  if (!projectData) {
    return { isValid: false, errors: ['Project data is required'], warnings: [] };
  }
  
  // Keep your excellent required string field validation
  const requiredStringFields = [
    { field: 'name', label: 'Project name' },
    { field: 'country', label: 'Country' },
    { field: 'structure_type', label: 'Structure type' }
  ];
  
  requiredStringFields.forEach(({ field, label }) => {
    const value = projectData[field];
    if (!value || String(value).trim().length === 0) {
      errors.push(`${label} is required`);
    }
  });
  
  // ENHANCED: Better numeric validation with specific error messages
  const numericValidations = [
    {
      field: 'lat',
      alt: 'latitude',
      label: 'Latitude',
      required: true,
      min: -90,
      max: 90,
      type: 'coordinate'
    },
    {
      field: 'lon',
      alt: 'longitude', 
      label: 'Longitude',
      required: true,
      min: -180,
      max: 180,
      type: 'coordinate'
    },
    {
      field: 'length',
      label: 'Length',
      required: false,
      min: 0,
      max: 10000,
      type: 'dimension'
    },
    {
      field: 'width',
      label: 'Width', 
      required: false,
      min: 0,
      max: 10000,
      type: 'dimension'
    },
    {
      field: 'height',
      label: 'Height',
      required: false,
      min: 0,
      max: 1000,
      type: 'dimension'
    },
    {
      field: 'water_depth',
      label: 'Water depth',
      required: false,
      min: 0,
      max: 12000,
      type: 'environmental'
    },
    {
      field: 'salinity',
      label: 'Salinity',
      required: false,
      min: 0,
      max: 50,
      type: 'environmental'
    },
    {
      field: 'ph_level',
      label: 'pH level',
      required: false,
      min: 0,
      max: 14,
      type: 'environmental'
    },
    {
      field: 'temperature',
      label: 'Temperature',
      required: false,
      min: -5,
      max: 50,
      type: 'environmental'
    },
    {
      field: 'wave_height',
      label: 'Wave height',
      required: false,
      min: 0,
      max: 30,
      type: 'environmental'
    },
    {
      field: 'carbon_targets',
      label: 'Carbon targets',
      required: false,
      min: 0,
      max: 1000000,
      type: 'target'
    },
    {
      field: 'budget',
      label: 'Budget',
      required: false,
      min: 0,
      max: 999999999,
      type: 'financial'
    },
    {
      field: 'design_life',
      label: 'Design life',
      required: false,
      min: 1,
      max: 200,
      type: 'duration'
    }
  ];
  
  numericValidations.forEach(({ field, alt, label, required, min, max, type }) => {
    const value = projectData[field] ?? (alt ? projectData[alt] : undefined);
    
    if (required && (value === undefined || value === null || value === '')) {
      errors.push(`${label} is required`);
      return;
    }
    
    if (value !== undefined && value !== null && value !== '') {
      const numValue = parseNumericField(value, null, field);
      
      if (numValue === null) {
        errors.push(`${label} must be a valid number`);
      } else {
        if (numValue < min) {
          if (type === 'coordinate') {
            errors.push(`${label} must be between ${min} and ${max} degrees`);
          } else if (type === 'dimension') {
            errors.push(`${label} must be at least ${min} meters`);
          } else {
            errors.push(`${label} must be at least ${min}`);
          }
        }
        if (numValue > max) {
          if (type === 'coordinate') {
            errors.push(`${label} must be between ${min} and ${max} degrees`);
          } else if (type === 'dimension') {
            errors.push(`${label} cannot exceed ${max} meters`);
          } else {
            errors.push(`${label} cannot exceed ${max}`);
          }
        }
      }
    }
  });
  
  // Keep your excellent array field validation
  const arrayFields = ['regulatory_framework', 'stakeholders', 'primary_goals', 'target_species', 'habitat_types'];
  arrayFields.forEach(field => {
    if (projectData[field] !== undefined) {
      try {
        const arrayValue = ensureArray(projectData[field]);
        if (arrayValue.length > 100) {
          warnings.push(`${field.replace('_', ' ')} has many items (${arrayValue.length}) - consider reviewing`);
        }
      } catch (error) {
        errors.push(`${field.replace('_', ' ')} must be a valid array or comma-separated string`);
      }
    }
  });
  
  // ENHANCED: Better business logic validations with numeric parsing
  const length = parseNumericField(projectData.length, null, 'length');
  const width = parseNumericField(projectData.width, null, 'width');
  const height = parseNumericField(projectData.height, null, 'height');
  
  if (length !== null && width !== null && height !== null && length > 0 && width > 0 && height > 0) {
    const volume = length * width * height;
    if (volume > 1000000) {
      warnings.push(`Project volume (${volume.toLocaleString()}m³) is extremely large - please verify dimensions`);
    }
    if (volume < 0.1) {
      warnings.push(`Project volume (${volume}m³) is very small - please verify dimensions`);
    }
  }
  
  // ENHANCED: Better coordinate validation
  const { latitude, longitude } = parseCoordinates(
    projectData.lat ?? projectData.latitude,
    projectData.lon ?? projectData.longitude
  );
  
  if (latitude !== null && longitude !== null) {
    if (Math.abs(latitude) > 85) {
      warnings.push('Coordinates are in polar regions - marine projects may not be feasible');
    }
    
    if (latitude === 0 && longitude === 0) {
      warnings.push('Coordinates appear to be default values (0,0) - please verify location');
    }
    
    // Check for land vs water coordinates (basic heuristic)
    if (Math.abs(latitude) < 1 && Math.abs(longitude) < 1) {
      warnings.push('Coordinates are near the equator/prime meridian - please verify this is the intended location');
    }
  }
  
  // ENHANCED: Environmental parameter cross-validation
  const salinity = parseNumericField(projectData.salinity, null, 'salinity');
  const temperature = parseNumericField(projectData.temperature, null, 'temperature');
  const ph_level = parseNumericField(projectData.ph_level, null, 'ph_level');
  
  if (salinity !== null && temperature !== null) {
    if (salinity > 40 && temperature < 5) {
      warnings.push('High salinity with low temperature is unusual - please verify environmental conditions');
    }
  }
  
  if (ph_level !== null && (ph_level < 7.5 || ph_level > 8.5)) {
    warnings.push('pH level is outside typical ocean range (7.5-8.5) - please verify');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    hasWarnings: warnings.length > 0
  };
};

// CRITICAL FIX: Map wizard data to backend schema format
const mapWizardDataToBackend = (wizardData) => {
  // Map structure types to backend expected values
  const structureTypeMap = {
    'Breakwater': 'breakwater',
    'Seawall': 'seawall', 
    'Pier': 'pier',
    'Jetty': 'jetty',
    'Artificial Reef': 'artificial_reef',
    'Coastal Protection': 'coastal_protection',
    // Handle both cases
    'breakwater': 'breakwater',
    'seawall': 'seawall',
    'pier': 'pier',
    'jetty': 'jetty',
    'artificial_reef': 'artificial_reef',
    'coastal_protection': 'coastal_protection'
  };

  // Helper function to safely format dates
  const formatDate = (dateInput) => {
    if (!dateInput) return null;
    
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return null;
      
      // Return ISO string format that backend expects
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    } catch (error) {
      console.error('Date formatting error:', error);
      return null;
    }
  };

  // Build the payload that matches backend schema EXACTLY
  const payload = {
    // Required fields - map wizard field names to backend field names
    name: wizardData.projectName || wizardData.name || '',
    location: wizardData.location || '',
    type: structureTypeMap[wizardData.structureType] || structureTypeMap[wizardData.type] || wizardData.type || '',
    
    // Optional fields with safe conversion
    status: wizardData.status || 'planned',
    budget: parseNumericField(wizardData.budget || wizardData.estimatedCost, null, 'budget'),
    start_date: formatDate(wizardData.startDate || wizardData.start_date),
    end_date: formatDate(wizardData.endDate || wizardData.end_date),
    
    // Additional fields if backend supports them
    client_name: wizardData.clientName || wizardData.client_name || null,
    project_manager: wizardData.projectManager || wizardData.project_manager || null,
    
    // Handle dimensions if provided
    ...(wizardData.dimensions && {
      length: parseNumericField(wizardData.dimensions.length, null, 'length'),
      width: parseNumericField(wizardData.dimensions.width, null, 'width'),
      height: parseNumericField(wizardData.dimensions.height, null, 'height'),
      depth: parseNumericField(wizardData.dimensions.depth, null, 'depth')
    })
  };

  // Remove null/undefined values to avoid backend issues
  Object.keys(payload).forEach(key => {
    if (payload[key] === null || payload[key] === undefined || payload[key] === '') {
      delete payload[key];
    }
  });

  return payload;
};

// ENHANCED: Your prepareProjectForAPI with backend schema mapping
export const prepareProjectForAPI = (projectData) => {
  if (!projectData) return null;
  
  console.log('Original wizard data:', projectData);
  
  // Step 1: Map wizard data to backend schema format
  const mappedData = mapWizardDataToBackend(projectData);
  console.log('Mapped to backend schema:', mappedData);
  
  // Step 2: Ensure defaults and validate
  const prepared = ensureProjectDefaults(mappedData);
  console.log('After ensuring defaults:', prepared);
  
  // Step 3: Final preparation with guaranteed numeric types
  const { latitude, longitude } = parseCoordinates(prepared.lat, prepared.lon);
  const { length, width, height } = parseDimensions(prepared);
  
  const apiReady = {
    ...prepared,
    
    // CRITICAL: Guarantee numeric types for API - Issue #6 Complete Fix
    lat: latitude !== null ? latitude : PROJECT_DEFAULTS.lat,
    lon: longitude !== null ? longitude : PROJECT_DEFAULTS.lon,
    latitude: latitude,
    longitude: longitude,
    
    length: length !== null ? length : PROJECT_DEFAULTS.length,
    width: width !== null ? width : PROJECT_DEFAULTS.width,
    height: height !== null ? height : PROJECT_DEFAULTS.height,
    
    // Environmental parameters with guaranteed types
    water_depth: parseNumericField(prepared.water_depth, null, 'water_depth'),
    salinity: parseNumericField(prepared.salinity, null, 'salinity'),
    carbon_targets: parseNumericField(prepared.carbon_targets, null, 'carbon_targets'),
    design_life: parseIntegerField(prepared.design_life, PROJECT_DEFAULTS.design_life, 'design_life'),
    
    // Additional numeric fields
    wave_height: parseNumericField(prepared.wave_height, null, 'wave_height'),
    temperature: parseNumericField(prepared.temperature, null, 'temperature'),
    ph_level: parseNumericField(prepared.ph_level, null, 'ph_level'),
    budget: parseNumericField(prepared.budget, null, 'budget'),
    
    // Ensure arrays are properly serialized
    regulatory_framework: ensureArray(prepared.regulatory_framework),
    stakeholders: ensureArray(prepared.stakeholders),
    primary_goals: ensureArray(prepared.primary_goals),
    target_species: ensureArray(prepared.target_species),
    habitat_types: ensureArray(prepared.habitat_types),
    
    // Clean string fields
    name: prepared.name || '',
    country: prepared.country || '',
    region: prepared.region || '',
    structure_type: prepared.structure_type || '',
    
    // Add metadata for debugging
    prepared_at: new Date().toISOString(),
    
    // Remove undefined fields
    ...Object.fromEntries(
      Object.entries(prepared).filter(([_, value]) => value !== undefined)
    )
  };
  
  // Final cleanup - remove any remaining undefined values
  Object.keys(apiReady).forEach(key => {
    if (apiReady[key] === undefined) {
      delete apiReady[key];
    }
  });
  
  console.log('Final API-ready payload:', apiReady);
  return apiReady;
};

// NEW: Utility functions for form handling - Issue #6 Complete Fix
export const handleNumericInput = (value, fieldName) => {
  return parseNumericField(value, null, fieldName);
};

export const displayNumericValue = (value) => {
  if (value === null || value === undefined) return '';
  return value.toString();
};

export const formatCurrency = (value, currency = 'USD') => {
  const numValue = parseNumericField(value, 0, 'currency');
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(numValue);
};

export const formatVolume = (length, width, height) => {
  const { volume } = parseDimensions({ length, width, height });
  if (volume === null) return 'Volume not calculable';
  
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(2)} million m³`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}k m³`;
  } else {
    return `${volume.toFixed(1)} m³`;
  }
};

// Keep all your excellent existing utility functions
export const getProjectProperty = (project, path, defaultValue = null) => {
  if (!project || !path) return defaultValue;
  
  const keys = path.split('.');
  let current = project;
  
  for (const key of keys) {
    if (current === null || current === undefined || !(key in current)) {
      return defaultValue;
    }
    current = current[key];
  }
  
  return current !== undefined ? current : defaultValue;
};

export const formatProjectDimensions = (project) => {
  if (!project) return 'Unknown dimensions';
  
  const { length, width, height } = parseDimensions(project);
  
  if (length === null || width === null || height === null) {
    return 'Dimensions not specified';
  }
  
  return `${length}m × ${width}m × ${height}m`;
};

export const isProjectComplete = (project) => {
  if (!project) return false;
  
  const validation = validateProjectData(project);
  return validation.isValid;
};

// Export everything
const projectUtilsExport = {
  PROJECT_DEFAULTS,
  ensureProjectDefaults,
  ensureProjectsDefaults,
  formatProjectLocation,
  validateProjectData,
  prepareProjectForAPI,
  getProjectProperty,
  formatProjectDimensions,
  isProjectComplete,
  // New exports for Issue #6
  handleNumericInput,
  displayNumericValue,
  formatCurrency,
  formatVolume
};

export default projectUtilsExport;