const express = require('express');
const { query } = require('../db/adapter');
const { asyncHandler } = require('../middleware/error-handler');

const router = express.Router();

router.get('/structure-types', asyncHandler(async (_req, res) => {
  res.json(query('SELECT * FROM structure_types'));
}));

router.get('/jurisdictions', asyncHandler(async (_req, res) => {
  const rows = query('SELECT * FROM jurisdictions');
  res.json(rows.map(r => ({ ...r, agencies: JSON.parse(r.agencies || '[]') })));
}));

router.get('/materials', asyncHandler(async (_req, res) => {
  res.json(query('SELECT * FROM materials_catalog'));
}));

module.exports = router;
