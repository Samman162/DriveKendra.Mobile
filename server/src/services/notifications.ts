import { Expo, type ExpoPushMessage, type ExpoPushTicket, type ExpoPushReceipt } from 'expo-server-sdk';
import { withPublicClient } from '../db.js';

// Initialize the Expo Server SDK client
const expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN || undefined,
  useFcmV1: true,
});

export interface NotificationPayload {
  screen?: string;
  bookingId?: number | string;
  eventType?: string;
  url?: string;
  driverName?: string;
  driverPhone?: string;
  vehiclePlate?: string;
  flightNumber?: string;
  delayMinutes?: number;
  [key: string]: any;
}

export interface SendPushNotificationOptions {
  pushToken: string;
  title: string;
  body: string;
  data?: NotificationPayload;
  channelId?: string;
  sound?: 'default' | null;
  priority?: 'default' | 'normal' | 'high';
  userId?: number;
  relatedEntityId?: number;
  notificationType?: string;
}

export interface DispatchResult {
  success: boolean;
  ticketId?: string;
  error?: string;
  deviceInvalidated?: boolean;
}

export interface DriverAssignmentDetails {
  driverName: string;
  driverPhone: string;
  vehiclePlate: string;
  vehicleModel?: string;
}

export interface FlightDelayDetails {
  flightNumber: string;
  delayMinutes: number;
  newArrivalTime?: string;
  airline?: string;
}

/**
 * Remove invalid or unregistered push tokens from user records
 */
export async function invalidatePushToken(pushToken: string): Promise<void> {
  try {
    await withPublicClient(async (client) => {
      await client.query(
        `UPDATE dka_users 
         SET push_token = NULL, 
             push_token_updated_at = NOW(),
             updated_at = NOW()
         WHERE push_token = $1`,
        [pushToken],
      );
    });
    console.info(`[PushDispatcher] Invalidated obsolete push token: ${pushToken}`);
  } catch (error) {
    console.error('[PushDispatcher] Failed to invalidate push token:', error);
  }
}

/**
 * Audit log push notification into PostgreSQL dka_notifications table
 */
export async function logNotificationToDb(params: {
  userId?: number | null;
  title: string;
  message: string;
  relatedEntityId?: number | null;
  notificationType: string;
  pushStatus: string;
  payload?: any;
  ticketId?: string | null;
}): Promise<void> {
  try {
    await withPublicClient(async (client) => {
      await client.query(
        `INSERT INTO dka_notifications (
            user_id, title, message, related_entity_id, 
            notification_type, push_status, payload, ticket_id, is_read, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, NOW())`,
        [
          params.userId ?? null,
          params.title,
          params.message,
          params.relatedEntityId ?? null,
          params.notificationType,
          params.pushStatus,
          params.payload ? JSON.stringify(params.payload) : null,
          params.ticketId ?? null,
        ],
      );
    });
  } catch (error) {
    console.error('[PushDispatcher] Failed to write notification audit log:', error);
  }
}

/**
 * Core Batch Push Notification Dispatcher
 * Validates tokens, chunks messages (max 100 per batch), and inspects tickets.
 */
