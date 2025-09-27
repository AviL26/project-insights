// File Location: /Users/avilapp/econcrete/backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Database service
const dbService = require('./db/database-service');

// Import actual middleware files
const { globalErrorHandler, notFoundHandler } = require('./middleware/error-handler');
const { corsOptions, generalRateLimit } = require('./middleware/security');

// Import route handlers (only the ones that exist)
const projectsRouter = require('./routes/projects');
const materialsRouter = require('./routes/materials');
const complianceRouter = require('./routes/compliance');
const authRouter = require('./routes/auth');
const lookupsRouter = require('./routes/lookups');
const geographicLookupsRouter = require('./routes/geographic-lookups');
const wizardRouter = require('./routes/wizard');  // Added wizard routes

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy
app.set('trust proxy', 1);

// Security and parsing middleware
app.use(helmet());
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
if (generalRateLimit) {
  app.use(generalRateLimit);
}

// Simple request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'WARN' : 'INFO';
    console.log(`[${new Date().toISOString()}] ${level}: ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await dbService.healthCheck();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.1.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      database: dbHealth.status === 'healthy'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API documentation
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'ECOncrete Project Insights API',
    version: '2.1.0',
    description: 'Marine infrastructure project management with geographic integration',
    endpoints: {
      projects: {
        'GET /api/projects': 'List all projects',
        'GET /api/projects/:id': 'Get project by ID',
        'POST /api/projects': 'Create new project',
        'PUT /api/projects/:id': 'Update project',
        'DELETE /api/projects/:id': 'Delete project',
        'GET /api/projects/by-status/:status': 'Get projects by status'
      },
      wizard: {
        'GET /api/wizard/bootstrap': 'Get wizard initialization data',
        'GET /api/wizard/cities/:countryCode': 'Get cities for country',
        'POST /api/wizard/projects': 'Create project from wizard'
      },
      geographic: {
        'GET /api/lookup/countries': 'Get coastal countries',
        'GET /api/lookup/regions/:countryCode': 'Get regions for country',
        'GET /api/lookup/structure-types': 'Get structure types',
        'GET /api/lookup/wave-exposure': 'Get wave exposure levels',
        'GET /api/lookup/seabed-types': 'Get seabed types',
        'GET /api/lookup/primary-goals': 'Get primary goals',
        'GET /api/lookup/all': 'Get all lookup data'
      },
      compliance: {
        'GET /api/compliance/:id': 'Get compliance data',
        'POST /api/compliance/check': 'Check compliance'
      },
      auth: {
        'POST /api/auth/login': 'User login',
        'POST /api/auth/register': 'User registration'
      }
    },
    features: [
      'Project Setup Wizard with 5-step configuration',
      'Geographic API integration with REST Countries and Nominatim',
      'Real-time country and region data',
      'Marine zone identification',
      'Database connection pooling',
      'Comprehensive error handling'
    ]
  });
});

// Mount API routes
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/compliance', complianceRouter);
app.use('/api/lookups', lookupsRouter);
app.use('/api/lookup', geographicLookupsRouter); // This is the key route for your wizard
app.use('/api/wizard', wizardRouter);  // Added wizard routes

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`Received ${signal}, starting graceful shutdown`);
  
  if (global.server) {
    global.server.close(async () => {
      console.log('HTTP server closed');
      try {
        await dbService.close();
        console.log('Database connections closed');
      } catch (error) {
        console.error('Error closing database:', error.message);
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Server startup
const startServer = async () => {
  try {
    console.log('🚀 Starting ECOncrete Project Insights Server...');
    
    // Initialize database
    console.log('📊 Initializing database...');
    await dbService.initialize();
    console.log('✅ Database initialization completed');
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`
🌊 ECOncrete Server running on port ${PORT}
📚 API Documentation: http://localhost:${PORT}/api/docs
🏥 Health Check: http://localhost:${PORT}/health
🔧 Environment: ${process.env.NODE_ENV || 'development'}

📋 Active Features:
   ✅ Database Connection Pooling
   ✅ Geographic API Integration
   ✅ Project Management
   ✅ Compliance Checking
   ✅ Authentication System
   ✅ Material Management
   ✅ Lookup Tables for Wizard
   ✅ Project Setup Wizard (5-step configuration)
      `);
    });

    global.server = server;
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;