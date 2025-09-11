const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'projects.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Projects table
  db.run(`CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    country TEXT,
    region TEXT,
    coordinates TEXT,
    water_depth REAL,
    wave_exposure TEXT,
    seabed_type TEXT,
    water_temperature TEXT,
    salinity REAL,
    structure_type TEXT,
    primary_function TEXT,
    length REAL,
    width REAL,
    height REAL,
    design_life INTEGER,
    regulatory_framework TEXT,
    environmental_assessment TEXT,
    permit_status TEXT,
    stakeholders TEXT,
    primary_goals TEXT,
    target_species TEXT,
    habitat_types TEXT,
    carbon_targets REAL,
    monitoring_plan TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Materials table
  db.run(`CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    name TEXT NOT NULL,
    category TEXT,
    quantity REAL,
    unit TEXT,
    cost REAL,
    availability TEXT,
    ecological_benefit TEXT,
    FOREIGN KEY (project_id) REFERENCES projects (id)
  )`);

  // Compliance frameworks table
  db.run(`CREATE TABLE IF NOT EXISTS compliance_frameworks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    name TEXT NOT NULL,
    status TEXT,
    last_review DATE,
    next_review DATE,
    requirements INTEGER,
    completed INTEGER,
    risk_level TEXT,
    FOREIGN KEY (project_id) REFERENCES projects (id)
  )`);

  // Ecological metrics table
  db.run(`CREATE TABLE IF NOT EXISTS ecological_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    metric_type TEXT,
    value REAL,
    unit TEXT,
    recorded_date DATE,
    FOREIGN KEY (project_id) REFERENCES projects (id)
  )`);

  console.log('Database initialized successfully');
});

module.exports = db;
