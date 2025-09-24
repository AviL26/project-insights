-- ECOncrete Project Insights Database Schema Update
-- Complete schema with existing tables and new lookup tables for wizard APIs
-- Run this file to update your database: sqlite3 your_database.db < update-schema.sql

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Update existing projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'breakwater';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_manager TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS estimated_cost REAL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS actual_cost REAL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS completion_date TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS jurisdiction_id INTEGER;

-- Materials Catalog - ECOncrete products and specifications
CREATE TABLE IF NOT EXISTS materials_catalog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('protective', 'ecological', 'hybrid', 'structural')),
  subcategory TEXT, -- 'armor_units', 'bio_blocks', 'texture_panels', 'standard_concrete'
  description TEXT,
  density_kg_m3 REAL,
  compressive_strength_mpa REAL,
  porosity_percent REAL,
  cost_per_m3 REAL,
  cost_per_unit REAL,
  unit_type TEXT DEFAULT 'm3', -- 'm3', 'unit', 'kg'
  ecological_enhancement TEXT, -- JSON array of enhancement features
  typical_applications TEXT, -- JSON array of use cases
  size_specifications TEXT, -- JSON object with dimensions
  installation_requirements TEXT,
  curing_time_days INTEGER,
  regulatory_approvals TEXT, -- JSON array of approved jurisdictions
  environmental_benefits TEXT,
  technical_datasheet_url TEXT,
  image_url TEXT,
  supplier_info TEXT, -- JSON object with supplier details
  is_active BOOLEAN DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Structure Types - Different marine infrastructure types
CREATE TABLE IF NOT EXISTS structure_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('coastal_protection', 'marine_infrastructure', 'recreational', 'ecological_restoration')),
  description TEXT,
  typical_depth_range TEXT, -- '2-8m', '0-15m'
  wave_exposure_suitability TEXT CHECK (wave_exposure_suitability IN ('low', 'medium', 'high', 'extreme')),
  soil_type_requirements TEXT, -- JSON array
  environmental_considerations TEXT,
  regulatory_complexity TEXT CHECK (regulatory_complexity IN ('low', 'medium', 'high')),
  typical_materials TEXT, -- JSON array of suitable material IDs
  construction_methods TEXT, -- JSON array
  maintenance_requirements TEXT,
  lifespan_years INTEGER,
  cost_range_per_m3_min REAL,
  cost_range_per_m3_max REAL,
  ecological_impact_rating TEXT CHECK (ecological_impact_rating IN ('positive', 'neutral', 'negative')),
  permit_types_required TEXT, -- JSON array
  design_considerations TEXT,
  installation_complexity TEXT CHECK (installation_complexity IN ('simple', 'moderate', 'complex')),
  is_active BOOLEAN DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Jurisdictions - Countries, states, regulatory regions
CREATE TABLE IF NOT EXISTS jurisdictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT UNIQUE, -- 'US-CA', 'AU-NSW', 'IL', 'EU-ES'
  type TEXT NOT NULL CHECK (type IN ('country', 'state', 'province', 'region', 'municipality')),
  parent_jurisdiction_id INTEGER,
  regulatory_framework TEXT CHECK (regulatory_framework IN ('strict', 'moderate', 'flexible')),
  primary_language TEXT,
  currency TEXT,
  timezone TEXT,
  environmental_regulations TEXT, -- JSON object
  permit_requirements TEXT, -- JSON array
  approval_timeline_days INTEGER,
  regulatory_bodies TEXT, -- JSON array of agencies
  contact_information TEXT, -- JSON object
  documentation_requirements TEXT, -- JSON array
  fees_structure TEXT, -- JSON object
  ecological_protection_level TEXT CHECK (ecological_protection_level IN ('high', 'medium', 'low')),
  marine_protected_areas TEXT, -- JSON array
  seasonal_restrictions TEXT, -- JSON object
  public_consultation_required BOOLEAN DEFAULT 0,
  environmental_impact_assessment_required BOOLEAN DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_jurisdiction_id) REFERENCES jurisdictions(id)
);

