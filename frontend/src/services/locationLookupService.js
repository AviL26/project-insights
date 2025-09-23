// frontend/src/services/locationLookupService.js
// This would typically fetch from your backend API or database

export class LocationLookupService {
  static async getCountries() {
    // In real app, this would be: return await api.get('/countries')
    return [
      { id: 'IL', code: 'IL', name: 'Israel', region: 'Mediterranean' },
      { id: 'CY', code: 'CY', name: 'Cyprus', region: 'Mediterranean' },
      { id: 'GR', code: 'GR', name: 'Greece', region: 'Mediterranean' },
      { id: 'ES', code: 'ES', name: 'Spain', region: 'Mediterranean' },
      { id: 'IT', code: 'IT', name: 'Italy', region: 'Mediterranean' },
      { id: 'FR', code: 'FR', name: 'France', region: 'Mediterranean' },
      { id: 'TR', code: 'TR', name: 'Turkey', region: 'Mediterranean' },
      { id: 'HR', code: 'HR', name: 'Croatia', region: 'Adriatic' },
      { id: 'MT', code: 'MT', name: 'Malta', region: 'Mediterranean' },
      { id: 'PT', code: 'PT', name: 'Portugal', region: 'Atlantic' },
      { id: 'ME', code: 'ME', name: 'Montenegro', region: 'Adriatic' },
      { id: 'AL', code: 'AL', name: 'Albania', region: 'Adriatic' },
      { id: 'SI', code: 'SI', name: 'Slovenia', region: 'Adriatic' },
      { id: 'OTHER', code: 'OTHER', name: 'Other', region: 'Various' }
    ];
  }

  static async getRegionsByCountry(countryCode) {
    // In real app: return await api.get(`/regions/${countryCode}`)
    const regionLookup = {
      'IL': [
        { id: 'med_north', name: 'Northern Mediterranean Coast', description: 'Haifa to Lebanese border' },
        { id: 'med_central', name: 'Central Mediterranean Coast', description: 'Tel Aviv metropolitan area' },
        { id: 'med_south', name: 'Southern Mediterranean Coast', description: 'Ashkelon to Gaza border' },
        { id: 'red_sea', name: 'Red Sea Coast', description: 'Eilat area' }
      ],
      'CY': [
        { id: 'south_coast', name: 'Southern Coast', description: 'Limassol, Paphos area' },
        { id: 'east_coast', name: 'Eastern Coast', description: 'Larnaca, Ayia Napa area' },
        { id: 'north_coast', name: 'Northern Coast', description: 'Kyrenia area' },
        { id: 'west_coast', name: 'Western Coast', description: 'Paphos area' }
      ],
      'GR': [
        { id: 'aegean_north', name: 'Northern Aegean', description: 'Thessaloniki, Kavala area' },
        { id: 'aegean_central', name: 'Central Aegean', description: 'Athens, Piraeus area' },
        { id: 'aegean_south', name: 'Southern Aegean', description: 'Crete, Dodecanese islands' },
        { id: 'ionian', name: 'Ionian Sea', description: 'Corfu, western Greece' },
        { id: 'peloponnese', name: 'Peloponnese Coast', description: 'Southern mainland' }
      ],
      // Add more countries as needed...
    };
    
    return regionLookup[countryCode] || [];
  }

