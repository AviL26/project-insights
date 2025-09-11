const express = require('express');
const router = express.Router();
const db = require('../db/init');

// GET materials for a project
router.get('/project/:projectId', (req, res) => {
  const { projectId } = req.params;
  db.all('SELECT * FROM materials WHERE project_id = ?', [projectId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Default materials data for demo
router.get('/demo', (req, res) => {
  const demoMaterials = [
    {
      id: 1,
      name: 'Bio-Enhanced Concrete',
      category: 'Primary Structure',
      quantity: 450,
      unit: 'm³',
      cost: 85000,
      availability: 'In Stock',
      ecological_benefit: 'High'
    },
    {
      id: 2,
      name: 'ECO Armor Units',
      category: 'Surface Enhancement',
      quantity: 120,
      unit: 'units',
      cost: 24000,
      availability: 'Made to Order',
      ecological_benefit: 'Very High'
    },
    {
      id: 3,
      name: 'Bio-Aggregate Mix',
      category: 'Additive',
      quantity: 50,
      unit: 'tons',
      cost: 12000,
      availability: 'In Stock',
      ecological_benefit: 'Medium'
    }
  ];
  res.json(demoMaterials);
});

module.exports = router;
