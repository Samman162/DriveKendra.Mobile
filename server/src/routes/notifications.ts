import { Hono } from 'hono';
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
