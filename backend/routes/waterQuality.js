// routes/waterQuality.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

// GET water quality by latitude & longitude
router.get('/', async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  try {
    // Query the EPA WQP API
    const response = await axios.get('https://www.waterqualitydata.us/data/Result/search', {
      params: {
        latitude: lat,
        longitude: lon,
        within: 5,          // radius in miles
        mimeType: 'json',   // get JSON
        sorted: 'no'
      }
    });

    const results = response.data?.Results || [];

    // Simplify the response to relevant water quality metrics
    const simplified = results.slice(0, 10).map(r => ({
      site: r.MonitoringLocationName,
      characteristic: r.CharacteristicName,
      value: r.ResultMeasureValue,
      unit: r.ResultMeasure?.MeasureUnitCode,
      date: r.ActivityStartDate
    }));

    res.json({ lat, lon, samples: simplified });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch water quality data' });
  }
});

module.exports = router;
