import { Hono } from 'hono';

import { withPublicClient } from '../db.js';
import {
  computeRequestHash,
  HttpError,
  parseBooking,
} from '../validation.js';

export const bookingsRoute = new Hono();

bookingsRoute.post('/', async (c) => {
  const rawIdempotencyKey = c.req.header('X-Idempotency-Key') || c.req.header('x-idempotency-key');
  const idempotencyKey = rawIdempotencyKey ? rawIdempotencyKey.trim() : null;

  const body = await c.req.json().catch(() => null);
  const booking = parseBooking(body);
  const requestHash = computeRequestHash(body);

  const result = await withPublicClient(async (client) => {
    // 1. Idempotency Check
    if (idempotencyKey) {
      const existingKeyRes = await client.query<{
        status: string;
        response_code: number;
        response_body: any;
      }>(
        `SELECT status, response_code, response_body
         FROM cr_idempotency_keys
         WHERE idempotency_key = $1`,
        [idempotencyKey],
      );

      if (existingKeyRes.rows.length > 0) {
        const row = existingKeyRes.rows[0];
        if (row.status === 'completed') {
          // Return cached response instantly for duplicate/retry submissions
          return {
            isCached: true,
            status: row.response_code || 201,
            body: row.response_body,
          };
        }

        if (row.status === 'processing') {
          throw new HttpError(
            409,
            'This booking request is currently being processed. Please wait a moment before retrying.',
          );
        }

        // If previously failed, mark as processing to retry
        await client.query(
          `UPDATE cr_idempotency_keys
           SET status = 'processing',
               request_hash = $1,
               updated_at = NOW()
           WHERE idempotency_key = $2`,
          [requestHash, idempotencyKey],
        );
      } else {
        // Record new in-flight idempotency key
        await client.query(
          `INSERT INTO cr_idempotency_keys (idempotency_key, request_hash, endpoint, status, created_at, updated_at)
           VALUES ($1, $2, '/api/bookings', 'processing', NOW(), NOW())`,
          [idempotencyKey, requestHash],
        );
      }
    }

    // 2. Atomic Multi-Table Transaction
    await client.query('BEGIN');
    try {
      // Step 1: Upsert customer
      const customer = await client.query<{ customer_id: number }>(
        `INSERT INTO cr_customers (full_name, phone_number, email)
         VALUES ($1, $2, $3)
         ON CONFLICT (phone_number)
         DO UPDATE SET
             full_name = EXCLUDED.full_name,
             email = COALESCE(NULLIF(EXCLUDED.email, ''), cr_customers.email),
             updated_at = NOW()
         RETURNING customer_id`,
        [booking.full_name, booking.phone_number, booking.email],
      );
      const customerId = customer.rows[0]?.customer_id;
      if (!customerId) {
        throw new HttpError(500, 'Failed to save customer details.');
      }

      // Step 2: Insert booking
      const bookingRecord = await client.query<{ booking_id: number; created_at: Date }>(
        `INSERT INTO cr_bookings (
            customer_id, vehicle_type_id, pickup_location, dropoff_location,
            pickup_date, return_date, passenger_count, trip_type, additional_details, booking_status
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Pending')
         RETURNING booking_id, created_at`,
        [
          customerId,
          booking.vehicle_type_id,
          booking.pickup_location,
          booking.dropoff_location,
          booking.pickup_date,
          booking.return_date,
          booking.passenger_count,
          booking.trip_type,
          booking.additional_details,
        ],
      );
      const bookingId = bookingRecord.rows[0]?.booking_id;
      if (!bookingId) {
        throw new HttpError(500, 'Failed to create booking reservation.');
      }

      // Step 3: Insert operational dispatch trip request
      const trip = await client.query<{ trip_request_id: number }>(
        `INSERT INTO cr_trip_requests (
            booking_id, customer_id, vehicle_type_id, pickup_location, dropoff_location,
            pickup_date, return_date, passenger_count, trip_type, additional_details, request_status
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Pending')
         RETURNING trip_request_id`,
        [
          bookingId,
          customerId,
          booking.vehicle_type_id,
          booking.pickup_location,
          booking.dropoff_location,
          booking.pickup_date,
          booking.return_date,
          booking.passenger_count,
          booking.trip_type,
          booking.additional_details,
        ],
      );
      const tripRequestId = trip.rows[0]?.trip_request_id;

      // Step 4: Insert admin notification
      await client.query(
        `INSERT INTO cr_notifications (title, message, related_entity_id, notification_type, created_at, is_read)
         VALUES ($1, $2, $3, $4, NOW(), false)`,
        [
          'New Trip Request',
          `New reservation received from ${booking.full_name} (${booking.pickup_location} ➔ ${booking.dropoff_location}) for ${booking.pickup_date.toISOString().slice(0, 10)}.`,
          tripRequestId ?? null,
          'TripRequest',
        ],
      );

      const bookingRef = `DK-${new Date().getFullYear()}-${String(bookingId).padStart(4, '0')}`;
      const responseBody = {
        success: true,
        message: 'Booking submitted successfully',
        bookingId,
        tripRequestId,
        bookingRef,
        status: 'Pending',
      };

      // Step 5: Save completed state to idempotency table
      if (idempotencyKey) {
        await client.query(
          `UPDATE cr_idempotency_keys
           SET status = 'completed',
               response_code = 201,
               response_body = $1,
               updated_at = NOW()
           WHERE idempotency_key = $2`,
          [JSON.stringify(responseBody), idempotencyKey],
        );
      }

      await client.query('COMMIT');

      return {
        isCached: false,
        status: 201,
        body: responseBody,
      };
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('[Bookings] Rollback error:', rollbackError);
      }

      // Mark idempotency key as failed so it can be retried cleanly
      if (idempotencyKey) {
        try {
          await client.query(
            `UPDATE cr_idempotency_keys
             SET status = 'failed',
                 updated_at = NOW()
             WHERE idempotency_key = $1`,
            [idempotencyKey],
          );
        } catch (idempUpdateErr) {
          console.error('[Bookings] Failed to update idempotency status:', idempUpdateErr);
        }
      }

      throw error;
    }
  });

  if (result.isCached) {
    c.header('X-Cache-Lookup', 'HIT');
  } else {
    c.header('X-Cache-Lookup', 'MISS');
  }

  return c.json(result.body, result.status as any);
});
