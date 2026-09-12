-- =============================================================================
-- Patch 005: Add missing assigned_vehicle_id, rejection_reason & notifications table
-- File: database/patches/005_add_missing_bookings_columns.sql
-- Description:
--   1. Adds assigned_vehicle_id column referencing dka_vehicles(vehicle_id).
--   2. Adds rejection_reason column for admin cancellations.
--   3. Adds index on assigned_vehicle_id.
--   4. Ensures dka_notifications table exists for booking alerts.
-- =============================================================================

ALTER TABLE dka_bookings
    ADD COLUMN IF NOT EXISTS assigned_vehicle_id INTEGER REFERENCES dka_vehicles(vehicle_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_dka_bookings_assigned_vehicle ON dka_bookings(assigned_vehicle_id);

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

ALTER TABLE dka_notifications ALTER COLUMN user_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dka_notifications_user_id ON dka_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_dka_notifications_created_at ON dka_notifications(created_at DESC);

