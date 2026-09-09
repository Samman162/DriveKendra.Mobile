-- =============================================================================
-- Patch 004: Sequence Synchronization & Booking Confirmation Dispatch
-- File: database/patches/004_sequence_sync_and_trip_confirmation.sql
-- Description:
--   1. Ensures sequence advancement on cr_owners <-> dka_owners triggers
--      to prevent sequence/ID collisions when inserting from either table.
--   2. Ensures sequence advancement on cr_vehicles <-> dka_vehicles triggers.
--   3. Confirms trip dispatch fields on dka_bookings.
-- =============================================================================

-- 1. Ensure dka_bookings dispatch & pricing fields
ALTER TABLE dka_bookings 
    ADD COLUMN IF NOT EXISTS assigned_driver_id INTEGER REFERENCES cr_owners(owner_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS assigned_driver_name VARCHAR(120),
    ADD COLUMN IF NOT EXISTS assigned_driver_phone VARCHAR(30),
    ADD COLUMN IF NOT EXISTS final_fare VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_dka_bookings_assigned_driver ON dka_bookings(assigned_driver_id);

-- 2. Enhanced cr_owners -> dka_owners sync with sequence alignment
CREATE OR REPLACE FUNCTION sync_cr_owners_to_dka_owners()
RETURNS TRIGGER AS $$
BEGIN
    IF pg_trigger_depth() > 1 THEN
        IF (TG_OP = 'DELETE') THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END IF;

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO dka_owners (
            owner_id, full_name, phone_number, whatsapp_number, email,
            citizenship_or_id_no, status, created_at, citizenship_doc_id, license_doc_id
        ) VALUES (
            NEW.owner_id, NEW.full_name, NEW.phone_number, NEW.whatsapp_number, NEW.email,
            NEW.citizenship_or_id_no, NEW.status, COALESCE(NEW.created_at, NOW()),
            NEW.citizenship_doc_id, NEW.license_doc_id
        )
        ON CONFLICT (owner_id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            phone_number = EXCLUDED.phone_number,
            whatsapp_number = EXCLUDED.whatsapp_number,
            email = EXCLUDED.email,
            citizenship_or_id_no = EXCLUDED.citizenship_or_id_no,
            status = EXCLUDED.status,
            citizenship_doc_id = EXCLUDED.citizenship_doc_id,
            license_doc_id = EXCLUDED.license_doc_id;

        PERFORM setval(pg_get_serial_sequence('dka_owners', 'owner_id'), GREATEST(NEW.owner_id, (SELECT COALESCE(MAX(owner_id), 1) FROM dka_owners)));
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        UPDATE dka_owners SET
            full_name = NEW.full_name,
            phone_number = NEW.phone_number,
            whatsapp_number = NEW.whatsapp_number,
            email = NEW.email,
            citizenship_or_id_no = NEW.citizenship_or_id_no,
            status = NEW.status,
            citizenship_doc_id = NEW.citizenship_doc_id,
            license_doc_id = NEW.license_doc_id
        WHERE owner_id = NEW.owner_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        DELETE FROM dka_owners WHERE owner_id = OLD.owner_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Enhanced dka_owners -> cr_owners sync with sequence alignment
CREATE OR REPLACE FUNCTION sync_dka_owners_to_cr_owners()
RETURNS TRIGGER AS $$
BEGIN
    IF pg_trigger_depth() > 1 THEN
        IF (TG_OP = 'DELETE') THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END IF;

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO cr_owners (
            owner_id, full_name, phone_number, whatsapp_number, email,
            citizenship_or_id_no, status, created_at, citizenship_doc_id, license_doc_id
        ) VALUES (
            NEW.owner_id, NEW.full_name, NEW.phone_number, NEW.whatsapp_number, NEW.email,
            NEW.citizenship_or_id_no, NEW.status, COALESCE(NEW.created_at, NOW()),
            NEW.citizenship_doc_id, NEW.license_doc_id
        )
        ON CONFLICT (owner_id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            phone_number = EXCLUDED.phone_number,
            whatsapp_number = EXCLUDED.whatsapp_number,
            email = EXCLUDED.email,
            citizenship_or_id_no = EXCLUDED.citizenship_or_id_no,
            status = EXCLUDED.status,
            citizenship_doc_id = EXCLUDED.citizenship_doc_id,
            license_doc_id = EXCLUDED.license_doc_id;

        PERFORM setval(pg_get_serial_sequence('cr_owners', 'owner_id'), GREATEST(NEW.owner_id, (SELECT COALESCE(MAX(owner_id), 1) FROM cr_owners)));
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        UPDATE cr_owners SET
            full_name = NEW.full_name,
            phone_number = NEW.phone_number,
            whatsapp_number = NEW.whatsapp_number,
            email = NEW.email,
            citizenship_or_id_no = NEW.citizenship_or_id_no,
            status = NEW.status,
            citizenship_doc_id = NEW.citizenship_doc_id,
            license_doc_id = NEW.license_doc_id
        WHERE owner_id = NEW.owner_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        DELETE FROM cr_owners WHERE owner_id = OLD.owner_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Enhanced cr_vehicles -> dka_vehicles sync with sequence alignment
CREATE OR REPLACE FUNCTION sync_cr_vehicles_to_dka_vehicles()
RETURNS TRIGGER AS $$
BEGIN
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

        PERFORM setval(pg_get_serial_sequence('dka_vehicles', 'vehicle_id'), GREATEST(NEW.vehicle_id, (SELECT COALESCE(MAX(vehicle_id), 1) FROM dka_vehicles)));
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

-- 5. Enhanced dka_vehicles -> cr_vehicles sync with sequence alignment
CREATE OR REPLACE FUNCTION sync_dka_vehicles_to_cr_vehicles()
RETURNS TRIGGER AS $$
BEGIN
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

        PERFORM setval(pg_get_serial_sequence('cr_vehicles', 'vehicle_id'), GREATEST(NEW.vehicle_id, (SELECT COALESCE(MAX(vehicle_id), 1) FROM cr_vehicles)));
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
