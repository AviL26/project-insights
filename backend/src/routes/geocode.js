const express = require('express');
const axios = require('axios');
const router = express.Router();

const NOMINATIM_HEADERS = {
  'User-Agent': 'ECOncrete/1.0 (econcrete-app)',
};

// GET /api/geocode/search → Nominatim search
router.get('/search', async (req, res) => {
  try {
    const params = { format: 'json', ...req.query };
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params,
      headers: NOMINATIM_HEADERS,
      timeout: 10000,
    });
    res.json(response.data);
  } catch (err) {
    const status = err.response?.status || 502;
    const message = err.response?.data || err.message;
    res.status(status).json({ error: 'Geocode search failed', details: message });
  }
});

// GET /api/geocode/reverse → Nominatim reverse geocode
router.get('/reverse', async (req, res) => {
  try {
    const params = { format: 'json', ...req.query };
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params,
      headers: NOMINATIM_HEADERS,
      timeout: 10000,
    });
    res.json(response.data);
  } catch (err) {
    const status = err.response?.status || 502;
    const message = err.response?.data || err.message;
    res.status(status).json({ error: 'Reverse geocode failed', details: message });
  }
});

module.exports = router;
