import { describe, expect, it } from '@jest/globals';
import { app } from '../src/index.js';

describe('Server API Endpoints Integration Test Suite', () => {
  describe('GET /health', () => {
    it('returns 200 with online status and database report', async () => {
      const res = await app.request('/health');
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.status).toBe('online');
      expect(typeof data.database).toBe('string');
      expect(typeof data.timestamp).toBe('string');
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in demo user Samman Chhetri by phone number', async () => {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: '+977 9851363783',
          password: 'password123',
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.user.name).toBe('Samman Chhetri');
      expect(data.user.phone).toBe('+977 9851363783');
      expect(data.token).toContain('jwt_acc_');
      expect(data.refreshToken).toContain('jwt_ref_');
    });

    it('logs in demo user Samman Chhetri by email', async () => {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'samman@drivekendra.com',
          password: 'password123',
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.user.name).toBe('Samman Chhetri');
    });

    it('rejects invalid or missing login credentials with 400', async () => {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: '',
          password: '',
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/register', () => {
    it('rejects registration with invalid phone format with 400', async () => {
      const res = await app.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jane Doe',
          phone: '123',
          password: 'password123',
        }),
      });

      expect(res.status).toBe(400);
    });

    it('rejects registration with short password with 400', async () => {
      const res = await app.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jane Doe',
          phone: '+977 9851363783',
          password: '123',
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('successfully refreshes token when provided a valid token string', async () => {
      const res = await app.request('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken: 'jwt_ref_valid_token_12345',
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.token).toContain('jwt_acc_');
      expect(data.refreshToken).toContain('jwt_ref_');
    });

    it('rejects missing or too-short refresh token with 401', async () => {
      const res = await app.request('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken: 'short',
        }),
      });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/forgot-password & reset-password', () => {
    it('generates a 6-digit OTP code for forgot password', async () => {
      const res = await app.request('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: '+977 9851363783',
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.code).toBeDefined();
      expect(data.code.length).toBe(6);
    });

    it('allows password reset for demo account seamlessly', async () => {
      const res = await app.request('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: '+977 9851363783',
          code: '849201',
          newPassword: 'newpassword123',
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.message).toContain('successfully');
    });
  });

  describe('GET /api/bookings', () => {
    it('returns 200 with bookings array for phone number query', async () => {
      const res = await app.request('/api/bookings?phoneNumber=%2B9779851363783');
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(Array.isArray(data.bookings)).toBe(true);
    });

    it('rejects query missing both userId and phoneNumber with 400', async () => {
      const res = await app.request('/api/bookings');
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/bookings', () => {
    it('rejects submission with honeypot filled with 400', async () => {
      const res = await app.request('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: 'Bot User',
          phone_number: '+977 9851363783',
          pickup_location: 'Kathmandu',
          dropoff_location: 'Pokhara',
          pickup_date: '2026-10-01',
          passenger_count: 2,
          trip_type: 'One Way',
          website_hp: 'spambot_filled',
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/users/push-token', () => {
    it('registers valid push token with 200', async () => {
      const res = await app.request('/api/users/push-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pushToken: 'ExponentPushToken[mock_token_abcdef123456]',
          phoneNumber: '+977 9851363783',
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
    });

    it('rejects missing pushToken with 400', async () => {
      const res = await app.request('/api/users/push-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('rejects missing or non-numeric userId with 400', async () => {
      const res = await app.request('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'New Name',
        }),
      });

      expect(res.status).toBe(400);
    });
  });
});
