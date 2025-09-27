-- Create complete projects table in projects.db
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  type TEXT DEFAULT 'breakwater',
  status TEXT DEFAULT 'planned',
  budget REAL,
  start_date TEXT,
  end_date TEXT,
  client_name TEXT,
  project_manager TEXT,
  length REAL,
  width REAL,
  height REAL,
  depth REAL,
  latitude REAL,
  longitude REAL,
  water_depth REAL,
  salinity REAL,
  temperature REAL,
  wave_height REAL,
  ph_level REAL,
  primary_goals TEXT,
  target_species TEXT,
  habitat_types TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_projects_name ON projects(name);
CREATE INDEX idx_projects_type ON projects(type);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created ON projects(created_at);

-- Insert a test project
INSERT INTO projects (
  name, location, type, status, description, 
  budget, latitude, longitude, primary_goals, target_species
) VALUES (
  'Test Project',
  'Test Location',
  'breakwater',
  'planned',
  'Test project for wizard',
  50000.0,
  32.0853,
  34.7818,
  '["Coastal Protection"]',
  '["Fish Species"]'
);

SELECT 'Projects database setup complete!' as result;
SELECT COUNT(*) || ' projects in database' as count FROM projects;
