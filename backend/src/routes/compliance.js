const express = require('express');
const { query, queryOne, run, transaction } = require('../db/adapter');
const { asyncHandler } = require('../middleware/error-handler');
const { validate } = require('../middleware/validate');
const { ComplianceUpdate, ComplianceGenerate } = require('@econcrete/shared');

const router = express.Router();

// Get compliance rules catalog (templates)
router.get('/rules', asyncHandler(async (_req, res) => {
  const rules = query('SELECT * FROM compliance_rules ORDER BY jurisdiction, category, priority DESC, rule_code');
  res.json(rules);
}));

// Get compliance checklist for a project
router.get('/project/:projectId', asyncHandler(async (req, res) => {
  const checks = query(`
    SELECT cc.*, cr.description as rule_description, cr.category
    FROM compliance_checks cc
    LEFT JOIN compliance_rules cr ON cc.rule_code = cr.rule_code
      AND (cr.jurisdiction = (SELECT jurisdiction FROM projects WHERE id = cc.project_id) OR cr.jurisdiction = '*')
    WHERE cc.project_id = ?
    ORDER BY
      CASE cc.priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END,
      cc.rule_code
  `, [req.params.projectId]);
  res.json(checks);
}));

// Generate checklist for a project based on its jurisdiction
router.post('/generate', validate(ComplianceGenerate, 'body'), asyncHandler(async (req, res) => {
  const { project_id } = req.validated;

  const project = queryOne('SELECT id, jurisdiction FROM projects WHERE id = ?', [project_id]);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (!project.jurisdiction) return res.status(400).json({ error: 'Project has no jurisdiction set. Update the project first.' });

  // Get universal rules (*) + jurisdiction-specific rules
  const rules = query(
    'SELECT * FROM compliance_rules WHERE jurisdiction = ? OR jurisdiction = ? ORDER BY category, priority DESC, rule_code',
    ['*', project.jurisdiction]
  );

  if (rules.length === 0) {
    return res.status(400).json({ error: 'No compliance rules found for this jurisdiction' });
  }

  // Check for existing checks to avoid duplicates
  const existing = query('SELECT rule_code FROM compliance_checks WHERE project_id = ?', [project_id]);
  const existingCodes = new Set(existing.map(e => e.rule_code));

  const newRules = rules.filter(r => !existingCodes.has(r.rule_code));

  if (newRules.length === 0) {
    const allChecks = query(`
      SELECT cc.*, cr.description as rule_description, cr.category
      FROM compliance_checks cc
      LEFT JOIN compliance_rules cr ON cc.rule_code = cr.rule_code
        AND (cr.jurisdiction = ? OR cr.jurisdiction = '*')
      WHERE cc.project_id = ?
      ORDER BY CASE cc.priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END, cc.rule_code
    `, [project.jurisdiction, project_id]);
    return res.json({ generated: 0, checks: allChecks });
  }

  // Insert new checks in a transaction
  transaction(() => {
    for (const rule of newRules) {
      run(
        'INSERT INTO compliance_checks (project_id, rule_code, rule_name, status, priority, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [project_id, rule.rule_code, rule.rule_name, 'pending', rule.priority, '']
      );
    }
  });

  // Return the full checklist
  const allChecks = query(`
    SELECT cc.*, cr.description as rule_description, cr.category
    FROM compliance_checks cc
    LEFT JOIN compliance_rules cr ON cc.rule_code = cr.rule_code
      AND (cr.jurisdiction = ? OR cr.jurisdiction = '*')
    WHERE cc.project_id = ?
    ORDER BY CASE cc.priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END, cc.rule_code
  `, [project.jurisdiction, project_id]);

  res.json({ generated: newRules.length, checks: allChecks });
}));

// Update a compliance check status
router.put('/:id', validate(ComplianceUpdate, 'body'), asyncHandler(async (req, res) => {
  const { status, notes } = req.validated;
  const existing = queryOne('SELECT * FROM compliance_checks WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Compliance check not found' });

  run(
    'UPDATE compliance_checks SET status = ?, notes = ?, checked_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, notes !== undefined ? notes : existing.notes, req.params.id]
  );

  const updated = queryOne(`
    SELECT cc.*, cr.description as rule_description, cr.category
    FROM compliance_checks cc
    LEFT JOIN compliance_rules cr ON cc.rule_code = cr.rule_code
      AND (cr.jurisdiction = (SELECT jurisdiction FROM projects WHERE id = cc.project_id) OR cr.jurisdiction = '*')
    WHERE cc.id = ?
  `, [req.params.id]);

  res.json(updated);
}));

// Delete a compliance check
router.delete('/:id', asyncHandler(async (req, res) => {
  const existing = queryOne('SELECT * FROM compliance_checks WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Compliance check not found' });
  run('DELETE FROM compliance_checks WHERE id = ?', [req.params.id]);
  res.json({ success: true });
}));

// Reset all checks for a project (regenerate)
router.delete('/project/:projectId', asyncHandler(async (req, res) => {
  run('DELETE FROM compliance_checks WHERE project_id = ?', [req.params.projectId]);
  res.json({ success: true });
}));

module.exports = router;
