-- ECOncrete Database Schema - Complete Update for Frontend Wizard Compatibility
-- Run this file to update your existing database: sqlite3 your_database.db < complete-schema-update.sql
-- This adds all missing fields needed by the enhanced ProjectSetupWizard

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Add all missing columns to projects table for wizard compatibility
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget REAL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS end_date TEXT;

-- Add dimensional fields (required by wizard Step 2)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS length REAL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS width REAL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS height REAL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS depth REAL;

-- Add coordinate fields (required by wizard Step 3)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS latitude REAL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS longitude REAL;

-- Add environmental data fields (required by wizard Step 3)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS water_depth REAL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS salinity REAL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS temperature REAL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS wave_height REAL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ph_level REAL;

-- Add project goal and species tracking fields (required by wizard Step 4)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS primary_goals TEXT; -- JSON array
ALTER TABLE projects ADD COLUMN IF NOT EXISTS target_species TEXT; -- JSON array  
ALTER TABLE projects ADD COLUMN IF NOT EXISTS habitat_types TEXT; -- JSON array

-- Add timestamp fields if they don't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Create indexes for better performance on new fields
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_name);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON projects(project_manager);
CREATE INDEX IF NOT EXISTS idx_projects_budget ON projects(budget);
CREATE INDEX IF NOT EXISTS idx_projects_coordinates ON projects(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_projects_created ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_updated ON projects(updated_at);
CREATE INDEX IF NOT EXISTS idx_projects_jurisdiction ON projects(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_projects_dimensions ON projects(length, width, height);

-- Update existing projects to have default values where needed
UPDATE projects SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
UPDATE projects SET status = 'planned' WHERE status IS NULL;
UPDATE projects SET type = 'breakwater' WHERE type IS NULL;

-- Create triggers for auto-updating timestamps
CREATE TRIGGER IF NOT EXISTS update_projects_updated_at 
    AFTER UPDATE ON projects
    FOR EACH ROW 
    WHEN NEW.updated_at = OLD.updated_at  -- Only update if updated_at wasn't manually set
    BEGIN
        UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Create triggers for data validation on projects table
CREATE TRIGGER IF NOT EXISTS validate_projects_required_fields_insert
    BEFORE INSERT ON projects
    FOR EACH ROW
    BEGIN
        SELECT CASE
            WHEN NEW.name IS NULL OR trim(NEW.name) = ''
            THEN RAISE(ABORT, 'Project name is required')
            WHEN NEW.location IS NULL OR trim(NEW.location) = ''
            THEN RAISE(ABORT, 'Project location is required')
            WHEN NEW.type IS NULL OR trim(NEW.type) = ''
            THEN RAISE(ABORT, 'Project type is required')
        END;
    END;

CREATE TRIGGER IF NOT EXISTS validate_projects_required_fields_update
    BEFORE UPDATE ON projects
    FOR EACH ROW
    BEGIN
        SELECT CASE
            WHEN NEW.name IS NULL OR trim(NEW.name) = ''
            THEN RAISE(ABORT, 'Project name is required')
            WHEN NEW.location IS NULL OR trim(NEW.location) = ''
            THEN RAISE(ABORT, 'Project location is required')
            WHEN NEW.type IS NULL OR trim(NEW.type) = ''
            THEN RAISE(ABORT, 'Project type is required')
        END;
    END;

-- Validate project type is one of the allowed values
CREATE TRIGGER IF NOT EXISTS validate_projects_type_insert
    BEFORE INSERT ON projects
    FOR EACH ROW
    BEGIN
        SELECT CASE
            WHEN NEW.type NOT IN ('breakwater', 'seawall', 'pier', 'jetty', 'artificial_reef', 'coastal_protection')
            THEN RAISE(ABORT, 'Project type must be one of: breakwater, seawall, pier, jetty, artificial_reef, coastal_protection')
        END;
    END;

CREATE TRIGGER IF NOT EXISTS validate_projects_type_update
    BEFORE UPDATE ON projects
    FOR EACH ROW
    BEGIN
        SELECT CASE
            WHEN NEW.type NOT IN ('breakwater', 'seawall', 'pier', 'jetty', 'artificial_reef', 'coastal_protection')
            THEN RAISE(ABORT, 'Project type must be one of: breakwater, seawall, pier, jetty, artificial_reef, coastal_protection')
        END;
    END;

-- Validate coordinate ranges
CREATE TRIGGER IF NOT EXISTS validate_projects_coordinates_insert
    BEFORE INSERT ON projects
    FOR EACH ROW
    BEGIN
        SELECT CASE
            WHEN NEW.latitude IS NOT NULL AND (NEW.latitude < -90 OR NEW.latitude > 90)
            THEN RAISE(ABORT, 'Latitude must be between -90 and 90 degrees')
            WHEN NEW.longitude IS NOT NULL AND (NEW.longitude < -180 OR NEW.longitude > 180)
            THEN RAISE(ABORT, 'Longitude must be between -180 and 180 degrees')
        END;
    END;

CREATE TRIGGER IF NOT EXISTS validate_projects_coordinates_update
    BEFORE UPDATE ON projects
    FOR EACH ROW
    BEGIN
        SELECT CASE
            WHEN NEW.latitude IS NOT NULL AND (NEW.latitude < -90 OR NEW.latitude > 90)
            THEN RAISE(ABORT, 'Latitude must be between -90 and 90 degrees')
            WHEN NEW.longitude IS NOT NULL AND (NEW.longitude < -180 OR NEW.longitude > 180)
            THEN RAISE(ABORT, 'Longitude must be between -180 and 180 degrees')
        END;
    END;

-- Validate numeric fields are positive where appropriate
CREATE TRIGGER IF NOT EXISTS validate_projects_numeric_fields_insert
    BEFORE INSERT ON projects
    FOR EACH ROW
    BEGIN
        SELECT CASE
            WHEN NEW.budget IS NOT NULL AND NEW.budget < 0
            THEN RAISE(ABORT, 'Budget must be positive')
            WHEN NEW.length IS NOT NULL AND NEW.length < 0
            THEN RAISE(ABORT, 'Length must be positive')
            WHEN NEW.width IS NOT NULL AND NEW.width < 0
            THEN RAISE(ABORT, 'Width must be positive')
            WHEN NEW.height IS NOT NULL AND NEW.height < 0
            THEN RAISE(ABORT, 'Height must be positive')
            WHEN NEW.depth IS NOT NULL AND NEW.depth < 0
            THEN RAISE(ABORT, 'Depth must be positive')
            WHEN NEW.water_depth IS NOT NULL AND NEW.water_depth < 0
            THEN RAISE(ABORT, 'Water depth must be positive')
            WHEN NEW.salinity IS NOT NULL AND (NEW.salinity < 0 OR NEW.salinity > 50)
            THEN RAISE(ABORT, 'Salinity must be between 0 and 50 ppt')
            WHEN NEW.temperature IS NOT NULL AND (NEW.temperature < -5 OR NEW.temperature > 50)
            THEN RAISE(ABORT, 'Temperature must be between -5 and 50 degrees Celsius')
            WHEN NEW.wave_height IS NOT NULL AND (NEW.wave_height < 0 OR NEW.wave_height > 30)
            THEN RAISE(ABORT, 'Wave height must be between 0 and 30 meters')
            WHEN NEW.ph_level IS NOT NULL AND (NEW.ph_level < 0 OR NEW.ph_level > 14)
            THEN RAISE(ABORT, 'pH level must be between 0 and 14')
        END;
    END;

CREATE TRIGGER IF NOT EXISTS validate_projects_numeric_fields_update
    BEFORE UPDATE ON projects
    FOR EACH ROW
    BEGIN
        SELECT CASE
            WHEN NEW.budget IS NOT NULL AND NEW.budget < 0
            THEN RAISE(ABORT, 'Budget must be positive')
            WHEN NEW.length IS NOT NULL AND NEW.length < 0
            THEN RAISE(ABORT, 'Length must be positive')
            WHEN NEW.width IS NOT NULL AND NEW.width < 0
            THEN RAISE(ABORT, 'Width must be positive')
            WHEN NEW.height IS NOT NULL AND NEW.height < 0
            THEN RAISE(ABORT, 'Height must be positive')
            WHEN NEW.depth IS NOT NULL AND NEW.depth < 0
            THEN RAISE(ABORT, 'Depth must be positive')
            WHEN NEW.water_depth IS NOT NULL AND NEW.water_depth < 0
            THEN RAISE(ABORT, 'Water depth must be positive')
            WHEN NEW.salinity IS NOT NULL AND (NEW.salinity < 0 OR NEW.salinity > 50)
            THEN RAISE(ABORT, 'Salinity must be between 0 and 50 ppt')
            WHEN NEW.temperature IS NOT NULL AND (NEW.temperature < -5 OR NEW.temperature > 50)
            THEN RAISE(ABORT, 'Temperature must be between -5 and 50 degrees Celsius')
            WHEN NEW.wave_height IS NOT NULL AND (NEW.wave_height < 0 OR NEW.wave_height > 30)
            THEN RAISE(ABORT, 'Wave height must be between 0 and 30 meters')
            WHEN NEW.ph_level IS NOT NULL AND (NEW.ph_level < 0 OR NEW.ph_level > 14)
            THEN RAISE(ABORT, 'pH level must be between 0 and 14')
        END;
    END;

-- Validate date logic
CREATE TRIGGER IF NOT EXISTS validate_projects_dates_insert
    BEFORE INSERT ON projects
    FOR EACH ROW
    BEGIN
        SELECT CASE
            WHEN NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL 
                 AND date(NEW.start_date) > date(NEW.end_date)
            THEN RAISE(ABORT, 'End date must be after start date')
        END;
    END;

CREATE TRIGGER IF NOT EXISTS validate_projects_dates_update
    BEFORE UPDATE ON projects
    FOR EACH ROW
    BEGIN
        SELECT CASE
            WHEN NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL 
                 AND date(NEW.start_date) > date(NEW.end_date)
            THEN RAISE(ABORT, 'End date must be after start date')
        END;
    END;

-- Add triggers for other existing tables if they don't have updated_at auto-update
CREATE TRIGGER IF NOT EXISTS update_materials_catalog_updated_at 
    AFTER UPDATE ON materials_catalog
    FOR EACH ROW 
    WHEN NEW.updated_at = OLD.updated_at
    BEGIN
        UPDATE materials_catalog SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_structure_types_updated_at 
    AFTER UPDATE ON structure_types
    FOR EACH ROW 
    WHEN NEW.updated_at = OLD.updated_at
    BEGIN
        UPDATE structure_types SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_jurisdictions_updated_at 
    AFTER UPDATE ON jurisdictions
    FOR EACH ROW 
    WHEN NEW.updated_at = OLD.updated_at
    BEGIN
        UPDATE jurisdictions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_species_database_updated_at 
    AFTER UPDATE ON species_database
    FOR EACH ROW 
    WHEN NEW.updated_at = OLD.updated_at
    BEGIN
        UPDATE species_database SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_regulatory_requirements_updated_at 
    AFTER UPDATE ON regulatory_requirements
    FOR EACH ROW 
    WHEN NEW.updated_at = OLD.updated_at
    BEGIN
        UPDATE regulatory_requirements SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_environmental_factors_updated_at 
    AFTER UPDATE ON environmental_factors
    FOR EACH ROW 
    WHEN NEW.updated_at = OLD.updated_at
    BEGIN
        UPDATE environmental_factors SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_project_materials_updated_at 
    AFTER UPDATE ON project_materials
    FOR EACH ROW 
    WHEN NEW.updated_at = OLD.updated_at
    BEGIN
        UPDATE project_materials SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Create a view that shows project data in a user-friendly format
CREATE VIEW IF NOT EXISTS projects_view AS
SELECT 
    p.*,
    j.name as jurisdiction_name,
    j.code as jurisdiction_code,
    CASE 
        WHEN p.length IS NOT NULL AND p.width IS NOT NULL AND p.height IS NOT NULL 
        THEN (p.length * p.width * p.height)
        ELSE NULL 
    END as calculated_volume,
    CASE 
        WHEN p.latitude IS NOT NULL AND p.longitude IS NOT NULL 
        THEN (CAST(p.latitude AS TEXT) || ',' || CAST(p.longitude AS TEXT))
        ELSE NULL 
    END as coordinates_string,
    CASE 
        WHEN p.start_date IS NOT NULL AND p.end_date IS NOT NULL 
        THEN julianday(p.end_date) - julianday(p.start_date)
        ELSE NULL 
    END as project_duration_days
FROM projects p
LEFT JOIN jurisdictions j ON p.jurisdiction_id = j.id;

-- Insert some sample projects for testing (optional)
INSERT OR IGNORE INTO projects (
    id, name, location, type, status, description, client_name, project_manager,
    budget, start_date, end_date, length, width, height, latitude, longitude,
    water_depth, salinity, temperature, primary_goals, target_species,
    jurisdiction_id, created_at
) VALUES (
    1, 
    'Tel Aviv Marina Breakwater', 
    'Tel Aviv, Israel', 
    'breakwater', 
    'planned',
    'Ecological breakwater enhancement project for Tel Aviv Marina',
    'Tel Aviv Municipality',
    'Dr. Sarah Cohen',
    750000.00,
    '2024-06-01',
    '2024-12-31',
    150.0,
    8.0,
    4.0,
    32.0853,
    34.7818,
    12.5,
    35.2,
    22.5,
    '["Marine Biodiversity Enhancement", "Coastal Protection"]',
    '["Corals", "Oysters", "Fish Species"]',
    1,
    CURRENT_TIMESTAMP
);

-- Verify the schema is correct by showing the projects table structure
.schema projects

-- Vacuum to optimize database after all changes
VACUUM;

-- Show success message
SELECT 'Database schema updated successfully! All wizard fields added to projects table.' as result;