-- =============================================================================
-- Patch 003: Vehicles (dka_vehicles <-> cr_vehicles) Synchronization
-- File: database/patches/003_vehicles_and_dka_vehicles_sync.sql
-- Description:
--   public.cr_vehicles already exists in the database with 11 columns:
--   (vehicle_id, owner_id, vehicle_type_id, make_model, license_plate,
--    manufacture_year, seating_capacity, color, is_active, created_at, bluebook_doc_id)
--
--   This patch creates:
--   1. dka_vehicles table matching the exact 11 columns of cr_vehicles
--   2. Bidirectional synchronization triggers (cr_vehicles <-> dka_vehicles)
--   3. Initial backfill from public.cr_vehicles into dka_vehicles
-- =============================================================================

-- 1. Create dka_vehicles table with the EXACT same 11 columns as cr_vehicles
CREATE TABLE IF NOT EXISTS dka_vehicles (
    vehicle_id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES dka_owners(owner_id) ON DELETE SET NULL,
    vehicle_type_id INTEGER,
    make_model VARCHAR(120) NOT NULL,
    license_plate VARCHAR(50) UNIQUE NOT NULL,
    manufacture_year INTEGER,
    seating_capacity INTEGER NOT NULL DEFAULT 4,
    color VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    bluebook_doc_id VARCHAR(100)
);

-- Safely drop updated_at or legacy columns if previously created
ALTER TABLE dka_vehicles DROP COLUMN IF EXISTS updated_at;
ALTER TABLE dka_vehicles DROP COLUMN IF EXISTS fuel_type;
ALTER TABLE dka_vehicles DROP COLUMN IF EXISTS image_url;
ALTER TABLE dka_vehicles DROP COLUMN IF EXISTS status;
ALTER TABLE dka_vehicles DROP COLUMN IF EXISTS category;
ALTER TABLE dka_vehicles DROP COLUMN IF EXISTS model;
ALTER TABLE dka_vehicles DROP COLUMN IF EXISTS registration_plate;
ALTER TABLE dka_vehicles DROP COLUMN IF EXISTS seats;

-- Ensure indexes for optimal lookup
CREATE INDEX IF NOT EXISTS idx_dka_vehicles_plate ON dka_vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_dka_vehicles_owner ON dka_vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_dka_vehicles_type ON dka_vehicles(vehicle_type_id);
CREATE INDEX IF NOT EXISTS idx_dka_vehicles_active ON dka_vehicles(is_active);

-- 2. Drop legacy timestamp triggers if any
DROP TRIGGER IF EXISTS trigger_dka_vehicles_updated_at ON dka_vehicles;
DROP FUNCTION IF EXISTS update_dka_vehicles_timestamp();

-- 3. Bidirectional Sync: cr_vehicles -> dka_vehicles
CREATE OR REPLACE FUNCTION sync_cr_vehicles_to_dka_vehicles()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent infinite recursion between bidirectional triggers
    IF pg_trigger_depth() > 1 THEN
        IF (TG_OP = 'DELETE') THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END IF;

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO dka_vehicles (
            vehicle_id, owner_id, vehicle_type_id, make_model, license_plate,
            manufacture_year, seating_capacity, color, is_active, created_at, bluebook_doc_id
        ) VALUES (
            NEW.vehicle_id, NEW.owner_id, NEW.vehicle_type_id, NEW.make_model, NEW.license_plate,
            NEW.manufacture_year, NEW.seating_capacity, NEW.color, NEW.is_active,
            COALESCE(NEW.created_at, NOW()), NEW.bluebook_doc_id
        )
        ON CONFLICT (vehicle_id) DO UPDATE SET
            owner_id = EXCLUDED.owner_id,
            vehicle_type_id = EXCLUDED.vehicle_type_id,
            make_model = EXCLUDED.make_model,
            license_plate = EXCLUDED.license_plate,
            manufacture_year = EXCLUDED.manufacture_year,
            seating_capacity = EXCLUDED.seating_capacity,
            color = EXCLUDED.color,
            is_active = EXCLUDED.is_active,
            bluebook_doc_id = EXCLUDED.bluebook_doc_id;
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        UPDATE dka_vehicles SET
            owner_id = NEW.owner_id,
            vehicle_type_id = NEW.vehicle_type_id,
            make_model = NEW.make_model,
            license_plate = NEW.license_plate,
            manufacture_year = NEW.manufacture_year,
            seating_capacity = NEW.seating_capacity,
            color = NEW.color,
            is_active = NEW.is_active,
            bluebook_doc_id = NEW.bluebook_doc_id
        WHERE vehicle_id = NEW.vehicle_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        DELETE FROM dka_vehicles WHERE vehicle_id = OLD.vehicle_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_cr_to_dka_vehicles ON cr_vehicles;
