const express = require('express');
const router = express.Router();
const db = require('../db/init');

// GET compliance data for a specific project
router.get('/project/:projectId', (req, res) => {
  const { projectId } = req.params;
  
  // Get compliance frameworks for this project
  db.all('SELECT * FROM compliance_frameworks WHERE project_id = ?', [projectId], (err, frameworks) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Get permits for this project  
    db.all('SELECT * FROM permits WHERE project_id = ?', [projectId], (err2, permits) => {
      if (err2) {
        return res.status(500).json({ error: err2.message });
      }
      
      // Get deadlines for this project
      db.all('SELECT * FROM compliance_deadlines WHERE project_id = ? ORDER BY due_date ASC', [projectId], (err3, deadlines) => {
        if (err3) {
          return res.status(500).json({ error: err3.message });
        }
        
        res.json({
          frameworks,
          permits,
          deadlines,
          projectId
        });
      });
    });
  });
});

// Demo compliance data (fallback)
router.get('/demo', (req, res) => {
  const demoCompliance = {
    frameworks: [
      {
        id: 1,
        name: 'EU Water Framework Directive',
        status: 'compliant',
        last_review: '2024-02-15',
        next_review: '2025-02-15',
        requirements: 8,
        completed: 8,
        risk_level: 'low'
      },
      {
        id: 2,
        name: 'Marine Strategy Framework Directive',
        status: 'in-progress',
        last_review: '2024-01-20',
        next_review: '2024-12-20',
        requirements: 12,
        completed: 9,
        risk_level: 'medium'
      },
      {
        id: 3,
        name: 'Environmental Impact Assessment',
        status: 'pending',
        last_review: '2024-03-10',
        next_review: '2024-09-10',
        requirements: 15,
        completed: 6,
        risk_level: 'high'
      }
    ],
    permits: [
      {
        id: 1,
        name: 'Construction Permit',
        status: 'approved',
        issue_date: '2024-02-01',
        expiry_date: '2025-02-01',
        authority: 'Ministry of Infrastructure',
        conditions: 3
      },
      {
        id: 2,
        name: 'Environmental Permit',
        status: 'under-review',
        submission_date: '2024-03-15',
        expected_decision: '2024-10-15',
        authority: 'Ministry of Environment',
        conditions: 0
      }
    ],
    deadlines: [
      {
        task: 'Environmental monitoring report',
        due_date: '2024-10-30',
        framework: 'Marine Strategy Framework',
        priority: 'high'
      },
      {
        task: 'Stakeholder consultation update',
        due_date: '2024-11-15',
        framework: 'Environmental Impact Assessment',
        priority: 'medium'
      }
    ]
  };
  res.json(demoCompliance);
});

module.exports = router;
