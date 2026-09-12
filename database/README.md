# 🗄️ Drive Kendra Mobile Database Architecture & Schema

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Database Rules](https://img.shields.io/badge/Schema%20Rules-Strict%20Migrations-success?style=for-the-badge)](https://github.com/Samman162/DriveKendra.Mobile)

This directory contains the canonical PostgreSQL database schema, migration patches, and indexes tailored specifically for the **Drive Kendra Mobile App**.

---

## ⚠️ Mandatory Database Management Rules

> [!IMPORTANT]
> All engineers, administrators, and AI assistants working with this database **MUST STRICTLY ADHERE** to the following rules:
>
> 1. **Base Schema**: Always maintain and update the complete base database schema, tables, indexes, and functions in [`database/database.sql`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/database.sql) as the single canonical source of truth.
> 2. **Patches Folder**: For any pending database updates, alterations, or incremental changes, create a new numbered patch file inside [`database/patches/`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/patches/) (e.g., `001_initial_schema.sql`, `002_add_field.sql`).
> 3. **Patch Consolidation & Cleanup**: Once patches have been applied to the target database and verified in [`database/database.sql`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/database.sql), delete the applied patch files from `database/patches/`.
> 4. **Execution Constraint**: **NEVER** run SQL queries directly on any live production or staging database yourself. Only produce the SQL files in `database/database.sql` and `database/patches/` for manual or administrator application.

---

## 📑 Table of Contents

- [Database Architecture & Data Synchronization](#-database-architecture--data-synchronization)
- [Schema Table Definitions](#-schema-table-definitions)
  - [1. `dka_users`](#1-dka_users)
  - [2. `dka_vehicle_types`](#2-dka_vehicle_types)
  - [3. `dka_vehicles`](#3-dka_vehicles)
  - [4. `dka_bookings`](#4-dka_bookings)
  - [5. `dka_notifications`](#5-dka_notifications)
  - [6. `dka_push_tokens`](#6-dka_push_tokens)
  - [7. `dka_idempotency_keys`](#7-dka_idempotency_keys)
  - [8. `dka_road_advisories`](#8-dka_road_advisories)
  - [9. `cr_owners` & `dka_owners`](#9-cr_owners--dka_owners)
  - [10. Bidirectional Triggers & `cr_drivers` View](#10-bidirectional-triggers--cr_drivers-view)
- [Incremental Migration Patches](#-incremental-migration-patches)
- [Indexing & Query Optimization](#-indexing--query-optimization)
- [Seed Data (Catalog, Accounts, Advisories & Drivers)](#-seed-data-catalog-accounts-advisories--drivers)
- [Initializing Database from Scratch](#-initializing-database-from-scratch)

---

## 🏗 Database Architecture & Data Synchronization

```
                       ┌─────────────────────────┐
                       │   dka_vehicle_types     │
                       └───────────┬─────────────┘
                                   │ 1:N
                                   ▼
                       ┌─────────────────────────┐
                       │      dka_vehicles       │
                       └───────────┬─────────────┘
                                   │ 1:N
                                   ▼
┌─────────────────┐ 1:N   ┌─────────────────┐ 1:N   ┌───────────────────┐
│    dka_users    ├──────►│  dka_bookings   ├──────►│ dka_notifications │
└────────┬────────┘       └─────────────────┘       └───────────────────┘
         │ 1:N
         ├──────────────────────► ┌──────────────────────┐
         │                        │ dka_road_advisories  │
         │                        └──────────────────────┘
         ▼
┌──────────────────────┐
│ dka_idempotency_keys │
└──────────────────────┘

  ┌─────────────────────────────────────────────────────────────┐
  │     Bidirectional Owner & Vehicle Synchronization           │
  │                                                             │
  │     ┌──────────────┐   Triggers (pg_trigger_depth)   ┌──────────────┐     │
  │     │  cr_owners   │ ◄─────────────────────────────► │  dka_owners  │     │
  │     └──────────────┘                                 └──────┬───────┘     │
  │                                                             │ View        │
  │     ┌──────────────┐   Triggers (pg_trigger_depth)   ┌──────▼───────┐     │
  │     │ cr_vehicles  │ ◄─────────────────────────────► │  cr_drivers  │     │
  │     └──────────────┘                                 └──────────────┘     │
  │            ▲                                                ▲             │
  │            │                                                │             │
  │            └────────────────────────────────────────────────┘             │
  │                        dka_vehicles ◄─► cr_vehicles                       │
  └─────────────────────────────────────────────────────────────┘
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
| `role` | `VARCHAR(30)` | `NOT NULL DEFAULT 'customer'` | `customer`, `operator`, `admin` |
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

### 3. `dka_vehicles`
Fleet vehicle inventory holding the exact 1:1 schema structure of `public.cr_vehicles`. Synchronized bidirectionally with `cr_vehicles` in real time.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `vehicle_id` | `SERIAL` | `PRIMARY KEY` | Unique vehicle identifier |
| `owner_id` | `INTEGER` | `REFERENCES dka_owners(owner_id) ON DELETE SET NULL` | Linked partner driver / owner (`dka_owners` / `cr_owners`) |
| `vehicle_type_id` | `INTEGER` | `REFERENCES dka_vehicle_types(vehicle_type_id) ON DELETE SET NULL` | Linked category classification |
| `make_model` | `VARCHAR(100)` | `NOT NULL` | e.g. Mahindra Scorpio S11 4x4, Hyundai Creta |
| `license_plate` | `VARCHAR(50)` | `UNIQUE NOT NULL` | Vehicle license plate (e.g. `BA 12 PA 9988`) |
| `manufacture_year`| `INTEGER` | | Year of vehicle manufacturing |
| `seating_capacity`| `INTEGER` | `NOT NULL DEFAULT 4` | Maximum passenger seating capacity |
| `color` | `VARCHAR(50)` | | Vehicle exterior color |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT TRUE` | Operational / active status |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Record creation timestamp |
| `bluebook_doc_id` | `VARCHAR(255)`| | Bluebook registration document identifier |

---

### 4. `dka_bookings`
Primary trip and vehicle booking records with vehicle assignment tracking.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `booking_id` | `SERIAL` | `PRIMARY KEY` | Reservation ID |
| `user_id` | `INTEGER` | `NOT NULL REFERENCES dka_users(user_id) ON DELETE CASCADE` | Linked user/traveler |
| `vehicle_type_id` | `INTEGER` | `REFERENCES dka_vehicle_types ON DELETE SET NULL` | Chosen vehicle category |
| `assigned_vehicle_id` | `INTEGER` | `REFERENCES dka_vehicles ON DELETE SET NULL` | Assigned fleet vehicle |
| `pickup_location` | `VARCHAR(255)` | `NOT NULL` | Origin address or landmark |
| `dropoff_location` | `VARCHAR(255)` | `NOT NULL` | Destination address or landmark |
| `pickup_date` | `TIMESTAMPTZ` | `NOT NULL` | Departure date & timestamp |
| `pickup_time` | `VARCHAR(20)` | | Scheduled pickup time string (e.g. `07:00 AM`) |
| `return_date` | `TIMESTAMPTZ` | | Return date & time (for round trips) |
| `passenger_count` | `INTEGER` | `NOT NULL DEFAULT 1` | Number of travelers |
| `trip_type` | `VARCHAR(50)` | `NOT NULL DEFAULT 'One Way'` | `One Way` or `Round Trip` |
| `estimated_fare` | `VARCHAR(50)` | | Target budget or quoted fare (e.g. `NPR 12,000`) |
| `additional_details` | `TEXT` | | Special instructions & luggage notes |
| `rejection_reason` | `TEXT` | | Stated reason when booking cancelled/rejected |
| `booking_status` | `VARCHAR(50)` | `NOT NULL DEFAULT 'Pending'` | `Pending`, `Confirmed`, `Completed`, `Cancelled` |
| `assigned_vehicle_plate` | `VARCHAR(50)` | | Vehicle number plate |
| `assigned_vehicle_model` | `VARCHAR(100)` | | Vehicle model / trim details |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Timestamp (Auto-updated via trigger) |

---

### 5. `dka_notifications`
Dispatched customer trip notifications and approval alerts.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `notification_id` | `SERIAL` | `PRIMARY KEY` | Unique notification ID |
| `user_id` | `INTEGER` | `NOT NULL REFERENCES dka_users ON DELETE CASCADE` | Recipient user |
| `booking_id` | `INTEGER` | `REFERENCES dka_bookings ON DELETE CASCADE` | Related booking |
| `title` | `VARCHAR(255)` | `NOT NULL` | Notification title |
| `message` | `TEXT` | `NOT NULL` | Notification body |
| `type` | `VARCHAR(50)` | `NOT NULL DEFAULT 'booking_update'` | Event classification |
| `is_read` | `BOOLEAN` | `NOT NULL DEFAULT FALSE` | Read status |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Timestamp |

---

### 6. `dka_push_tokens`
Hardware push notification registration tokens for Expo Push Notifications dispatched on booking status changes.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `token_id` | `SERIAL` | `PRIMARY KEY` | Unique token ID |
| `user_id` | `INTEGER` | `REFERENCES dka_users(user_id) ON DELETE CASCADE` | Registered recipient user |
| `push_token` | `TEXT` | `NOT NULL` | Expo Push Token (`ExponentPushToken[...]`) |
| `device_type` | `VARCHAR(20)` | `DEFAULT 'mobile'` | Device form factor (`mobile`, `tablet`, `web`) |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Registration timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Last update timestamp |

---

### 7. `dka_idempotency_keys`
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

### 8. `dka_road_advisories`
High-altitude highway alerts, seasonal pass status, and expedition safety notices.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `advisory_id` | `SERIAL` | `PRIMARY KEY` | Unique advisory ID |
| `route_name` | `VARCHAR(100)` | `NOT NULL` | Highway / route name (e.g. `BP Highway`, `Mustang Trail`) |
| `status` | `VARCHAR(30)` | `NOT NULL DEFAULT 'open'` | `open`, `caution`, `closed` |
| `condition_summary` | `TEXT` | `NOT NULL` | Detailed road alert and vehicle clearance instructions |
| `severity` | `VARCHAR(20)` | `NOT NULL DEFAULT 'moderate'` | `info`, `moderate`, `severe` |
| `updated_by` | `INTEGER` | `REFERENCES dka_users(user_id) ON DELETE SET NULL` | Linked admin operator user |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Auto-updated via trigger |

---

### 9. `cr_owners` & `dka_owners`
Unified partner vehicle owner and driver registry. Both tables share identical schema structures and are synchronized in real-time.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `owner_id` | `SERIAL` | `PRIMARY KEY` | Unique owner/driver identifier |
| `name` | `VARCHAR(120)` | `NOT NULL` | Driver / Owner full legal name |
| `phone` | `VARCHAR(30)` | `NOT NULL UNIQUE` | Contact mobile number (`+977 98/97` or `01XXXXXXX`) |
| `email` | `VARCHAR(120)` | | Optional email address |
| `vehicle_type` | `VARCHAR(50)` | `NOT NULL DEFAULT 'SUV / 4x4'` | Primary operated vehicle category |
| `experience_years` | `INTEGER` | `NOT NULL DEFAULT 1` | Commercial Himalayan driving experience (years) |
| `license_number` | `VARCHAR(50)` | | Department of Transport Management license number |
| `citizenship_number` | `VARCHAR(50)` | | National citizenship / identity card number |
| `address` | `TEXT` | | Permanent or operating base address |
| `photo_url` | `TEXT` | | Driver profile photo URL |
| `rating` | `NUMERIC(3, 2)` | `NOT NULL DEFAULT 5.00` | Average traveler rating (1.00 - 5.00) |
| `total_trips` | `INTEGER` | `NOT NULL DEFAULT 0` | Historical completed expedition count |
| `is_available` | `BOOLEAN` | `NOT NULL DEFAULT TRUE` | Real-time dispatch availability |
| `status` | `VARCHAR(30)` | `NOT NULL DEFAULT 'ACTIVE'` | Operational status (`ACTIVE`, `PENDING`, `INACTIVE`) |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Record update timestamp |

---

### 10. Bidirectional Triggers & `cr_drivers` View

To ensure zero divergence between the core rental ecosystem (`cr_owners`) and the mobile application schema (`dka_owners`), two reciprocal PostgreSQL triggers synchronize row modifications bidirectionally:

```sql
-- 1. Sync cr_owners -> dka_owners
CREATE OR REPLACE FUNCTION sync_cr_to_dka_owners()
RETURNS TRIGGER AS $$
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
    END IF;
    -- INSERT, UPDATE, DELETE replication logic
    ...
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_cr_owners_to_dka
AFTER INSERT OR UPDATE OR DELETE ON cr_owners
FOR EACH ROW EXECUTE FUNCTION sync_cr_to_dka_owners();

-- 2. Sync dka_owners -> cr_owners
CREATE OR REPLACE FUNCTION sync_dka_to_cr_owners()
RETURNS TRIGGER AS $$
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
    END IF;
    -- INSERT, UPDATE, DELETE replication logic
    ...
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_dka_owners_to_cr
AFTER INSERT OR UPDATE OR DELETE ON dka_owners
FOR EACH ROW EXECUTE FUNCTION sync_dka_to_cr_owners();
```

#### Bidirectional Vehicle Synchronization (`cr_vehicles` ◄─► `dka_vehicles`)
Similarly, modifications between `cr_vehicles` and `dka_vehicles` synchronize across the 11 identical columns:
```sql
-- 1. Sync cr_vehicles -> dka_vehicles
CREATE OR REPLACE FUNCTION sync_cr_vehicles_to_dka_vehicles()
RETURNS TRIGGER AS $$
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
    END IF;
    -- INSERT, UPDATE, DELETE replication logic
    ...
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_cr_vehicles_to_dka
AFTER INSERT OR UPDATE OR DELETE ON cr_vehicles
FOR EACH ROW EXECUTE FUNCTION sync_cr_vehicles_to_dka_vehicles();

-- 2. Sync dka_vehicles -> cr_vehicles
CREATE OR REPLACE FUNCTION sync_dka_vehicles_to_cr_vehicles()
RETURNS TRIGGER AS $$
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
    END IF;
    -- INSERT, UPDATE, DELETE replication logic
    ...
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_dka_vehicles_to_cr
AFTER INSERT OR UPDATE OR DELETE ON dka_vehicles
FOR EACH ROW EXECUTE FUNCTION sync_dka_vehicles_to_cr_vehicles();
```

> **Recursion Guard**:
> Both trigger functions inspect `pg_trigger_depth() > 1` before execution. This prevents infinite trigger recursion when `cr_owners` writes to `dka_owners` (or `cr_vehicles` writes to `dka_vehicles`) and vice-versa.

#### The `cr_drivers` View
The mobile application and admin control room query the unified `cr_drivers` view:
```sql
CREATE OR REPLACE VIEW cr_drivers AS
SELECT 
    owner_id AS driver_id,
    name,
    phone,
    email,
    vehicle_type,
    experience_years,
    license_number,
    citizenship_number,
    address,
    photo_url,
    rating,
    total_trips,
    is_available,
    status,
    created_at,
    updated_at
FROM dka_owners;
```

---

## 📦 Incremental Migration Patches

All database modifications follow the strict incremental patch workflow documented in [AGENTS.md](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/AGENTS.md):

> [!NOTE]
> All patches from `001` through `009` have been fully consolidated and incorporated into canonical [`database/database.sql`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/database.sql). Per Rule 3 (Patch Consolidation & Cleanup), applied patches are consolidated and deleted from `database/patches/`.

| Patch | Scope & Impact | Canonical Schema Location | Consolidation Status |
|---|---|---|---|
| `001` | Creates `dka_owners`, bidirectional triggers (`sync_cr_to_dka_owners`, `sync_dka_to_cr_owners`), `cr_drivers` view, and initial backfill. | [`database.sql:L69-L220`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/database.sql#L69-L220) | Consolidated into canonical schema |
| `002` | Adds `assigned_driver_id`, `assigned_driver_name`, `assigned_driver_phone`, and `final_fare` to `dka_bookings`. | [`database.sql:L388-L403`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/database.sql#L388-L403) | Consolidated into canonical schema |
| `003` | Creates `dka_vehicles` (11 columns), bidirectional triggers (`sync_cr_vehicles_to_dka_vehicles`, `sync_dka_vehicles_to_cr_vehicles`), and initial backfill. | [`database.sql:L224-L366`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/database.sql#L224-L366) | Consolidated into canonical schema |
| `004` | Sequence synchronization (`PERFORM setval`) for all owner and vehicle bidirectional triggers. | [`database.sql:L130-L338`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/database.sql#L130-L338) | Consolidated into canonical schema |
| `005` | Adds `assigned_vehicle_id`, `rejection_reason` to `dka_bookings`, and creates `dka_notifications` table. | [`database.sql:L374-L435`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/database.sql#L374-L435) | Consolidated into canonical schema |
| `006` | Admin account phone number and email role assignments (`role = 'admin'`). | [`database.sql:L558-L570`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/database.sql#L558-L570) | Consolidated into canonical schema |
| `007` | Allow `NULL` `owner_id` for company-owned fleet vehicles in `cr_vehicles`. | [`database.sql:L244-L245`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/database.sql#L244-L245) | Consolidated into canonical schema |
| `008` | Ephemeral test bookings & audit test passenger purge. | One-time migration / test audit | Completed |
| `009` | Purge broadcast advisories and create `dka_push_tokens` table with device type and token indexes. | [`database.sql:L437-L451`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/database.sql#L437-L451) | Consolidated into canonical schema |

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
- `idx_dka_road_advisories_status` ON `dka_road_advisories(status)`
- `idx_dka_road_advisories_created` ON `dka_road_advisories(created_at DESC)`
- `idx_cr_owners_phone` ON `cr_owners(phone)`
- `idx_cr_owners_status` ON `cr_owners(status)`
- `idx_dka_owners_phone` ON `dka_owners(phone)`
- `idx_dka_owners_status` ON `dka_owners(status)`

---

## 🌱 Seed Data (Catalog, Accounts, Advisories & Drivers)

[`database/database.sql`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/database.sql) includes idempotent seed inserts:

### 1. Default Vehicle Types
| ID | Type Name | Description |
|---|---|---|
| `1` | `Sedan / Hatchback` | Economical and comfortable for city rides and small groups (up to 4 passengers). |
| `2` | `SUV / Scorpio 4x4` | Rugged 4WD vehicles suited for rough terrain, hills, and Himalayan expeditions. |
| `3` | `HiAce / Van` | Spacious 14-seater vans for medium groups and family tours. |
| `4` | `Coaster / Bus` | Comfortable 25-35 seater tourist buses for large groups. |

### 2. Seed Accounts
| Name | Phone | Email | Role |
|---|---|---|---|
| `Samman Chhetri` | `+977 9851363783` | `samman@drivekendra.com` | `customer` |
| `Drive Kendra Admin` | `+977 9800000000` | `admin@drivekendra.com` | `admin` |

### 3. Seed Road Advisories
| ID | Route Name | Status | Condition Summary | Severity |
|---|---|---|---|---|
| `1` | `BP Highway (Sindhuli Corridor)` | `caution` | Single lane alternating traffic near Golanjor due to slope reinforcement. Expect 15-20 min delays. | `moderate` |
| `2` | `Prithvi Highway (Kathmandu - Pokhara)` | `open` | Both lanes clear. Road widening works underway between Mugling and Anbukhaireni. | `info` |
| `3` | `Mustang / Muktinath 4x4 Trail` | `caution` | High clearance 4x4 / Scorpio required. River crossings flowing moderately high after rainfall. | `moderate` |

### 4. Seed Himalayan Drivers (`cr_owners` / `dka_owners`)
| Name | Phone | Vehicle Type | Experience | Rating | Status |
|---|---|---|---|---|---|
| `Bikram Shrestha` | `+977 9841234567` | `SUV / 4x4 (Scorpio)` | 8 Years | `4.92` (142 Trips) | `ACTIVE` |
| `Prem Bahadur Gurung` | `+977 9856012345` | `HiAce / Van` | 12 Years | `4.98` (230 Trips) | `ACTIVE` |
| `Tenzing Sherpa` | `+977 9801234567` | `Toyota Land Cruiser` | 15 Years | `5.00` (310 Trips) | `ACTIVE` |

---

## 🚀 Initializing Database from Scratch

```bash
psql -U postgres -d car_rental_db -f database/database.sql
```
Or in **DBeaver** / **pgAdmin**: Open [`database/database.sql`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/database.sql) and execute script (`Alt + X` / `F5`).
