import { describe, expect, it } from '@jest/globals';
import { app } from '../src/index.js';

describe('Admin Portal Subsystem API Test Suite', () => {
  let challengeToken: string = '';
  let adminToken: string = '';

  describe('1. 2FA Authentication Gate (Phone + Password -> PIN)', () => {
    it('Step 1: Successfully authenticates primary credentials and returns challengeToken', async () => {
      const res = await app.request('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: '+977 9800000000',
          password: 'admin@123',
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.pinRequired).toBe(true);
      expect(typeof data.challengeToken).toBe('string');
      expect(data.challengeToken.startsWith('adm_chal_')).toBe(true);

      challengeToken = data.challengeToken;
    });

    it('Step 1: Also accepts normalized 10-digit phone 9800000000', async () => {
      const res = await app.request('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: '9800000000',
          password: 'admin@123',
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.pinRequired).toBe(true);
    });

    it('Step 1: Rejects incorrect phone or password with 401', async () => {
      const res = await app.request('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: '9800000000',
          password: 'wrongpassword',
        }),
      });

      expect(res.status).toBe(401);
    });

    it('Step 2: Rejects invalid PIN with 401', async () => {
      const res = await app.request('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeToken,
          pin: '0000',
        }),
      });

      expect(res.status).toBe(401);
      const data = (await res.json()) as any;
      expect(data.message).toContain('Incorrect security PIN');
    });

    it('Step 2: Rejects expired or malformed challenge token with 401', async () => {
      const res = await app.request('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeToken: 'adm_chal_nonexistent_token',
          pin: '6767',
        }),
      });

      expect(res.status).toBe(401);
    });

    it('Step 2: Successfully validates PIN 6767 and issues admin JWT', async () => {
      const res = await app.request('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeToken,
          pin: '6767',
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(typeof data.token).toBe('string');
      expect(data.admin.role).toBe('admin');

      adminToken = data.token;
    });
  });

  describe('2. Security Guard Middleware (requireAdminAuth)', () => {
    it('Blocks access to /api/admin/stats without Authorization header with 401', async () => {
      const res = await app.request('/api/admin/stats');
      expect(res.status).toBe(401);
    });

    it('Blocks access with invalid or forged token with 401', async () => {
      const res = await app.request('/api/admin/stats', {
        headers: { Authorization: 'Bearer forged_invalid_token' },
      });
      expect(res.status).toBe(401);
    });

    it('Permits access when valid admin JWT is supplied', async () => {
      const res = await app.request('/api/admin/stats', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data).toHaveProperty('pendingRequests');
      expect(data).toHaveProperty('activeFleet');
      expect(data).toHaveProperty('totalUsers');
      expect(data).toHaveProperty('totalTrips');
    });
  });

  describe('3. Users Directory & History', () => {
    it('GET /api/admin/users: Lists registered customers with lifetime booking stats', async () => {
      const res = await app.request('/api/admin/users', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(Array.isArray(data.users)).toBe(true);
      expect(data.users.length).toBeGreaterThan(0);

      const customer = data.users[0];
      expect(customer).toHaveProperty('id');
      expect(customer).toHaveProperty('fullName');
      expect(customer).toHaveProperty('phone');
      expect(customer).toHaveProperty('totalBookings');
      expect(customer).toHaveProperty('lifetimeSpend');
    });

    it('GET /api/admin/users?q=samman: Filters user search correctly', async () => {
      const res = await app.request('/api/admin/users?q=samman', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.users.every((u: any) => u.fullName.toLowerCase().includes('samman') || u.email.includes('samman'))).toBe(true);
    });

    it('GET /api/admin/users/:id/trips: Returns reservation history for user', async () => {
      const res = await app.request('/api/admin/users/1/trips', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(Array.isArray(data.trips)).toBe(true);
    });
  });

  describe('4. Trip Requests & Dispatch Operations', () => {
    let pendingTripId: number;

    it('GET /api/admin/trips: Returns all reservations with customer details', async () => {
      const res = await app.request('/api/admin/trips', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(Array.isArray(data.trips)).toBe(true);
      expect(data.trips.length).toBeGreaterThan(0);

      const pendingTrip = data.trips.find((t: any) => t.status === 'Pending');
      expect(pendingTrip).toBeTruthy();
      pendingTripId = pendingTrip.id;
    });

    it('PATCH /api/admin/trips/:id/approve: Approves reservation and assigns vehicle', async () => {
      const res = await app.request(`/api/admin/trips/${pendingTripId}/approve`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId: 1, // Scorpio 4x4
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.booking.status).toBe('Confirmed');
      expect(data.booking.assignedVehiclePlate).toBeTruthy();
    });

    it('PATCH /api/admin/trips/:id/reject: Rejects reservation with reason', async () => {
      const res = await app.request(`/api/admin/trips/${pendingTripId}/reject`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'Severe weather advisory on Prithvi Highway.',
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.booking.status).toBe('Cancelled');
      expect(data.booking.rejectionReason).toContain('Prithvi Highway');
    });

    it('PATCH /api/admin/trips/:id/complete: Marks a confirmed trip completed and releases vehicle', async () => {
      const res = await app.request(`/api/admin/trips/${pendingTripId}/complete`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.booking.status).toBe('Completed');
    });
  });

  describe('5. Fleet Inventory Management', () => {
    let newVehicleId: number;

    it('GET /api/admin/vehicles: Lists fleet vehicles with status', async () => {
      const res = await app.request('/api/admin/vehicles', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(Array.isArray(data.vehicles)).toBe(true);
      expect(data.vehicles.length).toBeGreaterThan(0);
      expect(data.vehicles[0]).toHaveProperty('registrationPlate');
      expect(data.vehicles[0]).toHaveProperty('category');
    });

    it('POST /api/admin/vehicles: Manually registers a new vehicle into the fleet', async () => {
      const res = await app.request('/api/admin/vehicles', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'Toyota Land Cruiser Prado',
          registrationPlate: 'BA 5 PA 9901',
          category: 'SUV',
          seats: 7,
          fuelType: 'Diesel',
          status: 'available',
        }),
      });

      expect(res.status).toBe(201);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.vehicle.model).toBe('Toyota Land Cruiser Prado');
      expect(data.vehicle.registrationPlate).toBe('BA 5 PA 9901');
      newVehicleId = data.vehicle.id;
    });

    it('PATCH /api/admin/vehicles/:id: Toggles vehicle status to maintenance', async () => {
      const res = await app.request(`/api/admin/vehicles/${newVehicleId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'maintenance',
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.vehicle.status).toBe('maintenance');
    });
  });

  describe('6. Himalayan Road Condition Bulletins (Advisories)', () => {
    let createdAdvisoryId: number;

    it('GET /api/admin/advisories: Returns list of mountain road bulletins', async () => {
      const res = await app.request('/api/admin/advisories', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(Array.isArray(data.advisories)).toBe(true);
      expect(data.advisories.length).toBeGreaterThan(0);
      expect(data.advisories[0]).toHaveProperty('routeName');
      expect(data.advisories[0]).toHaveProperty('status');
    });

    it('POST /api/admin/advisories: Publishes new mountain corridor advisory', async () => {
      const res = await app.request('/api/admin/advisories', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          routeName: 'Karnali Highway (Surkhet - Jumla)',
          status: 'caution',
          conditionSummary: 'Monsoon slush and rockfall near Kalikot. 4x4 only.',
          severity: 'moderate',
        }),
      });

      expect(res.status).toBe(201);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.advisory.routeName).toBe('Karnali Highway (Surkhet - Jumla)');
      expect(data.advisory.status).toBe('caution');
      createdAdvisoryId = data.advisory.id;
    });

    it('DELETE /api/admin/advisories/:id: Dismisses a road advisory', async () => {
      const res = await app.request(`/api/admin/advisories/${createdAdvisoryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
    });
  });
});
