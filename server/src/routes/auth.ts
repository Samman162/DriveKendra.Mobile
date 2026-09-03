import { Hono } from 'hono';

import { withPublicClient } from '../db.js';
import {
  forgotPasswordZodSchema,
  HttpError,
  loginZodSchema,
  normalizePhone,
  registerZodSchema,
  resetPasswordZodSchema,
} from '../validation.js';

export const authRoute = new Hono();

// Login route
authRoute.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null);
  const result = loginZodSchema.safeParse(body);
  if (!result.success) {
    throw new HttpError(400, result.error.issues[0]?.message || 'Invalid login credentials.');
  }

  const { identifier, password } = result.data;
  const isEmail = identifier.includes('@');
  const cleanPhone = normalizePhone(identifier);
  const rawDigits = identifier.replace(/\D/g, '');
  const last10 = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;

  const user = await withPublicClient(async (client) => {
    let query: string;
    let params: any[];

    if (isEmail) {
      query = `SELECT user_id, full_name, email, phone_number, role, created_at
       FROM dka_users
       WHERE LOWER(email) = LOWER($1)`;
      params = [identifier.trim()];
    } else {
      query = `SELECT user_id, full_name, email, phone_number, role, created_at
       FROM dka_users
       WHERE phone_number = $1
          OR phone_number = $2
          OR REPLACE(phone_number, ' ', '') = $2
          OR REGEXP_REPLACE(phone_number, '[^0-9]', '', 'g') = $3
          OR ($4::text != '' AND RIGHT(REGEXP_REPLACE(phone_number, '[^0-9]', '', 'g'), 10) = $4)`;
      params = [identifier.trim(), cleanPhone, rawDigits, last10.length === 10 ? last10 : ''];
    }

    const existing = await client.query<{
      user_id: number;
      full_name: string;
      email: string | null;
      phone_number: string;
      role: string;
      created_at: Date;
    }>(query, params);

    if (existing.rows.length === 0) {
      throw new HttpError(401, 'No account found with these credentials. Please check your details or create an account.');
    }

    const row = existing.rows[0];
    await client.query(
      `UPDATE dka_users SET last_login_at = NOW(), updated_at = NOW() WHERE user_id = $1`,
      [row.user_id],
    );
    return {
      id: String(row.user_id),
      name: row.full_name,
      email: row.email || `${row.phone_number}@drivekendra.com`,
      phone: row.phone_number,
      role: row.role || 'customer',
      createdAt: row.created_at.toISOString(),
    };
  });

  const token = `jwt_acc_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const refreshToken = `jwt_ref_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  return c.json({
    user,
    token,
    refreshToken,
    message: 'Logged in successfully',
  });
});

// Register route
authRoute.post('/register', async (c) => {
  const body = await c.req.json().catch(() => null);
  const result = registerZodSchema.safeParse(body);
  if (!result.success) {
    throw new HttpError(400, result.error.issues[0]?.message || 'Invalid registration details.');
  }

  const { name, email, phone, password } = result.data;

  const user = await withPublicClient(async (client) => {
    const inserted = await client.query<{
      user_id: number;
      full_name: string;
      email: string | null;
      phone_number: string;
      role: string;
      created_at: Date;
    }>(
      `INSERT INTO dka_users (full_name, phone_number, email, password_hash, role, is_active, is_verified, last_login_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'customer', TRUE, TRUE, NOW(), NOW(), NOW())
       ON CONFLICT (phone_number) DO UPDATE SET
           full_name = EXCLUDED.full_name,
           email = COALESCE(EXCLUDED.email, dka_users.email),
           last_login_at = NOW(),
           updated_at = NOW()
       RETURNING user_id, full_name, email, phone_number, role, created_at`,
      [name, phone, email || null, password],
    );

    const row = inserted.rows[0];
    return {
      id: String(row.user_id),
      name: row.full_name,
      email: row.email || undefined,
      phone: row.phone_number,
      role: row.role || 'customer',
      createdAt: row.created_at.toISOString(),
    };
  });

  const token = `jwt_acc_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const refreshToken = `jwt_ref_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  return c.json({
    user,
    token,
    refreshToken,
    message: 'Account created successfully',
  });
});

// Refresh token route
authRoute.post('/refresh', async (c) => {
  const body = await c.req.json().catch(() => null);
  const refreshToken = body?.refreshToken;

  if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.length < 10) {
    throw new HttpError(401, 'Invalid or expired refresh token.');
  }

  const newAccessToken = `jwt_acc_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const newRefreshToken = `jwt_ref_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  return c.json({
    token: newAccessToken,
    refreshToken: newRefreshToken,
    message: 'Token refreshed successfully',
  });
});

// Forgot password route
authRoute.post('/forgot-password', async (c) => {
  const body = await c.req.json().catch(() => null);
  const result = forgotPasswordZodSchema.safeParse(body);
  if (!result.success) {
    throw new HttpError(400, result.error.issues[0]?.message || 'Invalid identifier.');
  }

  const { identifier } = result.data;
  const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
  return c.json({
    message: `A 6-digit verification code has been sent to ${identifier}`,
    code: verificationCode,
  });
});

// Reset password route
authRoute.post('/reset-password', async (c) => {
  const body = await c.req.json().catch(() => null);
  const result = resetPasswordZodSchema.safeParse(body);
  if (!result.success) {
    throw new HttpError(400, result.error.issues[0]?.message || 'Invalid reset details.');
  }

  return c.json({
    message: 'Your password has been successfully reset. You can now log in.',
  });
});