  static async getMarineZonesByRegion(countryCode, regionId) {
    // In real app: return await api.get(`/marine-zones/${countryCode}/${regionId}`)
    const zoneLookup = {
      'IL': {
        'med_north': [
          { id: 'haifa_bay', name: 'Haifa Bay', lat: 32.8191, lon: 34.9885, depth_range: '5-25m', characteristics: 'Protected bay, moderate waves' },
          { id: 'nahariya', name: 'Nahariya Area', lat: 33.0058, lon: 35.0947, depth_range: '10-40m', characteristics: 'Open coast, exposed to waves' },
          { id: 'rosh_hanikra', name: 'Rosh HaNikra', lat: 33.0897, lon: 35.1069, depth_range: '15-60m', characteristics: 'Rocky coast, high energy' }
        ],
        'med_central': [
          { id: 'tel_aviv', name: 'Tel Aviv Marina Area', lat: 32.0853, lon: 34.7818, depth_range: '5-20m', characteristics: 'Urban coast, moderate protection' },
          { id: 'herzliya', name: 'Herzliya Marina', lat: 32.1700, lon: 34.8000, depth_range: '8-25m', characteristics: 'Marina environment, sheltered' },
          { id: 'netanya', name: 'Netanya Area', lat: 32.3215, lon: 34.8532, depth_range: '10-30m', characteristics: 'Sandy coast, moderate waves' }
        ],
        'med_south': [
          { id: 'ashdod', name: 'Ashdod Port Area', lat: 31.8000, lon: 34.6500, depth_range: '10-35m', characteristics: 'Port environment, modified currents' },
          { id: 'ashkelon', name: 'Ashkelon Area', lat: 31.6688, lon: 34.5742, depth_range: '8-30m', characteristics: 'Open coast, sandy bottom' },
          { id: 'gaza_border', name: 'Southern Border Area', lat: 31.2201, lon: 34.2700, depth_range: '5-25m', characteristics: 'Shallow coastal zone' }
        ]
      },
      'CY': {
        'south_coast': [
          { id: 'limassol', name: 'Limassol Area', lat: 34.6769, lon: 33.0369, depth_range: '10-50m', characteristics: 'Major port, deep water access' },
          { id: 'paphos', name: 'Paphos Area', lat: 34.7571, lon: 32.4057, depth_range: '8-40m', characteristics: 'Tourist area, mixed substrate' }
        ]
      },
      'GR': {
        'aegean_central': [
          { id: 'piraeus', name: 'Piraeus Port Area', lat: 37.9475, lon: 23.6342, depth_range: '15-80m', characteristics: 'Major port, protected harbor' },
          { id: 'saronic', name: 'Saronic Gulf', lat: 37.7000, lon: 23.5000, depth_range: '20-120m', characteristics: 'Semi-enclosed gulf, calmer waters' }
        ]
      }
      // Add more regions...
    };
    
    return zoneLookup[countryCode]?.[regionId] || [];
  }

  static async getStructureTypes() {
    // In real app: return await api.get('/structure-types')
    return [
      { 
        id: 'breakwater', 
        name: 'Breakwater', 
        category: 'coastal_protection',
        description: 'Coastal structure designed to reduce wave energy and protect harbors or coastlines',
        typical_materials: ['ECOncrete', 'Rock Armor', 'Concrete Blocks'],
        design_considerations: ['Wave height', 'Tidal range', 'Storm conditions'],
        environmental_benefits: ['Wave energy reduction', 'Marine habitat creation', 'Coastal protection']
      },
      { 
        id: 'seawall', 
        name: 'Seawall', 
        category: 'coastal_protection',
        description: 'Vertical or sloped barrier designed to prevent coastal erosion and flooding',
        typical_materials: ['Reinforced Concrete', 'ECOncrete Panels', 'Steel Sheet Piling'],
        design_considerations: ['Wave overtopping', 'Foundation stability', 'Drainage'],
        environmental_benefits: ['Coastal protection', 'Potential habitat surfaces', 'Erosion control']
      },
      { 
        id: 'pier', 
        name: 'Pier', 
        category: 'infrastructure',
        description: 'Structure extending into water for vessel mooring, cargo handling, or public access',
        typical_materials: ['Reinforced Concrete', 'Steel Piling', 'ECOncrete Components'],
        design_considerations: ['Vessel loads', 'Berthing forces', 'Tidal variations'],
        environmental_benefits: ['Fish aggregation', 'Artificial reef effect', 'Minimal footprint']
      },
      { 
        id: 'jetty', 
        name: 'Jetty', 
        category: 'navigation',
        description: 'Structure projecting into water to influence water flow, protect navigation channels',
        typical_materials: ['Rock Fill', 'Concrete Armor Units', 'ECOncrete Blocks'],
        design_considerations: ['Current patterns', 'Sediment transport', 'Navigation requirements'],
        environmental_benefits: ['Current modification', 'Habitat diversity', 'Spawning areas']
      },
      { 
        id: 'artificial_reef', 
        name: 'Artificial Reef', 
        category: 'environmental',
        description: 'Submerged structure specifically designed to enhance marine biodiversity and fish habitat',
        typical_materials: ['ECOncrete Bio-blocks', 'Specialized Reef Modules', 'Natural Stone'],
        design_considerations: ['Marine species requirements', 'Water circulation', 'Settlement substrate'],
        environmental_benefits: ['Biodiversity enhancement', 'Fish habitat', 'Ecosystem services', 'Carbon sequestration']
      },
      { 
        id: 'coastal_protection', 
        name: 'Coastal Protection', 
        category: 'coastal_protection',
        description: 'General coastal defense structures including revetments, bulkheads, and barriers',
        typical_materials: ['Various depending on specific application'],
        design_considerations: ['Site-specific conditions', 'Protection level required', 'Maintenance access'],
        environmental_benefits: ['Coastal stability', 'Potential habitat creation', 'Protection of inland ecosystems']
      },
      { 
        id: 'marine_infrastructure', 
        name: 'Marine Infrastructure', 
        category: 'infrastructure',
        description: 'Other marine construction projects including platforms, terminals, and specialized structures',
        typical_materials: ['Project-specific materials'],
        design_considerations: ['Functional requirements', 'Marine environment', 'Operational loads'],
        environmental_benefits: ['Varies by project type and design approach']
      }
    ];
  }

