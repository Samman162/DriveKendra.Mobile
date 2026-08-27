-- =============================================================================
-- Drive Kendra Mobile App - Streamlined PostgreSQL Database Schema
-- File: database/database.sql
-- Description: Core 6-table optimized schema with user authentication tagging.
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
    role VARCHAR(30) NOT NULL DEFAULT 'customer', -- 'customer', 'driver', 'operator', 'admin'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    push_token VARCHAR(255),
    push_token_updated_at TIMESTAMP WITH TIME ZONE,
    device_platform VARCHAR(30), -- 'ios', 'android', 'web'
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dka_users_phone ON dka_users(phone_number);
CREATE INDEX IF NOT EXISTS idx_dka_users_email ON dka_users(email);
CREATE INDEX IF NOT EXISTS idx_dka_users_role ON dka_users(role);
CREATE INDEX IF NOT EXISTS idx_dka_users_push_token ON dka_users(push_token);
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
    return_date TIMESTAMP WITH TIME ZONE,
    passenger_count INTEGER NOT NULL DEFAULT 1,
    trip_type VARCHAR(50) NOT NULL DEFAULT 'One Way',
    additional_details TEXT,
    booking_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    assigned_driver_name VARCHAR(100),
    assigned_driver_phone VARCHAR(30),
    assigned_vehicle_plate VARCHAR(50),
    flight_number VARCHAR(50),
    flight_delay_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dka_bookings_user_id ON dka_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_dka_bookings_status ON dka_bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_dka_bookings_pickup_date ON dka_bookings(pickup_date);

-- =============================================================================
-- 4. REVIEWS & TESTIMONIALS (dka_reviews)
-- =============================================================================
CREATE TABLE IF NOT EXISTS dka_reviews (
    review_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES dka_users(user_id) ON DELETE SET NULL,
    customer_name VARCHAR(100) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    trip_title VARCHAR(150),
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dka_reviews_user_id ON dka_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_dka_reviews_approved ON dka_reviews(is_approved);

-- =============================================================================
-- 5. NOTIFICATIONS & AUDIT LOGS (dka_notifications)
-- =============================================================================
CREATE TABLE IF NOT EXISTS dka_notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES dka_users(user_id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_entity_id INTEGER,
    notification_type VARCHAR(100) NOT NULL,
    push_status VARCHAR(50) DEFAULT 'delivered',
    payload JSONB,
    ticket_id VARCHAR(255),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dka_notifications_unread ON dka_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_dka_notifications_user_id ON dka_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_dka_notifications_ticket_id ON dka_notifications(ticket_id);

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
-- 7. STORED FUNCTIONS & PROCEDURES (dka_get_public_stats)
-- =============================================================================
CREATE OR REPLACE FUNCTION dka_get_public_stats()
RETURNS TABLE (
    fleet_count BIGINT,
    completed_trips BIGINT,
    cities_covered BIGINT,
    review_count BIGINT,
    average_rating NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM dka_vehicle_types) AS fleet_count,
        (SELECT COUNT(*) FROM dka_bookings WHERE LOWER(booking_status) = 'completed') AS completed_trips,
        (SELECT COUNT(*) FROM (
            SELECT DISTINCT LOWER(TRIM(pickup_location)) AS loc FROM dka_bookings
            UNION
            SELECT DISTINCT LOWER(TRIM(dropoff_location)) FROM dka_bookings
        ) cities) AS cities_covered,
        (SELECT COUNT(*) FROM dka_reviews WHERE is_approved = TRUE) AS review_count,
        (SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0) FROM dka_reviews WHERE is_approved = TRUE) AS average_rating;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 8. SEED DATA (DEFAULT VEHICLE TYPES & DEMO USERS)
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
    ('Aarav Sharma', '+977 9851363783', 'aarav@drivekendra.com', '$2b$10$demoHashedPasswordAarav1234567890', 'customer', TRUE, TRUE),
    ('Suman Thapa', '+977 9841234567', 'suman@drivekendra.com', '$2b$10$demoHashedPasswordSuman1234567890', 'customer', TRUE, TRUE),
    ('Drive Kendra Admin', '+977 9801000000', 'admin@drivekendra.com', '$2b$10$demoHashedPasswordAdmin1234567890', 'admin', TRUE, TRUE)
ON CONFLICT (phone_number) DO NOTHING;