export async function dispatchBatchPushNotifications(
  notifications: SendPushNotificationOptions[],
): Promise<DispatchResult[]> {
  const validMessages: ExpoPushMessage[] = [];
  const messageMetadata: SendPushNotificationOptions[] = [];
  const results: DispatchResult[] = [];

  for (const item of notifications) {
    if (!Expo.isExpoPushToken(item.pushToken)) {
      console.warn(`[PushDispatcher] Token "${item.pushToken}" is not a valid Expo push token.`);
      results.push({ success: false, error: 'Invalid Expo push token format.' });
      continue;
    }

    validMessages.push({
      to: item.pushToken,
      sound: item.sound ?? 'default',
      title: item.title,
      body: item.body,
      data: item.data ?? {},
      channelId: item.channelId ?? 'trip_updates',
      priority: item.priority ?? 'high',
    });
    messageMetadata.push(item);
  }

  if (validMessages.length === 0) {
    return results;
  }

  // Chunk messages into batches of max 100 for Expo Server API
  const chunks = expo.chunkPushNotifications(validMessages);
  let metadataIndex = 0;

  for (const chunk of chunks) {
    try {
      const ticketChunk: ExpoPushTicket[] = await expo.sendPushNotificationsAsync(chunk);

      for (let i = 0; i < ticketChunk.length; i++) {
        const ticket = ticketChunk[i];
        const meta = messageMetadata[metadataIndex++];

        if (ticket.status === 'ok') {
          results.push({
            success: true,
            ticketId: ticket.id,
          });

          await logNotificationToDb({
            userId: meta.userId,
            title: meta.title,
            message: meta.body,
            relatedEntityId: meta.relatedEntityId,
            notificationType: meta.notificationType || 'PushAlert',
            pushStatus: 'ok',
            payload: meta.data,
            ticketId: ticket.id,
          });
        } else if (ticket.status === 'error') {
          const errorCode = ticket.details?.error;
          console.error(`[PushDispatcher] Ticket error for token ${meta.pushToken}:`, ticket.message, errorCode);

          let deviceInvalidated = false;
          if (errorCode === 'DeviceNotRegistered') {
            await invalidatePushToken(meta.pushToken);
            deviceInvalidated = true;
          }

          results.push({
            success: false,
            error: ticket.message,
            deviceInvalidated,
          });

          await logNotificationToDb({
            userId: meta.userId,
            title: meta.title,
            message: meta.body,
            relatedEntityId: meta.relatedEntityId,
            notificationType: meta.notificationType || 'PushAlert',
            pushStatus: `error: ${ticket.message}`,
            payload: meta.data,
          });
        }
      }
    } catch (chunkError: any) {
      console.error('[PushDispatcher] Network error during chunk dispatch:', chunkError);
      for (let i = 0; i < chunk.length; i++) {
        const meta = messageMetadata[metadataIndex++];
        results.push({
          success: false,
          error: chunkError.message || 'Chunk dispatch network error',
        });
      }
    }
  }

  return results;
}

/**
 * Asynchronous Receipt Verifier
 * Collects and checks delivery receipts to confirm delivery and diagnose failures.
 */
export async function verifyPushReceipts(receiptIds: string[]): Promise<Record<string, ExpoPushReceipt>> {
  const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
  const receipts: Record<string, ExpoPushReceipt> = {};

  for (const chunk of receiptIdChunks) {
    try {
      const receiptChunk = await expo.getPushNotificationReceiptsAsync(chunk);
      for (const [receiptId, receipt] of Object.entries(receiptChunk)) {
        const receiptItem = receipt as ExpoPushReceipt;
        receipts[receiptId] = receiptItem;
        if (receiptItem.status === 'error') {
          const errReceipt = receiptItem as { status: 'error'; message?: string; details?: { error?: string } };
          console.error(`[PushReceipt] Error for receipt ${receiptId}:`, errReceipt.message, errReceipt.details?.error);
          if (errReceipt.details?.error === 'DeviceNotRegistered') {
            // Update database notification status
            await withPublicClient(async (client) => {
              await client.query(
                `UPDATE dka_notifications SET push_status = 'failed: DeviceNotRegistered' WHERE ticket_id = $1`,
                [receiptId],
              );
            });
          }
        }
      }
    } catch (error) {
      console.error('[PushReceipt] Error fetching receipt chunk:', error);
    }
  }

  return receipts;
}

/**
 * Helper: Fetch booking and user details from PostgreSQL
 */
