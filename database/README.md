# 🗄️ Drive Kendra PostgreSQL Database Management & Schema

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Database Rules](https://img.shields.io/badge/Schema%20Rules-Strict%20Migrations-success?style=for-the-badge)](https://github.com/Samman162/DriveKendra.Mobile)

This directory contains the core PostgreSQL database schema, stored procedures, indexes, and sequential migration patch files for **Drive Kendra**.

---

## ⚠️ Mandatory Database Management Rules

> [!IMPORTANT]
> All engineers, administrators, and AI assistants working with this database **MUST STRICTLY ADHERE** to the following rules:
>
> 1. **Base Schema**: Always maintain and update the complete base database schema, tables, indexes, and functions in [`database/database.sql`](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/database/database.sql) as the single canonical source of truth.
> 2. **Patches Folder**: For any pending database updates, alterations, or incremental changes, create a new numbered patch file inside [`database/patches/`](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/database/patches/) (e.g., `001_add_feature.sql`, `002_add_table.sql`).
> 3. **Patch Consolidation & Cleanup**: Once patches have been applied to the live/staging databases and verified in `database/database.sql`, delete the applied patch files from `database/patches/`.
> 4. **Execution Constraint**: **NEVER** run SQL queries directly on any live production or staging database yourself. Only produce the SQL files in `database/database.sql` and `database/patches/` for manual or administrator application.

---

## 📑 Table of Contents

- [Database Architecture](#-database-architecture)
- [Schema Table Definitions](#-schema-table-definitions)
  - [1. `cr_vehicle_types`](#1-cr_vehicle_types)
  - [2. `cr_vehicles`](#2-cr_vehicles)
  - [3. `cr_customers`](#3-cr_customers)
  - [4. `cr_bookings`](#4-cr_bookings)
  - [5. `cr_trip_requests`](#5-cr_trip_requests)
  - [6. `cr_reviews`](#6-cr_reviews)
  - [7. `cr_notifications`](#7-cr_notifications)
  - [8. `cr_idempotency_keys`](#8-cr_idempotency_keys)
- [Stored Functions & Procedures](#-stored-functions--procedures)
- [Indexing & Query Optimization](#-indexing--query-optimization)
- [Patch History & Migration Guide](#-patch-history--migration-guide)
  - [Applying Patches via psql](#applying-patches-via-psql)
  - [Applying Patches via pgAdmin](#applying-patches-via-pgadmin)

---

## 🏗 Database Architecture

```
                       ┌────────────────────────┐
                       │    cr_vehicle_types    │
                       └───────────┬────────────┘
                                   │ 1:N
                     ┌─────────────┴─────────────┐
                     ▼                           ▼
            ┌─────────────────┐         ┌─────────────────┐
            │   cr_vehicles   │         │   cr_bookings   │◄────────┐
            └─────────────────┘         └────────┬────────┘         │
                                                 │ 1:1              │
                                                 ▼                  │
┌─────────────────┐ 1:N                 ┌──────────────────┐        │ 1:N
│  cr_customers   ├────────────────────►│ cr_trip_requests │        │
└────────┬────────┘                     └──────────────────┘        │
         │ 1:N                                                      │
         ▼                                                          │
┌────────────────────┐                  ┌──────────────────────┐    │
│  cr_notifications  │                  │ cr_idempotency_keys  │    │
└────────────────────┘                  └──────────────────────┘    │
                                                                    │
┌─────────────────┐                                                 │
│   cr_reviews    │                                                 │
└─────────────────┘                                                 │
```

---

## 📋 Schema Table Definitions

### 1. `cr_vehicle_types`
Lookup table defining categories of vehicles available for booking.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `vehicle_type_id` | `SERIAL` | `PRIMARY KEY` | Unique ID |
| `type_name` | `VARCHAR(100)` | `NOT NULL UNIQUE` | e.g. Sedan, SUV 4x4, HiAce Van, Bus |
| `description` | `TEXT` | | Detailed category specs |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Record creation timestamp |

---

### 2. `cr_vehicles`
Physical fleet vehicle inventory.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `vehicle_id` | `SERIAL` | `PRIMARY KEY` | Vehicle inventory ID |
| `vehicle_type_id` | `INTEGER` | `REFERENCES cr_vehicle_types` | Associated category |
| `name` | `VARCHAR(150)` | `NOT NULL` | Vehicle make and model |
| `plate_number` | `VARCHAR(50)` | `UNIQUE` | Registration plate (e.g. Ba 12 Cha 3456) |
| `capacity` | `INTEGER` | `DEFAULT 4` | Passenger seating capacity |
| `luggage_capacity` | `INTEGER` | `DEFAULT 2` | Luggage capacity (bags) |
| `is_active` | `BOOLEAN` | `DEFAULT TRUE` | Active fleet status |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Last update timestamp |

---

### 3. `cr_customers`
User and customer profiles, unique by phone number.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `customer_id` | `SERIAL` | `PRIMARY KEY` | Unique customer ID |
| `full_name` | `VARCHAR(100)` | `NOT NULL` | Traveler full name |
| `phone_number` | `VARCHAR(30)` | `NOT NULL UNIQUE` | Nepal phone number (`+977 98/97`) |
| `email` | `VARCHAR(100)` | | Optional email address |
| `push_token` | `VARCHAR(255)` | | Expo push notification token |
| `push_token_updated_at` | `TIMESTAMPTZ` | | Token last refreshed timestamp |
| `device_platform` | `VARCHAR(30)` | | `android`, `ios`, or `web` |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Registration date |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Profile update date |

---

### 4. `cr_bookings`
Primary trip and vehicle booking records.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `booking_id` | `SERIAL` | `PRIMARY KEY` | Reservation ID |
| `customer_id` | `INTEGER` | `REFERENCES cr_customers ON DELETE CASCADE` | Linked customer |
| `vehicle_type_id` | `INTEGER` | `REFERENCES cr_vehicle_types` | Chosen vehicle category |
| `pickup_location` | `VARCHAR(255)` | `NOT NULL` | Origin address or landmark |
| `dropoff_location` | `VARCHAR(255)` | `NOT NULL` | Destination address or landmark |
| `pickup_date` | `TIMESTAMPTZ` | `NOT NULL` | Departure date & time |
| `return_date` | `TIMESTAMPTZ` | | Return date & time (for round trips) |
| `passenger_count` | `INTEGER` | `DEFAULT 1` | Number of travelers |
| `trip_type` | `VARCHAR(50)` | `DEFAULT 'One Way'` | `One Way` or `Round Trip` |
| `additional_details` | `TEXT` | | Special instructions & luggage notes |
| `booking_status` | `VARCHAR(50)` | `DEFAULT 'Pending'` | `Pending`, `Confirmed`, `Completed`, `Cancelled` |
| `assigned_driver_name` | `VARCHAR(100)` | | Driver full name |
| `assigned_driver_phone` | `VARCHAR(30)` | | Driver direct contact number |
| `assigned_vehicle_plate` | `VARCHAR(50)` | | Vehicle number plate |
| `flight_number` | `VARCHAR(50)` | | Airline flight code (for TIA transfers) |
| `flight_delay_minutes` | `INTEGER` | `DEFAULT 0` | Flight delay offset in minutes |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Timestamp |

---

### 5. `cr_trip_requests`
Operational dispatch records dispatched to fleet operators.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `trip_request_id` | `SERIAL` | `PRIMARY KEY` | Dispatch ID |
| `booking_id` | `INTEGER` | `REFERENCES cr_bookings ON DELETE CASCADE` | Source booking |
| `customer_id` | `INTEGER` | `REFERENCES cr_customers` | Customer reference |
| `vehicle_type_id` | `INTEGER` | `REFERENCES cr_vehicle_types` | Vehicle type |
| `pickup_location` | `VARCHAR(255)` | `NOT NULL` | Pickup origin |
| `dropoff_location` | `VARCHAR(255)` | `NOT NULL` | Dropoff destination |
| `pickup_date` | `TIMESTAMPTZ` | `NOT NULL` | Scheduled pickup |
| `return_date` | `TIMESTAMPTZ` | | Scheduled return |
| `passenger_count` | `INTEGER` | `DEFAULT 1` | Passenger count |
| `trip_type` | `VARCHAR(50)` | `DEFAULT 'One Way'` | Route type |
| `additional_details` | `TEXT` | | Notes |
| `request_status` | `VARCHAR(50)` | `DEFAULT 'Pending'` | Operational status |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Update timestamp |

---

### 6. `cr_reviews`
Customer reviews and ratings.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `review_id` | `SERIAL` | `PRIMARY KEY` | Review ID |
| `customer_name` | `VARCHAR(100)` | `NOT NULL` | Reviewer name |
| `rating` | `INTEGER` | `CHECK (rating BETWEEN 1 AND 5)` | Star rating (1 to 5) |
| `comment` | `TEXT` | `NOT NULL` | Review body |
| `trip_title` | `VARCHAR(150)` | | Destination / Trip title |
| `is_approved` | `BOOLEAN` | `DEFAULT FALSE` | Moderation approval flag |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Submission timestamp |

---

### 7. `cr_notifications`
In-app and push notification delivery log.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `notification_id` | `SERIAL` | `PRIMARY KEY` | Notification log ID |
| `customer_id` | `INTEGER` | `REFERENCES cr_customers` | Target recipient |
| `title` | `VARCHAR(255)` | `NOT NULL` | Alert title |
| `message` | `TEXT` | `NOT NULL` | Alert message text |
| `related_entity_id` | `INTEGER` | | Linked booking or request ID |
| `notification_type` | `VARCHAR(100)` | `NOT NULL` | `BookingConfirmed`, `DriverAssigned`, etc. |
| `push_status` | `VARCHAR(50)` | `DEFAULT 'delivered'` | `delivered`, `failed`, `ticket_created` |
| `payload` | `JSONB` | | Deep link data payload |
| `ticket_id` | `VARCHAR(255)` | | Expo Push Ticket ID |
| `is_read` | `BOOLEAN` | `DEFAULT FALSE` | In-app read status |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Creation timestamp |

---

### 8. `cr_idempotency_keys`
Prevents duplicate transactions when mobile clients retry on unstable cellular networks.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `idempotency_key` | `VARCHAR(128)` | `PRIMARY KEY` | Client-generated UUID / key |
| `request_hash` | `VARCHAR(64)` | `NOT NULL` | SHA-256 hash of payload |
| `endpoint` | `VARCHAR(100)` | `DEFAULT '/api/bookings'` | API endpoint |
| `status` | `VARCHAR(30)` | `DEFAULT 'processing'` | `processing`, `completed`, `failed` |
| `response_code` | `INTEGER` | | Cached HTTP status (e.g. 201) |
| `response_body` | `JSONB` | | Cached JSON response body |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Update timestamp |
| `expires_at` | `TIMESTAMPTZ` | `DEFAULT (NOW() + INTERVAL '24 hours')` | TTL expiration |

---

## ⚡ Stored Functions & Procedures

### `cr_get_public_stats()`
High-performance aggregation function returning real-time platform statistics in a single call.

```sql
SELECT * FROM cr_get_public_stats();
```
**Returns**:
- `fleet_count` (`BIGINT`): Count of active vehicles in `cr_vehicles`.
- `completed_trips` (`BIGINT`): Count of trips with `request_status = 'completed'`.
- `cities_covered` (`BIGINT`): Count of unique distinct pickup/dropoff cities.
- `review_count` (`BIGINT`): Count of approved customer reviews.
- `average_rating` (`NUMERIC`): Rounded average review score (1.0 - 5.0).

---

## 🔍 Indexing & Query Optimization

The following B-Tree and Hash indexes are maintained to guarantee sub-millisecond query performance:

- `idx_cr_customers_phone` ON `cr_customers(phone_number)`
- `idx_cr_customers_push_token` ON `cr_customers(push_token)`
- `idx_cr_bookings_customer_id` ON `cr_bookings(customer_id)`
- `idx_cr_bookings_status` ON `cr_bookings(booking_status)`
- `idx_cr_bookings_pickup_date` ON `cr_bookings(pickup_date)`
- `idx_cr_trip_requests_booking_id` ON `cr_trip_requests(booking_id)`
- `idx_cr_trip_requests_status` ON `cr_trip_requests(request_status)`
- `idx_cr_reviews_approved` ON `cr_reviews(is_approved)`
- `idx_cr_notifications_unread` ON `cr_notifications(is_read)`
- `idx_cr_notifications_customer_id` ON `cr_notifications(customer_id)`
- `idx_cr_notifications_ticket_id` ON `cr_notifications(ticket_id)`
- `idx_cr_idempotency_keys_expires_at` ON `cr_idempotency_keys(expires_at)`
- `idx_cr_idempotency_keys_hash` ON `cr_idempotency_keys(request_hash)`

---

## 🔄 Patch Lifecycle & Migration Workflow

The repository adheres to a strict zero-downtime, non-destructive migration lifecycle:

1. **Pending Schema Changes**:
   When new tables or columns are introduced, developers or AI agents create a new sequential file in [`database/patches/`](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/database/patches/) (e.g. `001_feature_name.sql`) using idempotent statements (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`).
2. **Base Schema Synchronization**:
   The base schema in [`database/database.sql`](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/database/database.sql) is simultaneously updated so fresh database setups always execute the full schema in clean DDL format (not nested migrations).
3. **Application & Patch Deletion**:
   Once the database administrator applies the pending patch to staging/production and verifies schema parity, the applied patch file is removed from `database/patches/`.

---

### Initializing Database from Scratch

To initialize a new instance of `car_rental_db` with all consolidated tables, indexes, idempotency keys, and seed data:

```bash
psql -U postgres -d car_rental_db -f database/database.sql
```

### Applying Pending Patches via `psql`

When pending patches exist in `database/patches/`:
```bash
psql -U postgres -d car_rental_db -f database/patches/<patch_name>.sql
```

### Applying Pending Patches via pgAdmin

1. Open **pgAdmin 4** and connect to your PostgreSQL server.
2. Select database `car_rental_db`.
3. Open the **Query Tool** (`Tools` ➔ `Query Tool`).
4. Open the SQL patch file from `database/patches/` and click **Execute (F5)**.
5. Once applied, remove the patch file.
