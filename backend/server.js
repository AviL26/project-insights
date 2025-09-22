// backend/server.js - Updated with Database Pooling & Your Existing Error Handler
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Import enhanced database service
const dbService = require('./db/database-service');

// Import your existing error handler
const {
  globalErrorHandler,
  notFoundHandler,
  timeoutHandler,
  asyncHandler,
  AppError,
  ValidationError,
  DatabaseError,
  errorLogger,
  healthCheck
} = require('./middleware/error-handler');

// Import existing middleware (if you have these)
const { securityHeaders, corsOptions, generalRateLimit } = require('./middleware/security');

// Import route handlers
const projectsRouter = require('./routes/projects');
const materialsRouter = require('./routes/materials');
const ecologicalRouter = require('./routes/ecological');
const complianceRouter = require('./routes/compliance');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Set up process error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  errorLogger.log(error, null, 'error');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  errorLogger.log(new Error(`Unhandled Rejection: ${reason}`), null, 'error');
  process.exit(1);
});

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}, starting graceful shutdown`);
  
  if (global.server) {
    global.server.close(async () => {
      console.log('HTTP server closed');
      await dbService.close();
      process.exit(0);
    });
    
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Core middleware
app.use(helmet(securityHeaders || {}));
app.use(compression());
app.use(cors(corsOptions || {}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply timeout and rate limiting
app.use(timeoutHandler(30000)); // 30 second timeout
if (generalRateLimit) {
  app.use(generalRateLimit);
}

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    
    errorLogger.log({
      message: 'Request completed',
      statusCode: res.statusCode,
      method: req.method,
      url: req.url,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }, req, level);
  });
  
  next();
});

// Health check endpoints
app.get('/health', asyncHandler(async (req, res) => {
  const dbHealth = await dbService.healthCheck();
  const errorSystemHealth = healthCheck.checkErrorHandling();
  
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '2.1.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    databases: {
      sqlite: dbHealth.status === 'healthy',
      postgresql: false,
      activeType: 'sqlite'
    },
    features: {
      enhancedCompliance: false,
      standardCompliance: true,
      authentication: true,
      rateLimiting: true,
      inputSanitization: true,
      securityHeaders: true,
      errorHandling: errorSystemHealth.status === 'healthy',
      connectionPooling: true,
      backupSystem: true,
      structuredLogging: true
    },
    security: {
      cors: true,
      helmet: true,
      rateLimit: true,
      sanitization: true,
      authentication: 'available'
    },
    connectionPool: dbHealth.connectionPool || {},
    errorHandling: errorSystemHealth
  };
  
  res.json(healthStatus);
}));

app.get('/health/detailed', asyncHandler(async (req, res) => {
  const [dbHealth, dbIntegrity] = await Promise.all([
    dbService.healthCheck(),
    dbService.checkDataIntegrity()
  ]);
  
  res.json({
    database: dbHealth,
    dataIntegrity: dbIntegrity,
    errorHandling: healthCheck.checkErrorHandling(),
    timestamp: new Date().toISOString()
  });
}));

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'ECOncrete Project Insights API',
    version: '2.1.0',
    description: 'Marine infrastructure project management API with enhanced data integrity and error handling',
    baseUrl: `${req.protocol}://${req.get('host')}/api`,
    features: [
      'Database connection pooling',
      'Comprehensive error handling',
      'Structured logging',
      'Automatic backups',
      'Data integrity checks',
      'Transaction support',
      'Activity auditing'
    ],
    endpoints: {
      authentication: {
        'POST /api/auth/register': 'Register new user',
        'POST /api/auth/login': 'User login',
        'POST /api/auth/logout': 'User logout',
        'GET /api/auth/profile': 'Get user profile',
        'PUT /api/auth/profile': 'Update user profile'
      },
      projects: {
        'GET /api/projects': 'Get projects with pagination and filtering',
        'GET /api/projects/by-status/:status': 'Get projects by status (active/archived)',
        'GET /api/projects/:id': 'Get single project with related data',
        'POST /api/projects': 'Create new project',
        'PUT /api/projects/:id': 'Update project',
        'DELETE /api/projects/:id': 'Delete project'
      },
      materials: {
        'GET /api/materials': 'Get all materials with pagination',
        'GET /api/materials/project/:projectId': 'Get materials for project',
        'GET /api/materials/:id': 'Get single material',
        'POST /api/materials': 'Create material entry',
        'PUT /api/materials/:id': 'Update material',
        'DELETE /api/materials/:id': 'Delete material'
      },
      ecological: {
        'GET /api/ecological': 'Get ecological data',
        'GET /api/ecological/project/:projectId': 'Get ecological data for project',
        'POST /api/ecological': 'Create ecological entry',
        'PUT /api/ecological/:id': 'Update ecological data',
        'DELETE /api/ecological/:id': 'Delete ecological data'
      },
      compliance: {
        'GET /api/compliance': 'Get compliance data',
        'GET /api/compliance/project/:projectId': 'Get compliance for project',
        'POST /api/compliance': 'Create compliance entry',
        'PUT /api/compliance/:id': 'Update compliance',
        'DELETE /api/compliance/:id': 'Delete compliance'
      },
      admin: {
        'POST /api/admin/backup': 'Create manual database backup',
        'GET /api/admin/integrity': 'Run data integrity check',
        'GET /api/admin/stats': 'Get system statistics'
      }
    },
    authentication: 'JWT Bearer token required for protected endpoints',
    rateLimit: 'Applied per endpoint as configured',
    errorHandling: 'Comprehensive error tracking with structured logging',
    support: 'Check logs directory for detailed error information'
  });
});

