-- Ecological metric definitions (catalog of what can be measured)
CREATE TABLE IF NOT EXISTS ecological_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('biodiversity','habitat','water_quality','structural','community')),
  unit TEXT NOT NULL,
  description TEXT DEFAULT '',
  min_value REAL DEFAULT 0,
  max_value REAL DEFAULT 100,
  target_value REAL,
  weight REAL DEFAULT 1.0
);

-- Ecological survey records (structured observations per project per date)
CREATE TABLE IF NOT EXISTS ecological_surveys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  survey_date DATE NOT NULL,
  surveyor TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Individual metric readings within a survey
CREATE TABLE IF NOT EXISTS ecological_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  survey_id INTEGER NOT NULL REFERENCES ecological_surveys(id) ON DELETE CASCADE,
  metric_id INTEGER NOT NULL REFERENCES ecological_metrics(id),
  value REAL NOT NULL,
  notes TEXT DEFAULT '',
  UNIQUE(survey_id, metric_id)
);

-- Seed ecological metrics
INSERT OR IGNORE INTO ecological_metrics (key, name, category, unit, description, min_value, max_value, target_value, weight) VALUES
  -- Biodiversity
  ('species_richness',    'Species Richness',        'biodiversity', 'count',   'Total number of distinct species observed',            0, 200, 30, 2.0),
  ('shannon_diversity',   'Shannon Diversity Index',  'biodiversity', 'index',   'H'' = -Σ(pi × ln(pi)); higher values indicate more diversity', 0, 5, 2.5, 2.0),
  ('native_species_pct',  'Native Species Ratio',     'biodiversity', '%',       'Percentage of observed species that are native',       0, 100, 80, 1.5),
  ('invasive_species',    'Invasive Species Count',   'biodiversity', 'count',   'Number of invasive species detected (lower is better)', 0, 50, 0, 1.5),

  -- Habitat
  ('colonization_pct',    'Surface Colonization',     'habitat',      '%',       'Percentage of structure surface colonized by organisms', 0, 100, 75, 2.0),
  ('habitat_complexity',  'Habitat Complexity Score',  'habitat',      'score',   'Structural complexity rating (rugosity, crevices, pools)', 0, 10, 7, 1.5),
  ('algae_cover',         'Algal Cover',              'habitat',      '%',       'Percentage of surface covered by macroalgae',          0, 100, 40, 1.0),
  ('invertebrate_density','Invertebrate Density',     'habitat',      'per m²', 'Count of sessile invertebrates per square meter',       0, 500, 100, 1.5),

  -- Water Quality
  ('dissolved_oxygen',    'Dissolved Oxygen',         'water_quality', 'mg/L',   'DO concentration in surrounding waters',               0, 20, 7, 1.0),
  ('turbidity',           'Turbidity',                'water_quality', 'NTU',    'Water clarity measurement (lower is generally better)',  0, 100, 10, 1.0),
  ('ph_level',            'pH Level',                 'water_quality', 'pH',     'Water acidity/alkalinity',                              0, 14, 8.1, 0.5),
  ('nutrient_level',      'Nutrient Loading',         'water_quality', 'µg/L',   'Total nitrogen + phosphorus concentration',             0, 1000, 50, 1.0),

  -- Structural
  ('surface_roughness',   'Surface Roughness Index',  'structural',   'index',   'Measurement of bio-receptive surface texture',         0, 10, 7, 1.0),
  ('structural_integrity','Structural Integrity',     'structural',   '%',       'Assessment of physical condition of eco-enhancements',  0, 100, 90, 1.0),
  ('tide_pool_function',  'Tide Pool Functionality',  'structural',   'score',   'Water retention and habitat provision rating',          0, 10, 7, 1.0),

  -- Community
  ('fish_abundance',      'Fish Abundance',           'community',    'count',   'Total fish observed per standardized survey',           0, 500, 50, 1.5),
  ('recruitment_rate',    'Larval Recruitment Rate',  'community',    'per m²/month', 'Rate of new organism settlement',                 0, 100, 20, 1.5),
  ('trophic_levels',      'Trophic Level Diversity',  'community',    'count',   'Number of trophic levels represented',                 0, 5, 4, 1.0);