  static async getWaveExposureCategories() {
    // In real app: return await api.get('/wave-exposure-categories')
    return [
      { 
        id: 'sheltered', 
        name: 'Sheltered', 
        description: 'Protected areas with minimal wave action (harbors, bays, lagoons)',
        wave_height_range: '0.1 - 0.5m',
        typical_locations: 'Inner harbors, enclosed bays, marinas',
        design_implications: 'Lower structural loads, focus on functionality',
        ecological_characteristics: 'Calmer conditions favor settlement species, less wave energy'
      },
      { 
        id: 'moderate', 
        name: 'Moderate', 
        description: 'Some wave exposure but generally calm conditions',
        wave_height_range: '0.5 - 1.5m',
        typical_locations: 'Semi-protected coastlines, outer harbor areas',
        design_implications: 'Standard marine construction practices',
        ecological_characteristics: 'Balanced wave action supports diverse marine communities'
      },
      { 
        id: 'exposed', 
        name: 'Exposed', 
        description: 'Significant wave action and energy, open coastlines',
        wave_height_range: '1.5 - 3.0m',
        typical_locations: 'Open ocean coastlines, headlands',
        design_implications: 'Enhanced structural design, wave-resistant materials',
        ecological_characteristics: 'Higher energy environment, specialized marine species'
      },
      { 
        id: 'very_exposed', 
        name: 'Very Exposed', 
        description: 'High energy environment with large waves and storms',
        wave_height_range: '3.0m+',
        typical_locations: 'Exposed headlands, storm-prone coastlines',
        design_implications: 'Robust design for extreme conditions, specialized armor',
        ecological_characteristics: 'Extreme conditions, unique adapted species communities'
      }
    ];
  }

  static async getSeabedTypes() {
    // In real app: return await api.get('/seabed-types')
    return [
      { 
        id: 'sand', 
        name: 'Sand', 
        description: 'Fine to coarse sand sediment',
        characteristics: 'Mobile substrate, good drainage, moderate bearing capacity',
        foundation_considerations: 'May require deep foundations or scour protection',
        ecological_implications: 'Sandy bottom communities, burrowing species',
        typical_grain_size: '0.05 - 2.0mm'
      },
      { 
        id: 'clay', 
        name: 'Clay', 
        description: 'Fine-grained cohesive sediment',
        characteristics: 'Stable substrate, low permeability, high plasticity',
        foundation_considerations: 'Good bearing capacity when consolidated, settlement issues',
        ecological_implications: 'Fine sediment communities, limited burrowing fauna',
        typical_grain_size: '<0.002mm'
      },
      { 
        id: 'rock', 
        name: 'Rock', 
        description: 'Hard rocky substrate including bedrock and large boulders',
        characteristics: 'Excellent bearing capacity, permanent substrate',
        foundation_considerations: 'Excellent for foundations, may require drilling/blasting',
        ecological_implications: 'Hard substrate communities, encrusting species, high diversity',
        typical_composition: 'Limestone, sandstone, igneous rocks'
      },
      { 
        id: 'gravel', 
        name: 'Gravel', 
        description: 'Coarse sediment and pebbles',
        characteristics: 'Coarse substrate, excellent drainage, good bearing capacity',
        foundation_considerations: 'Good foundation material, some settlement possible',
        ecological_implications: 'Interstitial communities, specialized gravel fauna',
        typical_grain_size: '2 - 64mm'
      },
      { 
        id: 'mixed', 
        name: 'Mixed', 
        description: 'Combination of sediment types',
        characteristics: 'Variable properties depending on dominant component',
        foundation_considerations: 'Site-specific investigation required',
        ecological_implications: 'Diverse habitat types, transition zones',
        typical_composition: 'Variable combinations of sand, silt, clay, gravel'
      }
    ];
  }

