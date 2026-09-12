-- ============================================================================
-- DRIVE KENDRA DATABASE PATCH 007: Allow NULL owner_id for company fleet
-- ============================================================================

-- Company-owned fleet vehicles in dka_vehicles have owner_id = NULL.
-- Align cr_vehicles constraint so company fleet synchronization succeeds.
ALTER TABLE cr_vehicles ALTER COLUMN owner_id DROP NOT NULL;
