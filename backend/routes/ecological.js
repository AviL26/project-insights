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
