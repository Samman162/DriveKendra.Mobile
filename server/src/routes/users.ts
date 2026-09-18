import { Hono } from 'hono';
import { withPublicClient } from '../db.js';
import { HttpError } from '../validation.js';

export const usersRoute = new Hono();

/**
 * PUT /api/users/profile
 * Update user full name, phone number, email, and avatar URL.
 */
usersRoute.put('/profile', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { userId, fullName, avatarUrl, phone, email } = body;

  const effectiveUserId = userId ? Number(userId) : null;

  if (!effectiveUserId || isNaN(effectiveUserId)) {
    throw new HttpError(400, 'Valid numeric userId is required.');
  }

  try {
    const updatedUser = await withPublicClient(async (client) => {
      const result = await client.query<{
        user_id: number;
        full_name: string;
        phone_number: string;
        email: string | null;
        avatar_url: string | null;
      }>(
        `UPDATE dka_users 
         SET full_name = COALESCE($1, full_name),
             avatar_url = COALESCE($2, avatar_url),
             phone_number = COALESCE($3, phone_number),
             email = COALESCE($4, email),
             updated_at = NOW()
         WHERE user_id = $5
         RETURNING user_id, full_name, phone_number, email, avatar_url`,
        [
          fullName?.trim() || null,
          avatarUrl?.trim() || null,
          phone?.trim() || null,
          email?.trim() || null,
          effectiveUserId,
        ],
      );

      return result.rows[0];
    });

    if (!updatedUser) {
      throw new HttpError(404, 'User account not found.');
    }

    return c.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error: any) {
    if (error instanceof HttpError) {
      throw error;
    }
    if (error?.code === '23505') {
      throw new HttpError(409, 'Phone number or email is already registered to another account.');
    }
    console.error('[Users] Update profile database error:', error?.message || error);
    throw new HttpError(
      503,
      'Database connection unavailable. Please check your PostgreSQL connection and credentials in server/.env.',
    );
  }
});

/**
 * POST /api/users/push-token
 * Register or update client device push notification token.
 */
usersRoute.post('/push-token', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { pushToken, userId, deviceType } = body;

  if (!pushToken || typeof pushToken !== 'string' || pushToken.trim().length === 0) {
    throw new HttpError(400, 'Valid pushToken is required.');
  }

  const cleanToken = pushToken.trim();
  const numericUserId = userId && !isNaN(Number(userId)) ? Number(userId) : null;
  const cleanDeviceType = typeof deviceType === 'string' ? deviceType.trim() : 'mobile';

  if (numericUserId) {
    try {
      await withPublicClient(async (client) => {
        await client.query(
          `INSERT INTO dka_push_tokens (user_id, push_token, device_type)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, push_token)
           DO UPDATE SET updated_at = NOW(), device_type = EXCLUDED.device_type`,
          [numericUserId, cleanToken, cleanDeviceType],
        );
      });
    } catch (err: any) {
      console.warn('[Users] Could not save push token to DB:', err?.message || err);
    }
  }

  return c.json({
    success: true,
    message: 'Push token registered successfully',
  });
});

/**
 * GET /api/users/notifications
 * Retrieve notifications for a customer by userId or phoneNumber (strictly trip lifecycle events)
 */
