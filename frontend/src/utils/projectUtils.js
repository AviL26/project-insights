// frontend/src/utils/projectUtils.js - ENHANCED
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

// FIXED: Better numeric parsing with validation
const parseNumericField = (value, defaultValue = null) => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  const parsed = typeof value === 'string' ? parseFloat(value.trim()) : Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

const parseIntegerField = (value, defaultValue = 50) => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  const parsed = typeof value === 'string' ? parseInt(value.trim(), 10) : Number(value);
  return isNaN(parsed) ? defaultValue : Math.floor(parsed);
};

// FIXED: Enhanced array handling
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

export const ensureProjectDefaults = (project) => {
  if (!project) return null;
  
  const ensured = {
    ...PROJECT_DEFAULTS,
    ...project,
    
    // FIXED: Consistent coordinate handling with validation
    lat: parseNumericField(
      project.lat ?? project.latitude, 
      PROJECT_DEFAULTS.lat
    ),
    lon: parseNumericField(
      project.lon ?? project.longitude, 
      PROJECT_DEFAULTS.lon
    ),
    
    // FIXED: Enhanced dimension handling
    length: parseNumericField(
      project.length ?? project.dimensions?.length, 
      PROJECT_DEFAULTS.length
    ),
    width: parseNumericField(
      project.width ?? project.dimensions?.width, 
      PROJECT_DEFAULTS.width
    ),
    height: parseNumericField(
      project.height ?? project.dimensions?.height, 
      PROJECT_DEFAULTS.height
    ),
    
    // FIXED: Optional numeric fields with proper null handling
    water_depth: parseNumericField(project.water_depth),
    salinity: parseNumericField(project.salinity),
    carbon_targets: parseNumericField(project.carbon_targets),
    design_life: parseIntegerField(project.design_life, PROJECT_DEFAULTS.design_life),
    
    // FIXED: Array field handling
    regulatory_framework: ensureArray(project.regulatory_framework),
    stakeholders: ensureArray(project.stakeholders),
    primary_goals: ensureArray(project.primary_goals),
    target_species: ensureArray(project.target_species),
    habitat_types: ensureArray(project.habitat_types),
    
    // Ensure string fields are strings
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
    status: project.status ? String(project.status).trim() : PROJECT_DEFAULTS.status
  };
  
  return ensured;
};

export const ensureProjectsDefaults = (projects) => {
  if (!Array.isArray(projects)) return [];
  return projects.map(ensureProjectDefaults).filter(Boolean);
};

export const formatProjectLocation = (project) => {
  if (!project) return 'Unknown location';
  
  if (project.region && project.country) {
    return `${project.region}, ${project.country}`;
  }
  if (project.location) {
    return project.location;
  }
  
  const lat = parseNumericField(project.lat ?? project.latitude, PROJECT_DEFAULTS.lat);
  const lon = parseNumericField(project.lon ?? project.longitude, PROJECT_DEFAULTS.lon);
  
  return `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`;
};

