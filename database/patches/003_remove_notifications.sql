-- =============================================================================
-- Patch: 003_remove_notifications.sql
-- Description: Drop dka_notifications table and remove push notification columns
--              from dka_users.
-- =============================================================================

-- 1. Drop dka_notifications table and associated indexes
DROP TABLE IF EXISTS dka_notifications CASCADE;

-- 2. Drop push notification columns and index from dka_users
DROP INDEX IF EXISTS idx_dka_users_push_token;

ALTER TABLE dka_users 
DROP COLUMN IF EXISTS push_token,
DROP COLUMN IF EXISTS push_token_updated_at,
DROP COLUMN IF EXISTS device_platform;
