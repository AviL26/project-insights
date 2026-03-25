const express = require('express');
const axios = require('axios');
const router = express.Router();

// GET /api/species/search → GBIF species search
router.get('/search', async (req, res) => {
  try {
    const response = await axios.get('https://api.gbif.org/v1/species/search', {
      params: req.query,
      timeout: 10000,
    });
    res.json(response.data);
  } catch (err) {
    const status = err.response?.status || 502;
    const message = err.response?.data || err.message;
    res.status(status).json({ error: 'GBIF species search failed', details: message });
  }
});

// GET /api/species/occurrences → OBIS occurrence search
router.get('/occurrences', async (req, res) => {
  try {
    const response = await axios.get('https://api.obis.org/v3/occurrence', {
      params: req.query,
      timeout: 10000,
    });
    res.json(response.data);
  } catch (err) {
    const status = err.response?.status || 502;
    const message = err.response?.data || err.message;
    res.status(status).json({ error: 'OBIS occurrence search failed', details: message });
  }
});

module.exports = router;