async function getBookingRecipient(bookingId: number) {
  return await withPublicClient(async (client) => {
    const result = await client.query<{
      booking_id: number;
      pickup_location: string;
      dropoff_location: string;
      pickup_date: Date;
      booking_status: string;
      trip_type: string;
      user_id: number;
      full_name: string;
      phone_number: string;
      email: string | null;
      push_token: string | null;
      type_name: string | null;
    }>(
      `SELECT b.booking_id, b.pickup_location, b.dropoff_location, b.pickup_date, b.booking_status,
              b.trip_type, u.user_id, u.full_name, u.phone_number, u.email, u.push_token,
              vt.type_name
       FROM dka_bookings b
       JOIN dka_users u ON b.user_id = u.user_id
       LEFT JOIN dka_vehicle_types vt ON b.vehicle_type_id = vt.vehicle_type_id
       WHERE b.booking_id = $1`,
      [bookingId],
    );

    return result.rows[0] || null;
  });
}

// =============================================================================
// KEY CUSTOMER LIFECYCLE EVENT TRIGGERS
// =============================================================================

/**
 * 1. Booking Status Change Trigger (Pending ➔ Confirmed)
 */
export async function triggerBookingConfirmedNotification(
  bookingId: number,
): Promise<DispatchResult> {
  const recipient = await getBookingRecipient(bookingId);
  if (!recipient) {
    return { success: false, error: `Booking #${bookingId} not found.` };
  }

  // Update status in dka_bookings
  await withPublicClient(async (client) => {
    await client.query(
      `UPDATE dka_bookings 
       SET booking_status = 'Confirmed', updated_at = NOW() 
       WHERE booking_id = $1`,
      [bookingId],
    );
  });

  if (!recipient.push_token) {
    console.info(`[PushDispatcher] User #${recipient.user_id} has no registered push token.`);
    return { success: true, error: 'User has no active push token registered.' };
  }

  const pickupFormatted = new Date(recipient.pickup_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const payload: NotificationPayload = {
    screen: 'MyTrips',
    bookingId: recipient.booking_id,
    eventType: 'booking_confirmed',
    url: `drivekendra://trips/${recipient.booking_id}`,
  };

  const [result] = await dispatchBatchPushNotifications([
    {
      pushToken: recipient.push_token,
      userId: recipient.user_id,
      relatedEntityId: recipient.booking_id,
      notificationType: 'BookingConfirmed',
      title: 'Booking Confirmed! 🚗',
      body: `Your ride to ${recipient.dropoff_location} on ${pickupFormatted} has been confirmed. Tap to view trip details.`,
      channelId: 'trip_updates',
      sound: 'default',
      priority: 'high',
      data: payload,
    },
  ]);

  return result;
}

/**
 * 2. Driver & Vehicle Assignment Trigger
 * Sends driver name, direct phone link, and vehicle plate number.
 */
export async function triggerDriverAssignedNotification(
  bookingId: number,
  details: DriverAssignmentDetails,
): Promise<DispatchResult> {
  const recipient = await getBookingRecipient(bookingId);
  if (!recipient) {
    return { success: false, error: `Booking #${bookingId} not found.` };
  }

  // Update booking record with assigned driver info
  await withPublicClient(async (client) => {
    await client.query(
      `UPDATE dka_bookings 
       SET assigned_driver_name = $1,
           assigned_driver_phone = $2,
           assigned_vehicle_plate = $3,
           updated_at = NOW()
       WHERE booking_id = $4`,
      [details.driverName, details.driverPhone, details.vehiclePlate, bookingId],
    );
  });

  if (!recipient.push_token) {
    return { success: true, error: 'User has no active push token registered.' };
  }

  const payload: NotificationPayload = {
    screen: 'MyTrips',
    bookingId: recipient.booking_id,
    eventType: 'driver_assigned',
    driverName: details.driverName,
    driverPhone: details.driverPhone,
    vehiclePlate: details.vehiclePlate,
    vehicleModel: details.vehicleModel,
    telUri: `tel:${details.driverPhone}`,
    url: `drivekendra://trips/${recipient.booking_id}`,
  };

  const vehicleLabel = details.vehicleModel
    ? `${details.vehicleModel} (${details.vehiclePlate})`
    : details.vehiclePlate;

  const [result] = await dispatchBatchPushNotifications([
    {
      pushToken: recipient.push_token,
      userId: recipient.user_id,
      relatedEntityId: recipient.booking_id,
      notificationType: 'DriverAssigned',
      title: 'Driver Assigned for Your Trip 👤',
      body: `Chauffeur ${details.driverName} is assigned (${vehicleLabel}). Call directly: ${details.driverPhone}. Tap to view full profile.`,
      channelId: 'trip_updates',
      sound: 'default',
      priority: 'high',
      data: payload,
    },
  ]);

  return result;
}

/**
 * 3. 24-Hour Upcoming Trip Reminder Trigger
 */
export async function trigger24HourReminderNotification(
  bookingId: number,
): Promise<DispatchResult> {
  const recipient = await getBookingRecipient(bookingId);
  if (!recipient) {
    return { success: false, error: `Booking #${bookingId} not found.` };
  }

  if (!recipient.push_token) {
    return { success: true, error: 'User has no active push token registered.' };
  }

  const timeFormatted = new Date(recipient.pickup_date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const payload: NotificationPayload = {
    screen: 'MyTrips',
    bookingId: recipient.booking_id,
    eventType: 'trip_reminder_24h',
    url: `drivekendra://trips/${recipient.booking_id}`,
  };

  const [result] = await dispatchBatchPushNotifications([
    {
      pushToken: recipient.push_token,
      userId: recipient.user_id,
      relatedEntityId: recipient.booking_id,
      notificationType: 'TripReminder24h',
      title: 'Upcoming Trip Reminder ⏰ (24h)',
      body: `Your Drive Kendra trip from ${recipient.pickup_location} is scheduled for tomorrow at ${timeFormatted}. Have questions? Our 24/7 hotline is ready.`,
      channelId: 'trip_updates',
      sound: 'default',
      priority: 'high',
      data: payload,
    },
  ]);

  return result;
}

/**
 * 4. TIA Airport Transfer Flight Delay Alert Trigger
 */
export async function triggerFlightDelayAlertNotification(
  bookingId: number,
  details: FlightDelayDetails,
): Promise<DispatchResult> {
  const recipient = await getBookingRecipient(bookingId);
  if (!recipient) {
    return { success: false, error: `Booking #${bookingId} not found.` };
  }

  // Update flight delay on dka_bookings
  await withPublicClient(async (client) => {
    await client.query(
      `UPDATE dka_bookings 
       SET flight_number = $1,
           flight_delay_minutes = $2,
           updated_at = NOW()
       WHERE booking_id = $3`,
      [details.flightNumber, details.delayMinutes, bookingId],
    );
  });

  if (!recipient.push_token) {
    return { success: true, error: 'User has no active push token registered.' };
  }

  const payload: NotificationPayload = {
    screen: 'MyTrips',
    bookingId: recipient.booking_id,
    eventType: 'flight_delay_alert',
    flightNumber: details.flightNumber,
    delayMinutes: details.delayMinutes,
    newArrivalTime: details.newArrivalTime,
    url: `drivekendra://trips/${recipient.booking_id}`,
  };

  const etaNote = details.newArrivalTime ? ` Revised ETA: ${details.newArrivalTime}.` : '';

  const [result] = await dispatchBatchPushNotifications([
    {
      pushToken: recipient.push_token,
      userId: recipient.user_id,
      relatedEntityId: recipient.booking_id,
      notificationType: 'FlightDelayAlert',
      title: 'TIA Airport Transfer: Flight Delay Alert ✈️',
      body: `Flight ${details.flightNumber} is delayed by ~${details.delayMinutes} mins.${etaNote} Don't worry! Your chauffeur is tracking your flight and will be ready at TIA Kathmandu Arrivals.`,
      channelId: 'trip_updates',
      sound: 'default',
      priority: 'high',
      data: payload,
    },
  ]);

  return result;
}
