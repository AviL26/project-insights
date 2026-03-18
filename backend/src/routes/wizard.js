const express = require('express');
const { STRUCTURE_TYPES, WAVE_EXPOSURE, SEABED_TYPES, PRIMARY_GOALS, JURISDICTIONS } = require('@econcrete/shared');
const { run, queryOne } = require('../db/adapter');
const { asyncHandler } = require('../middleware/error-handler');
const { validate } = require('../middleware/validate');
const { ProjectCreate } = require('@econcrete/shared');

const router = express.Router();

// Bootstrap — return all lookup data the wizard needs in a single request
router.get('/bootstrap', asyncHandler(async (_req, res) => {
  res.json({
    structureTypes: STRUCTURE_TYPES,
    waveExposure: WAVE_EXPOSURE,
    seabedTypes: SEABED_TYPES,
    primaryGoals: PRIMARY_GOALS,
    jurisdictions: JURISDICTIONS,
  });
}));

// Complete wizard — create project
router.post('/complete', validate(ProjectCreate), asyncHandler(async (req, res) => {
  const d = req.validated;
  const result = run(
    `INSERT INTO projects (name, description, status, country, region, latitude, longitude,
     structure_type, wave_exposure, seabed_type, depth_range, primary_goal,
     ecological_goals, target_species, jurisdiction)
     VALUES (?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [d.name, d.description, d.country, d.region, d.latitude, d.longitude,
     d.structure_type, d.wave_exposure, d.seabed_type, d.depth_range, d.primary_goal,
     JSON.stringify(d.ecological_goals), JSON.stringify(d.target_species), d.jurisdiction]
  );

  const project = queryOne('SELECT * FROM projects WHERE id = ?', [result.lastInsertRowid]);
  project.ecological_goals = JSON.parse(project.ecological_goals || '[]');
  project.target_species = JSON.parse(project.target_species || '[]');

  res.status(201).json(project);
}));

module.exports = router;
