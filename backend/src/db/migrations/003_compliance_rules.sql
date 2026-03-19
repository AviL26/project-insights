-- Compliance rules catalog (templates per jurisdiction)
CREATE TABLE IF NOT EXISTS compliance_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jurisdiction TEXT NOT NULL,
  rule_code TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL CHECK(category IN ('environmental','structural','permits','monitoring','safety')),
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high','critical')),
  UNIQUE(jurisdiction, rule_code)
);

-- Universal rules (apply to all jurisdictions)
INSERT OR IGNORE INTO compliance_rules (jurisdiction, rule_code, rule_name, description, category, priority) VALUES
  ('*', 'ENV-001', 'Environmental Impact Assessment', 'Complete EIA documenting potential effects on marine habitats', 'environmental', 'critical'),
  ('*', 'ENV-002', 'Sediment & Turbidity Plan', 'Erosion and sediment control plan for construction phase', 'environmental', 'high'),
  ('*', 'ENV-003', 'Marine Species Survey', 'Pre-construction survey of protected/endangered species in project area', 'environmental', 'high'),
  ('*', 'ENV-004', 'Water Quality Monitoring', 'Establish baseline and ongoing water quality monitoring protocol', 'monitoring', 'medium'),
  ('*', 'STR-001', 'Structural Design Review', 'Independent review of structural calculations and wave loading analysis', 'structural', 'critical'),
  ('*', 'STR-002', 'Material Specification Compliance', 'Verify all materials meet marine-grade specifications', 'structural', 'high'),
  ('*', 'SAF-001', 'Construction Safety Plan', 'OSHA-compliant safety plan for marine construction activities', 'safety', 'critical'),
  ('*', 'MON-001', 'Post-Construction Monitoring', '5-year ecological monitoring plan for constructed habitat', 'monitoring', 'medium');

-- US Federal rules
INSERT OR IGNORE INTO compliance_rules (jurisdiction, rule_code, rule_name, description, category, priority) VALUES
  ('us_federal', 'USACE-001', 'Section 404 Permit (CWA)', 'USACE permit for discharge of dredged/fill material into waters of the US', 'permits', 'critical'),
  ('us_federal', 'USACE-002', 'Section 10 Permit (RHA)', 'Rivers and Harbors Act permit for structures in navigable waters', 'permits', 'critical'),
  ('us_federal', 'NOAA-001', 'Essential Fish Habitat Assessment', 'EFH assessment per Magnuson-Stevens Act consultation with NMFS', 'environmental', 'high'),
  ('us_federal', 'USFWS-001', 'Endangered Species Act Consultation', 'Section 7 consultation for impacts on listed species', 'environmental', 'critical'),
  ('us_federal', 'EPA-001', 'NPDES Stormwater Permit', 'Construction stormwater discharge permit', 'permits', 'high'),
  ('us_federal', 'NEPA-001', 'NEPA Compliance', 'National Environmental Policy Act review (EA or EIS)', 'environmental', 'critical');

-- US California rules
INSERT OR IGNORE INTO compliance_rules (jurisdiction, rule_code, rule_name, description, category, priority) VALUES
  ('us_california', 'CCC-001', 'Coastal Development Permit', 'California Coastal Commission CDP for development in coastal zone', 'permits', 'critical'),
  ('us_california', 'CEQA-001', 'CEQA Review', 'California Environmental Quality Act environmental review', 'environmental', 'critical'),
  ('us_california', 'CDFW-001', 'Streambed Alteration Agreement', 'CDFW Section 1602 notification for work in streambeds/waterways', 'permits', 'high'),
  ('us_california', 'SWRCB-001', 'Section 401 Water Quality Certification', 'State water board certification for federal permit projects', 'permits', 'high');

-- US Florida rules
INSERT OR IGNORE INTO compliance_rules (jurisdiction, rule_code, rule_name, description, category, priority) VALUES
  ('us_florida', 'FDEP-001', 'Joint Coastal Permit', 'FDEP joint coastal permit for construction on sovereign submerged lands', 'permits', 'critical'),
  ('us_florida', 'FDEP-002', 'Environmental Resource Permit', 'ERP for activities in wetlands and other surface waters', 'permits', 'critical'),
  ('us_florida', 'FWC-001', 'Marine Turtle Protection', 'Compliance with sea turtle lighting and nesting survey requirements', 'environmental', 'high'),
  ('us_florida', 'FWC-002', 'Manatee Protection Plan', 'Standard manatee conditions for in-water work', 'environmental', 'high');

-- European Union rules
INSERT OR IGNORE INTO compliance_rules (jurisdiction, rule_code, rule_name, description, category, priority) VALUES
  ('eu', 'EU-EIA-001', 'EIA Directive Compliance', 'Assessment per EU Directive 2011/92/EU (amended by 2014/52/EU)', 'environmental', 'critical'),
  ('eu', 'EU-HD-001', 'Habitats Directive Assessment', 'Appropriate Assessment under Natura 2000 framework (92/43/EEC)', 'environmental', 'critical'),
  ('eu', 'EU-WFD-001', 'Water Framework Directive', 'Compliance with WFD water quality standards (2000/60/EC)', 'environmental', 'high'),
  ('eu', 'EU-MSFD-001', 'Marine Strategy Framework Directive', 'Alignment with MSFD good environmental status descriptors', 'monitoring', 'medium');

-- UK rules
INSERT OR IGNORE INTO compliance_rules (jurisdiction, rule_code, rule_name, description, category, priority) VALUES
  ('uk', 'MMO-001', 'Marine Licence', 'Marine Management Organisation licence for marine construction', 'permits', 'critical'),
  ('uk', 'EA-001', 'Flood Risk Activity Permit', 'Environment Agency permit for work near main rivers or sea defences', 'permits', 'high'),
  ('uk', 'NE-001', 'Habitats Regulations Assessment', 'HRA for impacts on European protected sites', 'environmental', 'critical'),
  ('uk', 'NE-002', 'Protected Species Licence', 'Natural England licence for works affecting protected species', 'environmental', 'high');

-- Australia rules
INSERT OR IGNORE INTO compliance_rules (jurisdiction, rule_code, rule_name, description, category, priority) VALUES
  ('australia', 'EPBC-001', 'EPBC Act Referral', 'Referral under Environment Protection and Biodiversity Conservation Act 1999', 'environmental', 'critical'),
  ('australia', 'GBRMPA-001', 'GBR Permit Assessment', 'Great Barrier Reef Marine Park Authority permit (if applicable)', 'permits', 'critical'),
  ('australia', 'DAWE-001', 'Sea Dumping Permit', 'Permit for sea disposal under Environment Protection (Sea Dumping) Act', 'permits', 'high'),
  ('australia', 'DAWE-002', 'Indigenous Heritage Assessment', 'Assessment of impacts on Indigenous cultural heritage sites', 'environmental', 'high');

-- Israel rules
INSERT OR IGNORE INTO compliance_rules (jurisdiction, rule_code, rule_name, description, category, priority) VALUES
  ('israel', 'MOEP-001', 'Environmental Impact Statement', 'Tachlit EIS per Planning and Building Law requirements', 'environmental', 'critical'),
  ('israel', 'INPA-001', 'Nature Reserve Consultation', 'INPA consultation for work near marine nature reserves', 'environmental', 'critical'),
  ('israel', 'MOEP-002', 'Marine Pollution Prevention', 'Compliance with Prevention of Sea Pollution Ordinance', 'environmental', 'high'),
  ('israel', 'MOEP-003', 'Coastal Environment Plan', 'Alignment with Israel Coastal Environment Protection Plan', 'permits', 'high');
