import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { app } from '../src/index.js';
import { withPublicClient } from '../src/db.js';

describe('Full Trip Lifecycle End-to-End Test (Customer & Admin POV)', () => {
  let adminToken: string = '';
  let createdBookingId: number = 0;
  let createdBookingRef: string = '';
  let createdDriverId: number = 0;
  let createdVehicleId: number = 0;

  const testCustomer = {
    fullName: 'Pooja Sharma',
    phone: '+977 9841998877',
    cleanPhone: '+9779841998877',
    email: 'pooja@drivekendra.com',
  };

  const testDriver = {
    fullName: 'Harka Bahadur Gurung',
    phoneNumber: '+977 9841223344',
    whatsappNumber: '+977 9841223344',
    email: 'harka.gurung@drivekendra.com',
    citizenshipOrIdNo: '27-01-75-01234',
    licenseDocId: 'DL-NP-2026-9876',
    status: 'active' as const,
    makeModel: 'Toyota Hilux 4x4',
    licensePlate: 'BA 15 PA 9988',
    category: 'SUV' as const,
    seatingCapacity: 5,
    manufactureYear: 2023,
    color: 'Silver',
  };

  const agreedFare = 'NPR 6,500';

  // Clean up any test records before and after tests
  const cleanupTestData = async () => {
    try {
      await withPublicClient(async (client) => {
        await client.query("SET LOCAL app.is_admin = 'true'");
        await client.query("DELETE FROM dka_bookings WHERE pickup_location = 'Patan Durbar Square, Lalitpur'");
        await client.query('DELETE FROM dka_vehicles WHERE license_plate = $1', [testDriver.licensePlate]).catch(() => {});
        await client.query('DELETE FROM cr_vehicles WHERE license_plate = $1', [testDriver.licensePlate]).catch(() => {});
        await client.query("DELETE FROM dka_owners WHERE phone_number IN ($1, $2, '9841223344')", [testDriver.phoneNumber, '+9779841223344']).catch(() => {});
        await client.query("DELETE FROM cr_owners WHERE phone_number IN ($1, $2, '9841223344')", [testDriver.phoneNumber, '+9779841223344']).catch(() => {});
        await client.query("DELETE FROM dka_users WHERE phone_number IN ($1, $2, '9841998877')", [testCustomer.phone, testCustomer.cleanPhone]).catch(() => {});
      });
    } catch {
      // Offline fallback continues safely
    }
  };

  beforeAll(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    const { pool } = await import('../src/db.js');
    await pool.end();
  });


  it('Step 1 [Customer POV]: Create a new trip request via user API', async () => {
    const res = await app.request('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: testCustomer.fullName,
        phone_number: testCustomer.phone,
        email: testCustomer.email,
        pickup_location: 'Patan Durbar Square, Lalitpur',
        dropoff_location: 'Nagarkot Sunrise Point',
        pickup_date: '2026-10-15',
        pickup_time: '05:30 AM',
        passenger_count: 3,
        trip_type: 'One Way',
        vehicle_type_id: 2,
        estimated_fare: 'NPR 6,000',
        additional_details: 'Sunrise expedition, please be punctual.',
        website_hp: '',
      }),
    });

    expect(res.status).toBe(201);
    const data = (await res.json()) as any;
    expect(data.success).toBe(true);
    expect(data.bookingId).toBeDefined();
    expect(data.bookingRef).toMatch(/^DK-\d{4}-\d+/);
    expect(data.status).toBe('Pending');

    createdBookingId = data.bookingId;
    createdBookingRef = data.bookingRef;
  });

  it('Step 2 [Database Check]: Verify trip request is saved as pending with NO drivers info', async () => {
    const res = await app.request(`/api/bookings?phoneNumber=${encodeURIComponent(testCustomer.phone)}`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(Array.isArray(data.bookings)).toBe(true);

    const booking = data.bookings.find((b: any) => b.bookingId === createdBookingId || b.bookingRef === createdBookingRef);
    expect(booking).toBeDefined();
    expect(booking.status).toBe('Pending');
    expect(booking.pickupLocation).toBe('Patan Durbar Square, Lalitpur');
    expect(booking.dropoffLocation).toBe('Nagarkot Sunrise Point');
    expect(booking.passengerCount).toBe(3);

    // Driver & vehicle must be completely unassigned
    expect(booking.assignedDriverName).toBeNull();
    expect(booking.assignedDriverPhone).toBeNull();
    expect(booking.assignedVehiclePlate).toBeNull();
    expect(booking.assignedVehicleModel).toBeNull();
  });

  it('Step 3 [Admin POV]: Login to admin panel using 2FA (Credentials + PIN)', async () => {
    // Step 3a: Primary login with phone '9800000000' and password 'admin@123'
    const loginRes = await app.request('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '9800000000',
        password: 'admin@123',
      }),
    });

    expect(loginRes.status).toBe(200);
    const loginData = (await loginRes.json()) as any;
    expect(loginData.pinRequired).toBe(true);
    expect(loginData.challengeToken).toBeDefined();

    // Step 3b: Verify 4-digit security PIN '6767'
    const pinRes = await app.request('/api/admin/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengeToken: loginData.challengeToken,
        pin: '6767',
      }),
    });

    expect(pinRes.status).toBe(200);
    const pinData = (await pinRes.json()) as any;
    expect(pinData.token).toBeDefined();
    expect(pinData.admin.role).toBe('admin');
    adminToken = pinData.token;
  });

  it('Step 4 [Admin POV]: Trip request arrives in admin panel dispatch desk with Pending status', async () => {
    const res = await app.request('/api/admin/trips', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(Array.isArray(data.trips)).toBe(true);

    const trip = data.trips.find((t: any) => t.id === createdBookingId || t.bookingRef === createdBookingRef);
    expect(trip).toBeDefined();
    expect(trip.customerName).toBe(testCustomer.fullName);
    expect(trip.customerPhone.replace(/\s+/g, '')).toBe(testCustomer.cleanPhone);
    expect(trip.pickupLocation).toBe('Patan Durbar Square, Lalitpur');
    expect(trip.status).toBe('Pending');
    expect(trip.assignedDriverName).toBeNull();
    expect(trip.assignedDriverPhone).toBeNull();
  });

  it('Step 5 [Admin POV]: Create a driver and verify data is saved in database with attached vehicle', async () => {
    const res = await app.request('/api/admin/drivers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(testDriver),
    });

    expect(res.status).toBe(201);
    const data = (await res.json()) as any;
    expect(data.success).toBe(true);
    expect(data.driver).toBeDefined();
    expect(data.driver.fullName).toBe(testDriver.fullName);
    expect(data.driver.status).toBe('active');
    expect(data.driver.vehicle).toBeDefined();
    expect(data.driver.vehicle.licensePlate).toBe(testDriver.licensePlate);

    createdDriverId = data.driver.id || data.driver.ownerId;
    createdVehicleId = data.driver.vehicle.id || data.driver.vehicle.vehicleId;

    // Verify driver is retrievable via GET /api/admin/drivers
    const listRes = await app.request('/api/admin/drivers', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(listRes.status).toBe(200);
    const listData = (await listRes.json()) as any;
    const found = listData.drivers.find((d: any) => (d.id || d.ownerId) === createdDriverId);
    expect(found).toBeDefined();
    expect(found.fullName).toBe(testDriver.fullName);
    expect(found.vehicle.makeModel).toBe(testDriver.makeModel);
  });

  it('Step 6 [Admin POV]: Accept trip request, attach created driver & vehicle, and write final fare', async () => {
    const res = await app.request(`/api/admin/trips/${createdBookingId}/approve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        driverId: createdDriverId,
        driverName: testDriver.fullName,
        driverPhone: testDriver.phoneNumber,
        vehicleId: createdVehicleId,
        finalPrice: agreedFare,
      }),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.success).toBe(true);
    expect(data.trip.status).toBe('Confirmed');
    expect(data.trip.assignedDriverName).toBe(testDriver.fullName);
    expect((data.trip.assignedDriverPhone || '').replace(/\s+/g, '')).toBe(testDriver.phoneNumber.replace(/\s+/g, ''));
    expect(data.trip.assignedVehiclePlate).toBe(testDriver.licensePlate);
    expect(data.trip.finalFare).toBe(agreedFare);
  });

  it('Step 7 [Customer POV Check]: Verify user sees confirmed trip with driver and fare attached', async () => {
    const res = await app.request(`/api/bookings?phoneNumber=${encodeURIComponent(testCustomer.phone)}`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    const booking = data.bookings.find((b: any) => b.bookingId === createdBookingId || b.bookingRef === createdBookingRef);

    expect(booking).toBeDefined();
    expect(booking.status).toBe('Confirmed');
    expect(booking.assignedDriverName).toBe(testDriver.fullName);
    expect((booking.assignedDriverPhone || '').replace(/\s+/g, '')).toBe(testDriver.phoneNumber.replace(/\s+/g, ''));
    expect(booking.assignedVehiclePlate).toBe(testDriver.licensePlate);
    expect(booking.assignedVehicleModel).toBe(testDriver.makeModel);
    expect(booking.finalFare || booking.estimatedFare).toBe(agreedFare);
  });

  it('Step 8 [User Notifications POV]: Customer receives dispatched booking confirmation notification', async () => {
    const res = await app.request(`/api/users/notifications?phoneNumber=${encodeURIComponent(testCustomer.phone)}`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(Array.isArray(data.notifications)).toBe(true);

    const notif = data.notifications.find((n: any) => n.bookingId === createdBookingId);
    expect(notif).toBeDefined();
    expect(notif.title).toBe('Reservation Confirmed & Dispatched');
    expect(notif.message).toContain(testDriver.fullName);
    expect(notif.message).toContain(agreedFare);
    expect(notif.type).toBe('booking_confirmed');
    expect(notif.isRead).toBe(false);

    // Test marking notification as read
    const readRes = await app.request(`/api/users/notifications/${notif.id}/read`, {
      method: 'PATCH',
    });
    expect(readRes.status).toBe(200);
    const readData = (await readRes.json()) as any;
    expect(readData.success).toBe(true);
  });

  it('Step 9 [Admin Notifications POV]: Admin audits notifications & dispatches customer broadcast', async () => {
    // 9a. Audit notifications log in admin
    const listRes = await app.request('/api/admin/notifications', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(listRes.status).toBe(200);
    const listData = (await listRes.json()) as any;
    expect(Array.isArray(listData.notifications)).toBe(true);

    const auditNotif = listData.notifications.find((n: any) => n.bookingId === createdBookingId);
    expect(auditNotif).toBeDefined();
    expect(auditNotif.customerName).toBe(testCustomer.fullName);

    // 9b. Dispatch custom advisory broadcast to customer
    const broadcastRes = await app.request('/api/admin/notifications/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        userId: auditNotif.userId,
        title: 'Himalayan Weather Advisory',
        message: 'Clear skies forecasted for Nagarkot sunrise expedition tomorrow.',
        type: 'weather_advisory',
      }),
    });

    expect(broadcastRes.status).toBe(201);
    const broadcastData = (await broadcastRes.json()) as any;
    expect(broadcastData.success).toBe(true);

    // 9c. Customer receives the broadcast advisory
    const custNotifRes = await app.request(`/api/users/notifications?phoneNumber=${encodeURIComponent(testCustomer.phone)}`);
    const custNotifData = (await custNotifRes.json()) as any;
    const weatherNotif = custNotifData.notifications.find((n: any) => n.type === 'weather_advisory');
    expect(weatherNotif).toBeDefined();
    expect(weatherNotif.title).toBe('Himalayan Weather Advisory');
  });
});
