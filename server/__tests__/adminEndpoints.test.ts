import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { app } from '../src/index.js';
import {
  fallbackBookings,
  fallbackDrivers,
  fallbackVehicles,
  resetFallbackData,
} from '../src/routes/admin.js';

describe('Admin Portal Subsystem API Test Suite', () => {
  let challengeToken: string = '';
  let adminToken: string = '';

  beforeAll(() => {
    fallbackVehicles.push(
      {
        id: 1,
        vehicleTypeId: 2,
        model: 'Mahindra Scorpio S11 4x4',
        registrationPlate: 'BA 2 PA 4521',
        category: 'SUV',
        seats: 7,
        fuelType: 'Diesel',
        imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf',
        status: 'available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 2,
        vehicleTypeId: 3,
        model: 'Toyota HiAce Super GL Luxury',
        registrationPlate: 'BA 3 PA 8820',
        category: 'HiAce',
        seats: 14,
        fuelType: 'Diesel',
        imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341',
        status: 'available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    );

    fallbackBookings.push(
      {
        id: 101,
        bookingRef: 'DK-2026-0101',
        userId: 1,
        customerName: 'Samman Chhetri',
        customerPhone: '+977 9851363783',
        customerEmail: 'samman@drivekendra.com',
        pickupLocation: 'Tribhuvan International Airport, Kathmandu',
        dropoffLocation: 'Lakeside, Pokhara',
        pickupDate: new Date(Date.now() + 86400000).toISOString(),
        pickupTime: '08:00 AM',
        returnDate: new Date(Date.now() + 4 * 86400000).toISOString(),
        passengerCount: 4,
        tripType: 'Round Trip',
        vehicleCategory: 'SUV / Scorpio 4x4',
        estimatedFare: 'NPR 34,500',
        finalFare: null,
        status: 'Pending',
        assignedVehicleId: null,
        assignedVehiclePlate: null,
        assignedVehicleModel: null,
        assignedDriverId: null,
        assignedDriverName: null,
        assignedDriverPhone: null,
        additionalDetails: 'Flight arrival at TIA at 07:15 AM.',
        rejectionReason: null,
        createdAt: new Date().toISOString(),
      },
      {
        id: 102,
        bookingRef: 'DK-2026-0102',
        userId: 1,
        customerName: 'Samman Chhetri',
        customerPhone: '+977 9851363783',
        customerEmail: 'samman@drivekendra.com',
        pickupLocation: 'Thamel, Kathmandu',
        dropoffLocation: 'Syabrubesi (Langtang Trek)',
        pickupDate: new Date(Date.now() + 2 * 86400000).toISOString(),
        pickupTime: '06:30 AM',
        returnDate: null,
        passengerCount: 6,
        tripType: 'One Way',
        vehicleCategory: 'HiAce / Van',
        estimatedFare: 'NPR 22,000',
        finalFare: null,
        status: 'Pending',
        assignedVehicleId: null,
        assignedVehiclePlate: null,
        assignedVehicleModel: null,
        assignedDriverId: null,
        assignedDriverName: null,
        assignedDriverPhone: null,
        additionalDetails: 'Starting Langtang trek.',
        rejectionReason: null,
        createdAt: new Date().toISOString(),
      },
    );

    fallbackDrivers.push({
      id: 1,
      ownerId: 1,
      fullName: 'Bikram Thapa',
      phoneNumber: '+977 9851011223',
      whatsappNumber: '+977 9851011223',
      email: 'bikram.thapa@drivekendra.com',
      citizenshipOrIdNo: '27-01-72-04512',
      status: 'active',
      citizenshipDocId: 'DOC-CTZ-0891',
      licenseDocId: 'LIC-EXP-9921',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  afterAll(() => {
    resetFallbackData();
  });

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

    const createTestBooking = async (details?: any) => {
      const res = await app.request('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: 'Test Passenger',
          phone_number: '+977 9811223344',
          pickup_location: 'Kathmandu Valley, Nepal',
          dropoff_location: 'Pokhara Lakeside, Nepal',
          pickup_date: '2026-10-15',
          passenger_count: 2,
          trip_type: 'One Way',
          vehicle_type_id: 1,
          ...details,
        }),
      });
      const data = (await res.json()) as any;
      return data.bookingId as number;
    };

    it('GET /api/admin/trips: Returns all reservations with customer details', async () => {
      pendingTripId = await createTestBooking();

      const res = await app.request('/api/admin/trips', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(Array.isArray(data.trips)).toBe(true);
      expect(data.trips.length).toBeGreaterThan(0);

      const pendingTrip = data.trips.find((t: any) => t.status === 'Pending');
      expect(pendingTrip).toBeTruthy();
    });

    it('PATCH /api/admin/trips/:id/approve: Approves reservation and assigns vehicle', async () => {
      const tripIdToApprove = await createTestBooking();
      const res = await app.request(`/api/admin/trips/${tripIdToApprove}/approve`, {
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

    it('PATCH /api/admin/trips/:id/approve: Approves reservation with driver assignment and final price', async () => {
      const tripIdToApprove = await createTestBooking();
      const res = await app.request(`/api/admin/trips/${tripIdToApprove}/approve`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId: 2, // HiAce
          driverId: 1,
          driverName: 'Bikram Thapa',
          driverPhone: '+977 9851011223',
          finalPrice: 'NPR 35,000',
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.booking.status).toBe('Confirmed');
      expect(data.booking.assignedDriverName).toBe('Bikram Thapa');
      expect(data.booking.assignedDriverPhone).toBe('+977 9851011223');
      expect(data.booking.finalFare).toBe('NPR 35,000');
    });

    it('PATCH /api/admin/trips/:id/reject: Rejects reservation with reason', async () => {
      const tripIdToReject = await createTestBooking();
      const res = await app.request(`/api/admin/trips/${tripIdToReject}/reject`, {
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
      const tripIdToComplete = await createTestBooking();
      // First confirm it
      await app.request(`/api/admin/trips/${tripIdToComplete}/approve`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vehicleId: 1 }),
      });

      const res = await app.request(`/api/admin/trips/${tripIdToComplete}/complete`, {
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
      const testPlate = `BA 5 PA ${Math.floor(1000 + Math.random() * 8999)}`;
      const res = await app.request('/api/admin/vehicles', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'Toyota Land Cruiser Prado',
          registrationPlate: testPlate,
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
      expect(data.vehicle.registrationPlate).toBe(testPlate);
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

  describe('7. Drivers & Fleet Owners Directory (dka_owners <-> cr_owners)', () => {
    let newDriverId: number;

    it('GET /api/admin/drivers: Lists all registered drivers with their details', async () => {
      const res = await app.request('/api/admin/drivers', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(Array.isArray(data.drivers)).toBe(true);
      expect(data.drivers.length).toBeGreaterThanOrEqual(1);
      expect(data.drivers[0]).toHaveProperty('fullName');
      expect(data.drivers[0]).toHaveProperty('phoneNumber');
      expect(data.drivers[0]).toHaveProperty('citizenshipOrIdNo');
      expect(data.drivers[0]).toHaveProperty('licenseDocId');
    });

    it('POST /api/admin/drivers: Registers a new driver profile with validation', async () => {
      const uniqueSuffix = Date.now().toString().slice(-6);
      const testDriverPhone = `+977 9851${uniqueSuffix}`;
      const testCtzNo = `14-03-71-${uniqueSuffix}`;

      const res = await app.request('/api/admin/drivers', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: 'Pemba Tenzing Lama',
          phoneNumber: testDriverPhone,
          whatsappNumber: testDriverPhone,
          email: `pemba.${uniqueSuffix}@expedition.np`,
          citizenshipOrIdNo: testCtzNo,
          status: 'active',
          citizenshipDocId: 'DOC-CTZ-7788',
          licenseDocId: 'LIC-EXP-5522',
        }),
      });

      expect(res.status).toBe(201);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.driver.fullName).toBe('Pemba Tenzing Lama');
      expect(data.driver.licenseDocId).toBe('LIC-EXP-5522');
      newDriverId = data.driver.id;
    });

    it('PATCH /api/admin/drivers/:id: Updates driver status or information', async () => {
      const res = await app.request(`/api/admin/drivers/${newDriverId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'inactive',
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.driver.status).toBe('inactive');
    });

    it('GET /api/admin/stats: Returns totalDrivers metric', async () => {
      const res = await app.request('/api/admin/stats', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(typeof data.totalDrivers).toBe('number');
      expect(data.totalDrivers).toBeGreaterThan(0);
    });
  });

  afterAll(async () => {
    const { pool } = await import('../src/db.js');
    await pool.end();
  });
});

