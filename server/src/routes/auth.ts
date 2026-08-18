import { Hono } from 'hono';

import {
  forgotPasswordZodSchema,
  HttpError,
  loginZodSchema,
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

  const { identifier } = result.data;

  // Create or return session user
  const user = {
    id: `usr_${Date.now()}`,
    name: identifier.includes('@') ? identifier.split('@')[0].replace('.', ' ') : 'Drive Kendra User',
    email: identifier.includes('@') ? identifier : `${identifier}@drivekendra.com`,
    phone: identifier.includes('@') ? '+977 9851363783' : identifier,
    role: 'customer',
    createdAt: new Date().toISOString(),
  };

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

  const { name, email, phone } = result.data;

  const user = {
    id: `usr_${Date.now()}`,
    name,
    email,
    phone,
    role: 'customer',
    createdAt: new Date().toISOString(),
  };

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
  return c.json({
    message: `A 6-digit verification code has been sent to ${identifier}`,
    code: '849201',
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
