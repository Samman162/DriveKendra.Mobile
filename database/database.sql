-- =============================================================================
-- Drive Kendra Mobile App - Streamlined PostgreSQL Database Schema
-- File: database/database.sql
-- Description: Core canonical schema with user auth, fleet management, notifications,
--              and bookings dispatch.
-- =============================================================================

-- Enable UUID extension if required
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. USERS & AUTHENTICATION TABLE (dka_users)
-- =============================================================================
CREATE TABLE IF NOT EXISTS dka_users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    phone_number VARCHAR(30) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE,
    password_hash VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(30) NOT NULL DEFAULT 'customer', -- 'customer', 'operator', 'admin'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dka_users_phone ON dka_users(phone_number);
CREATE INDEX IF NOT EXISTS idx_dka_users_email ON dka_users(email);
CREATE INDEX IF NOT EXISTS idx_dka_users_role ON dka_users(role);
CREATE INDEX IF NOT EXISTS idx_dka_users_created_at ON dka_users(created_at);

-- Automatic updated_at Trigger for dka_users
CREATE OR REPLACE FUNCTION update_dka_users_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_dka_users_updated_at ON dka_users;
CREATE TRIGGER trigger_dka_users_updated_at
    BEFORE UPDATE ON dka_users
    FOR EACH ROW
    EXECUTE FUNCTION update_dka_users_timestamp();

