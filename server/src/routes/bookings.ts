import { Hono } from 'hono';

import { withPublicClient } from '../db.js';
import { HttpError, parseBooking } from '../validation.js';

export const bookingsRoute = new Hono();

bookingsRoute.post('/', async (c) => {
  const booking = parseBooking(await c.req.json().catch(() => null));

  await withPublicClient(async (client) => {
    await client.query('BEGIN');
    try {
      const customer = await client.query<{ customer_id: number }>(
        `INSERT INTO cr_customers (full_name, phone_number, email)
         VALUES ($1, $2, $3)
         ON CONFLICT (phone_number)
         DO UPDATE SET email = COALESCE(NULLIF(EXCLUDED.email, ''), cr_customers.email)
         RETURNING customer_id`,
        [booking.full_name, booking.phone_number, booking.email],
      );
      const customerId = customer.rows[0]?.customer_id;
      if (!customerId) {
        throw new HttpError(500, 'Failed to save customer.');
      }

      await client.query(
        `INSERT INTO cr_bookings (
            customer_id, vehicle_type_id, pickup_location, dropoff_location,
            pickup_date, return_date, passenger_count, trip_type, additional_details, booking_status
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Pending')`,
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

      const bookingIdResult = await client.query<{ id: string }>(
        `SELECT currval(pg_get_serial_sequence('cr_bookings', 'booking_id')) AS id`,
      );
      const bookingId = Number(bookingIdResult.rows[0]?.id);
      if (!bookingId) {
        throw new HttpError(500, 'Failed to save booking.');
      }

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

      await client.query(
        `INSERT INTO cr_notifications (title, message, related_entity_id, notification_type, created_at, is_read)
         VALUES ($1, $2, $3, $4, NOW(), false)`,
        [
          'New Trip Request',
          `A new trip request was received from ${booking.full_name} for ${booking.pickup_date.toISOString().slice(0, 10)}.`,
          tripRequestId ?? null,
          'TripRequest',
        ],
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });

  return c.json({ message: 'Booking submitted successfully' }, 201);
});
