const express = require('express');
const router = express.Router();
const db = require('../db/init');

// GET all projects
router.get('/', (req, res) => {
  db.all('SELECT * FROM projects ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// GET single project
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM projects WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(row);
  });
});

// POST create new project
router.post('/', (req, res) => {
  const {
    name, country, region, coordinates, water_depth, wave_exposure,
    seabed_type, water_temperature, salinity, structure_type,
    primary_function, length, width, height, design_life,
    regulatory_framework, environmental_assessment, permit_status,
    stakeholders, primary_goals, target_species, habitat_types,
    carbon_targets, monitoring_plan
  } = req.body;

  const sql = `INSERT INTO projects (
    name, country, region, coordinates, water_depth, wave_exposure,
    seabed_type, water_temperature, salinity, structure_type,
    primary_function, length, width, height, design_life,
    regulatory_framework, environmental_assessment, permit_status,
    stakeholders, primary_goals, target_species, habitat_types,
    carbon_targets, monitoring_plan
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const params = [
    name, country, region, coordinates, water_depth, wave_exposure,
    seabed_type, water_temperature, salinity, structure_type,
    primary_function, length, width, height, design_life,
    JSON.stringify(regulatory_framework), environmental_assessment, permit_status,
    JSON.stringify(stakeholders), JSON.stringify(primary_goals),
    JSON.stringify(target_species), JSON.stringify(habitat_types),
    carbon_targets, monitoring_plan
  ];

  db.run(sql, params, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, message: 'Project created successfully' });
  });
});

module.exports = router;
