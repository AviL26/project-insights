const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabasePool {
  constructor(dbPath, options = {}) {
    this.dbPath = dbPath;
    this.maxConnections = options.maxConnections || 10;
    this.connections = [];
    this.activeConnections = new Set();
    this.waitingQueue = [];
    this.connectionTimeout = options.connectionTimeout || 30000; // 30 seconds
    
    // Initialize pool
    this.initializePool();
  }

  initializePool() {
    // Create initial connections
    for (let i = 0; i < Math.min(3, this.maxConnections); i++) {
      this.createConnection();
    }
  }

  createConnection() {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error creating database connection:', err.message);
          reject(err);
          return;
        }

        // Configure connection
        db.configure('busyTimeout', 10000);
        db.run('PRAGMA foreign_keys = ON');
        db.run('PRAGMA journal_mode = WAL');
        db.run('PRAGMA synchronous = NORMAL');
        db.run('PRAGMA cache_size = 10000');
        db.run('PRAGMA temp_store = memory');

        // Add connection metadata
        db._poolId = Date.now() + Math.random();
        db._createdAt = new Date();
        db._lastUsed = new Date();
        db._queryCount = 0;

        this.connections.push(db);
        console.log(`Database connection created. Pool size: ${this.connections.length}`);
        resolve(db);
      });
    });
  }

  async getConnection() {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout: Unable to get database connection'));
      }, this.connectionTimeout);

      try {
        // Try to get an available connection
        let connection = this.connections.find(conn => !this.activeConnections.has(conn));

        // If no connection available and under max limit, create new one
        if (!connection && this.connections.length < this.maxConnections) {
          connection = await this.createConnection();
        }

        // If still no connection, queue the request
        if (!connection) {
          this.waitingQueue.push({ resolve, reject, timeout });
          return;
        }

        clearTimeout(timeout);
        this.activeConnections.add(connection);
        connection._lastUsed = new Date();
        resolve(connection);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  releaseConnection(connection) {
    if (!connection) return;

    this.activeConnections.delete(connection);
    connection._lastUsed = new Date();

    // Process waiting queue
    if (this.waitingQueue.length > 0) {
      const { resolve, timeout } = this.waitingQueue.shift();
      clearTimeout(timeout);
      this.activeConnections.add(connection);
      resolve(connection);
    }
  }

  // Promisified database methods
  get(connection, sql, params = []) {
    return new Promise((resolve, reject) => {
      connection._queryCount++;
      connection.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(connection, sql, params = []) {
    return new Promise((resolve, reject) => {
      connection._queryCount++;
      connection.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  run(connection, sql, params = []) {
    return new Promise((resolve, reject) => {
      connection._queryCount++;
      connection.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  // Transaction support
  async beginTransaction(connection) {
    await this.run(connection, 'BEGIN TRANSACTION');
  }

  async commit(connection) {
    await this.run(connection, 'COMMIT');
  }

  async rollback(connection) {
    await this.run(connection, 'ROLLBACK');
  }

  // High-level transaction wrapper
  async transaction(callback) {
    const connection = await this.getConnection();
    
    try {
      await this.beginTransaction(connection);
      const result = await callback(connection);
      await this.commit(connection);
      return result;
    } catch (error) {
      await this.rollback(connection);
      throw error;
    } finally {
      this.releaseConnection(connection);
    }
  }

  // Pool maintenance
  async cleanupIdleConnections() {
    const now = new Date();
    const maxIdleTime = 30 * 60 * 1000; // 30 minutes

    const connectionsToClose = this.connections.filter(conn => {
      const isIdle = !this.activeConnections.has(conn);
      const idleTime = now - conn._lastUsed;
      return isIdle && idleTime > maxIdleTime && this.connections.length > 3;
    });

    for (const conn of connectionsToClose) {
      await this.closeConnection(conn);
    }
  }

  closeConnection(connection) {
    return new Promise((resolve) => {
      const index = this.connections.indexOf(connection);
      if (index > -1) {
        this.connections.splice(index, 1);
        this.activeConnections.delete(connection);
      }

      connection.close((err) => {
        if (err) {
          console.error('Error closing connection:', err.message);
        }
        console.log(`Connection closed. Pool size: ${this.connections.length}`);
        resolve();
      });
    });
  }

  getPoolStats() {
    return {
      totalConnections: this.connections.length,
      activeConnections: this.activeConnections.size,
      availableConnections: this.connections.length - this.activeConnections.size,
      waitingRequests: this.waitingQueue.length,
      maxConnections: this.maxConnections,
      connectionDetails: this.connections.map(conn => ({
        id: conn._poolId,
        createdAt: conn._createdAt,
        lastUsed: conn._lastUsed,
        queryCount: conn._queryCount,
        isActive: this.activeConnections.has(conn)
      }))
    };
  }

  async closeAll() {
    console.log('Closing all database connections...');
    
    // Clear waiting queue
    this.waitingQueue.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(new Error('Database pool is closing'));
    });
    this.waitingQueue = [];

    // Close all connections
    const closePromises = this.connections.map(conn => this.closeConnection(conn));
    await Promise.all(closePromises);
    
    this.connections = [];
    this.activeConnections.clear();
    console.log('All database connections closed');
  }
}

// Create pool instance
const dbPath = path.join(__dirname, 'econcretedb.sqlite');
const pool = new DatabasePool(dbPath, {
  maxConnections: 10,
  connectionTimeout: 30000
});

// Cleanup interval
setInterval(() => {
  pool.cleanupIdleConnections().catch(console.error);
}, 15 * 60 * 1000); // Every 15 minutes

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Initiating graceful database shutdown...');
  await pool.closeAll();
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = pool;