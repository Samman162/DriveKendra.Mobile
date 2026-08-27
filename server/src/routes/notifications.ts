import { Hono } from 'hono';
import { withPublicClient } from '../db.js';
import {
  triggerBookingConfirmedNotification,
  triggerDriverAssignedNotification,
  trigger24HourReminderNotification,
  triggerFlightDelayAlertNotification,
  verifyPushReceipts,
} from '../services/notifications.js';
import {
  bookingStatusTriggerSchema,
  driverAssignTriggerSchema,
  flightDelayTriggerSchema,
  HttpError,
  tripReminderTriggerSchema,
} from '../validation.js';

export const notificationsRoute = new Hono();

/**
 * GET /api/notifications
 * Fetch in-app notifications for a user
 */
notificationsRoute.get('/', async (c) => {
  const userId = c.req.query('userId');

  if (!userId) {
    throw new HttpError(400, 'userId query parameter is required.');
  }

  const result = await withPublicClient(async (client) => {
    return await client.query<{
      notification_id: number;
      user_id: number;
      title: string;
      message: string;
      related_entity_id: number | null;
      notification_type: string;
      push_status: string;
      payload: any;
      is_read: boolean;
      created_at: Date;
    }>(
      `SELECT notification_id, user_id, title, message, related_entity_id,
              notification_type, push_status, payload, is_read, created_at
       FROM dka_notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [Number(userId)],
    );
  });

  return c.json({
    notifications: result.rows.map((row) => ({
      id: row.notification_id,
      userId: row.user_id,
      title: row.title,
      message: row.message,
      relatedEntityId: row.related_entity_id,
      type: row.notification_type,
      pushStatus: row.push_status,
      payload: row.payload,
      isRead: row.is_read,
      createdAt: row.created_at,
    })),
  });
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a notification as read
 */
notificationsRoute.patch('/:id/read', async (c) => {
  const notificationId = Number(c.req.param('id'));
  if (!notificationId || isNaN(notificationId)) {
    throw new HttpError(400, 'Valid notification ID is required.');
  }

  await withPublicClient(async (client) => {
    await client.query(
      `UPDATE dka_notifications SET is_read = TRUE WHERE notification_id = $1`,
      [notificationId],
    );
  });

  return c.json({ success: true, message: 'Notification marked as read.' });
});

/**
 * POST /api/notifications/dispatch-booking-status
 * Trigger status change notification (e.g. Pending -> Confirmed)
 */
notificationsRoute.post('/dispatch-booking-status', async (c) => {
  const body = await c.req.json().catch(() => null);
  const result = bookingStatusTriggerSchema.safeParse(body);

  if (!result.success) {
    throw new HttpError(400, result.error.issues[0]?.message || 'Invalid booking status dispatch payload.');
  }

  const { bookingId, status } = result.data;

  if (status === 'Confirmed') {
    const dispatchResult = await triggerBookingConfirmedNotification(bookingId);
    return c.json({
      message: `Booking #${bookingId} status changed to Confirmed. Notification dispatched.`,
      result: dispatchResult,
    });
  }

  return c.json({
    message: `Status updated to ${status}.`,
  });
});

/**
 * POST /api/notifications/dispatch-driver-assigned
 * Trigger driver assignment alert (includes driver name, direct phone link, vehicle plate)
 */
notificationsRoute.post('/dispatch-driver-assigned', async (c) => {
  const body = await c.req.json().catch(() => null);
  const result = driverAssignTriggerSchema.safeParse(body);

  if (!result.success) {
    throw new HttpError(400, result.error.issues[0]?.message || 'Invalid driver assignment payload.');
  }

  const dispatchResult = await triggerDriverAssignedNotification(result.data.bookingId, {
    driverName: result.data.driverName,
    driverPhone: result.data.driverPhone,
    vehiclePlate: result.data.vehiclePlate,
    vehicleModel: result.data.vehicleModel,
  });

  return c.json({
    message: `Driver assigned for Booking #${result.data.bookingId}. Notification dispatched.`,
    result: dispatchResult,
  });
});

/**
 * POST /api/notifications/dispatch-trip-reminder
 * Trigger 24-hour upcoming trip reminder alert
 */
notificationsRoute.post('/dispatch-trip-reminder', async (c) => {
  const body = await c.req.json().catch(() => null);
  const result = tripReminderTriggerSchema.safeParse(body);

  if (!result.success) {
    throw new HttpError(400, result.error.issues[0]?.message || 'Invalid trip reminder payload.');
  }

  const dispatchResult = await trigger24HourReminderNotification(result.data.bookingId);

  return c.json({
    message: `24-hour reminder dispatched for Booking #${result.data.bookingId}.`,
    result: dispatchResult,
  });
});

/**
 * POST /api/notifications/dispatch-flight-delay
 * Trigger Tribhuvan International Airport (TIA) flight delay alert
 */
notificationsRoute.post('/dispatch-flight-delay', async (c) => {
  const body = await c.req.json().catch(() => null);
  const result = flightDelayTriggerSchema.safeParse(body);

  if (!result.success) {
    throw new HttpError(400, result.error.issues[0]?.message || 'Invalid flight delay payload.');
  }

  const dispatchResult = await triggerFlightDelayAlertNotification(result.data.bookingId, {
    flightNumber: result.data.flightNumber,
    delayMinutes: result.data.delayMinutes,
    newArrivalTime: result.data.newArrivalTime,
    airline: result.data.airline,
  });

  return c.json({
    message: `Flight delay alert dispatched for Booking #${result.data.bookingId}.`,
    result: dispatchResult,
  });
});

/**
 * POST /api/notifications/verify-receipts
 * Check delivery receipts by ticket IDs
 */
notificationsRoute.post('/verify-receipts', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const receiptIds = Array.isArray(body.receiptIds) ? body.receiptIds : [];

  if (receiptIds.length === 0) {
    throw new HttpError(400, 'receiptIds array is required.');
  }

  const receipts = await verifyPushReceipts(receiptIds);

  return c.json({ receipts });
});
