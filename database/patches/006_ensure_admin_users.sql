-- ============================================================================
-- DRIVE KENDRA DATABASE PATCH 006: Ensure Admin Role
-- ============================================================================

-- Ensure all admin telephone and email variations are set to role = 'admin'
UPDATE dka_users
SET role = 'admin'
WHERE phone_number IN ('9800000000', '+977 9800000000', '+9779800000000', '9801000000', '+977 9801000000', '+9779801000000')
   OR LOWER(email) = 'admin@drivekendra.com';
