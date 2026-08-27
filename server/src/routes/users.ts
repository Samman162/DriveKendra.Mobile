import { Hono } from 'hono';
import { Expo } from 'expo-server-sdk';
import { withPublicClient } from '../db.js';
import { HttpError, registerPushTokenSchema } from '../validation.js';

export const usersRoute = new Hono();

/**
 * POST /api/users/push-token
 * Register or update the user's Expo push token in dka_users.
 */
usersRoute.post('/push-token', async (c) => {
  const body = await c.req.json().catch(() => null);
  const result = registerPushTokenSchema.safeParse(body);

  if (!result.success) {
    throw new HttpError(400, result.error.issues[0]?.message || 'Invalid push token payload.');
  }

  const { pushToken, customerId, phoneNumber, email, devicePlatform } = result.data;

  if (!Expo.isExpoPushToken(pushToken)) {
    throw new HttpError(400, 'The provided token is not a valid Expo push token.');
  }

  let updated = false;

  await withPublicClient(async (client) => {
    // 1. If explicit user ID provided (customerId in payload maps to user_id)
    if (customerId) {
      const res = await client.query(
        `UPDATE dka_users 
         SET push_token = $1, 
             device_platform = COALESCE($2, device_platform), 
             push_token_updated_at = NOW(),
             updated_at = NOW()
         WHERE user_id = $3`,
        [pushToken, devicePlatform || null, customerId],
      );
      if (res.rowCount && res.rowCount > 0) {
        updated = true;
      }
    }

    // 2. If not updated and phone number is available
    if (!updated && phoneNumber) {
      const res = await client.query(
        `UPDATE dka_users 
         SET push_token = $1, 
             device_platform = COALESCE($2, device_platform), 
             push_token_updated_at = NOW(),
             updated_at = NOW()
         WHERE phone_number = $3`,
        [pushToken, devicePlatform || null, phoneNumber],
      );
      if (res.rowCount && res.rowCount > 0) {
        updated = true;
      }
    }

    // 3. If not updated and email is available
    if (!updated && email) {
      const res = await client.query(
        `UPDATE dka_users 
         SET push_token = $1, 
             device_platform = COALESCE($2, device_platform), 
             push_token_updated_at = NOW(),
             updated_at = NOW()
         WHERE email = $3`,
        [pushToken, devicePlatform || null, email],
      );
      if (res.rowCount && res.rowCount > 0) {
        updated = true;
      }
    }

    // 4. If user doesn't exist yet, create user record with phone
    if (!updated && phoneNumber) {
      await client.query(
        `INSERT INTO dka_users (full_name, phone_number, email, push_token, device_platform, push_token_updated_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())
         ON CONFLICT (phone_number) 
         DO UPDATE SET push_token = EXCLUDED.push_token,
                       device_platform = EXCLUDED.device_platform,
                       push_token_updated_at = NOW(),
                       updated_at = NOW()`,
        ['Drive Kendra Traveler', phoneNumber, email || null, pushToken, devicePlatform || null],
      );
      updated = true;
    }
  });

  return c.json({
    success: true,
    message: updated ? 'Push token registered successfully.' : 'Token received and acknowledged.',
  });
});
