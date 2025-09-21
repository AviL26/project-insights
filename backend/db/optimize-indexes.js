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
      )`);

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
        eco_properties TEXT, -- JSON string for ecological properties
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
        location_coordinates TEXT, -- JSON string for lat/lon
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
      )`);

      // Project phases table for detailed project management
      db.run(`CREATE TABLE IF NOT EXISTS project_phases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        phase_name TEXT NOT NULL CHECK(length(phase_name) > 0),
        description TEXT,
        start_date TEXT,
        end_date TEXT,
        status TEXT DEFAULT 'planned' CHECK(status IN ('planned', 'active', 'completed', 'delayed', 'cancelled')),
        budget_allocated REAL CHECK(budget_allocated >= 0),
        budget_spent REAL DEFAULT 0 CHECK(budget_spent >= 0),
        completion_percentage INTEGER DEFAULT 0 CHECK(completion_percentage >= 0 AND completion_percentage <= 100),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        -- Foreign key constraint
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE,
        
        -- Phase date constraints
        CHECK(start_date IS NULL OR end_date IS NULL OR date(start_date) <= date(end_date)),
        CHECK(budget_spent <= budget_allocated OR budget_allocated IS NULL)
      )`);

      // Users table for authentication (to be implemented)
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL CHECK(length(username) >= 3),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'manager', 'user', 'viewer')),
        first_name TEXT,
        last_name TEXT,
        is_active BOOLEAN DEFAULT 1,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Project permissions table for user access control
      db.run(`CREATE TABLE IF NOT EXISTS project_permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        project_id INTEGER NOT NULL,
        permission_level TEXT DEFAULT 'read' CHECK(permission_level IN ('read', 'write', 'admin')),
        granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        granted_by INTEGER,
        
        -- Foreign key constraints
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
        
        -- Unique constraint to prevent duplicate permissions
        UNIQUE(user_id, project_id)
      )`);

      // Activity log table for audit trail
      db.run(`CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        project_id INTEGER,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id INTEGER,
        old_values TEXT, -- JSON string
        new_values TEXT, -- JSON string
        ip_address TEXT,
        user_agent TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        -- Foreign key constraints
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE
      )`);

      // Create triggers for updating timestamps
      db.run(`CREATE TRIGGER IF NOT EXISTS update_projects_timestamp 
        AFTER UPDATE ON projects
        BEGIN
          UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END`);

      db.run(`CREATE TRIGGER IF NOT EXISTS update_materials_timestamp 
        AFTER UPDATE ON materials
        BEGIN
          UPDATE materials SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END`);

      db.run(`CREATE TRIGGER IF NOT EXISTS update_compliance_timestamp 
        AFTER UPDATE ON compliance_data
        BEGIN
          UPDATE compliance_data SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END`);

      db.run(`CREATE TRIGGER IF NOT EXISTS update_phases_timestamp 
        AFTER UPDATE ON project_phases
        BEGIN
          UPDATE project_phases SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END`);

      db.run(`CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
        AFTER UPDATE ON users
        BEGIN
          UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END`);

      // Validation triggers
      db.run(`CREATE TRIGGER IF NOT EXISTS validate_project_dates
        BEFORE UPDATE ON projects
        BEGIN
          SELECT CASE
            WHEN NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL 
                 AND date(NEW.start_date) > date(NEW.end_date)
            THEN RAISE(ABORT, 'End date must be after start date')
          END;
        END`);

      console.log('Database tables created successfully');
      resolve();
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
  db,
  initializeDatabase,
  closeDatabase,
  getDbStats
};