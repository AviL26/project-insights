// Week 3 Backend: Business Logic Implementation
// File: /api/services/RecommendationEngine.js

class RecommendationEngine {
  constructor(cache) {
    this.cache = cache;
    this.loadStaticData();
  }

  loadStaticData() {
    // Species/materials filtering rules by location
    this.locationRules = {
      'tropical': {
        waterTemp: [24, 30],
        recommendedMaterials: ['bio-concrete', 'calcium-carbonate', 'ceramic-substrate'],
        targetSpecies: ['staghorn-coral', 'brain-coral', 'reef-fish', 'sea-turtle'],
        avoidMaterials: ['steel', 'untreated-concrete']
      },
      'temperate': {
        waterTemp: [10, 24],
        recommendedMaterials: ['eco-concrete', 'limestone', 'oyster-shell'],
        targetSpecies: ['kelp', 'mussels', 'oysters', 'sea-bass'],
        avoidMaterials: ['tropical-coral-substrates']
      },
      'arctic': {
        waterTemp: [-2, 10],
        recommendedMaterials: ['frost-resistant-concrete', 'granite', 'basalt'],
        targetSpecies: ['arctic-char', 'seals', 'arctic-kelp'],
        avoidMaterials: ['calcium-carbonate', 'bio-concrete']
      }
    };

    // Structure type recommendations by goal and environment
    this.structureRules = {
      'marine-habitat': {
        waveExposure: {
          'low': ['artificial-reef', 'living-seawall', 'habitat-blocks'],
          'medium': ['breakwater-reef', 'habitat-modules', 'bio-rock'],
          'high': ['armored-reef', 'wave-energy-dissipator']
        },
        seabedType: {
          'sand': ['weighted-modules', 'anchor-systems'],
          'rock': ['bolt-on-structures', 'integrated-systems'],
          'mud': ['floating-systems', 'pile-supported']
        }
      },
      'coastal-protection': {
        waveExposure: {
          'low': ['living-seawall', 'soft-revetment'],
          'medium': ['hybrid-breakwater', 'reef-breakwater'],
          'high': ['armored-breakwater', 'offshore-reef']
        }
      },
      'aquaculture': {
        waveExposure: {
          'low': ['cage-systems', 'longline-structures'],
          'medium': ['submersible-cages', 'semi-submersible'],
          'high': ['offshore-platforms', 'deep-water-systems']
        }
      }
    };

    // Material compatibility matrix
    this.materialCompatibility = {
      'bio-concrete': {
        compatible: ['calcium-carbonate', 'ceramic-substrate', 'limestone'],
        incompatible: ['steel', 'aluminum', 'plastic'],
        notes: 'Promotes natural settlement and growth'
      },
      'steel': {
        compatible: ['concrete', 'composite-materials'],
        incompatible: ['bio-concrete', 'calcium-carbonate'],
        notes: 'Requires anti-corrosion treatment in marine environment'
      }
    };
  }

  // Main recommendation method
  async generateRecommendations(projectData) {
    try {
      const cacheKey = `recommendations:${JSON.stringify(projectData)}`;
      const cached = await this.cache.get(cacheKey);
      if (cached) return cached;

      const climate = this.determineClimate(projectData.coordinates);
      const recommendations = {
        materials: this.recommendMaterials(projectData, climate),
        species: this.recommendSpecies(projectData, climate),
        structures: this.recommendStructures(projectData),
        compliance: this.checkCompliance(projectData),
        warnings: this.generateWarnings(projectData)
      };

      await this.cache.set(cacheKey, recommendations, 3600); // 1 hour
      return recommendations;
    } catch (error) {
      console.error('Recommendation generation failed:', error);
      return this.getFallbackRecommendations(projectData);
    }
  }

  determineClimate(coordinates) {
    if (!coordinates) return 'temperate';
    
    const { lat } = coordinates;
    if (Math.abs(lat) < 23.5) return 'tropical';
    if (Math.abs(lat) > 66.5) return 'arctic';
    return 'temperate';
  }

