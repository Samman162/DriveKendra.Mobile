-- =============================================================================
-- Patch 009: Purge generic broadcast advisories and create dka_push_tokens
-- File: database/patches/009_clean_broadcast_notifications_and_add_push_tokens.sql
-- Description:
--   1. Removes generic weather and road condition broadcasts from dka_notifications,
--      ensuring notifications are strictly for trip lifecycle events.
--   2. Creates dka_push_tokens table to store mobile device push notification tokens.
-- =============================================================================

-- 1. Remove non-trip generic advisories and broadcasts
DELETE FROM dka_notifications
WHERE type IN ('broadcast', 'admin_broadcast', 'road_advisory', 'weather')
   OR title ILIKE '%safety advisory%'
   OR title ILIKE '%weather%'
   OR title ILIKE '%prithvi highway%'
   OR message ILIKE '%rainfall%'
   OR message ILIKE '%mugling%';

-- 2. Create dka_push_tokens table for push notification dispatch
CREATE TABLE IF NOT EXISTS dka_push_tokens (
    token_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES dka_users(user_id) ON DELETE CASCADE,
    push_token TEXT NOT NULL,
    device_type VARCHAR(20) DEFAULT 'mobile',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, push_token)
);

CREATE INDEX IF NOT EXISTS idx_dka_push_tokens_user ON dka_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_dka_push_tokens_token ON dka_push_tokens(push_token);
