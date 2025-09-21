// db/enhanced-connection.js - Complete Enhanced Database Connection
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseManager {
  constructor() {
    this.sqlite = null;
    this.connectionPool = new Map();
    this.maxConnections = 10;
    this.currentConnections = 0;
    this.queryQueue = [];
    this.retryAttempts = 3;
    this.retryDelay = 1000;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    const DB_PATH = path.join(__dirname, 'projects.db');
    
    try {
      // Create connection pool
      for (let i = 0; i < this.maxConnections; i++) {
        const connection = await this.createConnection(DB_PATH);
        this.connectionPool.set(`sqlite_${i}`, {
          connection,
          inUse: false,
          lastUsed: Date.now()
        });
      }

      this.isInitialized = true;
      console.log(`✅ Database pool initialized with ${this.maxConnections} connections`);
      
      // Start cleanup interval
      this.startConnectionCleanup();
      
    } catch (error) {
      console.error('❌ Database pool initialization failed:', error);
      throw error;
    }
  }

  createConnection(dbPath) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          // Configure for performance and integrity
          db.configure('busyTimeout', 30000);
          db.run('PRAGMA foreign_keys = ON');
          db.run('PRAGMA journal_mode = WAL');
          db.run('PRAGMA synchronous = NORMAL');
          db.run('PRAGMA cache_size = 10000');
          db.run('PRAGMA temp_store = MEMORY');
          resolve(db);
        }
      });
    });
  }

  async getConnection() {
    await this.initialize();
    
    // Find available connection
    for (const [key, pool] of this.connectionPool) {
      if (!pool.inUse) {
        pool.inUse = true;
        pool.lastUsed = Date.now();
        this.currentConnections++;
        return { connection: pool.connection, key };
      }
    }

    // Wait for connection if none available
    return new Promise((resolve) => {
      this.queryQueue.push(resolve);
      this.processQueue();
    });
  }

  releaseConnection(key) {
    const pool = this.connectionPool.get(key);
    if (pool) {
      pool.inUse = false;
      pool.lastUsed = Date.now();
      this.currentConnections--;
      this.processQueue();
    }
  }

  processQueue() {
    if (this.queryQueue.length > 0) {
      setTimeout(async () => {
        const waitingQuery = this.queryQueue.shift();
        if (waitingQuery) {
          const connection = await this.getConnection();
          waitingQuery(connection);
        }
      }, 10);
    }
  }

  startConnectionCleanup() {
    setInterval(() => {
      const now = Date.now();
      const maxIdleTime = 300000; // 5 minutes

      for (const [key, pool] of this.connectionPool) {
        if (!pool.inUse && (now - pool.lastUsed) > maxIdleTime) {
          // Refresh stale connections
          pool.connection.close();
          this.createConnection(path.join(__dirname, 'projects.db'))
            .then(newConnection => {
              pool.connection = newConnection;
              pool.lastUsed = now;
            })
            .catch(console.error);
        }
      }
    }, 60000); // Check every minute
  }

  // Enhanced query with retries
  async query(sql, params = [], options = {}) {
    const { retries = this.retryAttempts, timeout = 30000 } = options;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await this.executeQuery(sql, params, timeout);
      } catch (error) {
        console.error(`Query attempt ${attempt} failed:`, error.message);
        
        if (attempt === retries) {
          throw new Error(`Query failed after ${retries} attempts: ${error.message}`);
        }
        
        // Wait before retry with exponential backoff
        await this.delay(this.retryDelay * Math.pow(2, attempt - 1));
      }
    }
  }

  async executeQuery(sql, params, timeout) {
    const { connection, key } = await this.getConnection();
    
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Query timeout'));
      }, timeout);

      const isSelect = sql.trim().toLowerCase().startsWith('select');
      const method = isSelect ? 'all' : 'run';

      connection[method](sql, params, function(err, result) {
        clearTimeout(timer);
        
        if (err) {
          reject(err);
        } else {
          if (isSelect) {
            resolve(result);
          } else {
            resolve({
              changes: this.changes,
              lastInsertRowid: this.lastID
            });
          }
        }
      });
    }).finally(() => {
      this.releaseConnection(key);
    });
  }

  // Transaction support with automatic rollback
  async transaction(queries) {
    const { connection, key } = await this.getConnection();
    
    return new Promise((resolve, reject) => {
      connection.serialize(() => {
        connection.run('BEGIN TRANSACTION');
        
        const results = [];
        let hasError = false;

        const executeNext = (index) => {
          if (index >= queries.length) {
            if (hasError) {
              connection.run('ROLLBACK', () => {
                reject(new Error('Transaction rolled back due to errors'));
              });
            } else {
              connection.run('COMMIT', (err) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(results);
                }
              });
            }
            return;
          }

          const { sql, params = [] } = queries[index];
          connection.run(sql, params, function(err) {
            if (err) {
              hasError = true;
              console.error('Transaction query failed:', err);
            } else {
              results.push({
                changes: this.changes,
                lastInsertRowid: this.lastID
              });
            }
            executeNext(index + 1);
          });
        };

        executeNext(0);
      });
    }).finally(() => {
      this.releaseConnection(key);
    });
  }

  // Health check with detailed diagnostics
  async healthCheck() {
    try {
      const start = Date.now();
      await this.query('SELECT 1 as health_check');
      const responseTime = Date.now() - start;

      const poolStatus = {
        totalConnections: this.connectionPool.size,
        activeConnections: this.currentConnections,
        queueLength: this.queryQueue.length,
        responseTime,
        isHealthy: responseTime < 1000
      };

      return {
        status: poolStatus.isHealthy ? 'healthy' : 'degraded',
        ...poolStatus
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        totalConnections: this.connectionPool.size,
        activeConnections: this.currentConnections
      };
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    for (const [key, pool] of this.connectionPool) {
      pool.connection.close();
    }
    this.connectionPool.clear();
    this.isInitialized = false;
  }
}

