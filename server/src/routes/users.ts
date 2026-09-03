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
    throw error;
  }
});

