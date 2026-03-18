const express = require('express');
const { query, queryOne, run } = require('../db/adapter');
const { asyncHandler } = require('../middleware/error-handler');
const { validate } = require('../middleware/validate');
const { ProjectCreate, ProjectUpdate } = require('@econcrete/shared');

const router = express.Router();

// List projects (with optional status filter)
router.get('/', asyncHandler(async (req, res) => {
  const { status, search, sort = 'created_at', order = 'desc' } = req.query;

  const allowedSort = ['name', 'created_at', 'updated_at', 'status'];
  const sortCol = allowedSort.includes(sort) ? sort : 'created_at';
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

  let sql = 'SELECT * FROM projects WHERE 1=1';
  const params = [];

  if (status && status !== 'all') {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (search) {
    sql += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += ` ORDER BY ${sortCol} ${sortOrder}`;

  const projects = query(sql, params).map(p => ({
    ...p,
    ecological_goals: JSON.parse(p.ecological_goals || '[]'),
    target_species: JSON.parse(p.target_species || '[]'),
  }));

  res.json({ projects, total: projects.length });
}));

// Get single project
router.get('/:id', asyncHandler(async (req, res) => {
  const project = queryOne('SELECT * FROM projects WHERE id = ?', [req.params.id]);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  project.ecological_goals = JSON.parse(project.ecological_goals || '[]');
  project.target_species = JSON.parse(project.target_species || '[]');

  res.json(project);
}));

// Create project
router.post('/', validate(ProjectCreate), asyncHandler(async (req, res) => {
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

// Update project
router.put('/:id', validate(ProjectUpdate), asyncHandler(async (req, res) => {
  const existing = queryOne('SELECT * FROM projects WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Project not found' });

  const d = req.validated;
  const fields = [];
  const params = [];

  for (const [key, value] of Object.entries(d)) {
    if (key === 'ecological_goals' || key === 'target_species') {
      fields.push(`${key} = ?`);
      params.push(JSON.stringify(value));
    } else {
      fields.push(`${key} = ?`);
      params.push(value);
    }
  }

  if (fields.length > 0) {
    params.push(req.params.id);
    run(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, params);
  }

  const project = queryOne('SELECT * FROM projects WHERE id = ?', [req.params.id]);
  project.ecological_goals = JSON.parse(project.ecological_goals || '[]');
  project.target_species = JSON.parse(project.target_species || '[]');
  res.json(project);
}));

// Archive
router.put('/:id/archive', asyncHandler(async (req, res) => {
  const result = run("UPDATE projects SET status = 'archived' WHERE id = ?", [req.params.id]);
  if (result.changes === 0) return res.status(404).json({ error: 'Project not found' });
  res.json({ message: 'Project archived' });
}));

// Restore
router.put('/:id/restore', asyncHandler(async (req, res) => {
  const result = run("UPDATE projects SET status = 'active' WHERE id = ?", [req.params.id]);
  if (result.changes === 0) return res.status(404).json({ error: 'Project not found' });
  res.json({ message: 'Project restored' });
}));

// Delete
router.delete('/:id', asyncHandler(async (req, res) => {
  const result = run('DELETE FROM projects WHERE id = ?', [req.params.id]);
  if (result.changes === 0) return res.status(404).json({ error: 'Project not found' });
  res.json({ message: 'Project deleted' });
}));

module.exports = router;
