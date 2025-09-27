// Performance and Production Optimizations for ECOncrete Wizard
// Week 4: Days 3-4 Implementation

// 1. Enhanced API Service with Three-Tier Fallback Strategy
// File: /Users/avilapp/econcrete/frontend/src/services/wizardApiService.js

class WizardApiService {
  constructor() {
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
  }

  // Simplified fetch with three-tier fallback
  async fetchData(key, fetcher, fallback, ttl = 3600000) { // 1 hour default TTL
    try {
      // Try cache first
      const cached = this.getFromCache(key, ttl);
      if (cached) {
        console.log(`Cache hit for ${key}`);
        return cached;
      }

      // Try API with retry logic
      const data = await this.fetchWithRetry(fetcher);
      this.setCache(key, data);
      return data;
    } catch (error) {
      console.warn(`Failed to fetch ${key}, using fallback:`, error);
      
      // Return fallback data
      if (fallback) {
        this.setCache(key, fallback); // Cache fallback for consistency
        return fallback;
      }
      throw error;
    }
  }

  async fetchWithRetry(fetcher, attempt = 1) {
    try {
      return await fetcher();
    } catch (error) {
      if (attempt < this.retryAttempts) {
        console.log(`Retry attempt ${attempt + 1} after ${this.retryDelay}ms`);
        await this.delay(this.retryDelay);
        return this.fetchWithRetry(fetcher, attempt + 1);
      }
      throw error;
    }
  }

  getFromCache(key, ttl) {
    const data = this.cache.get(key);
    const timestamp = this.cacheTimestamps.get(key);
    
    if (data && timestamp && (Date.now() - timestamp < ttl)) {
      return data;
    }
    
    // Clean expired cache
    this.cache.delete(key);
    this.cacheTimestamps.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, data);
    this.cacheTimestamps.set(key, Date.now());
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Clear cache for testing/debugging
  clearCache() {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }
}

// 2. Static Data Strategy Implementation
// File: /Users/avilapp/econcrete/frontend/src/data/staticWizardData.js

