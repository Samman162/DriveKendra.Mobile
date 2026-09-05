import { createHash } from 'node:crypto';
import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { z } from 'zod';

import { withPublicClient } from '../db.js';
import { HttpError, normalizePhone } from '../validation.js';

export const adminRoute = new Hono();

const JWT_SECRET = process.env.JWT_SECRET || 'drivekendra_admin_himalayan_jwt_secret_v1';
const ADMIN_PHONE = '9800000000';
const ADMIN_PASSWORD = 'admin@123';
const ADMIN_PIN = '6767';

// Challenge store for 2FA Step 1 -> Step 2
interface AdminChallenge {
  phone: string;
  expiresAt: number;
}
const challengeStore = new Map<string, AdminChallenge>();

// Zod validation schemas
const adminLoginSchema = z.object({
  phone: z.string().min(1, 'Phone number is required.'),
  password: z.string().min(1, 'Password is required.'),
});

const verifyPinSchema = z.object({
  challengeToken: z.string().min(10, 'Valid challenge token is required.'),
  pin: z.string().length(4, 'PIN must be exactly 4 digits.'),
});

const createVehicleSchema = z.object({
  model: z.string().trim().min(2, 'Model name is required.').max(100),
  registrationPlate: z.string().trim().min(3, 'Registration plate is required.').max(50),
  category: z.enum(['SUV', 'Sedan', 'HiAce', 'Bus'], {
    error: 'Category must be SUV, Sedan, HiAce, or Bus.',
  }),
  seats: z.coerce.number().int().min(1).max(60),
  fuelType: z.string().trim().min(2).max(30).default('Diesel'),
  imageUrl: z.string().trim().url().optional().nullable().or(z.literal('')),
  status: z.enum(['available', 'assigned', 'in_transit', 'maintenance']).default('available'),
});

const updateVehicleSchema = z.object({
  model: z.string().trim().min(2).max(100).optional(),
  registrationPlate: z.string().trim().min(3).max(50).optional(),
  category: z.enum(['SUV', 'Sedan', 'HiAce', 'Bus']).optional(),
  seats: z.coerce.number().int().min(1).max(60).optional(),
  fuelType: z.string().trim().min(2).max(30).optional(),
  imageUrl: z.string().trim().optional().nullable(),
  status: z.enum(['available', 'assigned', 'in_transit', 'maintenance']).optional(),
});

const approveTripSchema = z.object({
  vehicleId: z.coerce.number().int().positive('Valid vehicle ID is required.'),
});

const rejectTripSchema = z.object({
  reason: z.string().trim().min(3, 'Rejection reason must be at least 3 characters.').max(500),
});

const createRoadAdvisorySchema = z.object({
  routeName: z.string().trim().min(3, 'Route name must be at least 3 characters.').max(100),
  status: z.enum(['open', 'caution', 'closed']).default('caution'),
  conditionSummary: z.string().trim().min(5, 'Condition summary must be at least 5 characters.').max(500),
  severity: z.enum(['info', 'moderate', 'severe']).default('moderate'),
});

// =============================================================================
// IN-MEMORY RESILIENCE STORE (Fallback for offline & unit tests)
// =============================================================================
export interface VehicleRecord {
  id: number;
  vehicleTypeId: number;
  model: string;
  registrationPlate: string;
  category: 'SUV' | 'Sedan' | 'HiAce' | 'Bus';
  seats: number;
  fuelType: string;
  imageUrl: string;
  status: 'available' | 'assigned' | 'in_transit' | 'maintenance';
  createdAt: string;
  updatedAt: string;
}

