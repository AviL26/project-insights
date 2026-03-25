const express = require('express');
const router = express.Router();

const DEMO_CATEGORIES = [
  { id: 'reef-base', name: 'Reef Base Structures', count: 6 },
  { id: 'substrate', name: 'Substrate & Coatings', count: 4 },
  { id: 'monitoring', name: 'Monitoring Equipment', count: 5 },
  { id: 'anchoring', name: 'Anchoring Systems', count: 3 },
];

const DEMO_MATERIALS = [
  {
    id: 1,
    name: 'ECOncrete Tide Pool Panel',
    category: 'reef-base',
    description: 'Textured concrete panel designed to mimic natural tide pool habitats.',
    ecoScore: 92,
    durabilityYears: 50,
    costPerUnit: 420,
    unit: 'm²',
    certifications: ['ISO 14001', 'Marine Tested'],
    inStock: true,
  },
  {
    id: 2,
    name: 'Bio-Enhanced Reef Block',
    category: 'reef-base',
    description: 'Modular reef block with integrated biological substrate for coral recruitment.',
    ecoScore: 88,
    durabilityYears: 40,
    costPerUnit: 680,
    unit: 'block',
    certifications: ['CE Mark', 'Marine Tested'],
    inStock: true,
  },
  {
    id: 3,
    name: 'Seawall Enhancement Panel',
    category: 'reef-base',
    description: 'Retrofittable panel for existing seawalls to increase biodiversity.',
    ecoScore: 85,
    durabilityYears: 30,
    costPerUnit: 310,
    unit: 'm²',
    certifications: ['ISO 14001'],
    inStock: true,
  },
  {
    id: 4,
    name: 'Living Shoreline Mix',
    category: 'substrate',
    description: 'Specially formulated substrate blend to support native macroalgae and invertebrates.',
    ecoScore: 95,
    durabilityYears: 10,
    costPerUnit: 85,
    unit: 'kg',
    certifications: ['Organic Certified'],
    inStock: true,
  },
  {
    id: 5,
    name: 'Anti-Invasive Coating',
    category: 'substrate',
    description: 'Non-toxic surface coating that inhibits invasive barnacle species.',
    ecoScore: 78,
    durabilityYears: 5,
    costPerUnit: 140,
    unit: 'L',
    certifications: ['EPA Approved'],
    inStock: false,
  },
  {
    id: 6,
    name: 'Underwater Sensor Array',
    category: 'monitoring',
    description: 'Multi-parameter sensor array for continuous water quality monitoring.',
    ecoScore: 70,
    durabilityYears: 7,
    costPerUnit: 3200,
    unit: 'unit',
    certifications: ['IP68', 'CE Mark'],
    inStock: true,
  },
  {
    id: 7,
    name: 'Acoustic Monitoring Buoy',
    category: 'monitoring',
    description: 'Solar-powered buoy with hydrophone array for marine biodiversity acoustics.',
    ecoScore: 72,
    durabilityYears: 10,
    costPerUnit: 7500,
    unit: 'unit',
    certifications: ['CE Mark', 'FCC'],
    inStock: true,
  },
  {
    id: 8,
    name: 'Helical Screw Anchor',
    category: 'anchoring',
    description: 'Low-disturbance helical anchor for soft sediment environments.',
    ecoScore: 80,
    durabilityYears: 25,
    costPerUnit: 550,
    unit: 'unit',
    certifications: ['ISO 9001'],
    inStock: true,
  },
  {
    id: 9,
    name: 'Rock-Socket Anchor',
    category: 'anchoring',
    description: 'High-load anchor system for rocky substrates.',
    ecoScore: 75,
    durabilityYears: 30,
    costPerUnit: 890,
    unit: 'unit',
    certifications: ['ISO 9001', 'CE Mark'],
    inStock: true,
  },
];

// GET /api/materials/categories
router.get('/categories', (_req, res) => {
  res.json(DEMO_CATEGORIES);
});

// GET /api/materials/:id
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const material = DEMO_MATERIALS.find(m => m.id === id);
  if (!material) return res.status(404).json({ error: 'Material not found' });
  res.json(material);
});

// GET /api/materials
router.get('/', (req, res) => {
  const { category, inStock, minScore } = req.query;
  let results = DEMO_MATERIALS;
  if (category) results = results.filter(m => m.category === category);
  if (inStock !== undefined) results = results.filter(m => m.inStock === (inStock === 'true'));
  if (minScore) results = results.filter(m => m.ecoScore >= parseInt(minScore, 10));
  res.json(results);
});

module.exports = router;