export const STATIC_WIZARD_DATA = {
  // Predefined coastal cities per country (from guide)
  cities: {
    'US': [
      { id: 'us-ny', name: 'New York', coordinates: { lat: 40.7128, lon: -74.0060 } },
      { id: 'us-la', name: 'Los Angeles', coordinates: { lat: 34.0522, lon: -118.2437 } },
      { id: 'us-miami', name: 'Miami', coordinates: { lat: 25.7617, lon: -80.1918 } },
      { id: 'us-sf', name: 'San Francisco', coordinates: { lat: 37.7749, lon: -122.4194 } },
      { id: 'us-seattle', name: 'Seattle', coordinates: { lat: 47.6062, lon: -122.3321 } },
      { id: 'us-boston', name: 'Boston', coordinates: { lat: 42.3601, lon: -71.0589 } },
      { id: 'us-charleston', name: 'Charleston', coordinates: { lat: 32.7765, lon: -79.9311 } },
      { id: 'us-san-diego', name: 'San Diego', coordinates: { lat: 32.7157, lon: -117.1611 } }
    ],
    'GB': [
      { id: 'gb-london', name: 'London', coordinates: { lat: 51.5074, lon: -0.1278 } },
      { id: 'gb-liverpool', name: 'Liverpool', coordinates: { lat: 53.4084, lon: -2.9916 } },
      { id: 'gb-plymouth', name: 'Plymouth', coordinates: { lat: 50.3755, lon: -4.1427 } },
      { id: 'gb-brighton', name: 'Brighton', coordinates: { lat: 50.8225, lon: -0.1372 } },
      { id: 'gb-portsmouth', name: 'Portsmouth', coordinates: { lat: 50.8198, lon: -1.0880 } }
    ],
    'AU': [
      { id: 'au-sydney', name: 'Sydney', coordinates: { lat: -33.8688, lon: 151.2093 } },
      { id: 'au-melbourne', name: 'Melbourne', coordinates: { lat: -37.8136, lon: 144.9631 } },
      { id: 'au-perth', name: 'Perth', coordinates: { lat: -31.9505, lon: 115.8605 } },
      { id: 'au-adelaide', name: 'Adelaide', coordinates: { lat: -34.9285, lon: 138.6007 } },
      { id: 'au-brisbane', name: 'Brisbane', coordinates: { lat: -27.4698, lon: 153.0251 } }
    ],
    'CA': [
      { id: 'ca-vancouver', name: 'Vancouver', coordinates: { lat: 49.2827, lon: -123.1207 } },
      { id: 'ca-halifax', name: 'Halifax', coordinates: { lat: 44.6488, lon: -63.5752 } },
      { id: 'ca-victoria', name: 'Victoria', coordinates: { lat: 48.4284, lon: -123.3656 } },
      { id: 'ca-st-johns', name: "St. John's", coordinates: { lat: 47.5615, lon: -52.7126 } }
    ],
    'NL': [
      { id: 'nl-amsterdam', name: 'Amsterdam', coordinates: { lat: 52.3676, lon: 4.9041 } },
      { id: 'nl-rotterdam', name: 'Rotterdam', coordinates: { lat: 51.9244, lon: 4.4777 } },
      { id: 'nl-the-hague', name: 'The Hague', coordinates: { lat: 52.0705, lon: 4.3007 } }
    ]
  },

  // Primary goals with enhanced descriptions
  primaryGoals: [
    {
      id: 'coastal-protection',
      name: 'Coastal Protection',
      description: 'Protect shoreline from erosion and storm damage while supporting marine life'
    },
    {
      id: 'marine-habitat',
      name: 'Marine Habitat Enhancement',
      description: 'Create and enhance marine biodiversity and ecosystem health'
    },
    {
      id: 'infrastructure',
      name: 'Marine Infrastructure',
      description: 'Build functional marine infrastructure with ecological benefits'
    },
    {
      id: 'restoration',
      name: 'Ecosystem Restoration',
      description: 'Restore damaged marine ecosystems and habitats'
    }
  ],

  // Comprehensive seabed types
  seabedTypes: [
    {
      id: 'sand',
      name: 'Sandy',
      description: 'Fine to coarse sand substrate, good for certain marine species'
    },
    {
      id: 'rock',
      name: 'Rocky',
      description: 'Hard rock or boulder substrate, excellent for structure attachment'
    },
    {
      id: 'mud',
      name: 'Muddy',
      description: 'Soft sediment substrate, requires special foundation considerations'
    },
    {
      id: 'coral',
      name: 'Coral',
      description: 'Existing coral substrate requiring sensitive design approaches'
    },
    {
      id: 'mixed',
      name: 'Mixed',
      description: 'Combination of substrate types'
    }
  ],

  // Wave exposure levels
  waveExposure: [
    {
      id: 'low',
      name: 'Low (Sheltered)',
      description: 'Protected waters, harbors, or lagoons with minimal wave action'
    },
    {
      id: 'medium',
      name: 'Medium (Semi-exposed)',
      description: 'Moderate wave action, typical coastal areas'
    },
    {
      id: 'high',
      name: 'High (Exposed)',
      description: 'Open ocean conditions with strong wave action'
    },
    {
      id: 'extreme',
      name: 'Extreme',
      description: 'Severe wave conditions requiring specialized design'
    }
  ],

  // Structure types with categories
  structureTypes: [
    {
      id: 'breakwater',
      name: 'Breakwater',
      description: 'Wave protection structure for harbor or shoreline defense',
      category: 'Coastal Protection'
    },
    {
      id: 'seawall',
      name: 'Seawall',
      description: 'Vertical coastal defense structure',
      category: 'Coastal Protection'
    },
    {
      id: 'artificial-reef',
      name: 'Artificial Reef',
      description: 'Structure designed to enhance marine biodiversity',
      category: 'Habitat Enhancement'
    },
    {
      id: 'jetty',
      name: 'Jetty',
      description: 'Structure extending into water for navigation or protection',
      category: 'Infrastructure'
    },
    {
      id: 'living-shoreline',
      name: 'Living Shoreline',
      description: 'Natural-engineered hybrid coastal protection',
      category: 'Ecosystem Restoration'
    },
    {
      id: 'pile-structure',
      name: 'Pile Structure',
      description: 'Vertical support structure for docks or platforms',
      category: 'Infrastructure'
    }
  ],

  // Materials with enhanced properties
  materials: [
    {
      id: 'econcrete',
      name: 'ECOncrete',
      description: 'Bio-enhanced concrete with surface textures to promote marine life',
      categories: ['Sustainable', 'Bio-active', 'Innovative']
    },
    {
      id: 'traditional-concrete',
      name: 'Traditional Concrete',
      description: 'Standard Portland cement concrete',
      categories: ['Traditional', 'Proven']
    },
    {
      id: 'precast-concrete',
      name: 'Precast Concrete Elements',
      description: 'Factory-manufactured concrete components',
      categories: ['Efficient', 'Quality-controlled']
    },
    {
      id: 'natural-stone',
      name: 'Natural Stone',
      description: 'Quarried stone materials for marine construction',
      categories: ['Natural', 'Durable']
    },
    {
      id: 'composite',
      name: 'Composite Materials',
      description: 'Advanced composite materials for specialized applications',
      categories: ['Innovative', 'Lightweight']
    }
  ],

  // Marine species
  species: [
    {
      id: 'coral',
      name: 'Coral Species',
      type: 'Cnidarian',
      description: 'Hard and soft corals for reef enhancement'
    },
    {
      id: 'oyster',
      name: 'Oysters',
      type: 'Mollusk',
      description: 'Filter-feeding bivalves that improve water quality'
    },
    {
      id: 'fish-reef',
      name: 'Reef Fish',
      type: 'Vertebrate',
      description: 'Various fish species that use reef structures'
    },
    {
      id: 'seaweed',
      name: 'Seaweed/Algae',
      type: 'Algae',
      description: 'Marine vegetation for habitat complexity'
    },
    {
      id: 'crustaceans',
      name: 'Crustaceans',
      type: 'Arthropod',
      description: 'Crabs, lobsters, and other shell-bearing species'
    },
    {
      id: 'sea-birds',
      name: 'Seabirds',
      type: 'Vertebrate',
      description: 'Birds that nest or feed in marine environments'
    }
  ],

  // Environmental factors
  environmentalFactors: [
    {
      id: 'temperature-variation',
      name: 'Temperature Variation',
      description: 'Seasonal and daily temperature changes'
    },
    {
      id: 'salinity-levels',
      name: 'Salinity Levels',
      description: 'Salt concentration variations'
    },
    {
      id: 'ocean-currents',
      name: 'Ocean Currents',
      description: 'Water flow patterns and velocities'
    },
    {
      id: 'tidal-range',
      name: 'Tidal Range',
      description: 'Difference between high and low tides'
    },
    {
      id: 'storm-frequency',
      name: 'Storm Frequency',
      description: 'Occurrence of severe weather events'
    },
    {
      id: 'pollution-levels',
      name: 'Pollution Levels',
      description: 'Water quality and contamination concerns'
    }
  ]
};

