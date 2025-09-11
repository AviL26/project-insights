const express = require('express');
const router = express.Router();
const db = require('../db/init');

// Demo compliance data
router.get('/demo', (req, res) => {
  const demoCompliance = {
    frameworks: [
      {
        id: 1,
        name: 'EU Water Framework Directive',
        status: 'compliant',
        requirements: 8,
        completed: 8,
        risk_level: 'low'
      },
      {
        id: 2,
        name: 'Marine Strategy Framework Directive',
        status: 'in-progress',
        requirements: 12,
        completed: 9,
        risk_level: 'medium'
      }
    ],
    permits: [
      {
        id: 1,
        name: 'Construction Permit',
        status: 'approved',
        authority: 'Ministry of Infrastructure'
      }
    ]
  };
  res.json(demoCompliance);
});

module.exports = router;
