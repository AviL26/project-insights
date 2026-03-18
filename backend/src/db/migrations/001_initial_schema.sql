-- Users
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK(role IN ('admin','user','viewer')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','active','completed','archived')),
  -- Location
  country TEXT,
  region TEXT DEFAULT '',
  latitude REAL,
  longitude REAL,
  -- Structure
  structure_type TEXT,
  wave_exposure TEXT CHECK(wave_exposure IN ('sheltered','moderate','exposed','very_exposed')),
  seabed_type TEXT CHECK(seabed_type IN ('rock','sand','mud','gravel','mixed')),
  depth_range TEXT DEFAULT '',
  -- Goals
  primary_goal TEXT,
  ecological_goals TEXT DEFAULT '[]',
  target_species TEXT DEFAULT '[]',
  -- Regulatory
  jurisdiction TEXT DEFAULT '',
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Lookup: materials catalog
CREATE TABLE IF NOT EXISTS materials_catalog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  eco_rating TEXT DEFAULT 'standard',
  description TEXT DEFAULT ''
);

-- Lookup: structure types
CREATE TABLE IF NOT EXISTS structure_types (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT DEFAULT ''
);

-- Lookup: jurisdictions
CREATE TABLE IF NOT EXISTS jurisdictions (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  agencies TEXT DEFAULT '[]'
);

-- Project materials (BOM)
CREATE TABLE IF NOT EXISTS project_materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  material_id INTEGER NOT NULL REFERENCES materials_catalog(id),
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  notes TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Compliance checks
CREATE TABLE IF NOT EXISTS compliance_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  rule_code TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','compliant','non_compliant','waived')),
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high','critical')),
  notes TEXT DEFAULT '',
  checked_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ecological records
CREATE TABLE IF NOT EXISTS ecological_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL,
  data TEXT NOT NULL DEFAULT '{}',
  recorded_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Triggers for updated_at
CREATE TRIGGER IF NOT EXISTS users_updated_at AFTER UPDATE ON users
BEGIN UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS projects_updated_at AFTER UPDATE ON projects
BEGIN UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;