  recommendMaterials(projectData, climate) {
    const rules = this.locationRules[climate];
    if (!rules) return [];

    let recommended = [...rules.recommendedMaterials];
    
    // Filter based on structure types
    if (projectData.structureTypes?.includes('artificial-reef')) {
      recommended = recommended.filter(m => m.includes('bio') || m.includes('calcium'));
    }

    // Filter based on wave exposure
    if (projectData.waveExposure === 'high') {
      recommended = recommended.filter(m => !m.includes('ceramic'));
    }

    return recommended.map(material => ({
      id: material,
      name: this.formatMaterialName(material),
      compatibility: this.materialCompatibility[material]?.notes || '',
      priority: this.calculateMaterialPriority(material, projectData)
    })).sort((a, b) => b.priority - a.priority);
  }

  recommendSpecies(projectData, climate) {
    const rules = this.locationRules[climate];
    if (!rules) return [];

    let species = [...rules.targetSpecies];

    // Filter based on project goals
    if (projectData.primaryGoal === 'coastal-protection') {
      species = species.filter(s => s.includes('kelp') || s.includes('oyster') || s.includes('mussel'));
    }

    return species.map(species => ({
      id: species,
      name: this.formatSpeciesName(species),
      description: this.getSpeciesDescription(species),
      suitability: this.calculateSpeciesSuitability(species, projectData)
    })).sort((a, b) => b.suitability - a.suitability);
  }

  recommendStructures(projectData) {
    const goal = projectData.primaryGoal;
    const waveExposure = projectData.waveExposure;
    const seabedType = projectData.seabedType;

    const goalRules = this.structureRules[goal];
    if (!goalRules) return [];

    let structures = [];
    
    if (goalRules.waveExposure?.[waveExposure]) {
      structures.push(...goalRules.waveExposure[waveExposure]);
    }

    if (goalRules.seabedType?.[seabedType]) {
      structures.push(...goalRules.seabedType[seabedType]);
    }

    // Remove duplicates and format
    return [...new Set(structures)].map(structure => ({
      id: structure,
      name: this.formatStructureName(structure),
      description: this.getStructureDescription(structure),
      complexity: this.getStructureComplexity(structure)
    }));
  }

  checkCompliance(projectData) {
    const compliance = [];
    
    // Environmental compliance
    if (projectData.coordinates) {
      compliance.push({
        type: 'environmental',
        requirement: 'Environmental Impact Assessment',
        status: 'required',
        description: 'Marine construction requires EIA in most jurisdictions'
      });
    }

    // Material compliance
    if (projectData.preferredMaterials?.includes('bio-concrete')) {
      compliance.push({
        type: 'material',
        requirement: 'Bio-material Certification',
        status: 'recommended',
        description: 'Verify bio-concrete meets local marine standards'
      });
    }

    return compliance;
  }

  generateWarnings(projectData) {
    const warnings = [];

    // Wave exposure warnings
    if (projectData.waveExposure === 'high' && 
        projectData.structureTypes?.includes('floating-systems')) {
      warnings.push({
        type: 'design',
        severity: 'high',
        message: 'Floating systems not recommended for high wave exposure areas'
      });
    }

    // Material compatibility warnings
    if (projectData.preferredMaterials?.includes('steel') && 
        projectData.preferredMaterials?.includes('bio-concrete')) {
      warnings.push({
        type: 'material',
        severity: 'medium',
        message: 'Steel and bio-concrete may have compatibility issues'
      });
    }

    return warnings;
  }

