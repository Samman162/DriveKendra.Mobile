import type { PoolClient } from 'pg';
import { withPublicClient } from './db.js';

export interface PushNotificationPayload {
  userIds?: number[];
  pushTokens?: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Dispatches native push notifications via Expo Push Notification Service.
 */
export async function sendPushNotification(payload: PushNotificationPayload): Promise<void> {
  const { userIds, pushTokens = [], title, body, data } = payload;
  const targetTokens = new Set<string>(pushTokens.filter(Boolean));

  if (userIds && userIds.length > 0) {
    try {
      await withPublicClient(async (client) => {
        const res = await client.query<{ push_token: string }>(
          `SELECT push_token FROM dka_push_tokens WHERE user_id = ANY($1::int[])`,
          [userIds],
        );
        for (const row of res.rows) {
          if (row.push_token) {
            targetTokens.add(row.push_token);
          }
        }
      });
    } catch (err: any) {
      console.warn('[Push] Error resolving push tokens for userIds:', err?.message || err);
    }
  }

  const tokenList = Array.from(targetTokens);
  if (tokenList.length === 0) {
    return;
  }

  const messages = tokenList.map((token) => ({
    to: token,
    sound: 'default',
    title,
    body,
    data: data || {},
    priority: 'high',
    channelId: 'trip_updates',
  }));

  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!res.ok) {
      console.warn('[Push] Expo Push Service response error:', res.status, await res.text());
    }
  } catch (error: any) {
    console.warn('[Push] Network error delivering push notifications:', error?.message || error);
  }
}

/**
 * Atomically inserts a trip lifecycle notification into dka_notifications
 * and sends a real-time native push alert to the target user.
 */
export async function recordAndPushTripNotification(params: {
  client: PoolClient;
  userId: number;
  bookingId?: number | null;
  title: string;
  message: string;
  type: string;
  data?: Record<string, any>;
}): Promise<number> {
  const { client, userId, bookingId = null, title, message, type, data } = params;

  const res = await client.query<{ notification_id: number }>(
    `INSERT INTO dka_notifications (user_id, booking_id, title, message, type)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING notification_id`,
    [userId, bookingId, title, message, type],
  );

  const notifId = res.rows[0]?.notification_id;

  // Dispatch push notification asynchronously after DB insert
  sendPushNotification({
    userIds: [userId],
    title,
    body: message,
    data: {
      notificationId: notifId,
      bookingId,
      type,
      ...(data || {}),
    },
  }).catch((err) => {
    console.warn('[Push] Asynchronous push dispatch warning:', err?.message || err);
  });

  return notifId;
}
