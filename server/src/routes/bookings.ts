import { Hono } from 'hono';

import { withPublicClient } from '../db.js';
import {
  computeRequestHash,
  HttpError,
  parseBooking,
} from '../validation.js';

export const bookingsRoute = new Hono();

/**
 * GET /api/bookings
 * Retrieve user's booking history by userId or phoneNumber
 */
bookingsRoute.get('/', async (c) => {
  const userId = c.req.query('userId');
  const phoneNumber = c.req.query('phoneNumber');

  if (!userId && !phoneNumber) {
    throw new HttpError(400, 'Either userId or phoneNumber query parameter is required.');
  }

  const result = await withPublicClient(async (client) => {
    return await client.query<{
      booking_id: number;
      user_id: number;
      vehicle_type_id: number | null;
      type_name: string | null;
      pickup_location: string;
      dropoff_location: string;
      pickup_date: Date;
      pickup_time: string | null;
      return_date: Date | null;
      passenger_count: number;
      trip_type: string;
      estimated_fare: string | null;
      booking_status: string;
      assigned_driver_name: string | null;
      assigned_driver_phone: string | null;
      assigned_driver_rating: number | null;
      assigned_vehicle_plate: string | null;
      assigned_vehicle_model: string | null;
      created_at: Date;
    }>(
      `SELECT b.booking_id, b.user_id, b.vehicle_type_id, vt.type_name,
              b.pickup_location, b.dropoff_location, b.pickup_date, b.pickup_time, b.return_date,
              b.passenger_count, b.trip_type, b.estimated_fare, b.booking_status,
              b.assigned_driver_name, b.assigned_driver_phone, b.assigned_driver_rating,
              b.assigned_vehicle_plate, b.assigned_vehicle_model,
              b.created_at
       FROM dka_bookings b
       JOIN dka_users u ON b.user_id = u.user_id
       LEFT JOIN dka_vehicle_types vt ON b.vehicle_type_id = vt.vehicle_type_id
       WHERE ${userId ? 'b.user_id = $1' : 'u.phone_number = $1'}
       ORDER BY b.created_at DESC`,
      [userId ? Number(userId) : phoneNumber],
    );
  });

  return c.json({
    bookings: result.rows.map((row) => ({
      bookingId: row.booking_id,
      bookingRef: `DK-${new Date(row.created_at).getFullYear()}-${String(row.booking_id).padStart(4, '0')}`,
      userId: row.user_id,
      vehicleTypeId: row.vehicle_type_id,
      vehicleTypeName: row.type_name,
      pickupLocation: row.pickup_location,
      dropoffLocation: row.dropoff_location,
      pickupDate: row.pickup_date,
      pickupTime: row.pickup_time,
      returnDate: row.return_date,
      passengerCount: row.passenger_count,
      tripType: row.trip_type,
      estimatedFare: row.estimated_fare,
      status: row.booking_status,
      assignedDriverName: row.assigned_driver_name,
      assignedDriverPhone: row.assigned_driver_phone,
      assignedDriverRating: row.assigned_driver_rating ? Number(row.assigned_driver_rating) : 4.9,
      assignedVehiclePlate: row.assigned_vehicle_plate,
      assignedVehicleModel: row.assigned_vehicle_model,
      createdAt: row.created_at,
    })),
  });
});

/**
 * POST /api/bookings
 * Submit a new booking and atomically tag user profile & idempotency key
 */
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
         FROM dka_idempotency_keys
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
          `UPDATE dka_idempotency_keys
           SET status = 'processing',
               request_hash = $1,
               updated_at = NOW()
           WHERE idempotency_key = $2`,
          [requestHash, idempotencyKey],
        );
      } else {
        // Record new in-flight idempotency key
        await client.query(
          `INSERT INTO dka_idempotency_keys (idempotency_key, user_id, request_hash, endpoint, status, created_at, updated_at)
           VALUES ($1, $2, $3, '/api/bookings', 'processing', NOW(), NOW())`,
          [idempotencyKey, booking.user_id || null, requestHash],
        );
      }
    }

    // 2. Atomic Multi-Table Transaction
    await client.query('BEGIN');
    try {
      // Step 1: Upsert user record
      const userRes = await client.query<{ user_id: number }>(
        `INSERT INTO dka_users (full_name, phone_number, email)
         VALUES ($1, $2, $3)
         ON CONFLICT (phone_number)
         DO UPDATE SET
             full_name = EXCLUDED.full_name,
             email = COALESCE(NULLIF(EXCLUDED.email, ''), dka_users.email),
             updated_at = NOW()
         RETURNING user_id`,
        [booking.full_name, booking.phone_number, booking.email],
      );
      const userId = userRes.rows[0]?.user_id;
      if (!userId) {
        throw new HttpError(500, 'Failed to save traveler details.');
      }

      // Step 2: Insert booking tagged with user_id
      const bookingRecord = await client.query<{ booking_id: number; created_at: Date }>(
        `INSERT INTO dka_bookings (
            user_id, vehicle_type_id, pickup_location, dropoff_location,
            pickup_date, pickup_time, return_date, passenger_count, trip_type,
            estimated_fare, additional_details, booking_status
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Pending')
         RETURNING booking_id, created_at`,
        [
          userId,
          booking.vehicle_type_id,
          booking.pickup_location,
          booking.dropoff_location,
          booking.pickup_date,
          booking.pickup_time || null,
          booking.return_date,
          booking.passenger_count,
          booking.trip_type,
          booking.estimated_fare || null,
          booking.additional_details,
        ],
      );
      const bookingId = bookingRecord.rows[0]?.booking_id;
      if (!bookingId) {
        throw new HttpError(500, 'Failed to create booking reservation.');
      }

      const bookingRef = `DK-${new Date().getFullYear()}-${String(bookingId).padStart(4, '0')}`;
      const responseBody = {
        success: true,
        message: 'Booking submitted successfully',
        bookingId,
        bookingRef,
        userId,
        status: 'Pending',
      };

      // Step 3: Save completed state to idempotency table
      if (idempotencyKey) {
        await client.query(
          `UPDATE dka_idempotency_keys
           SET status = 'completed',
               user_id = $1,
               response_code = 201,
               response_body = $2,
               updated_at = NOW()
           WHERE idempotency_key = $3`,
          [userId, JSON.stringify(responseBody), idempotencyKey],
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
            `UPDATE dka_idempotency_keys
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
