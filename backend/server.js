const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

// Import our modules
const { initializeDatabase, db } = require('./db/database');

// Import routes
const projectsRouter = require('./routes/projects');
// Add other routes as needed
// const materialsRouter = require('./routes/materials');
// const ecologicalRouter = require('./routes/ecological');
// const complianceRouter = require('./routes/compliance');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "http://localhost:3001"]
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  }
});

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ];
    
    // Add production origins from environment
    if (process.env.ALLOWED_ORIGINS) {
      allowedOrigins.push(...process.env.ALLOWED_ORIGINS.split(','));
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024 // Only compress responses larger than 1KB
}));

// Logging middleware
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Body parsing middleware with limits
app.use(express.json({
  limit: '10mb'
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Security headers and request metadata
app.use((req, res, next) => {
  // Add request ID for tracking
  req.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  // Add security headers
  res.setHeader('X-Request-ID', req.id);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Remove powered by header
  res.removeHeader('X-Powered-By');
  
  next();
});

// Health check endpoints
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await db.get('SELECT 1 as test');
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: '2.0.0',
      database: 'connected',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
      }
    };
    
    res.json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Apply rate limiting
app.use(limiter);

// API routes
app.use('/api/projects', projectsRouter);
// Add other routes when ready
// app.use('/api/materials', materialsRouter);
// app.use('/api/ecological', ecologicalRouter);
// app.use('/api/compliance', complianceRouter);

// Stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await Promise.all([
      db.get('SELECT COUNT(*) as count FROM projects'),
      db.get('SELECT COUNT(*) as count FROM materials'),
      db.get('SELECT COUNT(*) as count FROM ecological_data'),
      db.get('SELECT COUNT(*) as count FROM compliance_data'),
      db.get('SELECT AVG(budget) as avg_budget FROM projects WHERE budget IS NOT NULL')
    ]);
    
    res.json({
      success: true,
      data: {
        projects: stats[0]?.count || 0,
        materials: stats[1]?.count || 0,
        ecologicalRecords: stats[2]?.count || 0,
        complianceRecords: stats[3]?.count || 0,
        averageBudget: Math.round(stats[4]?.avg_budget || 0)
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    message: 'ECOncrete Project Insights API',
    version: '2.0.0',
    documentation: 'https://github.com/your-username/project-insights',
    endpoints: {
      projects: '/api/projects',
      health: '/api/health',
      stats: '/api/stats'
    },
    features: [
      'Pagination',
      'Filtering',
      'Sorting',
      'Data validation',
      'Error handling',
      'Rate limiting',
      'Security headers'
    ]
  });
});

// Serve static files from React build (in production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    code: 'NOT_FOUND'
  });
});

// Global error handler (must be last)
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Handle different types of errors
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  
  // Handle specific database errors
  if (error.code && error.code.startsWith('SQLITE_')) {
    statusCode = 400;
    message = 'Database operation failed';
  }
  
  // Handle JSON parsing errors
  if (error.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON format';
  }
  
  res.status(statusCode).json({
    success: false,
    message,
    code: error.code,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack
    })
  });
});

// Database initialization and server startup
const startServer = async () => {
  try {
    console.log('🚀 Starting ECOncrete Project Insights Server...');
    
    // Initialize database
    console.log('📊 Initializing database...');
    await initializeDatabase();
    console.log('✅ Database initialization completed');
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🌊 ECOncrete Server running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('HTTP server closed');
        console.log('Graceful shutdown completed');
        process.exit(0);
      });
      
      // Force close after 30 seconds
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;