-- Species Database - Marine life and ecological considerations
CREATE TABLE IF NOT EXISTS species_database (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scientific_name TEXT NOT NULL,
  common_name TEXT,
  category TEXT NOT NULL CHECK (category IN ('fish', 'coral', 'mollusk', 'crustacean', 'algae', 'echinoderm', 'other')),
  habitat_type TEXT, -- 'reef', 'sandy_bottom', 'rocky_shore', 'mangrove'
  depth_range TEXT, -- '0-5m', '5-20m'
  water_temperature_range TEXT, -- '18-25°C'
  salinity_tolerance TEXT CHECK (salinity_tolerance IN ('marine', 'brackish', 'variable')),
  conservation_status TEXT CHECK (conservation_status IN ('least_concern', 'near_threatened', 'vulnerable', 'endangered', 'critically_endangered')),
  ecological_role TEXT, -- 'primary_producer', 'filter_feeder', 'predator', 'herbivore'
  substrate_preference TEXT CHECK (substrate_preference IN ('hard', 'soft', 'mixed')),
  colonization_potential TEXT CHECK (colonization_potential IN ('high', 'medium', 'low')),
  econcrete_compatibility TEXT CHECK (econcrete_compatibility IN ('excellent', 'good', 'fair', 'poor')),
  monitoring_indicators TEXT, -- JSON array of what to measure
  protection_requirements TEXT,
  jurisdictions_present TEXT, -- JSON array of jurisdiction IDs
  spawning_season TEXT, -- JSON object with seasonal info
  feeding_habits TEXT,
  image_url TEXT,
  research_notes TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Regulatory Requirements - Specific permit and compliance requirements
CREATE TABLE IF NOT EXISTS regulatory_requirements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jurisdiction_id INTEGER NOT NULL,
  requirement_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('environmental', 'construction', 'marine', 'safety', 'heritage')),
  mandatory BOOLEAN DEFAULT 1,
  applies_to_structure_types TEXT, -- JSON array of structure type IDs
  trigger_conditions TEXT, -- JSON object defining when this applies
  documentation_required TEXT, -- JSON array
  fees REAL,
  processing_time_days INTEGER,
  validity_period_days INTEGER,
  renewal_required BOOLEAN DEFAULT 0,
  contact_agency TEXT,
  contact_details TEXT, -- JSON object
  application_process TEXT,
  common_delays TEXT, -- JSON array
  tips_for_approval TEXT,
  related_requirements TEXT, -- JSON array of other requirement IDs
  is_active BOOLEAN DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (jurisdiction_id) REFERENCES jurisdictions(id)
);

-- Environmental Factors - Site condition considerations
CREATE TABLE IF NOT EXISTS environmental_factors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('physical', 'biological', 'chemical', 'climatic')),
  measurement_unit TEXT,
  typical_range TEXT,
  impact_on_design TEXT CHECK (impact_on_design IN ('high', 'medium', 'low')),
  measurement_methods TEXT, -- JSON array
  monitoring_frequency TEXT,
  seasonal_variation BOOLEAN DEFAULT 0,
  regulatory_significance TEXT CHECK (regulatory_significance IN ('critical', 'important', 'moderate', 'low')),
  related_species TEXT, -- JSON array of species IDs affected by this factor
  mitigation_strategies TEXT, -- JSON array
  description TEXT,
  is_active BOOLEAN DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Project Material Usage - Junction table for materials used in projects