// 3. Enhanced Wizard Component with Performance Optimizations
// File: /Users/avilapp/econcrete/frontend/src/components/ProjectSetup/OptimizedWizard.js

import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { STATIC_WIZARD_DATA } from '../../data/staticWizardData';

// Lazy load step components for code splitting
const BasicsStep = lazy(() => import('./steps/BasicsStep'));
const EnvironmentStep = lazy(() => import('./steps/EnvironmentStep'));
const DesignStep = lazy(() => import('./steps/DesignStep'));
const ContextStep = lazy(() => import('./steps/ContextStep'));
const ReviewStep = lazy(() => import('./steps/ReviewStep'));

// Performance optimizations
const OptimizedProjectSetupWizard = ({ onComplete, isModal = false }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Performance: Use single state object instead of multiple useState calls
  const [formData, setFormData] = useState(() => ({
    name: '',
    countryCode: '',
    cityId: '',
    primaryGoal: '',
    seabedType: '',
    waveExposure: '',
    nearbyStructures: [],
    structureTypes: [],
    preferredMaterials: [],
    targetSpecies: [],
    environmentalFactors: [],
    regulatoryNotes: '',
    coordinates: null
  }));

  // Performance: Memoize API service
  const apiService = useMemo(() => new WizardApiService(), []);

  // Performance: Memoized data loading
  const loadWizardData = useCallback(async () => {
    try {
      const data = await apiService.fetchData(
        'wizard-bootstrap',
        () => api.get('/wizard/bootstrap').then(res => res.data),
        STATIC_WIZARD_DATA, // Fallback to static data
        24 * 60 * 60 * 1000 // 24 hour TTL for bootstrap data
      );
      
      setWizardData(data);
    } catch (err) {
      console.error('Failed to load wizard data:', err);
      setError('Failed to load wizard configuration. Using offline mode.');
      setWizardData(STATIC_WIZARD_DATA); // Always provide fallback
    } finally {
      setLoading(false);
    }
  }, [apiService]);

  useEffect(() => {
    loadWizardData();
  }, [loadWizardData]);

  // Performance: Memoized validation
  const validateStep = useCallback((step) => {
    const validators = {
      0: () => ({
        isValid: !!(formData.name && formData.countryCode && formData.primaryGoal),
        errors: {
          ...(formData.name ? {} : { name: 'Project name is required' }),
          ...(formData.countryCode ? {} : { countryCode: 'Country is required' }),
          ...(formData.primaryGoal ? {} : { primaryGoal: 'Primary goal is required' })
        }
      }),
      1: () => ({
        isValid: !!(formData.seabedType && formData.waveExposure),
        errors: {
          ...(formData.seabedType ? {} : { seabedType: 'Seabed type is required' }),
          ...(formData.waveExposure ? {} : { waveExposure: 'Wave exposure is required' })
        }
      }),
      2: () => ({
        isValid: formData.structureTypes.length > 0,
        errors: formData.structureTypes.length === 0 ? { structureTypes: 'At least one structure type is required' } : {}
      }),
      3: () => ({ isValid: true, errors: {} }),
      4: () => ({
        isValid: !!(formData.name && formData.countryCode && formData.primaryGoal &&
                   formData.seabedType && formData.waveExposure &&
                   formData.structureTypes.length > 0),
        errors: {}
      })
    };
    
    return validators[step]?.() || { isValid: true, errors: {} };
  }, [formData]);

  // Performance: Memoized handlers
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [validationErrors]);

  const handleArrayChange = useCallback((field, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
        ? [...(prev[field] || []), value]
        : (prev[field] || []).filter(item => item !== value)
    }));
  }, []);

  // Performance: Memoized step progress
  const stepProgress = useMemo(() => {
    let completedSteps = 0;
    for (let i = 0; i <= currentStep; i++) {
      if (validateStep(i).isValid) {
        completedSteps++;
      }
    }
    return Math.round((completedSteps / STEPS.length) * 100);
  }, [currentStep, validateStep]);

  // Performance: Render step content with Suspense for code splitting
  const renderStepContent = () => {
    const stepProps = {
      formData,
      wizardData,
      errors: validationErrors,
      onChange: handleInputChange,
      onArrayChange: handleArrayChange
    };

    const LoadingFallback = () => (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );

    return (
      <Suspense fallback={<LoadingFallback />}>
        {currentStep === 0 && <BasicsStep {...stepProps} />}
        {currentStep === 1 && <EnvironmentStep {...stepProps} />}
        {currentStep === 2 && <DesignStep {...stepProps} />}
        {currentStep === 3 && <ContextStep {...stepProps} />}
        {currentStep === 4 && <ReviewStep {...stepProps} />}
      </Suspense>
    );
  };

  // Rest of component implementation remains the same...
  // (Navigation handlers, submit logic, etc.)

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Enhanced progress bar */}
      <div className="mb-8">
        <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
          <div 
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${stepProgress}%` }}
          ></div>
        </div>
        {/* Step indicators and content */}
        {renderStepContent()}
      </div>
    </div>
  );
};

// 4. Mobile Responsiveness Enhancements
// File: /Users/avilapp/econcrete/frontend/src/styles/wizardResponsive.css

const responsiveStyles = `
/* Mobile-first responsive design */
@media (max-width: 640px) {
  .wizard-container {
    padding: 1rem;
  }
  
  .step-indicator {
    flex-direction: column;
    space-y: 0.5rem;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .navigation-buttons {
    flex-direction: column;
    space-y: 0.5rem;
  }
  
  .step-content {
    padding: 1rem;
  }
}

@media (max-width: 768px) {
  .structure-grid {
    grid-template-columns: 1fr;
  }
  
  .material-grid {
    grid-template-columns: 1fr;
  }
}

/* Touch-friendly interactive elements */
@media (hover: none) and (pointer: coarse) {
  .interactive-element {
    min-height: 44px;
    min-width: 44px;
  }
  
  .checkbox-label,
  .radio-label {
    padding: 1rem;
  }
}

/* Improved accessibility */
@media (prefers-reduced-motion: reduce) {
  .transition-all {
    transition: none;
  }
  
  .animate-spin {
    animation: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .border {
    border-width: 2px;
  }
  
  .focus-ring {
    outline: 3px solid;
    outline-offset: 2px;
  }
}
`;

export { OptimizedProjectSetupWizard, WizardApiService, STATIC_WIZARD_DATA, responsiveStyles };