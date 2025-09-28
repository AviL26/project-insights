-- Fixed migration for SQLite compatibility
-- Add wizard fields to projects table

PRAGMA foreign_keys = ON;

-- Add missing wizard fields (SQLite will ignore if column already exists)
ALTER TABLE projects ADD COLUMN length REAL;
ALTER TABLE projects ADD COLUMN width REAL;
ALTER TABLE projects ADD COLUMN height REAL;
ALTER TABLE projects ADD COLUMN depth REAL;
ALTER TABLE projects ADD COLUMN latitude REAL;
ALTER TABLE projects ADD COLUMN longitude REAL;
ALTER TABLE projects ADD COLUMN water_depth REAL;
ALTER TABLE projects ADD COLUMN salinity REAL;
ALTER TABLE projects ADD COLUMN temperature REAL;
ALTER TABLE projects ADD COLUMN wave_height REAL;
ALTER TABLE projects ADD COLUMN ph_level REAL;
ALTER TABLE projects ADD COLUMN primary_goals TEXT;
ALTER TABLE projects ADD COLUMN target_species TEXT;
ALTER TABLE projects ADD COLUMN habitat_types TEXT;

-- Update existing projects with default values
UPDATE projects SET status = 'planning' WHERE status IS NULL OR status = '';

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_projects_budget ON projects(budget);

-- Note: The coordinate index will be created after we verify the columns exist
SELECT 'Wizard compatibility fields migration completed!' as result;
