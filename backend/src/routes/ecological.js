const express = require('express');
const { query, queryOne, run, transaction } = require('../db/adapter');
const { asyncHandler } = require('../middleware/error-handler');
const { validate } = require('../middleware/validate');
const { SurveyCreate, SurveyUpdate } = require('@econcrete/shared');

const router = express.Router();

// Get all metric definitions
router.get('/metrics', asyncHandler(async (_req, res) => {
  const metrics = query('SELECT * FROM ecological_metrics ORDER BY category, name');
  res.json(metrics);
}));

// Get surveys for a project (with computed scores)
router.get('/project/:projectId', asyncHandler(async (req, res) => {
  const surveys = query(
    'SELECT * FROM ecological_surveys WHERE project_id = ? ORDER BY survey_date DESC',
    [req.params.projectId]
  );

  // Attach readings to each survey
  for (const survey of surveys) {
    survey.readings = query(`
      SELECT er.*, em.key, em.name, em.category, em.unit, em.description,
             em.min_value, em.max_value, em.target_value, em.weight
      FROM ecological_readings er
      JOIN ecological_metrics em ON er.metric_id = em.id
      WHERE er.survey_id = ?
      ORDER BY em.category, em.name
    `, [survey.id]);
  }

  res.json(surveys);
}));

// Get dashboard scores for a project (latest survey + trend)
router.get('/project/:projectId/dashboard', asyncHandler(async (req, res) => {
  const metrics = query('SELECT * FROM ecological_metrics ORDER BY category, name');

  const surveys = query(
    'SELECT * FROM ecological_surveys WHERE project_id = ? ORDER BY survey_date DESC LIMIT 10',
    [req.params.projectId]
  );

  if (surveys.length === 0) {
    return res.json({ metrics, surveys: [], latestScores: null, overallScore: null, trend: [] });
  }

  // Get readings for latest survey
  const latest = surveys[0];
  const latestReadings = query(`
    SELECT er.*, em.key, em.name, em.category, em.unit,
           em.min_value, em.max_value, em.target_value, em.weight
    FROM ecological_readings er
    JOIN ecological_metrics em ON er.metric_id = em.id
    WHERE er.survey_id = ?
  `, [latest.id]);

  // Compute category scores and overall score
  const categoryScores = computeCategoryScores(latestReadings);
  const overallScore = computeOverallScore(latestReadings);

  // Compute trend (overall score per survey)
  const trend = [];
  for (const survey of surveys.reverse()) {
    const readings = query(`
      SELECT er.*, em.key, em.name, em.category, em.unit,
             em.min_value, em.max_value, em.target_value, em.weight
      FROM ecological_readings er
      JOIN ecological_metrics em ON er.metric_id = em.id
      WHERE er.survey_id = ?
    `, [survey.id]);
    trend.push({
      survey_id: survey.id,
      date: survey.survey_date,
      score: computeOverallScore(readings),
      categoryScores: computeCategoryScores(readings),
    });
  }

  res.json({
    metrics,
    surveys,
    latestReadings,
    categoryScores,
    overallScore,
    trend,
  });
}));

// Create a new survey with readings
router.post('/survey', validate(SurveyCreate, 'body'), asyncHandler(async (req, res) => {
  const { project_id, survey_date, surveyor, notes, readings } = req.validated;

  const project = queryOne('SELECT id FROM projects WHERE id = ?', [project_id]);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  let surveyId;
  transaction(() => {
    const result = run(
      'INSERT INTO ecological_surveys (project_id, survey_date, surveyor, notes) VALUES (?, ?, ?, ?)',
      [project_id, survey_date, surveyor, notes]
    );
    surveyId = result.lastInsertRowid;

    for (const reading of readings) {
      run(
        'INSERT INTO ecological_readings (survey_id, metric_id, value, notes) VALUES (?, ?, ?, ?)',
        [surveyId, reading.metric_id, reading.value, reading.notes || '']
      );
    }
  });

  const survey = queryOne('SELECT * FROM ecological_surveys WHERE id = ?', [surveyId]);
  survey.readings = query(`
    SELECT er.*, em.key, em.name, em.category, em.unit,
           em.min_value, em.max_value, em.target_value, em.weight
    FROM ecological_readings er
    JOIN ecological_metrics em ON er.metric_id = em.id
    WHERE er.survey_id = ?
    ORDER BY em.category, em.name
  `, [surveyId]);

  res.status(201).json(survey);
}));

// Delete a survey
router.delete('/survey/:id', asyncHandler(async (req, res) => {
  const survey = queryOne('SELECT * FROM ecological_surveys WHERE id = ?', [req.params.id]);
  if (!survey) return res.status(404).json({ error: 'Survey not found' });
  run('DELETE FROM ecological_surveys WHERE id = ?', [req.params.id]);
  res.json({ success: true });
}));

// --- Scoring helpers ---

function computeMetricScore(reading) {
  // Normalize a reading to 0-100 based on target
  const { value, min_value, max_value, target_value } = reading;

  // Special handling for "lower is better" metrics
  const lowerIsBetter = ['invasive_species', 'turbidity', 'nutrient_level'].includes(reading.key);

  if (target_value == null) {
    // Simple range normalization
    const range = max_value - min_value;
    if (range === 0) return 50;
    const normalized = ((value - min_value) / range) * 100;
    return lowerIsBetter ? 100 - Math.min(100, Math.max(0, normalized)) : Math.min(100, Math.max(0, normalized));
  }

  if (lowerIsBetter) {
    // 0 = perfect (100), target = good (70), max = bad (0)
    if (value <= target_value) return 100;
    const ratio = (value - target_value) / (max_value - target_value);
    return Math.max(0, 100 - ratio * 100);
  }

  // Higher is better: at or above target = 100, at min = 0
  if (value >= target_value) return 100;
  const range = target_value - min_value;
  if (range === 0) return value >= target_value ? 100 : 0;
  return Math.max(0, ((value - min_value) / range) * 100);
}

function computeCategoryScores(readings) {
  const categories = {};
  for (const r of readings) {
    if (!categories[r.category]) categories[r.category] = { totalWeighted: 0, totalWeight: 0 };
    const score = computeMetricScore(r);
    categories[r.category].totalWeighted += score * r.weight;
    categories[r.category].totalWeight += r.weight;
  }

  const result = {};
  for (const [cat, data] of Object.entries(categories)) {
    result[cat] = data.totalWeight > 0 ? Math.round(data.totalWeighted / data.totalWeight) : 0;
  }
  return result;
}

function computeOverallScore(readings) {
  if (readings.length === 0) return 0;
  let totalWeighted = 0;
  let totalWeight = 0;
  for (const r of readings) {
    const score = computeMetricScore(r);
    totalWeighted += score * r.weight;
    totalWeight += r.weight;
  }
  return totalWeight > 0 ? Math.round(totalWeighted / totalWeight) : 0;
}

module.exports = router;
