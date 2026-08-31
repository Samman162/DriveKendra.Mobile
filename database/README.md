# 🗄️ Drive Kendra Mobile Database Architecture & Schema

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Database Rules](https://img.shields.io/badge/Schema%20Rules-Strict%20Migrations-success?style=for-the-badge)](https://github.com/Samman162/DriveKendra.Mobile)

This directory contains the canonical PostgreSQL database schema, migration patches, and indexes tailored specifically for the **Drive Kendra Mobile App**.

---

## ⚠️ Mandatory Database Management Rules

> [!IMPORTANT]
> All engineers, administrators, and AI assistants working with this database **MUST STRICTLY ADHERE** to the following rules:
>
> 1. **Base Schema**: Always maintain and update the complete base database schema, tables, indexes, and functions in [`database/database.sql`](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/database/database.sql) as the single canonical source of truth.
> 2. **Patches Folder**: For any pending database updates, alterations, or incremental changes, create a new numbered patch file inside [`database/patches/`](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/database/patches/) (e.g., `001_add_feature.sql`, `002_add_table.sql`).
> 3. **Patch Consolidation & Cleanup**: Once patches have been applied to the target database and verified in [`database/database.sql`](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/database/database.sql), delete the applied patch files from `database/patches/`.
> 4. **Execution Constraint**: **NEVER** run SQL queries directly on any live production or staging database yourself. Only produce the SQL files in `database/database.sql` and `database/patches/` for manual or administrator application.

---

## 📑 Table of Contents

- [Database Architecture (4 Core Tables)](#-database-architecture-4-core-tables)
- [Schema Table Definitions](#-schema-table-definitions)
  - [1. `dka_users`](#1-dka_users)
  - [2. `dka_vehicle_types`](#2-dka_vehicle_types)
  - [3. `dka_bookings`](#3-dka_bookings)
  - [4. `dka_idempotency_keys`](#4-dka_idempotency_keys)
- [Indexing & Query Optimization](#-indexing--query-optimization)
- [Initializing Database from Scratch](#-initializing-database-from-scratch)

---

## 🏗 Database Architecture (4 Core Tables)

```
                       ┌─────────────────────────┐
                       │   dka_vehicle_types     │
                       └───────────┬─────────────┘
                                   │ 1:N
                                   ▼
┌─────────────────┐ 1:N   ┌─────────────────┐
│    dka_users    ├──────►│  dka_bookings   │
└────────┬────────┘       └─────────────────┘
         │ 1:N
         ▼
┌──────────────────────┐
│ dka_idempotency_keys │
└──────────────────────┘
```

---

## 📋 Schema Table Definitions

### 1. `dka_users`
User accounts, traveler profiles, and authentication credentials.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `user_id` | `SERIAL` | `PRIMARY KEY` | Unique user ID |
| `full_name` | `VARCHAR(120)` | `NOT NULL` | Full name |
| `phone_number` | `VARCHAR(30)` | `UNIQUE NOT NULL` | Nepal phone number (`+977 98/97` or `01XXXXXXX`) |
| `email` | `VARCHAR(120)` | `UNIQUE` | User email address |
| `password_hash` | `VARCHAR(255)` | | Bcrypt password hash |
| `avatar_url` | `TEXT` | | Custom profile photo URL |
| `role` | `VARCHAR(30)` | `NOT NULL DEFAULT 'customer'` | `customer`, `driver`, `operator`, `admin` |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT TRUE` | Account status |
| `is_verified` | `BOOLEAN` | `NOT NULL DEFAULT FALSE` | Phone/Email verification |
| `last_login_at` | `TIMESTAMPTZ` | | Timestamp of last login |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Record update timestamp |

---

### 2. `dka_vehicle_types`
Lookup catalog defining categories of vehicles available for booking.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `vehicle_type_id` | `SERIAL` | `PRIMARY KEY` | Unique ID |
| `type_name` | `VARCHAR(100)` | `NOT NULL UNIQUE` | e.g. Sedan, SUV 4x4, HiAce Van, Bus |
| `description` | `TEXT` | | Category specs |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Record creation timestamp |

---

### 3. `dka_bookings`
Primary trip and vehicle booking records with chauffeur and vehicle assignment tracking.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `booking_id` | `SERIAL` | `PRIMARY KEY` | Reservation ID |
| `user_id` | `INTEGER` | `NOT NULL REFERENCES dka_users(user_id) ON DELETE CASCADE` | Linked user/traveler |
| `vehicle_type_id` | `INTEGER` | `REFERENCES dka_vehicle_types ON DELETE SET NULL` | Chosen vehicle category |
| `pickup_location` | `VARCHAR(255)` | `NOT NULL` | Origin address or landmark |
| `dropoff_location` | `VARCHAR(255)` | `NOT NULL` | Destination address or landmark |
| `pickup_date` | `TIMESTAMPTZ` | `NOT NULL` | Departure date & timestamp |
| `pickup_time` | `VARCHAR(20)` | | Scheduled pickup time string (e.g. `07:00 AM`) |
| `return_date` | `TIMESTAMPTZ` | | Return date & time (for round trips) |
| `passenger_count` | `INTEGER` | `NOT NULL DEFAULT 1` | Number of travelers |
| `trip_type` | `VARCHAR(50)` | `NOT NULL DEFAULT 'One Way'` | `One Way` or `Round Trip` |
| `estimated_fare` | `VARCHAR(50)` | | Target budget or quoted fare (e.g. `NPR 12,000`) |
| `additional_details` | `TEXT` | | Special instructions & luggage notes |
| `booking_status` | `VARCHAR(50)` | `NOT NULL DEFAULT 'Pending'` | `Pending`, `Confirmed`, `Completed`, `Cancelled` |
| `assigned_driver_name` | `VARCHAR(100)` | | Driver full name |
| `assigned_driver_phone` | `VARCHAR(30)` | | Driver direct contact number |
| `assigned_driver_rating` | `NUMERIC(2,1)` | `DEFAULT 4.9` | Driver performance rating |
| `assigned_vehicle_plate` | `VARCHAR(50)` | | Vehicle number plate |
| `assigned_vehicle_model` | `VARCHAR(100)` | | Vehicle model / trim details |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Timestamp (Auto-updated via trigger) |

---

### 4. `dka_idempotency_keys`
Prevents duplicate transactions when mobile clients retry on unstable mountain cellular networks.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `idempotency_key` | `VARCHAR(128)` | `PRIMARY KEY` | Client-generated unique UUID / key |
| `user_id` | `INTEGER` | `REFERENCES dka_users(user_id) ON DELETE SET NULL` | Linked user ID |
| `request_hash` | `VARCHAR(64)` | `NOT NULL` | SHA-256 hash of payload |
| `endpoint` | `VARCHAR(100)` | `NOT NULL DEFAULT '/api/bookings'` | API endpoint |
| `status` | `VARCHAR(30)` | `NOT NULL DEFAULT 'processing'` | `processing`, `completed`, `failed` |
| `response_code` | `INTEGER` | | Cached HTTP status (e.g. 201) |
| `response_body` | `JSONB` | | Cached JSON response body |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Update timestamp |
| `expires_at` | `TIMESTAMPTZ` | `DEFAULT (NOW() + INTERVAL '24 hours')` | TTL expiration |

---

## 🔍 Indexing & Query Optimization

- `idx_dka_users_phone` ON `dka_users(phone_number)`
- `idx_dka_users_email` ON `dka_users(email)`
- `idx_dka_users_role` ON `dka_users(role)`
- `idx_dka_users_created_at` ON `dka_users(created_at)`
- `idx_dka_bookings_user_id` ON `dka_bookings(user_id)`
- `idx_dka_bookings_status` ON `dka_bookings(booking_status)`
- `idx_dka_bookings_pickup_date` ON `dka_bookings(pickup_date)`
- `idx_dka_bookings_created_at` ON `dka_bookings(created_at DESC)`
- `idx_dka_bookings_user_status` ON `dka_bookings(user_id, booking_status)`
- `idx_dka_idempotency_keys_user_id` ON `dka_idempotency_keys(user_id)`
- `idx_dka_idempotency_keys_expires_at` ON `dka_idempotency_keys(expires_at)`
- `idx_dka_idempotency_keys_hash` ON `dka_idempotency_keys(request_hash)`

---

## 🚀 Initializing Database from Scratch

```bash
psql -U postgres -d car_rental_db -f database/database.sql
```
Or in **DBeaver** / **pgAdmin**: Open [`database/database.sql`](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/database/database.sql) and execute script (`Alt + X` / `F5`).
