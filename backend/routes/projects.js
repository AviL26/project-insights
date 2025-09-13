// backend/routes/projects.js
const express = require('express');
const router = express.Router();
const db = require('../db/init');

// Helper function to promisify database operations
const dbGet = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbRun = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

// GET all projects (exclude soft-deleted)
router.get('/', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM projects WHERE deleted_at IS NULL ORDER BY created_at DESC');
    res.json({ data: rows });
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// GET single project
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const row = await dbGet('SELECT * FROM projects WHERE id = ? AND deleted_at IS NULL', [id]);
    
    if (!row) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      });
    }
    
    res.json({ data: row });
  } catch (err) {
    console.error('Error fetching project:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// POST create new project
router.post('/', async (req, res) => {
  const {
    name, country, region, coordinates, water_depth, wave_exposure,
    seabed_type, water_temperature, salinity, structure_type,
    primary_function, length, width, height, design_life,
    regulatory_framework, environmental_assessment, permit_status,
    stakeholders, primary_goals, target_species, habitat_types,
    carbon_targets, monitoring_plan
  } = req.body;

  // Validation
  if (!name || !country) {
    return res.status(400).json({
      success: false,
      error: 'Project name and country are required'
    });
  }

  const sql = `INSERT INTO projects (
    name, country, region, coordinates, water_depth, wave_exposure,
    seabed_type, water_temperature, salinity, structure_type,
    primary_function, length, width, height, design_life,
    regulatory_framework, environmental_assessment, permit_status,
    stakeholders, primary_goals, target_species, habitat_types,
    carbon_targets, monitoring_plan, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`;

  const params = [
    name, country, region, coordinates, water_depth, wave_exposure,
    seabed_type, water_temperature, salinity, structure_type,
    primary_function, length, width, height, design_life,
    JSON.stringify(regulatory_framework || []), environmental_assessment, permit_status,
    JSON.stringify(stakeholders || []), JSON.stringify(primary_goals || []),
    JSON.stringify(target_species || []), JSON.stringify(habitat_types || []),
    carbon_targets, monitoring_plan
  ];

  try {
    const result = await dbRun(sql, params);
    
    // Fetch the created project to return complete data
    const newProject = await dbGet('SELECT * FROM projects WHERE id = ?', [result.lastID]);
    
    res.status(201).json({ 
      success: true,
      data: newProject,
      message: 'Project created successfully' 
    });
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// PUT update project
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  
  // Validate ID
  if (!id || isNaN(id)) {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid project ID provided' 
    });
  }

  try {
    // Check if project exists
    const existingProject = await dbGet('SELECT id FROM projects WHERE id = ? AND deleted_at IS NULL', [id]);
    
    if (!existingProject) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      });
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && key !== 'id') {
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
        error: 'No fields provided for update' 
      });
    }

    updateFields.push('updated_at = datetime("now")');
    values.push(id);

    const updateSql = `UPDATE projects SET ${updateFields.join(', ')} WHERE id = ?`;
    
    const result = await dbRun(updateSql, values);
    
    if (result.changes === 0) {
      return res.status(500).json({ 
        success: false,
        error: 'Failed to update project' 
      });
    }
    
    // Fetch updated project
    const updatedProject = await dbGet('SELECT * FROM projects WHERE id = ?', [id]);
    
    res.json({ 
      success: true,
      data: updatedProject,
      message: 'Project updated successfully' 
    });
    
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// DELETE project (soft delete)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  // Validate ID
  if (!id || isNaN(id)) {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid project ID provided' 
    });
  }

  try {
    // Check if project exists and get its details
    const project = await dbGet('SELECT id, name FROM projects WHERE id = ? AND deleted_at IS NULL', [id]);
    
    if (!project) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      });
    }

    const projectName = project.name;

    // Soft delete: mark as deleted instead of removing
    const deleteQuery = 'UPDATE projects SET deleted_at = datetime("now"), updated_at = datetime("now") WHERE id = ?';
    
    const result = await dbRun(deleteQuery, [id]);

    if (result.changes === 0) {
      return res.status(500).json({ 
        success: false,
        error: 'Failed to delete project' 
      });
    }

    // Log the deletion for audit purposes
    console.log(`Project deleted: ID ${id}, Name: ${projectName}, Timestamp: ${new Date().toISOString()}`);

    // Return success response that matches frontend expectations
    res.json({
      success: true,
      message: `Project "${projectName}" deleted successfully`,
      data: {
        id: parseInt(id),
        name: projectName
      }
    });

  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// DELETE multiple projects (bulk delete)
router.delete('/bulk', async (req, res) => {
  const { projectIds } = req.body;
  
  // Validation
  if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
    return res.status(400).json({ 
      success: false,
      error: 'Project IDs array is required and cannot be empty' 
    });
  }

  // Validate all IDs are numbers
  const invalidIds = projectIds.filter(id => !id || isNaN(id));
  if (invalidIds.length > 0) {
    return res.status(400).json({ 
      success: false,
      error: `Invalid project IDs: ${invalidIds.join(', ')}` 
    });
  }

  try {
    // Check which projects exist and get their names
    const placeholders = projectIds.map(() => '?').join(',');
    const existingProjects = await dbAll(
      `SELECT id, name FROM projects WHERE id IN (${placeholders}) AND deleted_at IS NULL`, 
      projectIds
    );

    if (existingProjects.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'No projects found with the provided IDs' 
      });
    }

    if (existingProjects.length !== projectIds.length) {
      const foundIds = existingProjects.map(p => p.id);
      const missingIds = projectIds.filter(id => !foundIds.includes(parseInt(id)));
      console.warn(`Some projects not found: ${missingIds.join(', ')}`);
    }

    // Bulk soft delete all existing projects
    const updateQuery = `
      UPDATE projects 
      SET deleted_at = datetime("now"), updated_at = datetime("now") 
      WHERE id IN (${placeholders}) AND deleted_at IS NULL
    `;
    
    const result = await dbRun(updateQuery, projectIds);

    if (result.changes === 0) {
      return res.status(500).json({ 
        success: false,
        error: 'Failed to delete projects' 
      });
    }

    // Log the bulk deletion for audit purposes
    const projectNames = existingProjects.map(p => `"${p.name}"`).join(', ');
    console.log(`Bulk delete: ${result.changes} projects deleted - ${projectNames}, Timestamp: ${new Date().toISOString()}`);

    // Return success response
    res.json({
      success: true,
      message: `${result.changes} project${result.changes === 1 ? '' : 's'} deleted successfully`,
      data: {
        deletedCount: result.changes,
        deletedProjects: existingProjects.map(p => ({
          id: p.id,
          name: p.name
        }))
      }
    });

  } catch (err) {
    console.error('Error in bulk delete:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// GET deleted projects (admin feature)
router.get('/admin/deleted', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM projects WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC');
    res.json({ data: rows });
  } catch (err) {
    console.error('Error fetching deleted projects:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// PUT restore deleted project
router.put('/:id/restore', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await dbRun('UPDATE projects SET deleted_at = NULL, updated_at = datetime("now") WHERE id = ? AND deleted_at IS NOT NULL', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found or not deleted' 
      });
    }
    
    const restoredProject = await dbGet('SELECT * FROM projects WHERE id = ?', [id]);
    
    res.json({ 
      success: true,
      data: restoredProject,
      message: 'Project restored successfully' 
    });
  } catch (err) {
    console.error('Error restoring project:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

module.exports = router;