-- =============================================================================
-- 2. VEHICLE TYPES CATALOG (dka_vehicle_types)
-- =============================================================================
CREATE TABLE IF NOT EXISTS dka_vehicle_types (
    vehicle_type_id SERIAL PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 3. DRIVERS & FLEET OWNERS (cr_owners, dka_owners & cr_drivers view)
-- Defined before dka_vehicles to satisfy foreign key dependencies
-- =============================================================================

-- Existing Partner Owners Table reference (cr_owners has 10 columns):
-- owner_id, full_name, phone_number, whatsapp_number, email,
-- citizenship_or_id_no, status, created_at, citizenship_doc_id, license_doc_id

-- Mobile App Owners Table (dka_owners) - Strictly identical schema to cr_owners
CREATE TABLE IF NOT EXISTS dka_owners (
    owner_id SERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    phone_number VARCHAR(30) UNIQUE NOT NULL,
    whatsapp_number VARCHAR(30),
    email VARCHAR(120),
    citizenship_or_id_no VARCHAR(50),
    status VARCHAR(30) NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'pending'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    citizenship_doc_id VARCHAR(100),
    license_doc_id VARCHAR(100)
);

-- Safely drop updated_at if it was previously created
ALTER TABLE dka_owners DROP COLUMN IF EXISTS updated_at;

CREATE INDEX IF NOT EXISTS idx_dka_owners_phone ON dka_owners(phone_number);
CREATE INDEX IF NOT EXISTS idx_dka_owners_status ON dka_owners(status);
CREATE INDEX IF NOT EXISTS idx_dka_owners_created_at ON dka_owners(created_at DESC);

-- Drop legacy timestamp triggers if any
DROP TRIGGER IF EXISTS trigger_dka_owners_updated_at ON dka_owners;
DROP FUNCTION IF EXISTS update_dka_owners_timestamp();

-- =============================================================================
-- BIDIRECTIONAL SYNCHRONIZATION TRIGGERS (cr_owners <-> dka_owners)
-- Recursion protected by pg_trigger_depth() > 1 and sequence aligned via setval
-- =============================================================================

-- Sync cr_owners -> dka_owners
CREATE OR REPLACE FUNCTION sync_cr_owners_to_dka_owners()
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

DROP TRIGGER IF EXISTS trg_sync_cr_to_dka_owners ON cr_owners;
CREATE TRIGGER trg_sync_cr_to_dka_owners
    AFTER INSERT OR UPDATE OR DELETE ON cr_owners
    FOR EACH ROW
    EXECUTE FUNCTION sync_cr_owners_to_dka_owners();

-- Sync dka_owners -> cr_owners
CREATE OR REPLACE FUNCTION sync_dka_owners_to_cr_owners()
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

DROP TRIGGER IF EXISTS trg_sync_dka_to_cr_owners ON dka_owners;
CREATE TRIGGER trg_sync_dka_to_cr_owners
    AFTER INSERT OR UPDATE OR DELETE ON dka_owners
    FOR EACH ROW
    EXECUTE FUNCTION sync_dka_owners_to_cr_owners();

-- Backward-compatibility VIEW: cr_drivers always mirrors cr_owners/dka_owners
CREATE OR REPLACE VIEW cr_drivers AS SELECT * FROM public.cr_owners;

-- =============================================================================
-- 4. VEHICLE FLEET INVENTORY (dka_vehicles) - Strictly matches cr_vehicles (11 columns)
-- =============================================================================
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

CREATE INDEX IF NOT EXISTS idx_dka_vehicles_plate ON dka_vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_dka_vehicles_owner ON dka_vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_dka_vehicles_type ON dka_vehicles(vehicle_type_id);
CREATE INDEX IF NOT EXISTS idx_dka_vehicles_active ON dka_vehicles(is_active);

-- Allow company fleet vehicles to exist without an assigned owner in cr_vehicles
ALTER TABLE IF EXISTS cr_vehicles ALTER COLUMN owner_id DROP NOT NULL;

-- Bidirectional Synchronization Triggers between cr_vehicles and dka_vehicles
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

DROP TRIGGER IF EXISTS trg_sync_cr_to_dka_vehicles ON cr_vehicles;
CREATE TRIGGER trg_sync_cr_to_dka_vehicles
    AFTER INSERT OR UPDATE OR DELETE ON cr_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION sync_cr_vehicles_to_dka_vehicles();

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

DROP TRIGGER IF EXISTS trg_sync_dka_to_cr_vehicles ON dka_vehicles;
CREATE TRIGGER trg_sync_dka_to_cr_vehicles
    AFTER INSERT OR UPDATE OR DELETE ON dka_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION sync_dka_vehicles_to_cr_vehicles();

-- =============================================================================
-- 5. BOOKINGS & TRIP RESERVATIONS (dka_bookings)
-- =============================================================================
CREATE TABLE IF NOT EXISTS dka_bookings (
    booking_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES dka_users(user_id) ON DELETE CASCADE,
    vehicle_type_id INTEGER REFERENCES dka_vehicle_types(vehicle_type_id) ON DELETE SET NULL,
    assigned_vehicle_id INTEGER REFERENCES dka_vehicles(vehicle_id) ON DELETE SET NULL,
    pickup_location VARCHAR(255) NOT NULL,
    dropoff_location VARCHAR(255) NOT NULL,
    pickup_date TIMESTAMP WITH TIME ZONE NOT NULL,
    pickup_time VARCHAR(20),
    return_date TIMESTAMP WITH TIME ZONE,
    passenger_count INTEGER NOT NULL DEFAULT 1,
    trip_type VARCHAR(50) NOT NULL DEFAULT 'One Way',
    estimated_fare VARCHAR(50),
    additional_details TEXT,
    rejection_reason TEXT,
    booking_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    assigned_vehicle_plate VARCHAR(50),
    assigned_vehicle_model VARCHAR(100),
    assigned_driver_id INTEGER REFERENCES cr_owners(owner_id) ON DELETE SET NULL,
    assigned_driver_name VARCHAR(120),
    assigned_driver_phone VARCHAR(30),
    final_fare VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dka_bookings_user_id ON dka_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_dka_bookings_status ON dka_bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_dka_bookings_pickup_date ON dka_bookings(pickup_date);
CREATE INDEX IF NOT EXISTS idx_dka_bookings_created_at ON dka_bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dka_bookings_user_status ON dka_bookings(user_id, booking_status);
CREATE INDEX IF NOT EXISTS idx_dka_bookings_assigned_vehicle ON dka_bookings(assigned_vehicle_id);
CREATE INDEX IF NOT EXISTS idx_dka_bookings_assigned_driver ON dka_bookings(assigned_driver_id);

-- Automatic updated_at Trigger for dka_bookings
CREATE OR REPLACE FUNCTION update_dka_bookings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_dka_bookings_updated_at ON dka_bookings;
CREATE TRIGGER trigger_dka_bookings_updated_at
    BEFORE UPDATE ON dka_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_dka_bookings_timestamp();

-- =============================================================================
-- 6. NOTIFICATIONS TABLE (dka_notifications)
-- =============================================================================
CREATE TABLE IF NOT EXISTS dka_notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES dka_users(user_id) ON DELETE CASCADE,
    booking_id INTEGER REFERENCES dka_bookings(booking_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'booking_update',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dka_notifications_user_id ON dka_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_dka_notifications_created_at ON dka_notifications(created_at DESC);

-- =============================================================================
-- 6.1 PUSH NOTIFICATION TOKENS (dka_push_tokens)
-- =============================================================================
CREATE TABLE IF NOT EXISTS dka_push_tokens (
    token_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES dka_users(user_id) ON DELETE CASCADE,
    push_token TEXT NOT NULL,
    device_type VARCHAR(20) DEFAULT 'mobile',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, push_token)
);

CREATE INDEX IF NOT EXISTS idx_dka_push_tokens_user ON dka_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_dka_push_tokens_token ON dka_push_tokens(push_token);

-- =============================================================================
-- 7. IDEMPOTENCY KEYS & NETWORK RETRIES (dka_idempotency_keys)
-- =============================================================================
CREATE TABLE IF NOT EXISTS dka_idempotency_keys (
    idempotency_key VARCHAR(128) PRIMARY KEY,
    user_id INTEGER REFERENCES dka_users(user_id) ON DELETE SET NULL,
    request_hash VARCHAR(64) NOT NULL,
    endpoint VARCHAR(100) NOT NULL DEFAULT '/api/bookings',
    status VARCHAR(30) NOT NULL DEFAULT 'processing', -- 'processing', 'completed', 'failed'
    response_code INTEGER,
    response_body JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_dka_idempotency_keys_user_id ON dka_idempotency_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_dka_idempotency_keys_expires_at ON dka_idempotency_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_dka_idempotency_keys_hash ON dka_idempotency_keys(request_hash);

-- =============================================================================
-- 8. HIMALAYAN EXPEDITION ROAD ADVISORIES (dka_road_advisories)
-- =============================================================================
CREATE TABLE IF NOT EXISTS dka_road_advisories (
    advisory_id SERIAL PRIMARY KEY,
    route_name VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'open', -- 'open', 'caution', 'closed'
    condition_summary TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'moderate', -- 'info', 'moderate', 'severe'
    updated_by INTEGER REFERENCES dka_users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dka_road_advisories_status ON dka_road_advisories(status);
CREATE INDEX IF NOT EXISTS idx_dka_road_advisories_created ON dka_road_advisories(created_at DESC);

-- Automatic updated_at Trigger for dka_road_advisories
CREATE OR REPLACE FUNCTION update_dka_road_advisories_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_dka_road_advisories_updated_at ON dka_road_advisories;
CREATE TRIGGER trigger_dka_road_advisories_updated_at
    BEFORE UPDATE ON dka_road_advisories
    FOR EACH ROW
    EXECUTE FUNCTION update_dka_road_advisories_timestamp();

-- =============================================================================
-- 9. SEED DATA (VEHICLE TYPES, FLEET, ADMIN ACCOUNTS, DRIVERS & ADVISORIES)
-- =============================================================================
INSERT INTO dka_vehicle_types (vehicle_type_id, type_name, description)
VALUES 
    (1, 'Sedan / Hatchback', 'Economical and comfortable for city rides and small groups (up to 4 passengers).'),
    (2, 'SUV / Scorpio 4x4', 'Rugged 4WD vehicles suited for rough terrain, hills, and Himalayan expeditions.'),
    (3, 'HiAce / Van', 'Spacious 14-seater vans for medium groups and family tours.'),
    (4, 'Coaster / Bus', 'Comfortable 25-35 seater tourist buses for large groups.')
ON CONFLICT (vehicle_type_id) DO NOTHING;

-- Initial backfill from existing cr_owners into dka_owners
INSERT INTO dka_owners (
    owner_id, full_name, phone_number, whatsapp_number, email,
    citizenship_or_id_no, status, created_at, citizenship_doc_id, license_doc_id
)
SELECT 
    owner_id, full_name, phone_number, whatsapp_number, email,
    citizenship_or_id_no, status, created_at, citizenship_doc_id, license_doc_id
FROM public.cr_owners
ON CONFLICT (owner_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone_number = EXCLUDED.phone_number,
    whatsapp_number = EXCLUDED.whatsapp_number,
    email = EXCLUDED.email,
    citizenship_or_id_no = EXCLUDED.citizenship_or_id_no,
    status = EXCLUDED.status,
    citizenship_doc_id = EXCLUDED.citizenship_doc_id,
    license_doc_id = EXCLUDED.license_doc_id;

SELECT setval(pg_get_serial_sequence('dka_owners', 'owner_id'), COALESCE(MAX(owner_id), 1)) FROM dka_owners;

-- Initial backfill from existing cr_vehicles into dka_vehicles
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

SELECT setval(pg_get_serial_sequence('dka_vehicles', 'vehicle_id'), COALESCE(MAX(vehicle_id), 1)) FROM dka_vehicles;

INSERT INTO dka_users (full_name, phone_number, email, password_hash, role, is_active, is_verified)
VALUES
    ('Samman Chhetri', '+977 9851363783', 'samman@drivekendra.com', '$2b$10$demoHashedPasswordSamman1234567890', 'customer', TRUE, TRUE),
    ('Drive Kendra Admin', '+977 9800000000', 'admin@drivekendra.com', 'c5ef7f208c0f6ff31c8d09a2779bc78fe60b4f2b7bde9d4b82b9ab281b9386dc', 'admin', TRUE, TRUE),
    ('Drive Kendra Admin', '9800000000', 'admin@drivekendra.com', 'c5ef7f208c0f6ff31c8d09a2779bc78fe60b4f2b7bde9d4b82b9ab281b9386dc', 'admin', TRUE, TRUE),
    ('Drive Kendra Admin', '+9779800000000', 'admin@drivekendra.com', 'c5ef7f208c0f6ff31c8d09a2779bc78fe60b4f2b7bde9d4b82b9ab281b9386dc', 'admin', TRUE, TRUE),
    ('Drive Kendra Admin', '9801000000', 'admin@drivekendra.com', 'c5ef7f208c0f6ff31c8d09a2779bc78fe60b4f2b7bde9d4b82b9ab281b9386dc', 'admin', TRUE, TRUE),
    ('Drive Kendra Admin', '+977 9801000000', 'admin@drivekendra.com', 'c5ef7f208c0f6ff31c8d09a2779bc78fe60b4f2b7bde9d4b82b9ab281b9386dc', 'admin', TRUE, TRUE),
    ('Drive Kendra Admin', '+9779801000000', 'admin@drivekendra.com', 'c5ef7f208c0f6ff31c8d09a2779bc78fe60b4f2b7bde9d4b82b9ab281b9386dc', 'admin', TRUE, TRUE)
ON CONFLICT (phone_number) DO UPDATE SET
    role = 'admin',
    password_hash = EXCLUDED.password_hash;

INSERT INTO dka_road_advisories (advisory_id, route_name, status, condition_summary, severity)
VALUES
    (1, 'BP Highway (Sindhuli Corridor)', 'caution', 'Single lane alternating traffic near Golanjor due to slope reinforcement. Expect 15-20 min delays.', 'moderate'),
    (2, 'Prithvi Highway (Kathmandu - Pokhara)', 'open', 'Both lanes clear. Road widening works underway between Mugling and Anbukhaireni.', 'info'),
    (3, 'Mustang / Muktinath 4x4 Trail', 'caution', 'High clearance 4x4 / Scorpio required. River crossings flowing moderately high after rainfall.', 'moderate')
ON CONFLICT (advisory_id) DO NOTHING;
