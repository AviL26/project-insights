const express = require('express');
const { query, queryOne, run } = require('../db/adapter');
const { asyncHandler } = require('../middleware/error-handler');
const { validate } = require('../middleware/validate');
const { MaterialAdd, MaterialUpdate } = require('@econcrete/shared');

const router = express.Router();

// Get materials catalog
router.get('/catalog', asyncHandler(async (_req, res) => {
  const materials = query('SELECT * FROM materials_catalog ORDER BY category, name');
  res.json(materials);
}));

// List materials for a project (joined with catalog)
router.get('/project/:projectId', asyncHandler(async (req, res) => {
  const project = queryOne('SELECT id FROM projects WHERE id = ?', [req.params.projectId]);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const materials = query(
    `SELECT pm.id, pm.quantity, pm.unit, pm.notes, pm.created_at,
            mc.id AS material_id, mc.name, mc.category, mc.eco_rating, mc.description AS material_description
     FROM project_materials pm
     JOIN materials_catalog mc ON pm.material_id = mc.id
     WHERE pm.project_id = ?
     ORDER BY mc.category, mc.name`,
    [req.params.projectId]
  );

  res.json(materials);
}));

// Add material to project
router.post('/project/:projectId', validate(MaterialAdd), asyncHandler(async (req, res) => {
  const project = queryOne('SELECT id FROM projects WHERE id = ?', [req.params.projectId]);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const catalog = queryOne('SELECT id FROM materials_catalog WHERE id = ?', [req.validated.material_id]);
  if (!catalog) return res.status(400).json({ error: 'Invalid material' });

  const d = req.validated;
  const result = run(
    `INSERT INTO project_materials (project_id, material_id, quantity, unit, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [req.params.projectId, d.material_id, d.quantity, d.unit, d.notes]
  );

  const material = queryOne(
    `SELECT pm.id, pm.quantity, pm.unit, pm.notes, pm.created_at,
            mc.id AS material_id, mc.name, mc.category, mc.eco_rating, mc.description AS material_description
     FROM project_materials pm
     JOIN materials_catalog mc ON pm.material_id = mc.id
     WHERE pm.id = ?`,
    [result.lastInsertRowid]
  );

  res.status(201).json(material);
}));

// Update material entry
router.put('/:id', validate(MaterialUpdate), asyncHandler(async (req, res) => {
  const existing = queryOne('SELECT id FROM project_materials WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Material entry not found' });

  const d = req.validated;
  const fields = [];
  const params = [];

  for (const [key, value] of Object.entries(d)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      params.push(value);
    }
  }

  if (fields.length > 0) {
    params.push(req.params.id);
    run(`UPDATE project_materials SET ${fields.join(', ')} WHERE id = ?`, params);
  }

  const material = queryOne(
    `SELECT pm.id, pm.quantity, pm.unit, pm.notes, pm.created_at,
            mc.id AS material_id, mc.name, mc.category, mc.eco_rating, mc.description AS material_description
     FROM project_materials pm
     JOIN materials_catalog mc ON pm.material_id = mc.id
     WHERE pm.id = ?`,
    [req.params.id]
  );

  res.json(material);
}));

// Remove material from project
router.delete('/:id', asyncHandler(async (req, res) => {
  const result = run('DELETE FROM project_materials WHERE id = ?', [req.params.id]);
  if (result.changes === 0) return res.status(404).json({ error: 'Material entry not found' });
  res.json({ message: 'Material removed' });
}));

module.exports = router;
