-- ECOncrete Database Issues Fix - Complete Migration Script
PRAGMA foreign_keys = ON;

-- Issue 1: Fix updated_at auto-update with triggers
CREATE TRIGGER IF NOT EXISTS update_materials_catalog_updated_at 
    AFTER UPDATE ON materials_catalog
    FOR EACH ROW 
    BEGIN
        UPDATE materials_catalog SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_jurisdictions_updated_at 
    AFTER UPDATE ON jurisdictions
    FOR EACH ROW 
    BEGIN
        UPDATE jurisdictions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Issue 4: Add validation for enumerated fields
CREATE TRIGGER IF NOT EXISTS validate_materials_category_insert
    BEFORE INSERT ON materials_catalog
    FOR EACH ROW
    BEGIN
        SELECT CASE
            WHEN NEW.category NOT IN ('protective', 'ecological', 'hybrid', 'structural')
            THEN RAISE(ABORT, 'Invalid materials category')
        END;
    END;

-- Issue 5: Add validation for mandatory fields  
CREATE TRIGGER IF NOT EXISTS validate_materials_required_fields_insert
    BEFORE INSERT ON materials_catalog
    FOR EACH ROW
    BEGIN
        SELECT CASE
            WHEN NEW.name IS NULL OR trim(NEW.name) = ''
            THEN RAISE(ABORT, 'Material name is required')
        END;
    END;

-- Issue 6: Add validation for numeric fields
CREATE TRIGGER IF NOT EXISTS validate_materials_numeric_fields_insert
    BEFORE INSERT ON materials_catalog
    FOR EACH ROW
    BEGIN
        SELECT CASE
            WHEN NEW.density_kg_m3 IS NOT NULL AND NEW.density_kg_m3 <= 0
            THEN RAISE(ABORT, 'Density must be positive')
        END;
    END;

VACUUM;
