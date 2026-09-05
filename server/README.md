# 🚀 Drive Kendra Mobile API Server

[![Hono API](https://img.shields.io/badge/API-Hono%20v4-E36002?style=for-the-badge&logo=hono&logoColor=white)](https://hono.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Tests](https://img.shields.io/badge/Tests-58%20Passed-success?style=for-the-badge)](https://github.com/Samman162/DriveKendra.Mobile)

The **Drive Kendra Mobile API** is a high-performance, lightweight REST API built with [Hono](https://hono.dev) v4 running on Node.js. It powers the Drive Kendra mobile application, providing endpoints for vehicle bookings, 2FA admin portal operations, fleet inventory management, user authentication, profile updates, and idempotency handling.

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Directory Structure](#-directory-structure)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
  - [1. Health Check](#1-health-check)
  - [2. Authentication](#2-authentication)
  - [3. Bookings & Idempotency](#3-bookings--idempotency)
  - [4. Users & Profile](#4-users--profile)
  - [5. Admin Portal Subsystem](#5-admin-portal-subsystem)
- [Database Security & Row-Level Security (RLS)](#-database-security--row-level-security-rls)
- [Testing & Quality Assurance (58 Tests)](#-testing--quality-assurance-58-tests)

---

## 🌟 Key Features

- **⚡ Blazing Fast Routing**: Powered by Hono v4 and `@hono/node-server`.
- **🔒 Idempotent Booking Engine**: Eliminates duplicate charges/reservations caused by flaky mountain cellular networks using `X-Idempotency-Key` and database caching.
- **🛡️ Strict Validation & Anti-Spam**: Zod schema validation, honeypot bot traps (`website_hp`), and Nepal phone number sanitization (`+977 98/97` or `01XXXXXXX`).
- **🗄️ Multi-Table Atomic Transactions**: PostgreSQL transactions ensuring data integrity across `dka_users`, `dka_bookings`, and `dka_idempotency_keys`.
- **🚙 Vehicle Assignment Tracking**: Seamless assignment of vehicle models and registration plates for confirmed expeditions.

---

## 🏗 Architecture & Tech Stack

- **Framework**: [Hono](https://hono.dev) v4
- **Runtime**: Node.js (ES Modules) with `tsx` hot-reloading
- **Database Driver**: `pg` (node-postgres connection pool)
- **Validation**: [Zod](https://zod.dev) v4
- **Testing**: [Jest](https://jestjs.io) with `ts-jest` & Experimental VM Modules

---

## 📁 Directory Structure

```
server/
├── src/
│   ├── routes/
│   │   ├── auth.ts           # Login, register, OTP reset endpoints
│   │   ├── bookings.ts       # GET & POST /api/bookings with Idempotency & DB transaction
│   │   └── users.ts          # User profile & push token endpoints (/api/users)
│   ├── db.ts                 # PostgreSQL connection pool & tenant security wrapper
│   ├── index.ts              # Server entry point & CORS configuration
│   └── validation.ts         # Zod schemas, honeypot filters, Nepal phone helpers
├── __tests__/
│   ├── apiEndpoints.test.ts  # Integration tests for health, auth, bookings, users, idempotency (25 tests)
│   └── validation.test.ts    # Unit tests for validation schemas, regex, and honeypot (11 tests)
├── .env.example              # Server environment template
├── package.json              # Dependencies and scripts
└── tsconfig.json             # TypeScript configuration
```

---

## ⚙️ Environment Variables

Create a `.env` file inside the `server/` directory:

```env
# PostgreSQL connection string (supports standard URI or ADO.NET format)
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/car_rental_db

# Port for the Hono server (default: 8787)
PORT=8787
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install --prefix server
```

### 2. Start the Server in Development Mode (Watch Mode)
```bash
npm run dev --prefix server
# or from inside server/
npm run dev
```

The API will start at `http://localhost:8787`.

### 3. Run in Production
```bash
npm run start --prefix server
```

---

## 🔌 API Reference

### 1. Health Check

#### `GET /health`
Verifies database connectivity and server status.

- **Response `200 OK`**:
```json
{
  "status": "online",
  "database": "connected",
  "timestamp": "2026-09-05T13:55:00.000Z"
}
```

---

### 2. Authentication

#### `POST /api/auth/login`
Authenticates a user via email or Nepal phone number.

- **Request Body**:
```json
{
  "identifier": "9851363783",
  "password": "SecurePassword123"
}
```
- **Response `200 OK`**:
```json
{
  "user": {
    "id": 1,
    "name": "Samman Shakya",
    "email": "samman@example.com",
    "phone": "9851363783"
  },
  "token": "demo-jwt-token-xyz",
  "message": "Welcome back, Samman Shakya!"
}
```

#### `POST /api/auth/register`
Registers a new customer account.

- **Request Body**:
```json
{
  "name": "Prajwol Thapa",
  "email": "prajwol@example.com",
  "phone": "9841234567",
  "password": "Password123"
}
```

#### `POST /api/auth/forgot-password`
Initiates a 6-digit OTP password reset sequence.

- **Request Body**:
```json
{
  "identifier": "9841234567"
}
```
- **Response `200 OK`**:
```json
{
  "message": "A 6-digit reset code has been sent to your registered phone / email.",
  "code": "482910"
}
```

#### `POST /api/auth/reset-password`
Completes password reset using verified OTP.

- **Request Body**:
```json
{
  "identifier": "9841234567",
  "code": "482910",
  "newPassword": "NewSecurePassword456"
}
```

---

### 3. Bookings & Idempotency

#### `GET /api/bookings`
Retrieves the list of active bookings with assigned vehicle models and registration plates. Requires either `userId` (numeric) or `phoneNumber` (Nepal phone string) as a query parameter.

- **Query Parameters**:
  - `userId` *(optional)*: Filter by customer ID (e.g. `?userId=1`)
  - `phoneNumber` *(optional)*: Filter by customer phone number (e.g. `?phoneNumber=9851363783`)
- **Response `200 OK`**:
```json
{
  "bookings": [
    {
      "bookingId": 42,
      "bookingRef": "DK-2026-0042",
      "userId": 1,
      "vehicleTypeId": 2,
      "vehicleTypeName": "SUV / Scorpio 4x4",
      "pickupLocation": "Kathmandu Airport (TIA)",
      "dropoffLocation": "Pokhara Lakeside",
      "pickupDate": "2026-09-01T06:00:00.000Z",
      "pickupTime": "07:00 AM",
      "returnDate": "2026-09-03T18:00:00.000Z",
      "passengerCount": 4,
      "tripType": "Round Trip",
      "estimatedFare": "NPR 12,000",
      "status": "Confirmed",
      "assignedVehiclePlate": "Ba 2 Cha 8492",
      "assignedVehicleModel": "Mahindra Scorpio 4x4",
      "createdAt": "2026-08-30T10:00:00.000Z"
    }
  ]
}
```

#### `POST /api/bookings`
Submits a car or tour reservation. Executes an atomic PostgreSQL transaction across `dka_users`, `dka_bookings`, and `dka_idempotency_keys`.

- **Headers**:
  - `X-Idempotency-Key` *(optional, recommended)*: UUID or client-generated unique string for retry deduplication.
- **Request Body**:
```json
{
  "full_name": "Ramesh Adhikari",
  "phone_number": "9851000000",
  "email": "ramesh@example.com",
  "vehicle_type_id": 2,
  "pickup_location": "Kathmandu Airport (TIA)",
  "dropoff_location": "Pokhara Lakeside",
  "pickup_date": "2026-09-01T06:00:00.000Z",
  "return_date": "2026-09-03T18:00:00.000Z",
  "passenger_count": 4,
  "trip_type": "Round Trip",
  "additional_details": "Require Scorpio 4WD with rooftop luggage rack.",
  "website_hp": ""
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "Booking submitted successfully",
  "bookingId": 42,
  "tripRequestId": 42,
  "bookingRef": "DK-2026-0042",
  "status": "Pending"
}
```

> **Idempotency Behavior**:
> If a request with an existing `X-Idempotency-Key` is re-sent after successful processing, the API returns the cached `201` response with the header `X-Cache-Lookup: HIT` without duplicate record insertions.

---

### 4. Users & Profile

#### `PUT /api/users/profile`
Updates a user's full name, phone number, and custom avatar URL.

- **Request Body**:
```json
{
  "userId": 1,
  "fullName": "Samman Shakya",
  "phone": "9851363783",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

#### `POST /api/users/push-token`
Registers or updates a client device push notification token.

- **Request Body**:
```json
{
  "pushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "customerId": 1,
  "phoneNumber": "9851363783"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Push token registered successfully"
}
```

---

### 5. Admin Portal Subsystem

All administrative endpoints require two-factor authentication (2FA) and issue a signed 24h JWT with `role: 'admin'`.

#### `POST /api/admin/login`
Step-1 verification for primary operator credentials (phone: `9800000000`, password: `admin@123`).
- **Response**: `{ "success": true, "pinRequired": true, "challengeToken": "adm_chal_..." }`

#### `POST /api/admin/verify-pin`
Step-2 verification for 4-digit security PIN (`6767`).
- **Response**: `{ "success": true, "token": "jwt_admin_...", "admin": { "id": "1", "name": "Drive Kendra Admin", "role": "admin" } }`

#### `GET /api/admin/stats`
Returns aggregated control room metrics: `{ "pendingRequests": 2, "activeFleet": 4, "totalUsers": 4, "totalTrips": 3, "totalRevenue": "NPR 148,500" }`.

#### `GET /api/admin/users`
Lists registered customers with reservation counts and lifetime expenditure. Supports `?q=` search.

#### `GET /api/admin/trips`
Retrieves incoming bookings for dispatch review (supports `?status=Pending|Confirmed|Cancelled`).

#### `PATCH /api/admin/trips/:id/approve`
Approves a reservation and atomically assigns a fleet vehicle (`{ "vehicleId": 1 }`), updating vehicle status to `assigned` and dispatching customer notification.

#### `PATCH /api/admin/trips/:id/reject`
Cancels reservation with stated reason (`{ "reason": "Severe weather on highway." }`).

#### `GET /api/admin/vehicles` & `POST /api/admin/vehicles`
Fleet inventory endpoints for listing, filtering, and registering new vehicles.

#### `PATCH /api/admin/vehicles/:id`
Updates vehicle status (e.g. toggles between `available` and `maintenance`).

---

## 🔒 Database Security & Row-Level Security (RLS)

All database queries executed via `withPublicClient` in `src/db.ts` automatically set:
```sql
SET LOCAL app.is_admin = 'false';
```
For administrative requests, the `requireAdminAuth` middleware verifies the signed admin JWT and sets:
```sql
SET LOCAL app.is_admin = 'true';
```
This isolates unauthenticated public requests from administrative operations and enforces strict database tenant safety. All SQL statements use `$1, $2, ...` positional parameterization to ensure complete protection against SQL injection.

---

## 🧪 Testing & Quality Assurance (58 Tests)

The server test suite includes **58 automated tests** across **3 test suites**:
- **`validation.test.ts` (11 tests)**: Unit tests for Zod schemas, honeypot bot trap filtering (`website_hp`), and Nepal phone number sanitization (`normalizePhone`).
- **`apiEndpoints.test.ts` (25 tests)**: Integration tests for `/health`, `/api/auth/*` (login, registration, OTP reset sequence), `/api/bookings` (GET with query filters, POST with transactional multi-table writes and `X-Idempotency-Key` deduplication), and `/api/users/*` (profile and push tokens).
- **`adminEndpoints.test.ts` (22 tests)**: Complete integration suite for 2FA primary login, PIN gate verification, RLS auth guards, customer directory, trip approval/rejection, and fleet inventory management.

### Run Test Suites
```bash
# Run all server tests (58 tests)
npm test --prefix server

# Run individual test suites
npm test --prefix server -- __tests__/validation.test.ts
npm test --prefix server -- __tests__/apiEndpoints.test.ts
npm test --prefix server -- __tests__/adminEndpoints.test.ts
```

### Run TypeScript Typechecking
```bash
npm run typecheck --prefix server
```