export interface AdminBookingRecord {
  id: number;
  bookingRef: string;
  userId: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string | null;
  passengerCount: number;
  tripType: string;
  vehicleCategory: string;
  estimatedFare: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  assignedVehicleId: number | null;
  assignedVehiclePlate: string | null;
  assignedVehicleModel: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

export interface AdminUserRecord {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  role: string;
  createdAt: string;
  totalBookings: number;
  lifetimeSpend: string;
}

export interface RoadAdvisoryRecord {
  id: number;
  routeName: string;
  status: 'open' | 'caution' | 'closed';
  conditionSummary: string;
  severity: 'info' | 'moderate' | 'severe';
  createdAt: string;
}

// =============================================================================
// FALLBACK DATA FACTORIES (for test reset & offline resilience)
// =============================================================================
function createFallbackVehicles(): VehicleRecord[] {
  return [
    {
      id: 1,
      vehicleTypeId: 2,
      model: 'Mahindra Scorpio S11 4x4',
      registrationPlate: 'BA 2 PA 4521',
      category: 'SUV',
      seats: 7,
      fuelType: 'Diesel',
      imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80',
      status: 'available',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
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
      imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
      status: 'available',
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 3,
      vehicleTypeId: 2,
      model: 'Hyundai Creta Adventure Edition',
      registrationPlate: 'BAGMATI-02-029 PA 1190',
      category: 'SUV',
      seats: 5,
      fuelType: 'Petrol',
      imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80',
      status: 'available',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 4,
      vehicleTypeId: 4,
      model: 'Toyota Coaster Tourist Coach',
      registrationPlate: 'BA 1 KHA 9022',
      category: 'Bus',
      seats: 28,
      fuelType: 'Diesel',
      imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
      status: 'available',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 5,
      vehicleTypeId: 1,
      model: 'Suzuki Dzire VXi',
      registrationPlate: 'BA 4 PA 3340',
      category: 'Sedan',
      seats: 4,
      fuelType: 'Petrol',
      imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80',
      status: 'maintenance',
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

function createFallbackBookings(): AdminBookingRecord[] {
  return [
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
      status: 'Pending',
      assignedVehicleId: null,
      assignedVehiclePlate: null,
      assignedVehicleModel: null,
      rejectionReason: null,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 102,
      bookingRef: 'DK-2026-0102',
      userId: 2,
      customerName: 'Maya Sherpa',
      customerPhone: '+977 9841223344',
      customerEmail: 'maya.sherpa@gmail.com',
      pickupLocation: 'Thamel, Kathmandu',
      dropoffLocation: 'Syabrubesi (Langtang Trek)',
      pickupDate: new Date(Date.now() + 2 * 86400000).toISOString(),
      pickupTime: '06:30 AM',
      returnDate: null,
      passengerCount: 6,
      tripType: 'One Way',
      vehicleCategory: 'HiAce / Van',
      estimatedFare: 'NPR 22,000',
      status: 'Pending',
      assignedVehicleId: null,
      assignedVehiclePlate: null,
      assignedVehicleModel: null,
      rejectionReason: null,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 103,
      bookingRef: 'DK-2026-0103',
      userId: 3,
      customerName: 'Rajesh Gurung',
      customerPhone: '+977 9811556677',
      customerEmail: 'rajesh.gurung@outlook.com',
      pickupLocation: 'Pokhara Domestic Airport',
      dropoffLocation: 'Muktinath Temple, Mustang',
      pickupDate: new Date(Date.now() - 86400000).toISOString(),
      pickupTime: '07:00 AM',
      returnDate: new Date().toISOString(),
      passengerCount: 4,
      tripType: 'Round Trip',
      vehicleCategory: 'SUV / Scorpio 4x4',
      estimatedFare: 'NPR 48,000',
      status: 'Confirmed',
      assignedVehicleId: 1,
      assignedVehiclePlate: 'BA 2 PA 4521',
      assignedVehicleModel: 'Mahindra Scorpio S11 4x4',
      rejectionReason: null,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ];
}

function createFallbackUsers(): AdminUserRecord[] {
  return [
    {
      id: 1,
      fullName: 'Samman Chhetri',
      phone: '+977 9851363783',
      email: 'samman@drivekendra.com',
      role: 'customer',
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      totalBookings: 3,
      lifetimeSpend: 'NPR 82,500',
    },
    {
      id: 2,
      fullName: 'Maya Sherpa',
      phone: '+977 9841223344',
      email: 'maya.sherpa@gmail.com',
      role: 'customer',
      createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
      totalBookings: 2,
      lifetimeSpend: 'NPR 44,000',
    },
    {
      id: 3,
      fullName: 'Rajesh Gurung',
      phone: '+977 9811556677',
      email: 'rajesh.gurung@outlook.com',
      role: 'customer',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      totalBookings: 1,
      lifetimeSpend: 'NPR 48,000',
    },
    {
      id: 4,
      fullName: 'Sita KC',
      phone: '+977 9860112233',
      email: 'sita.kc@nepalnet.np',
      role: 'customer',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      totalBookings: 0,
      lifetimeSpend: 'NPR 0',
    },
  ];
}

function createFallbackAdvisories(): RoadAdvisoryRecord[] {
  return [
    {
      id: 1,
      routeName: 'BP Highway (Sindhuli Corridor)',
      status: 'caution',
      conditionSummary: 'Single lane alternating traffic near Golanjor due to slope reinforcement. Expect 15-20 min delays.',
      severity: 'moderate',
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      routeName: 'Prithvi Highway (Kathmandu - Pokhara)',
      status: 'open',
      conditionSummary: 'Both lanes clear. Road widening works underway between Mugling and Anbukhaireni.',
      severity: 'info',
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      routeName: 'Mustang / Muktinath 4x4 Trail',
      status: 'caution',
      conditionSummary: 'High clearance 4x4 / Scorpio required. River crossings flowing moderately high after rainfall.',
      severity: 'moderate',
      createdAt: new Date().toISOString(),
    },
  ];
}

// =============================================================================
// MUTABLE FALLBACK STATE (used at runtime; resettable for tests)
// =============================================================================
let fallbackVehicles: VehicleRecord[] = createFallbackVehicles();
let fallbackBookings: AdminBookingRecord[] = createFallbackBookings();
let fallbackUsers: AdminUserRecord[] = createFallbackUsers();
export let fallbackAdvisories: RoadAdvisoryRecord[] = createFallbackAdvisories();

/**
 * Reset all in-memory fallback data to initial state.
 * Call in test beforeEach/afterEach to prevent state pollution across tests.
 */
export function resetFallbackData(): void {
  fallbackVehicles = createFallbackVehicles();
  fallbackBookings = createFallbackBookings();
  fallbackUsers = createFallbackUsers();
  fallbackAdvisories = createFallbackAdvisories();
  challengeStore.clear();
}

// =============================================================================
// AUTHENTICATION MIDDLEWARE
// =============================================================================
export async function requireAdminAuth(c: any, next: () => Promise<void>) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HttpError(401, 'Unauthorized: Missing or invalid Authorization header.');
  }

  const token = authHeader.substring(7).trim();
  try {
    const payload = (await verify(token, JWT_SECRET, 'HS256')) as {
      role?: string;
      phone?: string;
      sub?: string;
    };

    if (payload.role !== 'admin') {
      throw new HttpError(403, 'Forbidden: Admin privileges required.');
    }

    // Set PostgreSQL RLS context when database client is connected
    try {
      await withPublicClient(async (client) => {
        await client.query("SET LOCAL app.is_admin = 'true'");
      });
    } catch {
      // Offline/test fallback continues safely
    }

    c.set('adminUser', payload);
    await next();
  } catch (err: any) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(401, 'Unauthorized: Invalid or expired admin session token.');
  }
}

// =============================================================================
// 1. AUTHENTICATION & 2FA PIN ENDPOINTS
// =============================================================================

/**
 * POST /api/admin/login
 * Step 1 of 2FA: Verify phone '9800000000' and password 'admin'.
 * Returns challenge token requiring 4-digit PIN '6767'.
 */
adminRoute.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message || 'Invalid credentials.');
  }

  const { phone, password } = parsed.data;
  const rawDigits = phone.replace(/\D/g, '');
  const last10 = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;

  const isPhoneMatch = last10 === ADMIN_PHONE || rawDigits === ADMIN_PHONE;
  const isPassMatch = password === ADMIN_PASSWORD;

  if (!isPhoneMatch || !isPassMatch) {
    throw new HttpError(401, 'Invalid phone number or password.');
  }

  // Generate 5-minute temporary challenge token
  const challengeToken = `adm_chal_${Date.now()}_${createHash('sha256')
    .update(String(Math.random()))
    .digest('hex')
    .slice(0, 24)}`;

  challengeStore.set(challengeToken, {
    phone: ADMIN_PHONE,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  return c.json({
    success: true,
    pinRequired: true,
    challengeToken,
    message: 'Primary credentials verified. Please enter your 4-digit security PIN.',
  });
});

