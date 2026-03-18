const STRUCTURE_TYPES = [
  { id: 'seawall', label: 'Seawall', description: 'Vertical or near-vertical coastal defense structure' },
  { id: 'breakwater', label: 'Breakwater', description: 'Offshore structure to reduce wave energy' },
  { id: 'revetment', label: 'Revetment', description: 'Sloped structure protecting shoreline' },
  { id: 'jetty', label: 'Jetty / Groyne', description: 'Structure extending into water to direct current' },
  { id: 'pier', label: 'Pier / Wharf', description: 'Elevated structure extending over water' },
  { id: 'artificial_reef', label: 'Artificial Reef', description: 'Submerged structure promoting marine habitat' },
  { id: 'tide_pool', label: 'Tide Pool Enhancement', description: 'Engineered intertidal habitat features' },
];

const WAVE_EXPOSURE = [
  { id: 'sheltered', label: 'Sheltered', description: 'Protected from direct wave action' },
  { id: 'moderate', label: 'Moderate', description: 'Partial wave exposure' },
  { id: 'exposed', label: 'Exposed', description: 'Direct wave action' },
  { id: 'very_exposed', label: 'Very Exposed', description: 'Severe wave conditions' },
];

const SEABED_TYPES = [
  { id: 'rock', label: 'Rock' },
  { id: 'sand', label: 'Sand' },
  { id: 'mud', label: 'Mud / Silt' },
  { id: 'gravel', label: 'Gravel' },
  { id: 'mixed', label: 'Mixed' },
];

const PRIMARY_GOALS = [
  { id: 'habitat_creation', label: 'Habitat Creation', description: 'Create new marine habitats' },
  { id: 'biodiversity', label: 'Biodiversity Enhancement', description: 'Increase species diversity' },
  { id: 'coastal_protection', label: 'Coastal Protection', description: 'Protect shoreline from erosion' },
  { id: 'water_quality', label: 'Water Quality Improvement', description: 'Improve local water quality' },
  { id: 'carbon_sequestration', label: 'Carbon Sequestration', description: 'Enhance carbon capture' },
  { id: 'fisheries', label: 'Fisheries Support', description: 'Support commercial/recreational fisheries' },
];

module.exports = { STRUCTURE_TYPES, WAVE_EXPOSURE, SEABED_TYPES, PRIMARY_GOALS };
