const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use your existing projects.db file
const DB_PATH = path.join(__dirname, 'projects.db');

// Initialize SQLite connection
let sqlite = null;
let postgresql = null;
let isInitialized = false;

// Helper to promisify database operations
const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    sqlite.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    sqlite.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ changes: this.changes, lastInsertRowid: this.lastID });
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    sqlite.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Initialize SQLite connection
const initializeSQLite = () => {
  return new Promise((resolve, reject) => {
    sqlite = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ SQLite connection failed:', err);
        reject(err);
      } else {
        console.log(`✅ SQLite connected: ${DB_PATH}`);
        // Enable foreign keys
        sqlite.run('PRAGMA foreign_keys = ON', (err) => {
          if (err) console.warn('Warning: Could not enable foreign keys:', err);
        });
        isInitialized = true;
        resolve(sqlite);
      }
    });
  });
};

// Test database connections
const testConnections = async () => {
  const results = {
    sqlite: false,
    postgresql: false
  };

  if (sqlite && isInitialized) {
    try {
      await dbGet('SELECT 1 as test');
      results.sqlite = true;
    } catch (error) {
      console.error('SQLite test failed:', error);
    }
  }

  return results;
};

// Get the active database type
const dbType = 'sqlite';

// Get database instance with helper methods (compatible with better-sqlite3 API)
const getDatabase = () => {
  if (sqlite && isInitialized) {
    return {
      prepare: (sql) => ({
        get: async (...params) => {
          const flatParams = params.flat();
          return await dbGet(sql, flatParams);
        },
        run: async (...params) => {
          const flatParams = params.flat();
          return await dbRun(sql, flatParams);
        },
        all: async (...params) => {
          const flatParams = params.flat();
          return await dbAll(sql, flatParams);
        }
      }),
      exec: async (sql) => {
        return new Promise((resolve, reject) => {
          sqlite.exec(sql, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
    };
  }
  throw new Error('No database connection available');
};

// Initialize the database connection immediately
initializeSQLite().catch(console.error);

module.exports = {
  sqlite,
  postgresql,
  dbType,
  getDatabase,
  testConnections
};