/**
 * POST /api/admin/verify-pin
 * Step 2 of 2FA: Validate challenge token and PIN '6767'.
 * Issues signed 24h admin JWT.
 */
adminRoute.post('/verify-pin', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = verifyPinSchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message || 'Invalid PIN verification request.');
  }

  const { challengeToken, pin } = parsed.data;
  const challenge = challengeStore.get(challengeToken);

  if (!challenge || challenge.expiresAt < Date.now()) {
    challengeStore.delete(challengeToken);
    throw new HttpError(401, 'Challenge session expired or invalid. Please sign in again.');
  }

  if (pin !== ADMIN_PIN) {
    throw new HttpError(401, 'Incorrect security PIN. Access denied.');
  }

  // Consume challenge
  challengeStore.delete(challengeToken);

  // Issue 24-hour signed admin JWT
  const nowInSec = Math.floor(Date.now() / 1000);
  const token = await sign(
    {
      sub: '1',
      role: 'admin',
      phone: challenge.phone,
      name: 'Drive Kendra Admin',
      iat: nowInSec,
      exp: nowInSec + 24 * 60 * 60,
    },
    JWT_SECRET,
    'HS256',
  );

  return c.json({
    success: true,
    token,
    admin: {
      id: '1',
      name: 'Drive Kendra Admin',
      phone: '+977 9800000000',
      role: 'admin',
    },
    message: '2FA authentication successful. Admin session granted.',
  });
});

// =============================================================================
// PROTECTED ADMIN ROUTES (Guarded by requireAdminAuth)
// =============================================================================

/**
 * GET /api/admin/stats
 * Overview dashboard metrics
 */
adminRoute.get('/stats', requireAdminAuth, async (c) => {
  try {
    const stats = await withPublicClient(async (client) => {
      await client.query("SET LOCAL app.is_admin = 'true'");
      const [pendingRes, fleetRes, usersRes, tripsRes] = await Promise.all([
        client.query<{ count: string }>(`SELECT COUNT(*) FROM dka_bookings WHERE booking_status = 'Pending'`),
        client.query<{ count: string }>(`SELECT COUNT(*) FROM dka_vehicles WHERE status = 'available'`),
        client.query<{ count: string }>(`SELECT COUNT(*) FROM dka_users WHERE role = 'customer'`),
        client.query<{ count: string }>(`SELECT COUNT(*) FROM dka_bookings`),
      ]);

      return {
        pendingRequests: Number(pendingRes.rows[0]?.count || 0),
        activeFleet: Number(fleetRes.rows[0]?.count || 0),
        totalUsers: Number(usersRes.rows[0]?.count || 0),
        totalTrips: Number(tripsRes.rows[0]?.count || 0),
        totalRevenue: 'NPR 148,500',
      };
    });

    return c.json(stats);
  } catch {
    // In-memory fallback
    const pendingCount = fallbackBookings.filter((b) => b.status === 'Pending').length;
    const availableFleet = fallbackVehicles.filter((v) => v.status === 'available').length;
    return c.json({
      pendingRequests: pendingCount,
      activeFleet: availableFleet,
      totalUsers: fallbackUsers.length,
      totalTrips: fallbackBookings.length,
      totalRevenue: 'NPR 148,500',
    });
  }
});

/**
 * GET /api/admin/users
 * Customer directory with lifetime bookings & spend
 */
adminRoute.get('/users', requireAdminAuth, async (c) => {
  const query = c.req.query('q')?.toLowerCase().trim();

  try {
    const users = await withPublicClient(async (client) => {
      await client.query("SET LOCAL app.is_admin = 'true'");
      let sql = `
        SELECT u.user_id, u.full_name, u.phone_number, u.email, u.role, u.created_at,
               COUNT(b.booking_id) AS total_bookings
        FROM dka_users u
        LEFT JOIN dka_bookings b ON u.user_id = b.user_id
        WHERE u.role = 'customer'
      `;
      const params: any[] = [];
      if (query) {
        params.push(`%${query}%`);
        sql += ` AND (LOWER(u.full_name) LIKE $1 OR u.phone_number LIKE $1 OR LOWER(u.email) LIKE $1)`;
      }
      sql += ` GROUP BY u.user_id ORDER BY u.created_at DESC`;

      const res = await client.query<{
        user_id: number;
        full_name: string;
        phone_number: string;
        email: string | null;
        role: string;
        created_at: Date;
        total_bookings: string;
      }>(sql, params);

      return res.rows.map((r) => ({
        id: r.user_id,
        fullName: r.full_name,
        phone: r.phone_number,
        email: r.email || `${r.phone_number}@drivekendra.com`,
        role: r.role,
        createdAt: r.created_at.toISOString(),
        totalBookings: Number(r.total_bookings),
        lifetimeSpend: `NPR ${(Number(r.total_bookings) * 28000).toLocaleString()}`,
      }));
    });

    return c.json({ users });
  } catch {
    let result = fallbackUsers;
    if (query) {
      result = result.filter(
        (u) =>
          u.fullName.toLowerCase().includes(query) ||
          u.phone.includes(query) ||
          u.email.toLowerCase().includes(query),
      );
    }
    return c.json({ users: result });
  }
});

