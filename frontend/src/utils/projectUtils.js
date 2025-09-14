// frontend/src/utils/projectUtils.js
export const PROJECT_DEFAULTS = {
  lat: 32.0,
  lon: 34.0,
  length: 0,
  width: 0,
  height: 0,
  status: 'active',
  design_life: 50
};

export const ensureProjectDefaults = (project) => {
  if (!project) return null;
  
  return {
    ...PROJECT_DEFAULTS,
    ...project,
    // Handle coordinate variations
    lat: project.lat ?? project.latitude ?? PROJECT_DEFAULTS.lat,
    lon: project.lon ?? project.longitude ?? PROJECT_DEFAULTS.lon,
    // Handle dimension variations
    length: project.length ?? project.dimensions?.length ?? PROJECT_DEFAULTS.length,
    width: project.width ?? project.dimensions?.width ?? PROJECT_DEFAULTS.width,
    height: project.height ?? project.dimensions?.height ?? PROJECT_DEFAULTS.height
  };
};

export const ensureProjectsDefaults = (projects) => {
  if (!Array.isArray(projects)) return [];
  return projects.map(ensureProjectDefaults);
};

export const formatProjectLocation = (project) => {
  if (project.region && project.country) {
    return `${project.region}, ${project.country}`;
  }
  if (project.location) {
    return project.location;
  }
  const lat = project.lat ?? project.latitude ?? PROJECT_DEFAULTS.lat;
  const lon = project.lon ?? project.longitude ?? PROJECT_DEFAULTS.lon;
  return `${lat}°N, ${lon}°E`;
};

export const validateProjectData = (projectData) => {
  const errors = [];
  
  if (!projectData.name || projectData.name.trim().length === 0) {
    errors.push('Project name is required');
  }
  
  if (!projectData.country || projectData.country.trim().length === 0) {
    errors.push('Country is required');
  }
  
  if (!projectData.structure_type || projectData.structure_type.trim().length === 0) {
    errors.push('Structure type is required');
  }
  
  // Validate numeric fields
  const numericFields = ['lat', 'lon', 'length', 'width', 'height', 'water_depth'];
  numericFields.forEach(field => {
    if (projectData[field] !== undefined && projectData[field] !== null && projectData[field] !== '') {
      const value = parseFloat(projectData[field]);
      if (isNaN(value)) {
        errors.push(`${field.replace('_', ' ')} must be a valid number`);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const prepareProjectForAPI = (projectData) => {
  const prepared = ensureProjectDefaults(projectData);
  
  return {
    ...prepared,
    // Ensure numeric fields are properly formatted
    lat: parseFloat(prepared.lat) || PROJECT_DEFAULTS.lat,
    lon: parseFloat(prepared.lon) || PROJECT_DEFAULTS.lon,
    length: parseFloat(prepared.length) || PROJECT_DEFAULTS.length,
    width: parseFloat(prepared.width) || PROJECT_DEFAULTS.width,
    height: parseFloat(prepared.height) || PROJECT_DEFAULTS.height,
    water_depth: prepared.water_depth ? parseFloat(prepared.water_depth) : null,
    salinity: prepared.salinity ? parseFloat(prepared.salinity) : null,
    carbon_targets: prepared.carbon_targets ? parseFloat(prepared.carbon_targets) : null,
    design_life: parseInt(prepared.design_life) || PROJECT_DEFAULTS.design_life,
    
    // Ensure array fields are properly formatted
    regulatory_framework: Array.isArray(prepared.regulatory_framework) ? prepared.regulatory_framework : [],
    stakeholders: Array.isArray(prepared.stakeholders) ? prepared.stakeholders : [],
    primary_goals: Array.isArray(prepared.primary_goals) ? prepared.primary_goals : [],
    target_species: Array.isArray(prepared.target_species) ? prepared.target_species : [],
    habitat_types: Array.isArray(prepared.habitat_types) ? prepared.habitat_types : []
  };
};