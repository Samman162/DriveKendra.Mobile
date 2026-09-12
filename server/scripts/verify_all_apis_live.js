const BASE_URL = 'http://localhost:8787';

async function auditAllApis() {
  console.log('================================================================');
  console.log('🚀 LIVE FULL-STACK API AUDIT: TESTING 100% OF REAL API ENDPOINTS');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  async function check(name, fn) {
    try {
      process.stdout.write(`Testing: ${name.padEnd(52, ' ')}... `);
      await fn();
      console.log('✅ PASS');
      passed++;
    } catch (err) {
      console.log('❌ FAIL');
      console.error(`   Error details:`, err.message || err);
      failed++;
    }
  }

  // Dynamic unique identifiers for this audit run
  const runId = Math.floor(10000 + Math.random() * 90000);
  const testCustomerPhone = `+977 9841${Math.floor(100000 + Math.random() * 900000)}`;
  const testDriverPhone = `+977 9841${Math.floor(100000 + Math.random() * 900000)}`;
  const testDriverPlate = `BA 18 JA ${Math.floor(1000 + Math.random() * 9000)}`;
  const testVehiclePlate = `BAG-02-001-${Math.floor(1000 + Math.random() * 9000)}`;

  let customerToken = '';
  let customerRefreshToken = '';
  let customerUserId = 0;
  let adminToken = '';
  let testBookingId = 0;
  let testDriverId = 0;
  let testVehicleId = 0;
  let testAdvisoryId = 0;
  let testNotificationId = 0;

  // 1. Health
  await check('GET /health', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.status !== 'online' || data.database !== 'connected') {
      throw new Error(`Health status abnormal: ${JSON.stringify(data)}`);
    }
  });

  // 2. Customer Auth Login
  await check('POST /api/auth/login (Customer)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '9851363783', password: 'password123' }),
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.token) throw new Error('No token returned');
    if (data.user.role !== 'customer') throw new Error(`Role is ${data.user.role}, expected customer`);
    customerToken = data.token;
    customerRefreshToken = data.refreshToken;
    customerUserId = Number(data.user.id);
  });

  // 3. Admin Auth Login (Verifying role: admin)
  await check('POST /api/auth/login (Admin credentials)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '9800000000', password: 'admin@123' }),
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (data.user.role !== 'admin') throw new Error(`Role is ${data.user.role}, expected admin`);
  });

  // 4. Auth Refresh Token
  await check('POST /api/auth/refresh', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: customerRefreshToken }),
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.token) throw new Error('No refreshed token returned');
  });

  // 5. Auth Forgot Password
  await check('POST /api/auth/forgot-password', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '9851363783' }),
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.message) throw new Error('No message returned');
  });

  // 6. Auth Reset Password
  await check('POST /api/auth/reset-password', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '9851363783', code: '123456', newPassword: 'password123' }),
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.message) throw new Error('No message returned');
  });

  // 7. Update User Profile (PUT /api/users/profile)
  await check('PUT /api/users/profile', async () => {
    const res = await fetch(`${BASE_URL}/api/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: customerUserId, fullName: 'Samman Chhetri' }),
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.success) throw new Error('Profile update failed');
  });

  // 8. Register Push Token (POST /api/users/push-token)
  await check('POST /api/users/push-token', async () => {
    const res = await fetch(`${BASE_URL}/api/users/push-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pushToken: 'ExponentPushToken[mock_push_token_test]' }),
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.success) throw new Error('Push token registration failed');
  });

  // 9. Create Trip Request (POST /api/bookings)
  await check('POST /api/bookings (Submit Reservation)', async () => {
    const res = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: `Audit Passenger ${runId}`,
        phone_number: testCustomerPhone,
        email: `audit.${runId}@drivekendra.com`,
        pickup_location: 'Kathmandu Tribhuvan Airport',
        dropoff_location: 'Pokhara Lakeside',
        pickup_date: '2026-11-25',
        pickup_time: '09:00 AM',
        passenger_count: 3,
        trip_type: 'One Way',
        vehicle_type_id: 2,
        estimated_fare: 'NPR 15,000',
        additional_details: 'Himalayan expedition trip',
        website_hp: '',
      }),
    });
    if (res.status !== 201) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.bookingId || data.status !== 'Pending') throw new Error('Booking failed');
    testBookingId = data.bookingId;
  });

  // 10. List Customer Bookings (GET /api/bookings)
  await check('GET /api/bookings (Customer Bookings)', async () => {
    const res = await fetch(`${BASE_URL}/api/bookings?phoneNumber=${encodeURIComponent(testCustomerPhone)}`);
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const found = data.bookings.find(b => b.bookingId === testBookingId);
    if (!found) throw new Error('Created booking not found');
    if (found.assignedDriverName !== null) throw new Error('Driver should be unassigned');
  });

  // 11. Admin Login Step 1 (POST /api/admin/login)
  let challengeToken = '';
  await check('POST /api/admin/login (2FA Step 1)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9800000000', password: 'admin@123' }),
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.pinRequired || !data.challengeToken) throw new Error('2FA challenge not returned');
    challengeToken = data.challengeToken;
  });

  // 12. Admin Verify PIN Step 2 (POST /api/admin/verify-pin)
  await check('POST /api/admin/verify-pin (2FA Step 2)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeToken, pin: '6767' }),
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.token || data.admin.role !== 'admin') throw new Error('Admin JWT not issued');
    adminToken = data.token;
  });

  const adminHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminToken}`,
  });

  // 13. Admin Stats (GET /api/admin/stats)
  await check('GET /api/admin/stats', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/stats`, { headers: adminHeaders() });
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (typeof data.pendingRequests !== 'number') throw new Error('Invalid stats payload');
  });

  // 14. Admin Users Directory (GET /api/admin/users)
  await check('GET /api/admin/users', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/users`, { headers: adminHeaders() });
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!Array.isArray(data.users)) throw new Error('Users list not returned');
  });

  // 15. Admin User Trips (GET /api/admin/users/:id/trips)
  await check('GET /api/admin/users/:id/trips', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/users/${customerUserId}/trips`, { headers: adminHeaders() });
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!Array.isArray(data.trips)) throw new Error('User trips list not returned');
  });

  // 16. Admin Trips (GET /api/admin/trips)
  await check('GET /api/admin/trips (Dispatch Desk)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/trips`, { headers: adminHeaders() });
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const found = data.trips.find(t => t.id === testBookingId);
    if (!found) throw new Error('Booking not found on dispatch desk');
  });

  // 17. Admin Fleet List (GET /api/admin/vehicles)
  await check('GET /api/admin/vehicles', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/vehicles`, { headers: adminHeaders() });
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!Array.isArray(data.vehicles)) throw new Error('Vehicles not returned');
  });

  // 18. Admin Vehicle POST (POST /api/admin/vehicles)
  await check('POST /api/admin/vehicles', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/vehicles`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({
        model: `Toyota Fortuner ${runId}`,
        registrationPlate: testVehiclePlate,
        category: 'SUV',
        seats: 7,
        fuelType: 'Diesel',
        status: 'available',
      }),
    });
    if (res.status !== 201) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    testVehicleId = data.vehicle.id;
  });

  // 19. Admin Vehicle PATCH (PATCH /api/admin/vehicles/:id)
  await check('PATCH /api/admin/vehicles/:id', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/vehicles/${testVehicleId}`, {
      method: 'PATCH',
      headers: adminHeaders(),
      body: JSON.stringify({ seats: 8 }),
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${await res.text()}`);
  });

  // 20. Admin Drivers List (GET /api/admin/drivers)
  await check('GET /api/admin/drivers', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/drivers`, { headers: adminHeaders() });
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!Array.isArray(data.drivers)) throw new Error('Drivers not returned');
  });

  // 21. Admin Driver POST (POST /api/admin/drivers)
  await check('POST /api/admin/drivers (Register Driver + Vehicle)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/drivers`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({
        fullName: `Pasang Tamang ${runId}`,
        phoneNumber: testDriverPhone,
        citizenshipOrIdNo: `28-02-77-${runId}`,
        licenseDocId: `DL-NP-${runId}`,
        status: 'active',
        makeModel: 'Toyota HiAce Super GL',
        licensePlate: testDriverPlate,
        category: 'HiAce',
        seatingCapacity: 14,
      }),
    });
    if (res.status !== 201) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    testDriverId = data.driver.id || data.driver.ownerId;
  });

  // 22. Admin Driver PATCH (PATCH /api/admin/drivers/:id)
  await check('PATCH /api/admin/drivers/:id', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/drivers/${testDriverId}`, {
      method: 'PATCH',
      headers: adminHeaders(),
      body: JSON.stringify({ status: 'active' }),
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${await res.text()}`);
  });

  // 23. Admin Approve Trip (PATCH /api/admin/trips/:id/approve)
  await check('PATCH /api/admin/trips/:id/approve (Dispatch Trip)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/trips/${testBookingId}/approve`, {
      method: 'PATCH',
      headers: adminHeaders(),
      body: JSON.stringify({
        driverId: testDriverId,
        driverName: `Pasang Tamang ${runId}`,
        driverPhone: testDriverPhone,
        vehicleId: testVehicleId,
        finalPrice: 'NPR 15,000',
      }),
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (data.trip.status !== 'Confirmed') throw new Error(`Expected Confirmed, got ${data.trip.status}`);
  });

  // 24. Customer Notifications (GET /api/users/notifications)
  await check('GET /api/users/notifications', async () => {
    const res = await fetch(`${BASE_URL}/api/users/notifications?phoneNumber=${encodeURIComponent(testCustomerPhone)}`);
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const notif = data.notifications.find(n => n.bookingId === testBookingId);
    if (!notif) throw new Error('Dispatch notification not found');
    testNotificationId = notif.id;
  });

  // 25. Customer Notification Read (PATCH /api/users/notifications/:id/read)
  await check('PATCH /api/users/notifications/:id/read', async () => {
    const res = await fetch(`${BASE_URL}/api/users/notifications/${testNotificationId}/read`, {
      method: 'PATCH',
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${await res.text()}`);
  });

  // 26. Admin Notifications (GET /api/admin/notifications)
  await check('GET /api/admin/notifications', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/notifications`, { headers: adminHeaders() });
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!Array.isArray(data.notifications)) throw new Error('Notifications list not returned');
  });

  // 27. Admin Trip Notification (POST /api/admin/notifications/broadcast)
  await check('POST /api/admin/notifications/broadcast', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/notifications/broadcast`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({
        userId: customerUserId,
        title: 'Trip Update',
        message: 'Your vehicle is en route to the pickup location.',
        type: 'trip_update',
      }),
    });
    if (res.status !== 201) throw new Error(`Status ${res.status}: ${await res.text()}`);
  });

  // 28. Mountain Road Advisories GET (GET /api/admin/advisories)
  await check('GET /api/admin/advisories', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/advisories`, { headers: adminHeaders() });
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!Array.isArray(data.advisories)) throw new Error('Advisories not returned');
  });

  // 29. Mountain Road Advisories POST (POST /api/admin/advisories)
  await check('POST /api/admin/advisories', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/advisories`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({
        routeName: `B.P. Highway ${runId}`,
        status: 'open',
        conditionSummary: 'Clear weather and road dry.',
        severity: 'info',
      }),
    });
    if (res.status !== 201) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    testAdvisoryId = data.advisory.id;
  });

  // 30. Mountain Road Advisories DELETE (DELETE /api/admin/advisories/:id)
  await check('DELETE /api/admin/advisories/:id', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/advisories/${testAdvisoryId}`, {
      method: 'DELETE',
      headers: adminHeaders(),
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${await res.text()}`);
  });

  // 31. Complete Trip (PATCH /api/admin/trips/:id/complete)
  await check('PATCH /api/admin/trips/:id/complete', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/trips/${testBookingId}/complete`, {
      method: 'PATCH',
      headers: adminHeaders(),
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.success) throw new Error('Complete trip failed');
  });

  // 32. Reject Trip (PATCH /api/admin/trips/:id/reject)
  await check('PATCH /api/admin/trips/:id/reject (Reject Request)', async () => {
    const bookRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: `Reject Audit Test ${runId}`,
        phone_number: `+977 9841${Math.floor(100000 + Math.random() * 900000)}`,
        email: `reject.${runId}@drivekendra.com`,
        pickup_location: 'Kathmandu',
        dropoff_location: 'Nagarkot',
        pickup_date: '2026-12-01',
        pickup_time: '10:00 AM',
        passenger_count: 2,
        trip_type: 'One Way',
        vehicle_type_id: 1,
        estimated_fare: 'NPR 5,000',
        website_hp: '',
      }),
    });
    const bookData = await bookRes.json();
    const rejectTripId = bookData.bookingId;

    const res = await fetch(`${BASE_URL}/api/admin/trips/${rejectTripId}/reject`, {
      method: 'PATCH',
      headers: adminHeaders(),
      body: JSON.stringify({ reason: 'Vehicle type currently unavailable for this corridor.' }),
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const status = data.booking?.status || data.trip?.status;
    if (status !== 'Cancelled') throw new Error(`Expected Cancelled, got ${status}`);
  });

  // Cleanup ephemeral test bookings created by audit
  try {
    const { pool } = await import('../src/db.js');
    await pool.query(`
      DELETE FROM dka_notifications WHERE booking_id IN (
        SELECT booking_id FROM dka_bookings WHERE phone_number LIKE '%9841%' OR user_id IN (14, 22, 23, 24, 25, 26, 27, 28)
      )
    `);
    await pool.query(`
      DELETE FROM dka_bookings WHERE phone_number LIKE '%9841%' OR user_id IN (14, 22, 23, 24, 25, 26, 27, 28)
    `);
    await pool.end();
  } catch (cleanErr) {
    // Ignore cleanup error if db pool already closed
  }

  console.log('\n================================================================');
  console.log(`FULL-STACK AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED (${passed + failed} TOTAL)`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

auditAllApis().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