  static async getPrimaryGoals() {
    // In real app: return await api.get('/project-goals')
    return [
      {
        id: 'coastal_protection',
        name: 'Coastal Protection',
        category: 'Infrastructure',
        description: 'Primary focus on protecting coastlines from erosion and storm damage',
        key_metrics: ['Wave energy reduction', 'Erosion prevention', 'Storm protection level'],
        design_priorities: ['Structural integrity', 'Wave absorption', 'Overtopping prevention'],
        regulatory_considerations: ['Coastal zone permits', 'Environmental impact', 'Navigation clearances']
      },
      {
        id: 'biodiversity_enhancement',
        name: 'Biodiversity Enhancement',
        category: 'Environmental',
        description: 'Creating and improving marine habitats to support diverse species',
        key_metrics: ['Species diversity index', 'Habitat complexity', 'Population abundance'],
        design_priorities: ['Surface texture', 'Habitat niches', 'Water circulation'],
        regulatory_considerations: ['Marine protected areas', 'Species protection laws', 'Environmental monitoring']
      },
      {
        id: 'carbon_sequestration',
        name: 'Carbon Sequestration',
        category: 'Environmental',
        description: 'Promoting marine organisms that capture and store atmospheric carbon',
        key_metrics: ['Carbon capture rate', 'Organism coverage', 'Long-term storage'],
        design_priorities: ['Settlement surfaces', 'Nutrient flow', 'Organism-friendly materials'],
        regulatory_considerations: ['Carbon credit standards', 'Environmental monitoring', 'Ecosystem services']
      },
      {
        id: 'fish_habitat_creation',
        name: 'Fish Habitat Creation',
        category: 'Marine Life',
        description: 'Specifically designed to attract and support fish populations',
        key_metrics: ['Fish abundance', 'Species diversity', 'Reproduction success'],
        design_priorities: ['Shelter creation', 'Feeding areas', 'Nursery habitats'],
        regulatory_considerations: ['Fisheries management', 'Protected species', 'Fishing zone regulations']
      },
      {
        id: 'coral_restoration',
        name: 'Coral Restoration',
        category: 'Marine Life',
        description: 'Supporting coral growth and reef ecosystem recovery',
        key_metrics: ['Coral coverage', 'Growth rates', 'Reef health indices'],
        design_priorities: ['Coral settlement', 'Light penetration', 'Water quality'],
        regulatory_considerations: ['Marine sanctuary rules', 'Coral protection laws', 'Restoration permits']
      },
      {
        id: 'tourism_development',
        name: 'Tourism Development',
        category: 'Economic',
        description: 'Creating marine attractions and recreational diving/snorkeling sites',
        key_metrics: ['Visitor numbers', 'Tourist satisfaction', 'Economic impact'],
        design_priorities: ['Visual appeal', 'Accessibility', 'Safety features'],
        regulatory_considerations: ['Tourism permits', 'Safety standards', 'Environmental limits']
      },
      {
        id: 'research_platform',
        name: 'Research Platform',
        category: 'Scientific',
        description: 'Providing controlled environment for marine research and monitoring',
        key_metrics: ['Research output', 'Data quality', 'Long-term monitoring'],
        design_priorities: ['Instrument mounting', 'Access for researchers', 'Standardized conditions'],
        regulatory_considerations: ['Research permits', 'Data sharing requirements', 'Scientific protocols']
      },
      {
        id: 'commercial_infrastructure',
        name: 'Commercial Infrastructure',
        category: 'Economic',
        description: 'Supporting commercial activities like aquaculture, ports, or offshore platforms',
        key_metrics: ['Economic returns', 'Operational efficiency', 'Environmental compliance'],
        design_priorities: ['Functionality', 'Durability', 'Maintenance access'],
        regulatory_considerations: ['Commercial permits', 'Safety standards', 'Environmental compliance']
      }
    ];
  }

  // Helper method to get all lookup data at once (useful for initialization)
  static async getAllLookupData() {
    const [countries, structureTypes, waveExposure, seabedTypes, primaryGoals] = await Promise.all([
      this.getCountries(),
      this.getStructureTypes(), 
      this.getWaveExposureCategories(),
      this.getSeabedTypes(),
      this.getPrimaryGoals()
    ]);

    return {
      countries,
      structureTypes,
      waveExposure,
      seabedTypes,
      primaryGoals
    };
  }
}