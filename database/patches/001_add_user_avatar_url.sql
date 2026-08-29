-- =============================================================================
-- Patch: 001_add_user_avatar_url.sql
-- Description: Add avatar_url column to dka_users for user profile picture storage
-- =============================================================================

ALTER TABLE dka_users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMENT ON COLUMN dka_users.avatar_url IS 'Custom avatar photo URL or storage URI for user profile customization';