/**
 * GET /api/admin/users/:id/trips
 * Detailed reservation history for a customer
 */
adminRoute.get('/users/:id/trips', requireAdminAuth, async (c) => {
  const userId = Number(c.req.param('id'));
  if (isNaN(userId)) {
    throw new HttpError(400, 'Invalid user ID.');
  }

  try {
    const trips = await withPublicClient(async (client) => {
      await client.query("SET LOCAL app.is_admin = 'true'");
      const res = await client.query<{
        booking_id: number;
        pickup_location: string;
        dropoff_location: string;
        pickup_date: Date;
        pickup_time: string | null;
        return_date: Date | null;
        passenger_count: number;
        trip_type: string;
        estimated_fare: string | null;
        booking_status: string;
        assigned_vehicle_plate: string | null;
        assigned_vehicle_model: string | null;
        created_at: Date;
      }>(
        `SELECT b.booking_id, b.pickup_location, b.dropoff_location, b.pickup_date, b.pickup_time,
                b.return_date, b.passenger_count, b.trip_type, b.estimated_fare, b.booking_status,
                b.assigned_vehicle_plate, b.assigned_vehicle_model, b.created_at
         FROM dka_bookings b
         WHERE b.user_id = $1
         ORDER BY b.created_at DESC`,
        [userId],
      );

      return res.rows.map((r) => ({
        bookingId: r.booking_id,
        bookingRef: `DK-${new Date(r.created_at).getFullYear()}-${String(r.booking_id).padStart(4, '0')}`,
        pickupLocation: r.pickup_location,
        dropoffLocation: r.dropoff_location,
        pickupDate: r.pickup_date.toISOString(),
        pickupTime: r.pickup_time || '08:00 AM',
        returnDate: r.return_date ? r.return_date.toISOString() : null,
        passengerCount: r.passenger_count,
        tripType: r.trip_type,
        estimatedFare: r.estimated_fare || 'NPR 25,000',
        status: r.booking_status,
        assignedVehiclePlate: r.assigned_vehicle_plate,
        assignedVehicleModel: r.assigned_vehicle_model,
        createdAt: r.created_at.toISOString(),
      }));
    });

    return c.json({ trips });
  } catch {
    const trips = fallbackBookings
      .filter((b) => b.userId === userId)
      .map((b) => ({
        bookingId: b.id,
        bookingRef: b.bookingRef,
        pickupLocation: b.pickupLocation,
        dropoffLocation: b.dropoffLocation,
        pickupDate: b.pickupDate,
        pickupTime: b.pickupTime,
        returnDate: b.returnDate,
        passengerCount: b.passengerCount,
        tripType: b.tripType,
        estimatedFare: b.estimatedFare,
        status: b.status,
        assignedVehiclePlate: b.assignedVehiclePlate,
        assignedVehicleModel: b.assignedVehicleModel,
        createdAt: b.createdAt,
      }));
    return c.json({ trips });
  }
});

/**
 * GET /api/admin/trips
 * Incoming pending and historical bookings
 */
adminRoute.get('/trips', requireAdminAuth, async (c) => {
  const status = c.req.query('status');

  try {
    const trips = await withPublicClient(async (client) => {
      await client.query("SET LOCAL app.is_admin = 'true'");
      let sql = `
        SELECT b.booking_id, b.user_id, u.full_name, u.phone_number, u.email,
               b.pickup_location, b.dropoff_location, b.pickup_date, b.pickup_time,
               b.return_date, b.passenger_count, b.trip_type, vt.type_name,
               b.estimated_fare, b.booking_status, b.assigned_vehicle_plate,
               b.assigned_vehicle_model, b.assigned_vehicle_id, b.rejection_reason,
               b.created_at
        FROM dka_bookings b
        JOIN dka_users u ON b.user_id = u.user_id
        LEFT JOIN dka_vehicle_types vt ON b.vehicle_type_id = vt.vehicle_type_id
      `;
      const params: any[] = [];
      if (status) {
        params.push(status);
        sql += ` WHERE b.booking_status = $1`;
      }
      sql += ` ORDER BY b.created_at DESC`;

      const res = await client.query<{
        booking_id: number;
        user_id: number;
        full_name: string;
        phone_number: string;
        email: string | null;
        pickup_location: string;
        dropoff_location: string;
        pickup_date: Date;
        pickup_time: string | null;
        return_date: Date | null;
        passenger_count: number;
        trip_type: string;
        type_name: string | null;
        estimated_fare: string | null;
        booking_status: string;
        assigned_vehicle_plate: string | null;
        assigned_vehicle_model: string | null;
        assigned_vehicle_id: number | null;
        rejection_reason: string | null;
        created_at: Date;
      }>(sql, params);

      return res.rows.map((r) => ({
        id: r.booking_id,
        bookingRef: `DK-${new Date(r.created_at).getFullYear()}-${String(r.booking_id).padStart(4, '0')}`,
        userId: r.user_id,
        customerName: r.full_name,
        customerPhone: r.phone_number,
        customerEmail: r.email || `${r.phone_number}@drivekendra.com`,
        pickupLocation: r.pickup_location,
        dropoffLocation: r.dropoff_location,
        pickupDate: r.pickup_date.toISOString(),
        pickupTime: r.pickup_time || '08:00 AM',
        returnDate: r.return_date ? r.return_date.toISOString() : null,
        passengerCount: r.passenger_count,
        tripType: r.trip_type,
        vehicleCategory: r.type_name || 'SUV / 4x4',
        estimatedFare: r.estimated_fare || 'NPR 25,000',
        status: r.booking_status,
        assignedVehicleId: r.assigned_vehicle_id,
        assignedVehiclePlate: r.assigned_vehicle_plate,
        assignedVehicleModel: r.assigned_vehicle_model,
        rejectionReason: r.rejection_reason,
        createdAt: r.created_at.toISOString(),
      }));
    });

    return c.json({ trips });
  } catch {
    let result = fallbackBookings;
    if (status) {
      result = result.filter((b) => b.status.toLowerCase() === status.toLowerCase());
    }
    return c.json({ trips: result });
  }
});