  // Helper methods for formatting and calculations
  formatMaterialName(material) {
    return material.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  formatSpeciesName(species) {
    return species.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  formatStructureName(structure) {
    return structure.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  calculateMaterialPriority(material, projectData) {
    let priority = 50; // Base priority
    
    if (projectData.primaryGoal === 'marine-habitat' && material.includes('bio')) {
      priority += 30;
    }
    
    if (projectData.waveExposure === 'high' && material.includes('steel')) {
      priority += 20;
    }

    return priority;
  }

  calculateSpeciesSuitability(species, projectData) {
    let suitability = 50; // Base suitability
    
    if (projectData.primaryGoal === 'marine-habitat') {
      suitability += 30;
    }

    return suitability;
  }

  getSpeciesDescription(species) {
    const descriptions = {
      'staghorn-coral': 'Fast-growing coral species, excellent for reef restoration',
      'brain-coral': 'Slow-growing but very resilient coral species',
      'kelp': 'Large seaweed providing habitat and coastal protection',
      'oysters': 'Filter feeders that improve water quality',
      'mussels': 'Hardy bivalves good for wave energy reduction'
    };
    return descriptions[species] || 'Marine species suitable for habitat restoration';
  }

  getStructureDescription(structure) {
    const descriptions = {
      'artificial-reef': 'Engineered structure to mimic natural reef systems',
      'living-seawall': 'Hybrid structure combining protection with habitat',
      'breakwater-reef': 'Offshore structure reducing wave energy'
    };
    return descriptions[structure] || 'Marine structure for coastal enhancement';
  }

  getStructureComplexity(structure) {
    const complexity = {
      'habitat-blocks': 'low',
      'artificial-reef': 'medium',
      'offshore-platforms': 'high'
    };
    return complexity[structure] || 'medium';
  }

  getFallbackRecommendations(projectData) {
    return {
      materials: [
        { id: 'eco-concrete', name: 'Eco Concrete', priority: 80 },
        { id: 'limestone', name: 'Limestone', priority: 70 }
      ],
      species: [
        { id: 'generic-marine-life', name: 'General Marine Species', suitability: 60 }
      ],
      structures: [
        { id: 'habitat-modules', name: 'Habitat Modules', complexity: 'medium' }
      ],
      compliance: [],
      warnings: []
    };
  }
}

// File: /api/services/ValidationEngine.js

class ValidationEngine {
  constructor() {
    this.initializeRules();
  }

  initializeRules() {
    this.validationRules = {
      step1: {
        required: ['name', 'countryCode', 'primaryGoal'],
        validators: {
          name: (value) => value && value.length >= 3,
          countryCode: (value) => value && value.length === 2,
          primaryGoal: (value) => ['marine-habitat', 'coastal-protection', 'aquaculture'].includes(value)
        }
      },
      step2: {
        required: ['seabedType', 'waveExposure'],
        validators: {
          seabedType: (value) => ['sand', 'rock', 'mud', 'coral'].includes(value),
          waveExposure: (value) => ['low', 'medium', 'high'].includes(value)
        }
      },
      step3: {
        required: ['structureTypes'],
        validators: {
          structureTypes: (value) => Array.isArray(value) && value.length > 0,
          preferredMaterials: (value) => !value || Array.isArray(value)
        }
      },
      step4: {
        required: [],
        validators: {
          targetSpecies: (value) => !value || Array.isArray(value),
          regulatoryNotes: (value) => !value || typeof value === 'string'
        }
      }
    };

    // Cross-step validation rules
    this.crossValidations = [
      {
        condition: (data) => data.waveExposure === 'high' && 
                           data.structureTypes?.includes('floating-systems'),
        error: 'Floating systems not suitable for high wave exposure'
      },
      {
        condition: (data) => data.seabedType === 'mud' && 
                           data.structureTypes?.includes('bolt-on-structures'),
        error: 'Bolt-on structures require solid substrate'
      }
    ];
  }

  validateStep(step, data) {
    const rules = this.validationRules[`step${step}`];
    if (!rules) return { isValid: true, errors: {} };

    const errors = {};
    let isValid = true;

    // Check required fields
    for (const field of rules.required) {
      if (!data[field] || (Array.isArray(data[field]) && data[field].length === 0)) {
        errors[field] = `${field} is required`;
        isValid = false;
      }
    }

    // Run field validators
    for (const [field, validator] of Object.entries(rules.validators)) {
      if (data[field] !== undefined && !validator(data[field])) {
        errors[field] = `Invalid ${field}`;
        isValid = false;
      }
    }

    return { isValid, errors };
  }

  validateComplete(data) {
    const allErrors = {};
    let isValid = true;

    // Validate each step
    for (let step = 1; step <= 4; step++) {
      const stepValidation = this.validateStep(step, data);
      if (!stepValidation.isValid) {
        allErrors[`step${step}`] = stepValidation.errors;
        isValid = false;
      }
    }

    // Run cross-validations
    const crossErrors = [];
    for (const rule of this.crossValidations) {
      if (rule.condition(data)) {
        crossErrors.push(rule.error);
        isValid = false;
      }
    }

    if (crossErrors.length > 0) {
      allErrors.cross = crossErrors;
    }

    return { isValid, errors: allErrors };
  }
}

// File: /api/routes/wizard.js (Updated with Week 3 features)

const express = require('express');
const RecommendationEngine = require('../services/RecommendationEngine');
const ValidationEngine = require('../services/ValidationEngine');

const router = express.Router();

// Initialize engines
const recommendationEngine = new RecommendationEngine(cache);
const validationEngine = new ValidationEngine();

// Enhanced project submission with recommendations
router.post('/projects', async (req, res) => {
  try {
    const projectData = req.body;

    // Enhanced validation
    const validation = validationEngine.validateComplete(projectData);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    // Generate recommendations
    const recommendations = await recommendationEngine.generateRecommendations(projectData);

    // Create project with recommendations
    const project = await createProject({
      ...projectData,
      recommendations,
      createdAt: new Date().toISOString()
    });

    res.json({
      id: project.id,
      recommendations,
      status: 'created'
    });

  } catch (error) {
    console.error('Project creation failed:', error);
    res.status(500).json({
      error: 'Project creation failed',
      message: error.message
    });
  }
});

// New endpoint: Step validation
router.post('/validate/:step', async (req, res) => {
  try {
    const step = parseInt(req.params.step);
    const data = req.body;

    const validation = validationEngine.validateStep(step, data);
    
    res.json(validation);
  } catch (error) {
    res.status(500).json({ error: 'Validation failed' });
  }
});

// New endpoint: Live recommendations
router.post('/recommendations', async (req, res) => {
  try {
    const partialData = req.body;
    
    // Generate recommendations even with partial data
    const recommendations = await recommendationEngine.generateRecommendations(partialData);
    
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: 'Recommendation generation failed' });
  }
});

module.exports = router;

// File: /api/services/PerformanceOptimizer.js

class PerformanceOptimizer {
  constructor(cache) {
    this.cache = cache;
    this.preloadCriticalData();
  }

  async preloadCriticalData() {
    // Preload frequently accessed data
    const criticalData = [
      'countries',
      'coastal-cities',
      'material-types',
      'species-lists'
    ];

    for (const dataType of criticalData) {
      try {
        await this.cache.warmup(dataType);
      } catch (error) {
        console.warn(`Failed to preload ${dataType}:`, error);
      }
    }
  }

  // Batch operations for better performance
  async batchRecommendations(projectDataArray) {
    const results = await Promise.allSettled(
      projectDataArray.map(data => 
        recommendationEngine.generateRecommendations(data)
      )
    );

    return results.map((result, index) => ({
      projectIndex: index,
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
  }

  // Database query optimization
  optimizeQuery(query, params) {
    // Add indexes and optimize common queries
    const optimizations = {
      'project-lookup': 'CREATE INDEX IF NOT EXISTS idx_project_location ON projects(country_code, city_id)',
      'material-filter': 'CREATE INDEX IF NOT EXISTS idx_material_climate ON materials(climate_zone, material_type)'
    };

    return {
      optimizedQuery: query,
      suggestedIndexes: optimizations
    };
  }
}

module.exports = {
  RecommendationEngine,
  ValidationEngine,
  PerformanceOptimizer
};