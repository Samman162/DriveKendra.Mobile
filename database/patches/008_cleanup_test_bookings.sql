-- ============================================================================
-- DRIVE KENDRA DATABASE PATCH 008: Purge ephemeral test bookings
-- ============================================================================

-- Clean up automated test bookings and ephemeral audit records
-- Preserves real demo customer bookings (such as Samman Chhetri, user_id = 4, booking_id = 27)

DELETE FROM dka_notifications WHERE booking_id IN (
  SELECT booking_id FROM dka_bookings
  WHERE user_id IN (14, 22, 23, 24, 25, 26, 27, 28)
     OR additional_details ILIKE '%audit%'
     OR additional_details ILIKE '%automated%'
);

DELETE FROM dka_bookings
WHERE user_id IN (14, 22, 23, 24, 25, 26, 27, 28)
   OR additional_details ILIKE '%audit%'
   OR additional_details ILIKE '%automated%';

DELETE FROM dka_users
WHERE user_id IN (14, 22, 23, 24, 25, 26, 27, 28)
  AND (
    full_name ILIKE '%Test Passenger%'
    OR full_name ILIKE '%Audit%'
    OR phone_number LIKE '%9811223344%'
  );
