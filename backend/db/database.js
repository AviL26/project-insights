const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'econcretedb.sqlite');

// Create database connection with proper configuration
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    // Enable foreign key constraints
    db.run('PRAGMA foreign_keys = ON');
    // Enable WAL mode for better concurrent access
    db.run('PRAGMA journal_mode = WAL');
    // Optimize for performance
    db.run('PRAGMA synchronous = NORMAL');
    db.run('PRAGMA cache_size = 10000');
    db.run('PRAGMA temp_store = memory');
  }
});

// Promisify database methods
const promiseDb = {
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  },
  
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }
};

// Initialize database tables with proper constraints
const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Projects table (main entity)
      db.run(`CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL CHECK(length(name) > 0 AND length(name) <= 255),
        description TEXT,
        location TEXT NOT NULL CHECK(length(location) > 0),
        type TEXT NOT NULL CHECK(type IN ('breakwater', 'seawall', 'pier', 'jetty', 'artificial_reef', 'coastal_protection')),
        status TEXT DEFAULT 'planning' CHECK(status IN ('planning', 'design', 'permitting', 'construction', 'completed', 'on_hold', 'cancelled')),
        budget REAL CHECK(budget >= 0),
        start_date TEXT,
        end_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        -- Constraints
        CHECK(start_date IS NULL OR end_date IS NULL OR date(start_date) <= date(end_date))
      )`, (err) => {
        if (err) {
          console.error('Error creating projects table:', err);
          reject(err);
          return;
        }
      });

      // Materials table
      db.run(`CREATE TABLE IF NOT EXISTS materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        name TEXT NOT NULL CHECK(length(name) > 0),
        type TEXT NOT NULL,
        quantity REAL NOT NULL CHECK(quantity > 0),
        unit TEXT NOT NULL,
        supplier TEXT,
        cost_per_unit REAL CHECK(cost_per_unit >= 0),
        total_cost REAL CHECK(total_cost >= 0),
        status TEXT DEFAULT 'ordered' CHECK(status IN ('ordered', 'delivered', 'installed', 'cancelled')),
        delivery_date TEXT,
        specifications TEXT,
        eco_properties TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        -- Foreign key constraint
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE
      )`);

      // Ecological data table
      db.run(`CREATE TABLE IF NOT EXISTS ecological_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        measurement_date TEXT NOT NULL,
        parameter TEXT NOT NULL CHECK(length(parameter) > 0),
        value REAL NOT NULL,
        unit TEXT NOT NULL,
        location_detail TEXT,
        depth REAL,
        methodology TEXT,
        notes TEXT,
        data_quality TEXT DEFAULT 'good' CHECK(data_quality IN ('excellent', 'good', 'fair', 'poor')),
        measured_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        -- Foreign key constraint
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE
      )`);

      // Compliance data table
      db.run(`CREATE TABLE IF NOT EXISTS compliance_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        regulation_type TEXT NOT NULL,
        requirement_description TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('compliant', 'non_compliant', 'pending', 'not_applicable')),
        due_date TEXT,
        completion_date TEXT,
        responsible_party TEXT,
        documentation_path TEXT,
        notes TEXT,
        risk_level TEXT DEFAULT 'medium' CHECK(risk_level IN ('low', 'medium', 'high', 'critical')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        -- Foreign key constraint
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE
      )`);

      // Environmental monitoring table
      db.run(`CREATE TABLE IF NOT EXISTS environmental_monitoring (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        parameter TEXT NOT NULL,
        value REAL NOT NULL,
        unit TEXT NOT NULL,
        sensor_id TEXT,
        location_coordinates TEXT,
        depth REAL,
        quality_flag TEXT DEFAULT 'good' CHECK(quality_flag IN ('good', 'questionable', 'bad')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        -- Foreign key constraint
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE
      )`);

      // Reports table
      db.run(`CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        title TEXT NOT NULL CHECK(length(title) > 0),
        type TEXT NOT NULL CHECK(type IN ('progress', 'environmental', 'compliance', 'financial', 'technical', 'final')),
        content TEXT,
        file_path TEXT,
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'review', 'approved', 'published')),
        generated_by TEXT,
        file_size INTEGER,
        file_format TEXT,
        
        -- Foreign key constraint
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE
      )`, (err) => {
        if (err) {
          console.error('Error creating reports table:', err);
          reject(err);
          return;
        }
        console.log('Database tables created successfully');
        resolve();
      });
    });
  });
};

// Graceful database closure
const closeDatabase = () => {
  return new Promise((resolve) => {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
      resolve();
    });
  });
};

// Database utility functions
const getDbStats = () => {
  return new Promise((resolve, reject) => {
    const stats = {};
    
    db.serialize(() => {
      db.get("SELECT COUNT(*) as count FROM projects", (err, row) => {
        if (err) reject(err);
        stats.projects = row.count;
      });
      
      db.get("SELECT COUNT(*) as count FROM materials", (err, row) => {
        if (err) reject(err);
        stats.materials = row.count;
      });
      
      db.get("SELECT COUNT(*) as count FROM ecological_data", (err, row) => {
        if (err) reject(err);
        stats.ecological_records = row.count;
        resolve(stats);
      });
    });
  });
};

module.exports = {
  db: promiseDb,
  initializeDatabase,
  closeDatabase,
  getDbStats
};