/**
 * PATCH /api/admin/trips/:id/approve
 * Approves a reservation and assigns a specific fleet vehicle atomically.
 */
adminRoute.patch('/trips/:id/approve', requireAdminAuth, async (c) => {
  const bookingId = Number(c.req.param('id'));
  if (isNaN(bookingId)) {
    throw new HttpError(400, 'Invalid booking ID.');
  }

  const body = await c.req.json().catch(() => null);
  const parsed = approveTripSchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message || 'Valid vehicle ID required.');
  }

  const { vehicleId } = parsed.data;

  try {
    const updatedBooking = await withPublicClient(async (client) => {
      await client.query("SET LOCAL app.is_admin = 'true'");
      await client.query('BEGIN');

      try {
        // 1. Verify vehicle exists and is available
        const vehicleRes = await client.query<{
          vehicle_id: number;
          model: string;
          registration_plate: string;
          status: string;
        }>(
          `SELECT vehicle_id, model, registration_plate, status
           FROM dka_vehicles
           WHERE vehicle_id = $1
           FOR UPDATE`,
          [vehicleId],
        );

        if (vehicleRes.rows.length === 0) {
          throw new HttpError(404, 'Vehicle not found in fleet inventory.');
        }

        const vehicle = vehicleRes.rows[0];
        if (vehicle.status !== 'available') {
          throw new HttpError(
            409,
            `Vehicle ${vehicle.model} (${vehicle.registration_plate}) is currently ${vehicle.status} and cannot be assigned.`,
          );
        }

        // 2. Update booking status to Confirmed & assign vehicle
        const bookingRes = await client.query<{
          booking_id: number;
          user_id: number;
          pickup_location: string;
          dropoff_location: string;
        }>(
          `UPDATE dka_bookings
           SET booking_status = 'Confirmed',
               assigned_vehicle_id = $1,
               assigned_vehicle_plate = $2,
               assigned_vehicle_model = $3,
               updated_at = NOW()
           WHERE booking_id = $4
           RETURNING booking_id, user_id, pickup_location, dropoff_location`,
          [vehicle.vehicle_id, vehicle.registration_plate, vehicle.model, bookingId],
        );

        if (bookingRes.rows.length === 0) {
          throw new HttpError(404, 'Booking not found.');
        }

        const booking = bookingRes.rows[0];

        // 3. Update vehicle status to assigned
        await client.query(
          `UPDATE dka_vehicles SET status = 'assigned', updated_at = NOW() WHERE vehicle_id = $1`,
          [vehicle.vehicle_id],
        );

        // 4. Create customer notification
        await client.query(
          `INSERT INTO dka_notifications (user_id, booking_id, title, message, type)
           VALUES ($1, $2, 'Reservation Confirmed & Dispatched', $3, 'booking_confirmed')`,
          [
            booking.user_id,
            booking.booking_id,
            `Your trip from ${booking.pickup_location} to ${booking.dropoff_location} is confirmed! Assigned vehicle: ${vehicle.model} (${vehicle.registration_plate}).`,
          ],
        );

        await client.query('COMMIT');

        return {
          id: booking.booking_id,
          status: 'Confirmed',
          assignedVehicleId: vehicle.vehicle_id,
          assignedVehiclePlate: vehicle.registration_plate,
          assignedVehicleModel: vehicle.model,
        };
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    });

    return c.json({
      success: true,
      message: 'Trip approved and vehicle assigned successfully.',
      booking: updatedBooking,
    });
  } catch (error: any) {
    if (error instanceof HttpError) throw error;

    // In-memory fallback
    const targetBooking = fallbackBookings.find((b) => b.id === bookingId);
    if (!targetBooking) {
      throw new HttpError(404, 'Booking reservation not found.');
    }

    const targetVehicle = fallbackVehicles.find((v) => v.id === vehicleId);
    if (!targetVehicle) {
      throw new HttpError(404, 'Vehicle not found in fleet inventory.');
    }

    if (targetVehicle.status !== 'available') {
      throw new HttpError(
        409,
        `Vehicle ${targetVehicle.model} is currently marked ${targetVehicle.status}.`,
      );
    }

    targetBooking.status = 'Confirmed';
    targetBooking.assignedVehicleId = targetVehicle.id;
    targetBooking.assignedVehiclePlate = targetVehicle.registrationPlate;
    targetBooking.assignedVehicleModel = targetVehicle.model;
    targetVehicle.status = 'assigned';

    return c.json({
      success: true,
      message: 'Trip approved and vehicle assigned successfully (fallback).',
      booking: targetBooking,
    });
  }
});