CREATE TRIGGER trg_sync_cr_to_dka_vehicles
    AFTER INSERT OR UPDATE OR DELETE ON cr_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION sync_cr_vehicles_to_dka_vehicles();

-- 4. Bidirectional Sync: dka_vehicles -> cr_vehicles
CREATE OR REPLACE FUNCTION sync_dka_vehicles_to_cr_vehicles()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent infinite recursion between bidirectional triggers
    IF pg_trigger_depth() > 1 THEN
        IF (TG_OP = 'DELETE') THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END IF;

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO cr_vehicles (
            vehicle_id, owner_id, vehicle_type_id, make_model, license_plate,
            manufacture_year, seating_capacity, color, is_active, created_at, bluebook_doc_id
        ) VALUES (
            NEW.vehicle_id, NEW.owner_id, NEW.vehicle_type_id, NEW.make_model, NEW.license_plate,
            NEW.manufacture_year, NEW.seating_capacity, NEW.color, NEW.is_active,
            COALESCE(NEW.created_at, NOW()), NEW.bluebook_doc_id
        )
        ON CONFLICT (vehicle_id) DO UPDATE SET
            owner_id = EXCLUDED.owner_id,
            vehicle_type_id = EXCLUDED.vehicle_type_id,
            make_model = EXCLUDED.make_model,
            license_plate = EXCLUDED.license_plate,
            manufacture_year = EXCLUDED.manufacture_year,
            seating_capacity = EXCLUDED.seating_capacity,
            color = EXCLUDED.color,
            is_active = EXCLUDED.is_active,
            bluebook_doc_id = EXCLUDED.bluebook_doc_id;
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        UPDATE cr_vehicles SET
            owner_id = NEW.owner_id,
            vehicle_type_id = NEW.vehicle_type_id,
            make_model = NEW.make_model,
            license_plate = NEW.license_plate,
            manufacture_year = NEW.manufacture_year,
            seating_capacity = NEW.seating_capacity,
            color = NEW.color,
            is_active = NEW.is_active,
            bluebook_doc_id = NEW.bluebook_doc_id
        WHERE vehicle_id = NEW.vehicle_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        DELETE FROM cr_vehicles WHERE vehicle_id = OLD.vehicle_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_dka_to_cr_vehicles ON dka_vehicles;
CREATE TRIGGER trg_sync_dka_to_cr_vehicles
    AFTER INSERT OR UPDATE OR DELETE ON dka_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION sync_dka_vehicles_to_cr_vehicles();

-- 5. Initial backfill: copies existing cr_vehicles into dka_vehicles
INSERT INTO dka_vehicles (
    vehicle_id, owner_id, vehicle_type_id, make_model, license_plate,
    manufacture_year, seating_capacity, color, is_active, created_at, bluebook_doc_id
)
SELECT 
    vehicle_id, owner_id, vehicle_type_id, make_model, license_plate,
    manufacture_year, seating_capacity, color, is_active, created_at, bluebook_doc_id
FROM public.cr_vehicles
ON CONFLICT (vehicle_id) DO UPDATE SET
    owner_id = EXCLUDED.owner_id,
    vehicle_type_id = EXCLUDED.vehicle_type_id,
    make_model = EXCLUDED.make_model,
    license_plate = EXCLUDED.license_plate,
    manufacture_year = EXCLUDED.manufacture_year,
    seating_capacity = EXCLUDED.seating_capacity,
    color = EXCLUDED.color,
    is_active = EXCLUDED.is_active,
    bluebook_doc_id = EXCLUDED.bluebook_doc_id;

-- Align sequence for dka_vehicles
SELECT setval(pg_get_serial_sequence('dka_vehicles', 'vehicle_id'), COALESCE(MAX(vehicle_id), 1)) FROM dka_vehicles;
