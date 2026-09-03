-- =============================================================================
-- Drive Kendra Mobile App - Streamlined PostgreSQL Database Schema
-- File: database/database.sql
-- Description: Core 4-table optimized schema with user authentication tagging.
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
-- 3. BOOKINGS & TRIP RESERVATIONS (dka_bookings)
-- =============================================================================
CREATE TABLE IF NOT EXISTS dka_bookings (
    booking_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES dka_users(user_id) ON DELETE CASCADE,
    vehicle_type_id INTEGER REFERENCES dka_vehicle_types(vehicle_type_id) ON DELETE SET NULL,
    pickup_location VARCHAR(255) NOT NULL,
    dropoff_location VARCHAR(255) NOT NULL,
    pickup_date TIMESTAMP WITH TIME ZONE NOT NULL,
    pickup_time VARCHAR(20),
    return_date TIMESTAMP WITH TIME ZONE,
    passenger_count INTEGER NOT NULL DEFAULT 1,
    trip_type VARCHAR(50) NOT NULL DEFAULT 'One Way',
    estimated_fare VARCHAR(50),
    additional_details TEXT,
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
-- 4. IDEMPOTENCY KEYS & NETWORK RETRIES (dka_idempotency_keys)
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
-- 5. SEED DATA (DEFAULT VEHICLE TYPES & DEMO USERS)
-- =============================================================================
INSERT INTO dka_vehicle_types (vehicle_type_id, type_name, description)
VALUES 
    (1, 'Sedan / Hatchback', 'Economical and comfortable for city rides and small groups (up to 4 passengers).'),
    (2, 'SUV / Scorpio 4x4', 'Rugged 4WD vehicles suited for rough terrain, hills, and Himalayan expeditions.'),
    (3, 'HiAce / Van', 'Spacious 14-seater vans for medium groups and family tours.'),
    (4, 'Coaster / Bus', 'Comfortable 25-35 seater tourist buses for large groups.')
ON CONFLICT (vehicle_type_id) DO NOTHING;

INSERT INTO dka_users (full_name, phone_number, email, password_hash, role, is_active, is_verified)
VALUES
    ('Samman Chhetri', '+977 9851363783', 'samman@drivekendra.com', '$2b$10$demoHashedPasswordSamman1234567890', 'customer', TRUE, TRUE),
    ('Drive Kendra Admin', '+977 9801000000', 'admin@drivekendra.com', '$2b$10$demoHashedPasswordAdmin1234567890', 'admin', TRUE, TRUE)
ON CONFLICT (phone_number) DO NOTHING;