// Enhanced error handling middleware
class ErrorHandler {
  static handleDatabaseError(error, req, res, next) {
    console.error('Database error:', {
      error: error.message,
      stack: error.stack,
      query: req.body,
      params: req.params,
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Categorize errors
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        success: false,
        message: 'Record already exists',
        code: 'DUPLICATE_ENTRY',
        field: ErrorHandler.extractFieldFromConstraintError(error.message)
      });
    }

    if (error.message.includes('FOREIGN KEY constraint failed')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reference to related record',
        code: 'FOREIGN_KEY_VIOLATION'
      });
    }

    if (error.message.includes('NOT NULL constraint failed')) {
      return res.status(400).json({
        success: false,
        message: 'Required field is missing',
        code: 'REQUIRED_FIELD_MISSING',
        field: ErrorHandler.extractFieldFromConstraintError(error.message)
      });
    }

    if (error.message.includes('Query timeout')) {
      return res.status(408).json({
        success: false,
        message: 'Database operation timed out',
        code: 'QUERY_TIMEOUT'
      });
    }

    // Generic database error
    res.status(500).json({
      success: false,
      message: 'Database operation failed',
      code: 'DATABASE_ERROR',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }

  static extractFieldFromConstraintError(message) {
    const match = message.match(/(\w+\.\w+)/);
    return match ? match[1].split('.')[1] : null;
  }

  static handleAsyncErrors(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  static createValidationError(field, message) {
    const error = new Error(`Validation failed for ${field}: ${message}`);
    error.type = 'VALIDATION_ERROR';
    error.field = field;
    return error;
  }
}

// Data validation utilities
class DataValidator {
  static validateProject(data) {
    const errors = [];

    if (!data.name || data.name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Project name must be at least 2 characters' });
    }

    if (data.name && data.name.length > 100) {
      errors.push({ field: 'name', message: 'Project name must be less than 100 characters' });
    }

    if (data.latitude !== undefined && (data.latitude < -90 || data.latitude > 90)) {
      errors.push({ field: 'latitude', message: 'Latitude must be between -90 and 90' });
    }

    if (data.longitude !== undefined && (data.longitude < -180 || data.longitude > 180)) {
      errors.push({ field: 'longitude', message: 'Longitude must be between -180 and 180' });
    }

    if (data.budget !== undefined && data.budget < 0) {
      errors.push({ field: 'budget', message: 'Budget must be non-negative' });
    }

    if (data.start_date && data.end_date) {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      if (start >= end) {
        errors.push({ field: 'end_date', message: 'End date must be after start date' });
      }
    }

    // Validate enum fields
    const validStatuses = ['planning', 'design', 'permitting', 'construction', 'monitoring', 'completed', 'archived'];
    if (data.status && !validStatuses.includes(data.status)) {
      errors.push({ field: 'status', message: 'Invalid project status' });
    }

    const validTypes = ['Breakwater', 'Seawall', 'Pier', 'Jetty', 'Artificial Reef', 'Coastal Protection', 'Marine Infrastructure'];
    if (data.type && !validTypes.includes(data.type)) {
      errors.push({ field: 'type', message: 'Invalid project type' });
    }

    return errors;
  }

  static sanitizeProjectData(data) {
    const sanitized = {};
    
    // String fields
    ['name', 'description', 'type', 'status'].forEach(field => {
      if (data[field] !== undefined) {
        sanitized[field] = String(data[field]).trim().substring(0, field === 'description' ? 1000 : 100);
      }
    });

    // Numeric fields
    ['latitude', 'longitude', 'budget'].forEach(field => {
      if (data[field] !== undefined) {
        const num = parseFloat(data[field]);
        sanitized[field] = isNaN(num) ? null : num;
      }
    });

    // Date fields
    ['start_date', 'end_date'].forEach(field => {
      if (data[field] !== undefined) {
        const date = new Date(data[field]);
        sanitized[field] = isNaN(date.getTime()) ? null : date.toISOString();
      }
    });

    return sanitized;
  }
}

// Create singleton instance
const dbManager = new DatabaseManager();

module.exports = {
  DatabaseManager,
  ErrorHandler,
  DataValidator,
  dbManager
};