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
-- 3. VEHICLE FLEET INVENTORY (dka_vehicles)
-- =============================================================================
CREATE TABLE IF NOT EXISTS dka_vehicles (
    vehicle_id SERIAL PRIMARY KEY,
    vehicle_type_id INTEGER REFERENCES dka_vehicle_types(vehicle_type_id) ON DELETE SET NULL,
    model VARCHAR(100) NOT NULL,
    registration_plate VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'SUV', 'Sedan', 'HiAce', 'Bus'
    seats INTEGER NOT NULL DEFAULT 4,
    fuel_type VARCHAR(30) NOT NULL DEFAULT 'Diesel',
    image_url TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'available', -- 'available', 'assigned', 'in_transit', 'maintenance'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dka_vehicles_status ON dka_vehicles(status);
CREATE INDEX IF NOT EXISTS idx_dka_vehicles_category ON dka_vehicles(category);
CREATE INDEX IF NOT EXISTS idx_dka_vehicles_plate ON dka_vehicles(registration_plate);

-- Automatic updated_at Trigger for dka_vehicles
CREATE OR REPLACE FUNCTION update_dka_vehicles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_dka_vehicles_updated_at ON dka_vehicles;
CREATE TRIGGER trigger_dka_vehicles_updated_at
    BEFORE UPDATE ON dka_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_dka_vehicles_timestamp();

-- =============================================================================
-- 4. BOOKINGS & TRIP RESERVATIONS (dka_bookings)
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dka_bookings_user_id ON dka_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_dka_bookings_status ON dka_bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_dka_bookings_pickup_date ON dka_bookings(pickup_date);
CREATE INDEX IF NOT EXISTS idx_dka_bookings_created_at ON dka_bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dka_bookings_user_status ON dka_bookings(user_id, booking_status);
CREATE INDEX IF NOT EXISTS idx_dka_bookings_assigned_vehicle ON dka_bookings(assigned_vehicle_id);

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
-- 5. NOTIFICATIONS TABLE (dka_notifications)
-- =============================================================================
CREATE TABLE IF NOT EXISTS dka_notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES dka_users(user_id) ON DELETE CASCADE,
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
-- 6. IDEMPOTENCY KEYS & NETWORK RETRIES (dka_idempotency_keys)
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
-- 7. HIMALAYAN EXPEDITION ROAD ADVISORIES (dka_road_advisories)
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
-- 8. SEED DATA (VEHICLE TYPES, FLEET, ADMIN ACCOUNTS & ROAD ADVISORIES)
-- =============================================================================
INSERT INTO dka_vehicle_types (vehicle_type_id, type_name, description)
VALUES 
    (1, 'Sedan / Hatchback', 'Economical and comfortable for city rides and small groups (up to 4 passengers).'),
    (2, 'SUV / Scorpio 4x4', 'Rugged 4WD vehicles suited for rough terrain, hills, and Himalayan expeditions.'),
    (3, 'HiAce / Van', 'Spacious 14-seater vans for medium groups and family tours.'),
    (4, 'Coaster / Bus', 'Comfortable 25-35 seater tourist buses for large groups.')
ON CONFLICT (vehicle_type_id) DO NOTHING;

INSERT INTO dka_vehicles (model, registration_plate, category, seats, fuel_type, status, image_url)
VALUES
    ('Mahindra Scorpio S11 4x4', 'BA 2 PA 4521', 'SUV', 7, 'Diesel', 'available', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80'),
    ('Toyota HiAce Super GL Luxury', 'BA 3 PA 8820', 'HiAce', 14, 'Diesel', 'available', 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80'),
    ('Hyundai Creta Adventure Edition', 'BAGMATI-02-029 PA 1190', 'SUV', 5, 'Petrol', 'available', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80'),
    ('Toyota Coaster Tourist Coach', 'BA 1 KHA 9022', 'Bus', 28, 'Diesel', 'available', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80'),
    ('Suzuki Dzire VXi', 'BA 4 PA 3340', 'Sedan', 4, 'Petrol', 'maintenance', 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80')
ON CONFLICT (registration_plate) DO NOTHING;

INSERT INTO dka_users (full_name, phone_number, email, password_hash, role, is_active, is_verified)
VALUES
    ('Samman Chhetri', '+977 9851363783', 'samman@drivekendra.com', '$2b$10$demoHashedPasswordSamman1234567890', 'customer', TRUE, TRUE),
    ('Drive Kendra Admin', '+977 9800000000', 'admin@drivekendra.com', 'c5ef7f208c0f6ff31c8d09a2779bc78fe60b4f2b7bde9d4b82b9ab281b9386dc', 'admin', TRUE, TRUE)
ON CONFLICT (phone_number) DO UPDATE SET
    role = 'admin',
    password_hash = EXCLUDED.password_hash;

INSERT INTO dka_road_advisories (advisory_id, route_name, status, condition_summary, severity)
VALUES
    (1, 'BP Highway (Sindhuli Corridor)', 'caution', 'Single lane alternating traffic near Golanjor due to slope reinforcement. Expect 15-20 min delays.', 'moderate'),
    (2, 'Prithvi Highway (Kathmandu - Pokhara)', 'open', 'Both lanes clear. Road widening works underway between Mugling and Anbukhaireni.', 'info'),
    (3, 'Mustang / Muktinath 4x4 Trail', 'caution', 'High clearance 4x4 / Scorpio required. River crossings flowing moderately high after rainfall.', 'moderate')
ON CONFLICT (advisory_id) DO NOTHING;
