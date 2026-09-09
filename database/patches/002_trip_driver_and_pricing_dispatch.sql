-- =============================================================================
-- Patch 002: Trip Driver Assignment & Final Pricing Dispatch
-- File: database/patches/002_trip_driver_and_pricing_dispatch.sql
-- Description:
--   1. Adds assigned driver fields to dka_bookings (assigned_driver_id,
--      assigned_driver_name, assigned_driver_phone).
--   2. Adds final_fare column to dka_bookings for admin-negotiated price.
--   3. Adds foreign key constraint to cr_owners/dka_owners with safe index.
-- =============================================================================

ALTER TABLE dka_bookings 
    ADD COLUMN IF NOT EXISTS assigned_driver_id INTEGER REFERENCES cr_owners(owner_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS assigned_driver_name VARCHAR(120),
    ADD COLUMN IF NOT EXISTS assigned_driver_phone VARCHAR(30),
    ADD COLUMN IF NOT EXISTS final_fare VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_dka_bookings_assigned_driver 
    ON dka_bookings(assigned_driver_id);
