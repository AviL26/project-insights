const express = require('express');
const axios = require('axios');
const router = express.Router();

// GET /api/climate/marine → Open-Meteo Marine API
router.get('/marine', async (req, res) => {
  try {
    const response = await axios.get('https://marine-api.open-meteo.com/v1/marine', {
      params: req.query,
      timeout: 10000,
    });
    res.json(response.data);
  } catch (err) {
    const status = err.response?.status || 502;
    const message = err.response?.data || err.message;
    res.status(status).json({ error: 'Marine API request failed', details: message });
  }
});

// GET /api/climate/weather → Open-Meteo Forecast API
router.get('/weather', async (req, res) => {
  try {
    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: req.query,
      timeout: 10000,
    });
    res.json(response.data);
  } catch (err) {
    const status = err.response?.status || 502;
    const message = err.response?.data || err.message;
    res.status(status).json({ error: 'Weather API request failed', details: message });
  }
});

module.exports = router;
