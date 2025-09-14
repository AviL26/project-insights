// backend/routes/projects.js - Updated with Archive System
const express = require('express');
const router = express.Router();
const db = require('../db/init');

// GET all active projects (default view)
router.get('/', (req, res) => {
  const status = req.query.status || 'active'; // Default to active projects
  
  const sql = `
    SELECT * FROM projects 
    WHERE status = ? 
    ORDER BY created_at DESC
  `;
  
  db.all(sql, [status], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch projects',
        details: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: rows,
      status: status
    });
  });
});

// GET projects by status (active, archived)
router.get('/by-status/:status', (req, res) => {
  const { status } = req.params;
  
  if (!['active', 'archived'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid status. Must be "active" or "archived"'
    });
  }
  
  const sql = `
    SELECT * FROM projects 
    WHERE status = ? 
    ORDER BY created_at DESC
  `;
  
  db.all(sql, [status], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch projects',
        details: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: rows,
      status: status,
      count: rows.length
    });
  });
});

// POST create new project (always active)
router.post('/', (req, res) => {
  const {
    name, country, region, coordinates, water_depth, wave_exposure,
    seabed_type, water_temperature, salinity, structure_type, primary_function,
    length, width, height, design_life, regulatory_framework, environmental_assessment,
    permit_status, stakeholders, primary_goals, target_species, habitat_types,
    carbon_targets, monitoring_plan, lat, lon
  } = req.body;

  // Validation
  if (!name || !country || !structure_type) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: name, country, structure_type'
    });
  }

  const sql = `
    INSERT INTO projects (
      name, country, region, coordinates, water_depth, wave_exposure,
      seabed_type, water_temperature, salinity, structure_type, primary_function,
      length, width, height, design_life, regulatory_framework, environmental_assessment,
      permit_status, stakeholders, primary_goals, target_species, habitat_types,
      carbon_targets, monitoring_plan, lat, lon, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))
  `;

  const values = [
    name, country, region, coordinates, water_depth, wave_exposure,
    seabed_type, water_temperature, salinity, structure_type, primary_function,
    length || 0, width || 0, height || 0, design_life || 50,
    JSON.stringify(regulatory_framework || []), environmental_assessment,
    permit_status || 'planning', JSON.stringify(stakeholders || []),
    JSON.stringify(primary_goals || []), JSON.stringify(target_species || []),
    JSON.stringify(habitat_types || []), carbon_targets, monitoring_plan,
    lat || 0, lon || 0
  ];

  db.run(sql, values, function(err) {
    if (err) {
      console.error('Database error creating project:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to create project',
        details: err.message
      });
    }

    // Fetch the created project
    db.get('SELECT * FROM projects WHERE id = ?', [this.lastID], (err, row) => {
      if (err) {
        console.error('Error fetching created project:', err);
        return res.status(500).json({
          success: false,
          error: 'Project created but failed to fetch',
          details: err.message
        });
      }

      res.status(201).json({
        success: true,
        data: row,
        message: 'Project created successfully'
      });
    });
  });
});

// PUT /:id/archive - Archive a project
router.put('/:id/archive', (req, res) => {
  const { id } = req.params;
  
  const sql = `
    UPDATE projects 
    SET status = 'archived', updated_at = datetime('now')
    WHERE id = ? AND status = 'active'
  `;

  db.run(sql, [id], function(err) {
    if (err) {
      console.error('Database error archiving project:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to archive project',
        details: err.message
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or already archived'
      });
    }

    // Fetch updated project
    db.get('SELECT * FROM projects WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Error fetching archived project:', err);
        return res.status(500).json({
          success: false,
          error: 'Project archived but failed to fetch'
        });
      }

      res.json({
        success: true,
        data: row,
        message: 'Project archived successfully'
      });
    });
  });
});

// PUT /:id/restore - Restore project from archive
router.put('/:id/restore', (req, res) => {
  const { id } = req.params;
  
  const sql = `
    UPDATE projects 
    SET status = 'active', updated_at = datetime('now')
    WHERE id = ? AND status = 'archived'
  `;

  db.run(sql, [id], function(err) {
    if (err) {
      console.error('Database error restoring project:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to restore project',
        details: err.message
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or not archived'
      });
    }

    // Fetch updated project
    db.get('SELECT * FROM projects WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Error fetching restored project:', err);
        return res.status(500).json({
          success: false,
          error: 'Project restored but failed to fetch'
        });
      }

      res.json({
        success: true,
        data: row,
        message: 'Project restored successfully'
      });
    });
  });
});

