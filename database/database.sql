-- =============================================================================
-- Drive Kendra - Core PostgreSQL Database Schema
-- File: database/database.sql
-- Description: Complete schema definitions, indexes, and functions for Drive Kendra.
-- Note: Canonical base schema. Incremental patches are placed in database/patches/
--       until applied, then integrated here and cleaned up.
-- =============================================================================

-- Enable UUID extension if required
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. VEHICLE TYPES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS cr_vehicle_types (
    vehicle_type_id SERIAL PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 2. VEHICLES (FLEET) TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS cr_vehicles (
    vehicle_id SERIAL PRIMARY KEY,
    vehicle_type_id INTEGER REFERENCES cr_vehicle_types(vehicle_type_id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    plate_number VARCHAR(50) UNIQUE,
    capacity INTEGER NOT NULL DEFAULT 4,
    luggage_capacity INTEGER NOT NULL DEFAULT 2,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 3. CUSTOMERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS cr_customers (
    customer_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(30) UNIQUE NOT NULL,
    email VARCHAR(100),
    push_token VARCHAR(255),
    push_token_updated_at TIMESTAMP WITH TIME ZONE,
    device_platform VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cr_customers_phone ON cr_customers(phone_number);
CREATE INDEX IF NOT EXISTS idx_cr_customers_push_token ON cr_customers(push_token);

-- =============================================================================
-- 4. BOOKINGS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS cr_bookings (
    booking_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES cr_customers(customer_id) ON DELETE CASCADE,
    vehicle_type_id INTEGER REFERENCES cr_vehicle_types(vehicle_type_id) ON DELETE SET NULL,
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

CREATE INDEX IF NOT EXISTS idx_cr_bookings_customer_id ON cr_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_cr_bookings_status ON cr_bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_cr_bookings_pickup_date ON cr_bookings(pickup_date);

-- =============================================================================
-- 5. TRIP REQUESTS (OPERATIONAL DISPATCH) TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS cr_trip_requests (
    trip_request_id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES cr_bookings(booking_id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES cr_customers(customer_id) ON DELETE SET NULL,
    vehicle_type_id INTEGER REFERENCES cr_vehicle_types(vehicle_type_id) ON DELETE SET NULL,
    pickup_location VARCHAR(255) NOT NULL,
    dropoff_location VARCHAR(255) NOT NULL,
    pickup_date TIMESTAMP WITH TIME ZONE NOT NULL,
    return_date TIMESTAMP WITH TIME ZONE,
    passenger_count INTEGER NOT NULL DEFAULT 1,
    trip_type VARCHAR(50) NOT NULL DEFAULT 'One Way',
    additional_details TEXT,
    request_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cr_trip_requests_booking_id ON cr_trip_requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_cr_trip_requests_status ON cr_trip_requests(request_status);

-- =============================================================================
-- 6. REVIEWS & TESTIMONIALS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS cr_reviews (
    review_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    trip_title VARCHAR(150),
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cr_reviews_approved ON cr_reviews(is_approved);

-- =============================================================================
-- 7. NOTIFICATIONS & AUDIT LOG TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS cr_notifications (
    notification_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES cr_customers(customer_id) ON DELETE SET NULL,
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

CREATE INDEX IF NOT EXISTS idx_cr_notifications_unread ON cr_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_cr_notifications_customer_id ON cr_notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_cr_notifications_ticket_id ON cr_notifications(ticket_id);

-- =============================================================================
-- 8. IDEMPOTENCY KEYS (DEDUPLICATION & TRANSACTION RETRIES) TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS cr_idempotency_keys (
    idempotency_key VARCHAR(128) PRIMARY KEY,
    request_hash VARCHAR(64) NOT NULL,
    endpoint VARCHAR(100) NOT NULL DEFAULT '/api/bookings',
    status VARCHAR(30) NOT NULL DEFAULT 'processing', -- 'processing', 'completed', 'failed'
    response_code INTEGER,
    response_body JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_cr_idempotency_keys_expires_at ON cr_idempotency_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_cr_idempotency_keys_hash ON cr_idempotency_keys(request_hash);

-- =============================================================================
-- 9. STORED FUNCTIONS & PROCEDURES
-- =============================================================================
CREATE OR REPLACE FUNCTION cr_get_public_stats()
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
        (SELECT COUNT(*) FROM cr_vehicles WHERE is_active = TRUE) AS fleet_count,
        (SELECT COUNT(*) FROM cr_trip_requests WHERE LOWER(request_status) = 'completed') AS completed_trips,
        (SELECT COUNT(*) FROM (
            SELECT DISTINCT LOWER(TRIM(pickup_location)) AS loc FROM cr_trip_requests
            UNION
            SELECT DISTINCT LOWER(TRIM(dropoff_location)) FROM cr_trip_requests
        ) cities) AS cities_covered,
        (SELECT COUNT(*) FROM cr_reviews WHERE is_approved = TRUE) AS review_count,
        (SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0) FROM cr_reviews WHERE is_approved = TRUE) AS average_rating;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 10. SEED DATA (DEFAULT VEHICLE TYPES)
-- =============================================================================
INSERT INTO cr_vehicle_types (vehicle_type_id, type_name, description)
VALUES 
    (1, 'Sedan / Hatchback', 'Economical and comfortable for city rides and small groups (up to 4 passengers).'),
    (2, 'SUV / Scorpio 4x4', 'Rugged 4WD vehicles suited for rough terrain, hills, and Himalayan expeditions.'),
    (3, 'HiAce / Van', 'Spacious 14-seater vans for medium groups and family tours.'),
    (4, 'Coaster / Bus', 'Comfortable 25-35 seater tourist buses for large groups.')
ON CONFLICT (vehicle_type_id) DO NOTHING;