CREATE TABLE IF NOT EXISTS project_materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  material_id INTEGER NOT NULL,
  quantity REAL NOT NULL,
  unit_cost REAL,
  total_cost REAL,
  installation_date TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES materials_catalog(id),
  UNIQUE(project_id, material_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials_catalog(category);
CREATE INDEX IF NOT EXISTS idx_materials_active ON materials_catalog(is_active);
CREATE INDEX IF NOT EXISTS idx_structures_category ON structure_types(category);
CREATE INDEX IF NOT EXISTS idx_structures_active ON structure_types(is_active);
CREATE INDEX IF NOT EXISTS idx_jurisdictions_code ON jurisdictions(code);
CREATE INDEX IF NOT EXISTS idx_jurisdictions_type ON jurisdictions(type);
CREATE INDEX IF NOT EXISTS idx_jurisdictions_parent ON jurisdictions(parent_jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_species_category ON species_database(category);
CREATE INDEX IF NOT EXISTS idx_species_active ON species_database(is_active);
CREATE INDEX IF NOT EXISTS idx_requirements_jurisdiction ON regulatory_requirements(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_requirements_type ON regulatory_requirements(requirement_type);
CREATE INDEX IF NOT EXISTS idx_environmental_category ON environmental_factors(category);
CREATE INDEX IF NOT EXISTS idx_project_materials_project ON project_materials(project_id);
CREATE INDEX IF NOT EXISTS idx_project_materials_material ON project_materials(material_id);

-- Insert sample data for immediate testing

-- Sample Materials
INSERT OR IGNORE INTO materials_catalog (id, name, category, subcategory, description, density_kg_m3, cost_per_m3, unit_type, is_active) VALUES
(1, 'ECOncrete Bio-Block Standard', 'ecological', 'bio_blocks', 'Standard bio-enhanced concrete block for marine applications', 2400, 280, 'm3', 1),
(2, 'ECOncrete Armor Units Type A', 'protective', 'armor_units', 'Heavy-duty armor units for breakwater construction', 2500, 320, 'unit', 1),
(3, 'ECOncrete Tidal Pool Panels', 'ecological', 'texture_panels', 'Textured panels designed to enhance tidal pool formation', 2350, 380, 'm2', 1),
(4, 'Standard Marine Concrete', 'structural', 'standard_concrete', 'Traditional marine-grade concrete', 2400, 150, 'm3', 1);

-- Sample Structure Types
INSERT OR IGNORE INTO structure_types (id, name, category, description, wave_exposure_suitability, regulatory_complexity, is_active) VALUES
(1, 'Breakwater', 'coastal_protection', 'Offshore structure to reduce wave energy', 'high', 'medium', 1),
(2, 'Seawall', 'coastal_protection', 'Vertical wall structure for shoreline protection', 'medium', 'high', 1),
(3, 'Marina Dock', 'marine_infrastructure', 'Floating or fixed dock structure for boats', 'low', 'medium', 1),
(4, 'Artificial Reef', 'ecological_restoration', 'Submerged structure to enhance marine habitat', 'medium', 'high', 1);

-- Sample Jurisdictions
INSERT OR IGNORE INTO jurisdictions (id, name, code, type, regulatory_framework, primary_language, currency, is_active) VALUES
(1, 'Israel', 'IL', 'country', 'strict', 'Hebrew', 'ILS', 1),
(2, 'United States', 'US', 'country', 'moderate', 'English', 'USD', 1),
(3, 'California', 'US-CA', 'state', 'strict', 'English', 'USD', 1),
(4, 'Australia', 'AU', 'country', 'strict', 'English', 'AUD', 1),
(5, 'New South Wales', 'AU-NSW', 'state', 'strict', 'English', 'AUD', 1);

-- Set parent relationships for sub-jurisdictions
UPDATE jurisdictions SET parent_jurisdiction_id = 2 WHERE code = 'US-CA';
UPDATE jurisdictions SET parent_jurisdiction_id = 4 WHERE code = 'AU-NSW';

-- Sample Species
INSERT OR IGNORE INTO species_database (id, scientific_name, common_name, category, habitat_type, conservation_status, econcrete_compatibility, is_active) VALUES
(1, 'Balanus amphitrite', 'Striped Barnacle', 'crustacean', 'hard_substrate', 'least_concern', 'excellent', 1),
(2, 'Mytilus edulis', 'Blue Mussel', 'mollusk', 'hard_substrate', 'least_concern', 'excellent', 1),
(3, 'Pocillopora damicornis', 'Cauliflower Coral', 'coral', 'reef', 'near_threatened', 'good', 1),
(4, 'Ulva lactuca', 'Sea Lettuce', 'algae', 'rocky_shore', 'least_concern', 'good', 1);

-- Sample Environmental Factors
INSERT OR IGNORE INTO environmental_factors (id, name, category, measurement_unit, impact_on_design, is_active) VALUES
(1, 'Wave Height', 'physical', 'meters', 'high', 1),
(2, 'Water Temperature', 'physical', 'celsius', 'medium', 1),
(3, 'Salinity', 'chemical', 'ppt', 'medium', 1),
(4, 'pH Level', 'chemical', 'pH units', 'medium', 1),
(5, 'Tidal Range', 'physical', 'meters', 'high', 1),
(6, 'Current Velocity', 'physical', 'm/s', 'high', 1);

-- Sample Regulatory Requirements
INSERT OR IGNORE INTO regulatory_requirements (id, jurisdiction_id, requirement_type, title, category, mandatory, processing_time_days, is_active) VALUES
(1, 1, 'environmental_permit', 'Marine Environmental Impact Assessment', 'environmental', 1, 90, 1),
(2, 1, 'construction_permit', 'Coastal Construction Permit', 'construction', 1, 60, 1),
(3, 3, 'environmental_permit', 'California Coastal Development Permit', 'environmental', 1, 120, 1),
(4, 5, 'marine_permit', 'NSW Marine Parks Permit', 'marine', 1, 45, 1);

-- Add foreign key constraint to projects table if not exists
-- This needs to be done after jurisdictions table is created
UPDATE projects SET jurisdiction_id = 1 WHERE jurisdiction_id IS NULL;

-- Vacuum to optimize database
VACUUM;
