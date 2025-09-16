const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database connections
const db = require('./db/connection');

// Security and logging middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Test database connections on startup
db.testConnections().then(results => {
  console.log('🔍 Database Connection Status:');
  console.log('  SQLite:', results.sqlite ? '✅ Connected' : '❌ Failed');
  console.log('  PostgreSQL:', results.postgresql ? '✅ Connected' : '❌ Failed');
  console.log('  Active Database Type:', db.dbType);
  
  if (results.postgresql) {
    console.log('🚀 Enhanced compliance features available');
  } else {
    console.log('⚠️  Enhanced compliance features unavailable (PostgreSQL not connected)');
  }
}).catch(err => {
  console.error('❌ Database connection test failed:', err);
});

// API Routes
// Existing routes (using SQLite)
app.use('/api/projects', require('./routes/projects'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/compliance', require('./routes/compliance'));
app.use('/api/ecological', require('./routes/ecological'));

// Enhanced routes (using PostgreSQL)
if (process.env.ENABLE_COMPLIANCE_FEATURES === 'true') {
  try {
    app.use('/api/compliance-enhanced', require('./routes/compliance-pg'));
    console.log('📋 Enhanced compliance routes loaded');
  } catch (err) {
    console.warn('⚠️  Enhanced compliance routes could not be loaded:', err.message);
  }
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const connections = await db.testConnections();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      databases: {
        sqlite: connections.sqlite,
        postgresql: connections.postgresql,
        activeType: db.dbType
      },
      features: {
        enhancedCompliance: connections.postgresql,
        standardCompliance: connections.sqlite
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Database status endpoint
app.get('/api/database/status', async (req, res) => {
  try {
    const connections = await db.testConnections();
    
    res.json({
      success: true,
      data: {
        sqlite: {
          connected: connections.sqlite,
          path: process.env.SQLITE_DB_PATH || './db/projects.db'
        },
        postgresql: {
          connected: connections.postgresql,
          url: process.env.DATABASE_URL ? 'configured' : 'not configured'
        },
        activeDatabase: db.dbType,
        enhancedFeaturesAvailable: connections.postgresql
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check database status'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.details || err.message
    });
  }
  
  // Database errors
  if (err.code === '23503') { // Foreign key violation
    return res.status(400).json({
      success: false,
      error: 'Referenced record does not exist'
    });
  }
  
  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      error: 'Database connection failed'
    });
  }
  
  // Generic error response
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /api/health',
      'GET /api/database/status',
      'GET /api/projects',
      'GET /api/materials',
      'GET /api/compliance',
      'GET /api/ecological',
      'POST /api/compliance-enhanced/check (if PostgreSQL connected)'
    ]
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  try {
    await db.closeConnections();
    console.log('✅ Database connections closed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  try {
    await db.closeConnections();
    process.exit(0);
  } catch (err) {
    console.error('Error during SIGTERM shutdown:', err);
    process.exit(1);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ECOncrete Project Insights API`);
  console.log(`📍 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database type: ${db.dbType}`);
  console.log(`📋 Enhanced compliance: ${process.env.ENABLE_COMPLIANCE_FEATURES === 'true' ? 'enabled' : 'disabled'}`);
  console.log(`\n📊 Available endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/database/status`);
  console.log(`   GET  /api/projects`);
  console.log(`   POST /api/compliance/check (SQLite)`);
  console.log(`   POST /api/compliance-enhanced/check (PostgreSQL)`);
});

module.exports = app;