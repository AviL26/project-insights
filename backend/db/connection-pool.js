// backend/db/connection-pool.js - Database Connection Pooling
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');
const path = require('path');

class DatabaseConnectionPool {
  constructor(options = {}) {
    this.dbPath = options.dbPath || path.join(__dirname, 'econcretedb.sqlite');
    this.maxConnections = options.maxConnections || 10;
    this.minConnections = options.minConnections || 2;
    this.acquireTimeout = options.acquireTimeout || 30000; // 30 seconds
    this.idleTimeout = options.idleTimeout || 300000; // 5 minutes
    
    this.pool = [];
    this.activeConnections = 0;
    this.pendingAcquires = [];
    this.connectionId = 0;
    
    // Initialize minimum connections
    this.initialize();
  }

  async initialize() {
    console.log('Initializing database connection pool...');
    
    for (let i = 0; i < this.minConnections; i++) {
      try {
        const connection = await this.createConnection();
        this.pool.push(connection);
        console.log(`Created initial connection ${i + 1}/${this.minConnections}`);
      } catch (error) {
        console.error('Failed to create initial connection:', error);
        throw error;
      }
    }
    
    console.log(`Database pool initialized with ${this.pool.length} connections`);
  }

  async createConnection() {
    return new Promise((resolve, reject) => {
      const connectionId = ++this.connectionId;
      const db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error(`Failed to create connection ${connectionId}:`, err);
          reject(err);
          return;
        }
        
        // Configure connection
        db.configure('busyTimeout', 30000);
        db.run('PRAGMA journal_mode = WAL');
        db.run('PRAGMA synchronous = NORMAL');
        db.run('PRAGMA cache_size = 1000');
        db.run('PRAGMA temp_store = memory');
        
        // Add connection metadata
        db.connectionId = connectionId;
        db.createdAt = new Date();
        db.lastUsed = new Date();
        db.inUse = false;
        
        // Promisify methods
        db.getAsync = promisify(db.get.bind(db));
        db.allAsync = promisify(db.all.bind(db));
        db.runAsync = promisify(db.run.bind(db));
        db.closeAsync = promisify(db.close.bind(db));
        
        console.log(`Created database connection ${connectionId}`);
        resolve(db);
      });
    });
  }

  async acquire() {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Connection acquire timeout'));
      }, this.acquireTimeout);

      try {
        // Check for available connection in pool
        let connection = this.pool.find(conn => !conn.inUse);
        
        if (connection) {
          connection.inUse = true;
          connection.lastUsed = new Date();
          this.activeConnections++;
          clearTimeout(timeoutId);
          resolve(connection);
          return;
        }

        // Create new connection if under max limit
        if (this.pool.length < this.maxConnections) {
          connection = await this.createConnection();
          connection.inUse = true;
          this.pool.push(connection);
          this.activeConnections++;
          clearTimeout(timeoutId);
          resolve(connection);
          return;
        }

        // Wait for available connection
        this.pendingAcquires.push({ resolve, reject, timeoutId });
        
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  release(connection) {
    if (!connection || !connection.inUse) {
      console.warn('Attempted to release connection that is not in use');
      return;
    }

    connection.inUse = false;
    connection.lastUsed = new Date();
    this.activeConnections--;

    // Fulfill pending acquire if any
    if (this.pendingAcquires.length > 0) {
      const pending = this.pendingAcquires.shift();
      clearTimeout(pending.timeoutId);
      connection.inUse = true;
      this.activeConnections++;
      pending.resolve(connection);
      return;
    }

    console.log(`Released connection ${connection.connectionId}`);
  }

  async execute(query, params = [], method = 'all') {
    const connection = await this.acquire();
    
    try {
      let result;
      switch (method) {
        case 'get':
          result = await connection.getAsync(query, params);
          break;
        case 'run':
          result = await connection.runAsync(query, params);
          break;
        case 'all':
        default:
          result = await connection.allAsync(query, params);
          break;
      }
      
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    } finally {
      this.release(connection);
    }
  }

  async transaction(callback) {
    const connection = await this.acquire();
    
    try {
      await connection.runAsync('BEGIN TRANSACTION');
      
      const transactionMethods = {
        get: (query, params) => connection.getAsync(query, params),
        all: (query, params) => connection.allAsync(query, params),
        run: (query, params) => connection.runAsync(query, params)
      };
      
      const result = await callback(transactionMethods);
      await connection.runAsync('COMMIT');
      
      return result;
    } catch (error) {
      await connection.runAsync('ROLLBACK');
      console.error('Transaction failed:', error);
      throw error;
    } finally {
      this.release(connection);
    }
  }

  getStats() {
    const now = new Date();
    const connections = this.pool.map(conn => ({
      id: conn.connectionId,
      inUse: conn.inUse,
      createdAt: conn.createdAt,
      lastUsed: conn.lastUsed,
      idleTime: now - conn.lastUsed
    }));

    return {
      totalConnections: this.pool.length,
      activeConnections: this.activeConnections,
      idleConnections: this.pool.length - this.activeConnections,
      pendingAcquires: this.pendingAcquires.length,
      maxConnections: this.maxConnections,
      connections
    };
  }

  async cleanup() {
    const now = new Date();
    const connectionsToRemove = [];

    // Find idle connections that have exceeded idle timeout
    for (const connection of this.pool) {
      if (!connection.inUse && (now - connection.lastUsed) > this.idleTimeout) {
        if (this.pool.length > this.minConnections) {
          connectionsToRemove.push(connection);
        }
      }
    }

    // Close and remove idle connections
    for (const connection of connectionsToRemove) {
      try {
        await connection.closeAsync();
        const index = this.pool.indexOf(connection);
        this.pool.splice(index, 1);
        console.log(`Closed idle connection ${connection.connectionId}`);
      } catch (error) {
        console.error(`Error closing connection ${connection.connectionId}:`, error);
      }
    }

    return connectionsToRemove.length;
  }

  async close() {
    console.log('Closing database connection pool...');
    
    // Wait for active connections to finish
    while (this.activeConnections > 0) {
      console.log(`Waiting for ${this.activeConnections} active connections to finish...`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Close all connections
    const closePromises = this.pool.map(async (connection) => {
      try {
        await connection.closeAsync();
        console.log(`Closed connection ${connection.connectionId}`);
      } catch (error) {
        console.error(`Error closing connection ${connection.connectionId}:`, error);
      }
    });

    await Promise.all(closePromises);
    this.pool = [];
    console.log('Database connection pool closed');
  }
}

// Create singleton instance
const pool = new DatabaseConnectionPool({
  dbPath: process.env.SQLITE_DB_PATH || path.join(__dirname, 'econcretedb.sqlite'),
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS) || 10,
  minConnections: parseInt(process.env.DB_MIN_CONNECTIONS) || 2,
  acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 30000,
  idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT) || 300000
});

// Cleanup idle connections every 5 minutes
setInterval(() => {
  pool.cleanup().catch(console.error);
}, 5 * 60 * 1000);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing database pool...');
  await pool.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, closing database pool...');
  await pool.close();
  process.exit(0);
});

module.exports = pool;