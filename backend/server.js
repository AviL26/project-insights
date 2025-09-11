const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/projects', require('./routes/projects'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/compliance', require('./routes/compliance'));
app.use('/api/ecological', require('./routes/ecological'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend running successfully', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
