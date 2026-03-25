const express = require('express');
const router = express.Router();

const DEMO_STATS = {
  total: 12,
  passed: 8,
  failed: 2,
  pending: 2,
  score: 75,
};

const DEMO_CHECKS = [
  { id: 1, name: 'Environmental Impact Assessment', status: 'passed', category: 'environmental' },
  { id: 2, name: 'Marine Protected Area Clearance', status: 'passed', category: 'environmental' },
  { id: 3, name: 'Coastal Construction Permit', status: 'passed', category: 'permits' },
  { id: 4, name: 'Species Disturbance Assessment', status: 'failed', category: 'environmental' },
  { id: 5, name: 'Water Quality Standards', status: 'passed', category: 'quality' },
  { id: 6, name: 'Structural Load Certification', status: 'passed', category: 'structural' },
  { id: 7, name: 'Invasive Species Risk Review', status: 'failed', category: 'environmental' },
  { id: 8, name: 'Sediment Runoff Plan', status: 'passed', category: 'environmental' },
  { id: 9, name: 'Noise Impact Study', status: 'passed', category: 'impact' },
  { id: 10, name: 'Community Consultation', status: 'passed', category: 'social' },
  { id: 11, name: 'Post-Installation Monitoring Plan', status: 'pending', category: 'monitoring' },
  { id: 12, name: 'Annual Reporting Schedule', status: 'pending', category: 'monitoring' },
];

const DEMO_DEADLINES = [
  { id: 1, title: 'Submit quarterly monitoring report', dueDate: '2026-04-15', status: 'upcoming', priority: 'high' },
  { id: 2, title: 'Renew coastal construction permit', dueDate: '2026-06-01', status: 'upcoming', priority: 'medium' },
  { id: 3, title: 'Annual species survey submission', dueDate: '2026-07-31', status: 'upcoming', priority: 'medium' },
  { id: 4, title: 'Water quality lab results', dueDate: '2026-03-31', status: 'overdue', priority: 'high' },
];

const DEMO_REQUIREMENTS = [
  {
    id: 1,
    title: 'Environmental Impact Assessment',
    description: 'Full EIA required for projects impacting more than 500m² of seabed.',
    jurisdiction: 'National',
    category: 'environmental',
    mandatory: true,
  },
  {
    id: 2,
    title: 'Marine Protected Area Buffer Zone',
    description: 'Minimum 200m buffer from MPA boundaries. Variance requires ministerial approval.',
    jurisdiction: 'National',
    category: 'environmental',
    mandatory: true,
  },
  {
    id: 3,
    title: 'Coastal Construction Permit',
    description: 'Required for all hard structures installed within the 12nm territorial sea.',
    jurisdiction: 'Regional',
    category: 'permits',
    mandatory: true,
  },
  {
    id: 4,
    title: 'Post-Installation Ecological Monitoring',
    description: 'Biannual surveys for the first 3 years, then annual thereafter.',
    jurisdiction: 'National',
    category: 'monitoring',
    mandatory: true,
  },
];

// GET /api/compliance/stats
router.get('/stats', (_req, res) => {
  res.json(DEMO_STATS);
});

// GET /api/compliance/checks
router.get('/checks', (req, res) => {
  const { category, status } = req.query;
  let results = DEMO_CHECKS;
  if (category) results = results.filter(c => c.category === category);
  if (status) results = results.filter(c => c.status === status);
  res.json(results);
});

// GET /api/compliance/deadlines
router.get('/deadlines', (req, res) => {
  const { status } = req.query;
  let results = DEMO_DEADLINES;
  if (status) results = results.filter(d => d.status === status);
  res.json(results);
});

// GET /api/compliance/requirements
router.get('/requirements', (req, res) => {
  const { category, jurisdiction } = req.query;
  let results = DEMO_REQUIREMENTS;
  if (category) results = results.filter(r => r.category === category);
  if (jurisdiction) results = results.filter(r => r.jurisdiction === jurisdiction);
  res.json(results);
});

module.exports = router;