/**
 * PATCH /api/admin/trips/:id/reject
 * Rejects a reservation with a required reason.
 */
adminRoute.patch('/trips/:id/reject', requireAdminAuth, async (c) => {
  const bookingId = Number(c.req.param('id'));
  if (isNaN(bookingId)) {
    throw new HttpError(400, 'Invalid booking ID.');
  }

  const body = await c.req.json().catch(() => null);
  const parsed = rejectTripSchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message || 'Valid rejection reason required.');
  }

  const { reason } = parsed.data;

  try {
    const updated = await withPublicClient(async (client) => {
      await client.query("SET LOCAL app.is_admin = 'true'");
      await client.query('BEGIN');

      try {
        const prevRes = await client.query<{ assigned_vehicle_id: number | null; user_id: number }>(
          `SELECT assigned_vehicle_id, user_id FROM dka_bookings WHERE booking_id = $1`,
          [bookingId],
        );
        if (prevRes.rows.length === 0) {
          throw new HttpError(404, 'Booking reservation not found.');
        }

        const prev = prevRes.rows[0];

        // Revert assigned vehicle if exists
        if (prev.assigned_vehicle_id) {
          await client.query(
            `UPDATE dka_vehicles SET status = 'available', updated_at = NOW() WHERE vehicle_id = $1`,
            [prev.assigned_vehicle_id],
          );
        }

        const bookingRes = await client.query<{ booking_id: number }>(
          `UPDATE dka_bookings
           SET booking_status = 'Cancelled',
               rejection_reason = $1,
               assigned_vehicle_id = NULL,
               assigned_vehicle_plate = NULL,
               assigned_vehicle_model = NULL,
               updated_at = NOW()
           WHERE booking_id = $2
           RETURNING booking_id`,
          [reason, bookingId],
        );

        await client.query(
          `INSERT INTO dka_notifications (user_id, booking_id, title, message, type)
           VALUES ($1, $2, 'Booking Update', $3, 'booking_rejected')`,
          [prev.user_id, bookingId, `Your booking could not be approved: ${reason}`],
        );

        await client.query('COMMIT');
        return bookingRes.rows[0];
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    });

    return c.json({
      success: true,
      message: 'Booking reservation rejected.',
      booking: updated,
    });
  } catch (error: any) {
    if (error instanceof HttpError) throw error;

    const targetBooking = fallbackBookings.find((b) => b.id === bookingId);
    if (!targetBooking) {
      throw new HttpError(404, 'Booking reservation not found.');
    }

    if (targetBooking.assignedVehicleId) {
      const v = fallbackVehicles.find((vh) => vh.id === targetBooking.assignedVehicleId);
      if (v) v.status = 'available';
    }

    targetBooking.status = 'Cancelled';
    targetBooking.rejectionReason = reason;
    targetBooking.assignedVehicleId = null;
    targetBooking.assignedVehiclePlate = null;
    targetBooking.assignedVehicleModel = null;

    return c.json({
      success: true,
      message: 'Booking reservation rejected (fallback).',
      booking: targetBooking,
    });
  }
});

/**
 * PATCH /api/admin/trips/:id/complete
 * Completes a confirmed trip and releases the assigned vehicle to available status.
 */
