-- =============================================================================
-- Drive Kendra Mobile App - Partner Car Rental Database Schema
-- File: database/cr_database.sql
-- Description: Core schema for external partner fleet owners and vehicles (cr_*)
-- =============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. PARTNER FLEET OWNERS / DRIVERS (cr_owners)
-- =============================================================================
CREATE TABLE IF NOT EXISTS cr_owners (
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

CREATE INDEX IF NOT EXISTS idx_cr_owners_phone ON cr_owners(phone_number);
CREATE INDEX IF NOT EXISTS idx_cr_owners_status ON cr_owners(status);
CREATE INDEX IF NOT EXISTS idx_cr_owners_created_at ON cr_owners(created_at DESC);

-- Backward-compatibility VIEW: cr_drivers mirrors cr_owners
CREATE OR REPLACE VIEW cr_drivers AS 
SELECT * FROM cr_owners;

-- =============================================================================
-- 2. PARTNER VEHICLE FLEET (cr_vehicles)
-- =============================================================================
CREATE TABLE IF NOT EXISTS cr_vehicles (
    vehicle_id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES cr_owners(owner_id) ON DELETE SET NULL,
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

CREATE INDEX IF NOT EXISTS idx_cr_vehicles_plate ON cr_vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_cr_vehicles_owner ON cr_vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_cr_vehicles_active ON cr_vehicles(is_active);