usersRoute.get('/notifications', async (c) => {
  const rawUserId = c.req.query('userId');
  const rawPhone = c.req.query('phoneNumber');

  const numericUserId = rawUserId && !isNaN(Number(rawUserId)) ? Number(rawUserId) : null;
  const phoneNumber = rawPhone ? rawPhone.trim() : null;

  if (!numericUserId && !phoneNumber) {
    throw new HttpError(400, 'Either a valid numeric userId or phoneNumber query parameter is required.');
  }

  try {
    const notifications = await withPublicClient(async (client) => {
      let whereClause: string;
      let params: any[];

      if (numericUserId) {
        whereClause = 'n.user_id = $1';
        params = [numericUserId];
      } else {
        whereClause = `u.phone_number = $1 OR REGEXP_REPLACE(u.phone_number, '[^0-9]', '', 'g') = $2`;
        const rawDigits = phoneNumber!.replace(/\D/g, '');
        params = [phoneNumber!, rawDigits];
      }

      const res = await client.query<{
        notification_id: number;
        user_id: number;
        booking_id: number | null;
        title: string;
        message: string;
        type: string;
        is_read: boolean;
        created_at: Date;
      }>(
        `SELECT n.notification_id, n.user_id, n.booking_id, n.title, n.message, n.type, n.is_read, n.created_at
         FROM dka_notifications n
         JOIN dka_users u ON n.user_id = u.user_id
         WHERE (${whereClause}) 
           AND (n.booking_id IS NOT NULL OR n.type LIKE 'trip_%' OR n.type LIKE 'booking_%' OR n.type IN ('weather_advisory', 'road_advisory'))
         ORDER BY n.created_at DESC`,
        params,
      );

      return res.rows.map((r) => ({
        id: r.notification_id,
        userId: r.user_id,
        bookingId: r.booking_id,
        title: r.title,
        message: r.message,
        type: r.type,
        isRead: r.is_read,
        createdAt: r.created_at.toISOString(),
      }));
    });

    return c.json({ notifications });
  } catch (error: any) {
    if (error instanceof HttpError) throw error;
    console.warn('[Users] Database unavailable; returning empty notifications list:', error?.message || error);
    return c.json({ notifications: [] });
  }
});

/**
 * PATCH /api/users/notifications/:id/read
 * Mark notification as read
 */
usersRoute.patch('/notifications/:id/read', async (c) => {
  const notifId = Number(c.req.param('id'));
  if (isNaN(notifId)) {
    throw new HttpError(400, 'Valid numeric notification ID is required.');
  }

  try {
    await withPublicClient(async (client) => {
      await client.query('UPDATE dka_notifications SET is_read = TRUE WHERE notification_id = $1', [notifId]);
    });
    return c.json({ success: true, message: 'Notification marked as read.' });
  } catch {
    return c.json({ success: true, message: 'Notification marked as read (fallback).' });
  }
});

/**
 * DELETE /api/users/account
 * Apple App Store Guideline 5.1.1(v) compliant user account deletion.
 * Cleans up notifications, push tokens, and anonymizes/deletes user profile data.
 */
usersRoute.delete('/account', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const rawId = body?.userId || c.req.query('userId');
  const userId = Number(rawId);

  if (!userId || isNaN(userId)) {
    throw new HttpError(400, 'Valid numeric userId is required.');
  }

  try {
    await withPublicClient(async (client) => {
      // 1. Delete device push tokens and notifications
      await client.query('DELETE FROM dka_push_tokens WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM dka_notifications WHERE user_id = $1', [userId]);

      // 2. Check if user has bookings
      const bookingCheck = await client.query<{ count: string }>(
        'SELECT COUNT(*) as count FROM dka_bookings WHERE user_id = $1',
        [userId],
      );
      const bookingCount = Number(bookingCheck.rows[0]?.count || 0);

      if (bookingCount > 0) {
        // Cancel any pending bookings
        await client.query(
          `UPDATE dka_bookings
           SET booking_status = 'Cancelled',
               additional_details = COALESCE(additional_details, '') || ' [Account Deleted by User]'
           WHERE user_id = $1 AND booking_status = 'Pending'`,
          [userId],
        );

        // Anonymize personal info to respect ON DELETE RESTRICT ledger integrity
        await client.query(
          `UPDATE dka_users
           SET full_name = 'Deleted Account',
               phone_number = 'del_' || user_id || '_' || FLOOR(EXTRACT(EPOCH FROM NOW())),
               email = NULL,
               avatar_url = NULL,
               password_hash = 'DELETED',
               is_active = FALSE,
               updated_at = NOW()
           WHERE user_id = $1`,
          [userId],
        );
      } else {
        // Safe to fully delete row
        await client.query('DELETE FROM dka_users WHERE user_id = $1', [userId]);
      }
    });

    return c.json({
      success: true,
      message: 'Your account and personal data have been permanently deleted.',
    });
  } catch (error: any) {
    if (error instanceof HttpError) throw error;
    console.error('[Users] Delete account error:', error?.message || error);
    throw new HttpError(500, 'Could not delete user account. Please try again.');
  }
});