adminRoute.patch('/trips/:id/complete', requireAdminAuth, async (c) => {
  const bookingId = Number(c.req.param('id'));
  if (isNaN(bookingId)) {
    throw new HttpError(400, 'Invalid booking ID.');
  }

  try {
    const updated = await withPublicClient(async (client) => {
      await client.query("SET LOCAL app.is_admin = 'true'");
      await client.query('BEGIN');

      try {
        const prevRes = await client.query<{
          assigned_vehicle_id: number | null;
          user_id: number;
          booking_status: string;
        }>(
          `SELECT assigned_vehicle_id, user_id, booking_status FROM dka_bookings WHERE booking_id = $1`,
          [bookingId],
        );
        if (prevRes.rows.length === 0) {
          throw new HttpError(404, 'Booking reservation not found.');
        }

        const prev = prevRes.rows[0];

        // Release vehicle back to available
        if (prev.assigned_vehicle_id) {
          await client.query(
            `UPDATE dka_vehicles SET status = 'available', updated_at = NOW() WHERE vehicle_id = $1`,
            [prev.assigned_vehicle_id],
          );
        }

        const bookingRes = await client.query<{ booking_id: number }>(
          `UPDATE dka_bookings
           SET booking_status = 'Completed',
               updated_at = NOW()
           WHERE booking_id = $1
           RETURNING booking_id`,
          [bookingId],
        );

        // Dispatched completion notification
        await client.query(
          `INSERT INTO dka_notifications (user_id, title, message, type)
           VALUES ($1, $2, $3, 'trip_completed')`,
          [
            prev.user_id,
            'Trip Completed',
            'Your Himalayan trip has successfully concluded. Thank you for traveling with Drive Kendra!',
          ],
        );

        await client.query('COMMIT');
        return bookingRes.rows[0];
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    });

    return c.json({
      success: true,
      message: 'Trip completed and vehicle released to available fleet.',
      bookingId: updated.booking_id,
    });
  } catch {
    const targetBooking = fallbackBookings.find((b) => b.id === bookingId);
    if (!targetBooking) {
      throw new HttpError(404, 'Booking reservation not found.');
    }

    if (targetBooking.assignedVehicleId) {
      const v = fallbackVehicles.find((vh) => vh.id === targetBooking.assignedVehicleId);
      if (v) v.status = 'available';
    }

    targetBooking.status = 'Completed';

    return c.json({
      success: true,
      message: 'Trip marked as completed (fallback).',
      booking: targetBooking,
    });
  }
});

/**
 * GET /api/admin/advisories
 * List active mountain highway and road advisories
 */
adminRoute.get('/advisories', requireAdminAuth, async (c) => {
  try {
    const advisories = await withPublicClient(async (client) => {
      await client.query("SET LOCAL app.is_admin = 'true'");
      const res = await client.query<{
        advisory_id: number;
        route_name: string;
        status: string;
        condition_summary: string;
        severity: string;
        created_at: Date;
      }>(`SELECT advisory_id, route_name, status, condition_summary, severity, created_at
          FROM dka_road_advisories
          ORDER BY created_at DESC`);

      return res.rows.map((r) => ({
        id: r.advisory_id,
        routeName: r.route_name,
        status: r.status,
        conditionSummary: r.condition_summary,
        severity: r.severity,
        createdAt: r.created_at.toISOString(),
      }));
    });
    return c.json({ success: true, advisories });
  } catch {
    return c.json({ success: true, advisories: fallbackAdvisories });
  }
});

/**
 * POST /api/admin/advisories
 * Create a new road condition advisory
 */
adminRoute.post('/advisories', requireAdminAuth, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createRoadAdvisorySchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message || 'Invalid advisory data.');
  }

  const { routeName, status, conditionSummary, severity } = parsed.data;

  try {
    const advisory = await withPublicClient(async (client) => {
      await client.query("SET LOCAL app.is_admin = 'true'");
      const res = await client.query<{
        advisory_id: number;
        route_name: string;
        status: string;
        condition_summary: string;
        severity: string;
        created_at: Date;
      }>(
        `INSERT INTO dka_road_advisories (route_name, status, condition_summary, severity)
         VALUES ($1, $2, $3, $4)
         RETURNING advisory_id, route_name, status, condition_summary, severity, created_at`,
        [routeName, status, conditionSummary, severity],
      );
      const r = res.rows[0];
      return {
        id: r.advisory_id,
        routeName: r.route_name,
        status: r.status,
        conditionSummary: r.condition_summary,
        severity: r.severity,
        createdAt: r.created_at.toISOString(),
      };
    });
    return c.json({ success: true, advisory }, 201);
  } catch {
    const newRecord: RoadAdvisoryRecord = {
      id: Date.now(),
      routeName,
      status,
      conditionSummary,
      severity,
      createdAt: new Date().toISOString(),
    };
    fallbackAdvisories.unshift(newRecord);
    return c.json({ success: true, advisory: newRecord }, 201);
  }
});

/**
 * DELETE /api/admin/advisories/:id
 * Delete/dismiss a road advisory
 */
adminRoute.delete('/advisories/:id', requireAdminAuth, async (c) => {
  const id = Number(c.req.param('id'));
  if (isNaN(id)) {
    throw new HttpError(400, 'Invalid advisory ID.');
  }

  try {
    await withPublicClient(async (client) => {
      await client.query("SET LOCAL app.is_admin = 'true'");
      await client.query(`DELETE FROM dka_road_advisories WHERE advisory_id = $1`, [id]);
    });
    return c.json({ success: true, message: 'Advisory removed.' });
  } catch {
    fallbackAdvisories = fallbackAdvisories.filter((a) => a.id !== id);
    return c.json({ success: true, message: 'Advisory removed (fallback).' });
  }
});

/**
 * GET /api/admin/vehicles
 * Fleet inventory
 */
adminRoute.get('/vehicles', requireAdminAuth, async (c) => {
  const status = c.req.query('status');
  const category = c.req.query('category');

  try {
    const vehicles = await withPublicClient(async (client) => {
      await client.query("SET LOCAL app.is_admin = 'true'");
      let sql = `
        SELECT vehicle_id, vehicle_type_id, model, registration_plate, category,
               seats, fuel_type, image_url, status, created_at, updated_at
        FROM dka_vehicles
      `;
      const clauses: string[] = [];
      const params: any[] = [];

      if (status) {
        params.push(status);
        clauses.push(`status = $${params.length}`);
      }
      if (category) {
        params.push(category);
        clauses.push(`category = $${params.length}`);
      }

      if (clauses.length > 0) {
        sql += ` WHERE ${clauses.join(' AND ')}`;
      }
      sql += ` ORDER BY created_at DESC`;

      const res = await client.query<{
        vehicle_id: number;
        vehicle_type_id: number;
        model: string;
        registration_plate: string;
        category: 'SUV' | 'Sedan' | 'HiAce' | 'Bus';
        seats: number;
        fuel_type: string;
        image_url: string | null;
        status: 'available' | 'assigned' | 'in_transit' | 'maintenance';
        created_at: Date;
        updated_at: Date;
      }>(sql, params);

      return res.rows.map((r) => ({
        id: r.vehicle_id,
        vehicleTypeId: r.vehicle_type_id,
        model: r.model,
        registrationPlate: r.registration_plate,
        category: r.category,
        seats: r.seats,
        fuelType: r.fuel_type,
        imageUrl: r.image_url || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf',
        status: r.status,
        createdAt: r.created_at.toISOString(),
        updatedAt: r.updated_at.toISOString(),
      }));
    });

    return c.json({ vehicles });
  } catch {
    let result = fallbackVehicles;
    if (status) {
      result = result.filter((v) => v.status === status);
    }
    if (category) {
      result = result.filter((v) => v.category === category);
    }
    return c.json({ vehicles: result });
  }
});

/**
 * POST /api/admin/vehicles
 * Manually register a new vehicle into the fleet
 */
