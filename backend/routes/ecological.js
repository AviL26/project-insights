const express = require('express');
const router = express.Router();
const db = require('../db/init');

// Demo ecological data
router.get('/demo', (req, res) => {
  const demoEcological = {
    overallScore: 8.7,
    carbonSequestration: {
      annual: 125,
      projected5Year: 750
    },
    biodiversityIndex: {
      current: 7.2,
      baseline: 4.1,
      improvement: 75.6
    },
    species: [
      {
        name: 'Mediterranean Grouper',
        status: 'thriving',
        trend: 18
      },
      {
        name: 'Sea Bream',
        status: 'stable',
        trend: 5
      }
    ]
  };
  res.json(demoEcological);
});

module.exports = router;

// GET ecological data for a specific project
router.get('/project/:projectId', (req, res) => {
  const { projectId } = req.params;
  
  // Get species monitoring data
  db.all('SELECT * FROM species_monitoring WHERE project_id = ? ORDER BY recorded_date DESC', [projectId], (err, species) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Get environmental metrics
    db.all('SELECT * FROM environmental_metrics WHERE project_id = ? ORDER BY recorded_date DESC', [projectId], (err2, metrics) => {
      if (err2) {
        return res.status(500).json({ error: err2.message });
      }
      
      res.json({
        species,
        metrics,
        projectId
      });
    });
  });
});