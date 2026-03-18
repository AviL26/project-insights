-- Structure types
INSERT OR IGNORE INTO structure_types (id, label, description) VALUES
  ('seawall', 'Seawall', 'Vertical or near-vertical coastal defense structure'),
  ('breakwater', 'Breakwater', 'Offshore structure to reduce wave energy'),
  ('revetment', 'Revetment', 'Sloped structure protecting shoreline'),
  ('jetty', 'Jetty / Groyne', 'Structure extending into water to direct current'),
  ('pier', 'Pier / Wharf', 'Elevated structure extending over water'),
  ('artificial_reef', 'Artificial Reef', 'Submerged structure promoting marine habitat'),
  ('tide_pool', 'Tide Pool Enhancement', 'Engineered intertidal habitat features');

-- Jurisdictions
INSERT OR IGNORE INTO jurisdictions (id, label, agencies) VALUES
  ('us_federal', 'United States (Federal)', '["USACE","EPA","NOAA","USFWS"]'),
  ('us_california', 'United States (California)', '["CCC","CDFW","SWRCB"]'),
  ('us_florida', 'United States (Florida)', '["FDEP","FWC","SFWMD"]'),
  ('eu', 'European Union', '["EEA","DG ENV"]'),
  ('uk', 'United Kingdom', '["EA","NE","MMO"]'),
  ('australia', 'Australia', '["DAWE","GBRMPA"]'),
  ('israel', 'Israel', '["INPA","MoEP"]');

-- Materials catalog
INSERT OR IGNORE INTO materials_catalog (name, category, unit, eco_rating, description) VALUES
  ('ECOncrete Armor Unit', 'armor', 'unit', 'eco_enhanced', 'Bio-enhanced concrete armor unit with textured surface'),
  ('Standard Portland Cement', 'binder', 'kg', 'standard', 'Ordinary Portland cement CEM I'),
  ('ECOncrete Admixture', 'additive', 'kg', 'eco_enhanced', 'Bio-enhancing concrete admixture'),
  ('Marine-Grade Aggregate', 'aggregate', 'm3', 'standard', 'Washed marine aggregate 10-20mm'),
  ('Recycled Aggregate', 'aggregate', 'm3', 'eco_enhanced', 'Recycled concrete aggregate'),
  ('Steel Reinforcement', 'reinforcement', 'kg', 'standard', 'Grade 500 deformed bar'),
  ('Basalt Fiber', 'reinforcement', 'kg', 'eco_enhanced', 'Corrosion-resistant basalt fiber reinforcement'),
  ('Geotextile Filter', 'geosynthetic', 'm2', 'standard', 'Non-woven geotextile filter fabric');