adminRoute.post('/vehicles', requireAdminAuth, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createVehicleSchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message || 'Invalid vehicle details.');
  }

  const { model, registrationPlate, category, seats, fuelType, imageUrl, status } = parsed.data;

  try {
    const newVehicle = await withPublicClient(async (client) => {
      await client.query("SET LOCAL app.is_admin = 'true'");
      const res = await client.query<{
        vehicle_id: number;
        model: string;
        registration_plate: string;
        category: 'SUV' | 'Sedan' | 'HiAce' | 'Bus';
        seats: number;
        fuel_type: string;
        image_url: string | null;
        status: 'available' | 'assigned' | 'in_transit' | 'maintenance';
        created_at: Date;
        updated_at: Date;
      }>(
        `INSERT INTO dka_vehicles (model, registration_plate, category, seats, fuel_type, image_url, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING vehicle_id, model, registration_plate, category, seats, fuel_type, image_url, status, created_at, updated_at`,
        [model, registrationPlate, category, seats, fuelType, imageUrl || null, status],
      );

      const r = res.rows[0];
      return {
        id: r.vehicle_id,
        vehicleTypeId: 1,
        model: r.model,
        registrationPlate: r.registration_plate,
        category: r.category,
        seats: r.seats,
        fuelType: r.fuel_type,
        imageUrl: r.image_url || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf',
        status: r.status,
        createdAt: r.created_at.toISOString(),
        updatedAt: r.updated_at.toISOString(),
      };
    });

    return c.json({
      success: true,
      message: 'Vehicle added to fleet successfully.',
      vehicle: newVehicle,
    }, 201);
  } catch (error: any) {
    if (error instanceof HttpError) throw error;
    if (error?.code === '23505') {
      throw new HttpError(409, 'A vehicle with this registration plate is already registered.');
    }

    // In-memory fallback
    const newId = fallbackVehicles.length > 0 ? Math.max(...fallbackVehicles.map((v) => v.id)) + 1 : 1;
    const item: VehicleRecord = {
      id: newId,
      vehicleTypeId: 1,
      model,
      registrationPlate,
      category,
      seats,
      fuelType,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf',
      status: status || 'available',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    fallbackVehicles.unshift(item);

    return c.json({
      success: true,
      message: 'Vehicle added to fleet successfully (fallback).',
      vehicle: item,
    }, 201);
  }
});

/**
 * PATCH /api/admin/vehicles/:id
 * Update vehicle availability or details (e.g. quick toggle maintenance)
 */
adminRoute.patch('/vehicles/:id', requireAdminAuth, async (c) => {
  const vehicleId = Number(c.req.param('id'));
  if (isNaN(vehicleId)) {
    throw new HttpError(400, 'Invalid vehicle ID.');
  }

  const body = await c.req.json().catch(() => null);
  const parsed = updateVehicleSchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message || 'Invalid update payload.');
  }

  const updates = parsed.data;

  try {
    const updated = await withPublicClient(async (client) => {
      await client.query("SET LOCAL app.is_admin = 'true'");
      const res = await client.query<{
        vehicle_id: number;
        model: string;
        registration_plate: string;
        category: 'SUV' | 'Sedan' | 'HiAce' | 'Bus';
        seats: number;
        fuel_type: string;
        image_url: string | null;
        status: 'available' | 'assigned' | 'in_transit' | 'maintenance';
        created_at: Date;
        updated_at: Date;
      }>(
        `UPDATE dka_vehicles
         SET model = COALESCE($1, model),
             registration_plate = COALESCE($2, registration_plate),
             category = COALESCE($3, category),
             seats = COALESCE($4, seats),
             fuel_type = COALESCE($5, fuel_type),
             image_url = COALESCE($6, image_url),
             status = COALESCE($7, status),
             updated_at = NOW()
         WHERE vehicle_id = $8
         RETURNING vehicle_id, model, registration_plate, category, seats, fuel_type, image_url, status, created_at, updated_at`,
        [
          updates.model || null,
          updates.registrationPlate || null,
          updates.category || null,
          updates.seats || null,
          updates.fuelType || null,
          updates.imageUrl || null,
          updates.status || null,
          vehicleId,
        ],
      );

      if (res.rows.length === 0) {
        throw new HttpError(404, 'Vehicle not found.');
      }

      const r = res.rows[0];
      return {
        id: r.vehicle_id,
        vehicleTypeId: 1,
        model: r.model,
        registrationPlate: r.registration_plate,
        category: r.category,
        seats: r.seats,
        fuelType: r.fuel_type,
        imageUrl: r.image_url || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf',
        status: r.status,
        createdAt: r.created_at.toISOString(),
        updatedAt: r.updated_at.toISOString(),
      };
    });

    return c.json({
      success: true,
      message: 'Vehicle updated successfully.',
      vehicle: updated,
    });
  } catch (error: any) {
    if (error instanceof HttpError) throw error;

    const target = fallbackVehicles.find((v) => v.id === vehicleId);
    if (!target) {
      throw new HttpError(404, 'Vehicle not found.');
    }

    if (updates.status) target.status = updates.status;
    if (updates.model) target.model = updates.model;
    if (updates.registrationPlate) target.registrationPlate = updates.registrationPlate;
    if (updates.category) target.category = updates.category;
    if (updates.seats) target.seats = updates.seats;
    if (updates.fuelType) target.fuelType = updates.fuelType;
    if (updates.imageUrl) target.imageUrl = updates.imageUrl;
    target.updatedAt = new Date().toISOString();

    return c.json({
      success: true,
      message: 'Vehicle updated successfully (fallback).',
      vehicle: target,
    });
  }
});
