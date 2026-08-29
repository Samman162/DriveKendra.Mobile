-- =============================================================================
-- Patch: 002_alter_bookings_enhance_schema.sql
-- Description: Enhance dka_bookings with estimated fare, pickup time, vehicle model,
--              driver rating, auto-update trigger, and performance indexes.
-- =============================================================================

-- 1. Add estimated fare / target budget column
ALTER TABLE dka_bookings 
ADD COLUMN IF NOT EXISTS estimated_fare VARCHAR(50);

COMMENT ON COLUMN dka_bookings.estimated_fare IS 'Target budget or estimated trip fare (e.g. NPR 12,000 / Rs. 12,000)';

-- 2. Add pickup time string column
ALTER TABLE dka_bookings 
ADD COLUMN IF NOT EXISTS pickup_time VARCHAR(20);

COMMENT ON COLUMN dka_bookings.pickup_time IS 'Scheduled pickup time string (e.g. 07:00 AM, 02:30 PM)';

-- 3. Add assigned vehicle model column
ALTER TABLE dka_bookings 
ADD COLUMN IF NOT EXISTS assigned_vehicle_model VARCHAR(100);

COMMENT ON COLUMN dka_bookings.assigned_vehicle_model IS 'Assigned vehicle model details (e.g. Mahindra Scorpio 4x4, Toyota HiAce)';

-- 4. Add assigned driver rating column
ALTER TABLE dka_bookings 
ADD COLUMN IF NOT EXISTS assigned_driver_rating NUMERIC(2, 1) DEFAULT 4.9;

COMMENT ON COLUMN dka_bookings.assigned_driver_rating IS 'Chauffeur performance rating (e.g. 4.9)';

-- 5. Add automatic updated_at Trigger for dka_bookings
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

-- 6. Add composite & sorting performance indexes
CREATE INDEX IF NOT EXISTS idx_dka_bookings_created_at ON dka_bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dka_bookings_user_status ON dka_bookings(user_id, booking_status);