// FIXED: Enhanced validation with specific error types
export const validateProjectData = (projectData) => {
  const errors = [];
  const warnings = [];
  
  if (!projectData) {
    return { isValid: false, errors: ['Project data is required'], warnings: [] };
  }
  
  // Required string fields
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
  
  // Validate numeric fields with proper ranges
  const numericValidations = [
    {
      field: 'lat',
      alt: 'latitude',
      label: 'Latitude',
      required: true,
      min: -90,
      max: 90
    },
    {
      field: 'lon',
      alt: 'longitude', 
      label: 'Longitude',
      required: true,
      min: -180,
      max: 180
    },
    {
      field: 'length',
      label: 'Length',
      required: false,
      min: 0,
      max: 10000 // reasonable upper limit in meters
    },
    {
      field: 'width',
      label: 'Width', 
      required: false,
      min: 0,
      max: 10000
    },
    {
      field: 'height',
      label: 'Height',
      required: false,
      min: 0,
      max: 1000
    },
    {
      field: 'water_depth',
      label: 'Water depth',
      required: false,
      min: 0,
      max: 12000 // deepest ocean
    },
    {
      field: 'salinity',
      label: 'Salinity',
      required: false,
      min: 0,
      max: 50 // PSU
    },
    {
      field: 'carbon_targets',
      label: 'Carbon targets',
      required: false,
      min: 0,
      max: 1000000 // tonnes
    },
    {
      field: 'design_life',
      label: 'Design life',
      required: false,
      min: 1,
      max: 200 // years
    }
  ];
  
  numericValidations.forEach(({ field, alt, label, required, min, max }) => {
    const value = projectData[field] ?? (alt ? projectData[alt] : undefined);
    
    if (required && (value === undefined || value === null || value === '')) {
      errors.push(`${label} is required`);
      return;
    }
    
    if (value !== undefined && value !== null && value !== '') {
      const numValue = parseNumericField(value);
      
      if (numValue === null) {
        errors.push(`${label} must be a valid number`);
      } else {
        if (numValue < min) {
          errors.push(`${label} must be at least ${min}`);
        }
        if (numValue > max) {
          errors.push(`${label} must not exceed ${max}`);
        }
      }
    }
  });
  
  // Validate array fields
  const arrayFields = ['regulatory_framework', 'stakeholders', 'primary_goals', 'target_species', 'habitat_types'];
  arrayFields.forEach(field => {
    if (projectData[field] !== undefined) {
      try {
        const arrayValue = ensureArray(projectData[field]);
        if (arrayValue.length > 100) { // reasonable limit
          warnings.push(`${field.replace('_', ' ')} has many items (${arrayValue.length}) - consider reviewing`);
        }
      } catch (error) {
        errors.push(`${field.replace('_', ' ')} must be a valid array or comma-separated string`);
      }
    }
  });
  
  // Business logic validations
  const length = parseNumericField(projectData.length);
  const width = parseNumericField(projectData.width);
  const height = parseNumericField(projectData.height);
  
  if (length && width && height) {
    const volume = length * width * height;
    if (volume > 1000000) { // 1 million cubic meters
      warnings.push(`Project volume (${volume.toLocaleString()}m³) is extremely large - please verify dimensions`);
    }
    if (volume < 0.1) {
      warnings.push(`Project volume (${volume}m³) is very small - please verify dimensions`);
    }
  }
  
  // Coordinate proximity validation
  const lat = parseNumericField(projectData.lat ?? projectData.latitude);
  const lon = parseNumericField(projectData.lon ?? projectData.longitude);
  
  if (lat && lon) {
    // Check if coordinates are in water (very basic check)
    if (Math.abs(lat) > 85) {
      warnings.push('Coordinates are in polar regions - marine projects may not be feasible');
    }
    
    // Check for obviously wrong coordinates (like 0,0 which is in the Gulf of Guinea)
    if (lat === 0 && lon === 0) {
      warnings.push('Coordinates appear to be default values (0,0) - please verify location');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    hasWarnings: warnings.length > 0
  };
};

export const prepareProjectForAPI = (projectData) => {
  if (!projectData) return null;
  
  const prepared = ensureProjectDefaults(projectData);
  
  return {
    ...prepared,
    // FIXED: Guaranteed numeric parsing for API
    lat: parseNumericField(prepared.lat, PROJECT_DEFAULTS.lat),
    lon: parseNumericField(prepared.lon, PROJECT_DEFAULTS.lon),
    length: parseNumericField(prepared.length, PROJECT_DEFAULTS.length),
    width: parseNumericField(prepared.width, PROJECT_DEFAULTS.width),
    height: parseNumericField(prepared.height, PROJECT_DEFAULTS.height),
    water_depth: parseNumericField(prepared.water_depth),
    salinity: parseNumericField(prepared.salinity),
    carbon_targets: parseNumericField(prepared.carbon_targets),
    design_life: parseIntegerField(prepared.design_life, PROJECT_DEFAULTS.design_life),
    
    // FIXED: Ensure arrays are properly serialized for API
    regulatory_framework: ensureArray(prepared.regulatory_framework),
    stakeholders: ensureArray(prepared.stakeholders),
    primary_goals: ensureArray(prepared.primary_goals),
    target_species: ensureArray(prepared.target_species),
    habitat_types: ensureArray(prepared.habitat_types),
    
    // Clean up undefined/null string fields
    name: prepared.name || '',
    country: prepared.country || '',
    region: prepared.region || '',
    structure_type: prepared.structure_type || '',
    
    // Remove any undefined fields to avoid API issues
    ...Object.fromEntries(
      Object.entries(prepared).filter(([_, value]) => value !== undefined)
    )
  };
};

// FIXED: Utility to safely access nested project properties
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

// FIXED: Utility to format project dimensions safely
export const formatProjectDimensions = (project) => {
  if (!project) return 'Unknown dimensions';
  
  const length = parseNumericField(project.length ?? project.dimensions?.length);
  const width = parseNumericField(project.width ?? project.dimensions?.width);
  const height = parseNumericField(project.height ?? project.dimensions?.height);
  
  if (!length || !width || !height) {
    return 'Dimensions not specified';
  }
  
  return `${length}m × ${width}m × ${height}m`;
};

// FIXED: Utility to check if project has complete data
export const isProjectComplete = (project) => {
  if (!project) return false;
  
  const validation = validateProjectData(project);
  return validation.isValid;
};

// FIXED: Export as named variable instead of anonymous default
const projectUtilsExport = {
  PROJECT_DEFAULTS,
  ensureProjectDefaults,
  ensureProjectsDefaults,
  formatProjectLocation,
  validateProjectData,
  prepareProjectForAPI,
  getProjectProperty,
  formatProjectDimensions,
  isProjectComplete
};

export default projectUtilsExport;