// DELETE /bulk-archive - Bulk archive projects
router.put('/bulk-archive', (req, res) => {
  const { projectIds } = req.body;

  // Validation
  if (!Array.isArray(projectIds) || projectIds.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'projectIds must be a non-empty array'
    });
  }

  const placeholders = projectIds.map(() => '?').join(',');
  const sql = `
    UPDATE projects 
    SET status = 'archived', updated_at = datetime('now')
    WHERE id IN (${placeholders}) AND status = 'active'
  `;

  db.run(sql, projectIds, function(err) {
    if (err) {
      console.error('Database error in bulk archive:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to archive projects',
        details: err.message
      });
    }

    const archivedCount = this.changes;
    
    res.json({
      success: true,
      message: `Successfully archived ${archivedCount} projects`,
      data: {
        archivedCount: archivedCount,
        archivedProjects: projectIds,
        requestedCount: projectIds.length
      }
    });
  });
});

// DELETE /bulk-permanent - Permanently delete projects (HARD DELETE)
router.delete('/bulk-permanent', (req, res) => {
  const { projectIds } = req.body;

  // Validation
  if (!Array.isArray(projectIds) || projectIds.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'projectIds must be a non-empty array'
    });
  }

  const placeholders = projectIds.map(() => '?').join(',');
  
  // HARD DELETE - actually remove from database
  const sql = `DELETE FROM projects WHERE id IN (${placeholders})`;

  db.run(sql, projectIds, function(err) {
    if (err) {
      console.error('Database error in permanent bulk delete:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to permanently delete projects',
        details: err.message
      });
    }

    const deletedCount = this.changes;
    
    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} projects permanently`,
      data: {
        deletedCount: deletedCount,
        deletedProjects: projectIds,
        requestedCount: projectIds.length
      }
    });
  });
});

// PUT update project with field whitelisting
router.put('/:id', (req, res) => {
  const { id } = req.params;
  
  // Whitelist allowed fields (unchanged)
  const allowedFields = [
    'name', 'country', 'region', 'coordinates', 'water_depth', 'wave_exposure',
    'seabed_type', 'water_temperature', 'salinity', 'structure_type', 'primary_function',
    'length', 'width', 'height', 'design_life', 'regulatory_framework', 'environmental_assessment',
    'permit_status', 'stakeholders', 'primary_goals', 'target_species', 'habitat_types',
    'carbon_targets', 'monitoring_plan', 'lat', 'lon', 'status'
  ];

  const updateFields = [];
  const values = [];

  // Only process whitelisted fields
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key) && req.body[key] !== undefined) {
      updateFields.push(`${key} = ?`);
      
      // Handle JSON fields
      if (['regulatory_framework', 'stakeholders', 'primary_goals', 'target_species', 'habitat_types'].includes(key)) {
        values.push(JSON.stringify(req.body[key]));
      } else {
        values.push(req.body[key]);
      }
    }
  });

  if (updateFields.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No valid fields to update'
    });
  }

  // Add updated timestamp and project ID
  updateFields.push('updated_at = datetime(\'now\')');
  values.push(id);

  const sql = `
    UPDATE projects 
    SET ${updateFields.join(', ')} 
    WHERE id = ?
  `;

  db.run(sql, values, function(err) {
    if (err) {
      console.error('Database error updating project:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to update project',
        details: err.message
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Fetch updated project
    db.get('SELECT * FROM projects WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Error fetching updated project:', err);
        return res.status(500).json({
          success: false,
          error: 'Project updated but failed to fetch'
        });
      }

      res.json({
        success: true,
        data: row,
        message: 'Project updated successfully'
      });
    });
  });
});

// GET single project
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM projects WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch project',
        details: err.message
      });
    }
    
    if (!row) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    res.json({
      success: true,
      data: row
    });
  });
});

// DELETE /:id/permanent - Permanently delete single project (HARD DELETE)
router.delete('/:id/permanent', (req, res) => {
  const { id } = req.params;

  // HARD DELETE - actually remove from database
  const sql = `DELETE FROM projects WHERE id = ?`;

  db.run(sql, [id], function(err) {
    if (err) {
      console.error('Database error permanently deleting project:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to permanently delete project',
        details: err.message
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      message: 'Project permanently deleted',
      data: { deletedId: id }
    });
  });
});

module.exports = router;