// Mount API routes
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/ecological', ecologicalRouter);
app.use('/api/compliance', complianceRouter);

// Admin endpoints
app.post('/api/admin/backup', asyncHandler(async (req, res) => {
  // TODO: Add authentication check here
  try {
    const backupPath = await dbService.createBackup('manual');
    
    res.json({
      success: true,
      message: 'Backup created successfully',
      backupPath,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw new DatabaseError('Failed to create backup', error);
  }
}));

app.get('/api/admin/integrity', asyncHandler(async (req, res) => {
  // TODO: Add authentication check here
  try {
    const integrityCheck = await dbService.checkDataIntegrity();
    
    res.json({
      success: true,
      data: integrityCheck
    });
  } catch (error) {
    throw new DatabaseError('Failed to run integrity check', error);
  }
}));

app.get('/api/admin/stats', asyncHandler(async (req, res) => {
  // TODO: Add authentication check here
  try {
    const stats = dbService.pool.getStats();
    
    res.json({
      success: true,
      data: {
        connectionPool: stats,
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    throw new DatabaseError('Failed to get system stats', error);
  }
}));

// Handle 404 for all other routes
app.use('*', notFoundHandler);

// Global error handler (must be last)
app.use(globalErrorHandler);

// Enhanced server startup
const startServer = asyncHandler(async () => {
  try {
    console.log('🚀 Starting ECOncrete Project Insights Server...');
    
    // Initialize database service
    console.log('📊 Initializing database...');
    await dbService.initialize();
    console.log('✅ Database initialization completed');
    
    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`
🌊 ECOncrete Server running on port ${PORT}
📚 API Documentation: http://localhost:${PORT}/api/docs
🏥 Health Check: http://localhost:${PORT}/health
🔧 Environment: ${process.env.NODE_ENV || 'development'}

📋 Enhanced Features Active:
   ✅ Database Connection Pooling
   ✅ Comprehensive Error Handling
   ✅ Structured Logging System
   ✅ Automatic Backup System
   ✅ Data Integrity Monitoring
   ✅ Transaction Support
   ✅ Activity Auditing
   ✅ Graceful Shutdown
      `);
    });

    // Store server reference for graceful shutdown
    global.server = server;
    
    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        errorLogger.log(error, null, 'error');
        throw error;
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    errorLogger.log(error, null, 'error');
    process.exit(1);
  }
});

// Start the server
startServer();

module.exports = app;