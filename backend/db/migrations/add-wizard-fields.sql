-- Add only the missing fields needed for wizard compatibility
PRAGMA foreign_keys = ON;

-- Check if projects table exists and add missing wizard fields
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget REAL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS end_date TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS length REAL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS width REAL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS height REAL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS depth REAL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS latitude REAL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS longitude REAL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS water_depth REAL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS salinity REAL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS temperature REAL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS wave_height REAL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ph_level REAL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS primary_goals TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS target_species TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS habitat_types TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Update existing projects with default values
UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
UPDATE projects SET status = 'planned' WHERE status IS NULL;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_projects_budget ON projects(budget);
CREATE INDEX IF NOT EXISTS idx_projects_coordinates ON projects(latitude, longitude);

SELECT 'Wizard compatibility fields added successfully!' as result;
