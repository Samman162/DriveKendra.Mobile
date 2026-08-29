# 🚀 Drive Kendra Mobile API Server

[![Hono API](https://img.shields.io/badge/API-Hono%20v4-E36002?style=for-the-badge&logo=hono&logoColor=white)](https://hono.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)

The **Drive Kendra Mobile API** is a high-performance, lightweight REST API built with [Hono](https://hono.dev) v4 running on Node.js. It powers the Drive Kendra mobile application, providing endpoints for vehicle bookings, user authentication, customer review management, public fleet statistics, and idempotency handling.

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
  - [5. Reviews & Testimonials](#5-reviews--testimonials)
  - [6. Platform Statistics](#6-platform-statistics)
- [Database Security & Row-Level Security (RLS)](#-database-security--row-level-security-rls)
- [Testing & Quality Assurance (14 Tests)](#-testing--quality-assurance-14-tests)

---

## 🌟 Key Features

- **⚡ Blazing Fast Routing**: Powered by Hono v4 and `@hono/node-server`.
- **🔒 Idempotent Booking Engine**: Eliminates duplicate charges/reservations caused by flaky mountain cellular networks using `X-Idempotency-Key` and database caching.
- **🛡️ Strict Validation & Anti-Spam**: Zod schema validation, honeypot bot traps (`website_hp`), and Nepal phone number sanitization (`+977 98/97` or `01XXXXXXX`).
- **🗄️ Multi-Table Atomic Transactions**: PostgreSQL transactions ensuring data integrity across `dka_users`, `dka_bookings`, and `dka_idempotency_keys`.
- **📊 Real-time Analytics**: Stored procedure `dka_get_public_stats()` aggregating active fleet counts, completed trips, cities covered, and customer ratings.

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
│   │   ├── bookings.ts       # POST /api/bookings with Idempotency & DB transaction
│   │   ├── reviews.ts        # Testimonial submission & public listing
│   │   ├── stats.ts          # Aggregated live platform statistics
│   │   └── users.ts          # User profile update endpoints (/api/users/profile)
│   ├── db.ts                 # PostgreSQL connection pool & tenant security wrapper
│   ├── index.ts              # Server entry point & CORS configuration
│   └── validation.ts         # Zod schemas, honeypot filters, Nepal phone helpers
├── __tests__/
│   └── validation.test.ts    # Unit tests for validation, regex, and honeypot
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
  "ok": true
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
> If a request with an existing `X-Idempotency-Key` is re-sent after successful processing, the API returns the cached `201` response with the header `X-Cache-Lookup: HIT` without re-inserting records.

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

---

### 5. Reviews & Testimonials

#### `GET /api/reviews`
Retrieves all approved traveler testimonials (`is_approved = true`).

- **Response `200 OK`**:
```json
[
  {
    "id": 1,
    "name": "Bipul Sharma",
    "rating": 5,
    "comment": "Seamless Scorpio rental for our Muktinath trip! Chauffeur was exceptionally skilled on the off-road trails.",
    "trip_title": "Muktinath 4WD Tour",
    "created_at": "2026-07-15T10:30:00.000Z"
  }
]
```

#### `POST /api/reviews`
Submits a customer review for moderation.

- **Request Body**:
```json
{
  "name": "Anita Shrestha",
  "rating": 5,
  "comment": "Airport pickup was right on time with a clean sedan and polite driver.",
  "trip_title": "TIA Airport Drop",
  "website_hp": ""
}
```

---

### 6. Platform Statistics

#### `GET /api/stats`
Calls stored procedure `dka_get_public_stats()` to retrieve real-time platform metrics.

- **Response `200 OK`**:
```json
{
  "fleet_count": 35,
  "completed_trips": 1250,
  "cities_covered": 48,
  "review_count": 320,
  "average_rating": 4.9
}
```

---

## 🔒 Database Security & Row-Level Security (RLS)

All database queries executed via `withPublicClient` in `src/db.ts` automatically set:
```sql
SET LOCAL app.is_admin = 'false';
```
This isolates unauthenticated public requests from administrative operations and enforces strict database tenant safety. All SQL statements use `$1, $2, ...` positional parameterization to ensure complete protection against SQL injection.

---

## 🧪 Testing & Quality Assurance (14 Tests)

### Run Unit Tests
```bash
npm test --prefix server
```

### Run TypeScript Typechecking
```bash
npm run typecheck --prefix server
```
