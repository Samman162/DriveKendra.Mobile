import { Hono } from 'hono';
import { withPublicClient } from '../db.js';

export const usersRoute = new Hono();


/**
 * PUT /api/users/profile
 * Update user full name, phone number, and avatar URL.
 */
usersRoute.put('/profile', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { userId, fullName, avatarUrl, phone, email } = body;

  const effectiveUserId = userId ? Number(userId) : null;

  if (effectiveUserId && !isNaN(effectiveUserId)) {
    await withPublicClient(async (client) => {
      await client.query(
        `UPDATE dka_users 
         SET full_name = COALESCE($1, full_name),
             avatar_url = COALESCE($2, avatar_url),
             phone_number = COALESCE($3, phone_number),
             email = COALESCE($4, email),
             updated_at = NOW()
         WHERE user_id = $5`,
        [fullName || null, avatarUrl || null, phone || null, email || null, effectiveUserId],
      );
    });
  }

  return c.json({
    success: true,
    message: 'Profile updated successfully',
  });
});

