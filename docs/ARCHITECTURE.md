# 🏛️ Drive Kendra Mobile System Architecture

[![Architecture](https://img.shields.io/badge/Architecture-End--to--End-blue?style=for-the-badge)](https://drivekendra.com)
[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2057-000020?style=for-the-badge&logo=expo&logoColor=white)](https://docs.expo.dev/versions/v57.0.0/)
[![Hono](https://img.shields.io/badge/Hono-v4-E36002?style=for-the-badge&logo=hono&logoColor=white)](https://hono.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)

This document details the high-level system design, data flows, security boundaries, and engineering patterns governing **Drive Kendra Mobile**.

---

## 📑 Table of Contents

- [High-Level System Topology](#-high-level-system-topology)
- [Client Architecture (React Native / Expo)](#-client-architecture-react-native--expo)
  - [Navigation Architecture](#navigation-architecture)
  - [Interactive Mapping & Geocoding Subsystem](#interactive-mapping--geocoding-subsystem)
  - [Highway Status & Mountain Safety Subsystem](#highway-status--mountain-safety-subsystem)
  - [State & Context Architecture](#state--context-architecture)
  - [Theme Engine](#theme-engine)
  - [Hardware & Native API Bridges](#hardware--native-api-bridges)
- [Server Architecture (Hono / Node.js)](#-server-architecture-hono--nodejs)
  - [Route Modularity & Middleware](#route-modularity--middleware)
  - [Idempotency & Concurrency Handling](#idempotency--concurrency-handling)
  - [Validation & Anti-Spam Pipeline](#validation--anti-spam-pipeline)
  - [Database Abstraction & RLS Isolation](#database-abstraction--rls-isolation)
- [Push Notification Pipeline](#-push-notification-pipeline)
- [Offline-First & Himalayan Resilience Strategy](#-offline-first--himalayan-resilience-strategy)
- [Security & Authentication Model](#-security--authentication-model)

---

## 🌐 High-Level System Topology

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Drive Kendra Mobile Client                       │
│       (Expo SDK 57 • React Native 0.86.2 • TypeScript Strict Mode)      │
│                                                                         │
│  ┌───────────────────────┐ ┌──────────────────────┐ ┌────────────────┐ │
│  │ React Navigation v7   │ │ Theme & UI System    │ │ Auth & Bio SDK │ │
│  │ (4-Tabs, Stacks, Mod) │ │ (useThemedStyles)    │ │ (SecureStore)  │ │
│  └───────────┬───────────┘ └──────────────────────┘ └────────────────┘ │
│              │                                                          │
│  ┌───────────┴───────────┐ ┌──────────────────────┐ ┌────────────────┐ │
│  │ Offline Cache & Queue │ │ Push Notification    │ │ OpenStreetMap  │ │
│  │ (Encrypted Vouchers)  │ │ Listener (Expo Push) │ │ Leaflet Engine │ │
│  └───────────────────────┘ └──────────────────────┘ └────────────────┘ │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTPS / JSON (Axios + Headers)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       Drive Kendra API (server/)                        │
│                 Hono v4 on Node.js / tsx Watch Engine                   │
│                                                                         │
│  ┌───────────────────────┐ ┌──────────────────────┐ ┌────────────────┐ │
│  │ Routing & Middleware  │ │ Zod Validation & HP  │ │ Idempotency    │ │
│  │ (CORS, Error Handler) │ │ (Nepal Phone Regex)  │ │ Manager (SHA)  │ │
│  └───────────┬───────────┘ └──────────────────────┘ └────────────────┘ │
│              │                                                          │
│  ┌───────────┴───────────┐ ┌──────────────────────┐                     │
│  │ Transaction Manager   │ │ Push Dispatcher      │═══════════════════╗ │
│  │ (Multi-Table Atomic)  │ │ (Expo Server SDK/FCM)│                   ║ │
│  └───────────┬───────────┘ └──────────────────────┘                   ║ │
└──────────────┼────────────────────────────────────────────────────────╫─┘
               │ PostgreSQL Connection Pool (pg)                        ║
               ▼                                                        ▼
┌───────────────────────────────────────────────┐     ┌───────────────────┐
│          PostgreSQL Database Server           │     │ Expo Push Service │
│   (dka_bookings • dka_users • dka_idemp etc)  │     │     (FCM v1)      │
└───────────────────────────────────────────────┘     └───────────────────┘
```

---

## 📱 Client Architecture (React Native / Expo)

The client is built using **Expo SDK 57** (React Native 0.86.2, React 19.2.3) with strict TypeScript compliance.

### Navigation Architecture
Drive Kendra uses `@react-navigation/native` v7 structured with a nested tab and modal stack pattern:

```
RootStackNavigator
├── MainTabs (BottomTabNavigator - 4 Primary Tabs)
│   ├── Home (HomeScreen)
│   ├── Booking (BookingScreen)
│   ├── MyBookings (MyTripsScreen)
│   └── Profile (ProfileScreen)
├── Onboarding (OnboardingScreen - First Launch Flow)
├── BookingModal (BookingScreen - Animated Full Modal)
├── Auth (AuthScreen - SignIn / SignUp / OTP Modal)
├── Fleet (FleetScreen - Fleet Catalog)
├── Rates (RatesScreen - Official Nepal Tariff Matrix)
├── Airport (AirportScreen - TIA Transfers)
├── Wedding (WeddingScreen - VIP Convoy Packages)
├── Tours (ToursScreen - Tour Expeditions)
├── TourDetail (TourDetailScreen - Itinerary & Pax Table)
├── Contact (ContactScreen - Help Desk & Reviews)
├── MyTrips (MyTripsScreen - My Reservations)
├── Profile (ProfileScreen - Profile & Settings)
└── Explore (ExploreScreen - Service Discovery Hub)
```

### Interactive Mapping & Geocoding Subsystem
Drive Kendra Mobile integrates zero-cost OpenStreetMap (OSM) and Leaflet mapping:
- **`FullScreenMapPicker.tsx`**: Full-screen modal with an interactive Leaflet map rendered via `react-native-webview` (mobile) or responsive `iframe` (web). Users can drag the map to position the custom amber brand marker over any point in Nepal.
- **`EmbeddedMapView.tsx`**: Reusable container bridging web message events (zoom, pan, drag-end, pin coordinate clicks) between React Native and Leaflet.
- **`src/utils/geocoding.ts`**: Queries OSM Nominatim API for reverse geocoding (coordinates ➔ readable landmark/street address) with fallback to nearest landmark in `nepalLocations.ts`.
- **`src/constants/nepalLocations.ts`**: Curated database of all 77 districts, major tourist hubs (Pokhara, Chitwan, Lumbini, Jomsom, Nagarkot), airport terminals, and highway checkpoints.
- **`src/utils/recentSearchesStorage.ts`**: Persistent search history caching using AsyncStorage.

### Highway Status & Mountain Safety Subsystem
- **`HighwayStatusCard.tsx`**: Real-time road advisory card displaying traffic conditions, weather alerts, landslide warnings, and one-way traffic notices across critical Nepal corridors:
  - Narayanghat - Mugling Highway (Landslide zone alerts)
  - Prithvi Highway (Kathmandu - Pokhara)
  - BP Highway (Kathmandu - Eastern Terai)
  - Tribhuvan Highway & Araniko Highway
- **`EmergencySosModal.tsx` & `EmergencyTripCard.tsx`**: GPS sensor interrogation (`expo-location`) to extract high-accuracy coordinates and dispatch pre-formatted SOS SMS messages to Nepal Tourist Police (`1144`) and Drive Kendra 24/7 hotline (`+977 985-1363783`).

### State & Context Architecture
- **AuthContext** (`src/context/AuthContext.tsx`): Manages authentication tokens, current user object, biometrics state, and automatic persistent session restore via `secureStorage.ts`.
- **ThemeContext** (`src/theme/ThemeProvider.tsx`): Supplies the active theme (`light` or `dark`), toggling state, and color palette tokens across the component tree.

### Theme Engine
All screens and components leverage the `useThemedStyles` hook:
```typescript
const styles = useThemedStyles((theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      padding: theme.spacing.md,
    },
  })
);
```
This pattern ensures instantaneous theme switching, avoids memory leaks, and enables clean separation of presentation from logic.

### Hardware & Native API Bridges
- **Haptics**: `expo-haptics` triggers light/medium/notification tactile feedback.
- **Biometrics**: `expo-local-authentication` checks for fingerprint/FaceID hardware.
- **Secure Storage**: `expo-secure-store` encrypts sensitive auth credentials on device keychain/keystore.
- **Location**: `expo-location` queries real-time GPS coordinates for emergency SOS dispatch in high-altitude terrain.
- **Document Generation**: `expo-print` renders HTML booking vouchers into printable PDFs, which `expo-sharing` shares across WhatsApp, Email, or AirDrop.

---

## ⚙️ Server Architecture (Hono / Node.js)

### Route Modularity & Middleware
The server entry point (`server/src/index.ts`) mounts distinct feature routes onto a unified Hono application:
- `/health` ➔ Database ping & health check
- `/api/auth` ➔ Authentication and OTP flow
- `/api/bookings` ➔ Idempotent booking transactions
- `/api/notifications` ➔ Push notification triggers
- `/api/users` ➔ Device push token management
- `/api/reviews` ➔ Testimonial submissions & moderation
- `/api/stats` ➔ Real-time platform metrics

### Idempotency & Concurrency Handling
When the mobile client submits a booking, it generates a unique `X-Idempotency-Key` header. The server verifies this key against the `dka_idempotency_keys` table:
1. **New Key**: Inserted with `status: 'processing'` and SHA-256 hash of payload.
2. **Key in-flight (`processing`)**: Rejects with `409 Conflict` to prevent double-charging or dual bookings.
3. **Key completed (`completed`)**: Immediately returns cached response with `X-Cache-Lookup: HIT`.
4. **Key failed (`failed`)**: Resets status to allow immediate retry.

### Validation & Anti-Spam Pipeline
Every incoming payload passes through Zod v4 schemas in `server/src/validation.ts`:
- **Honeypot Protection**: Rejects requests where `website_hp` contains text (trapping automated spam bots).
- **Nepal Phone Normalization**: Strips spaces, dashes, country codes, and validates against `/^(?:977)?(9[78]\d{8}|0[1-9]\d{7})$/`.
- **Date Validation**: Ensures pickup dates are in the future and return dates follow pickup dates.

### Database Abstraction & RLS Isolation
All queries run inside `withPublicClient` in `server/src/db.ts`:
- Automatically sets `SET LOCAL app.is_admin = 'false'`.
- Uses node-postgres connection pooling with configurable pool sizes.
- Ensures all transactions cleanly `ROLLBACK` on unhandled errors.

---

## 🔔 Push Notification Pipeline

```
+------------------+         +--------------------+         +------------------------+
|  Mobile Client   |         |    Hono API        |         |   Expo Push Service    |
| (Expo Notifs SDK)|         | (server/services)  |         |        (FCM v1)        |
+--------+---------+         +---------+----------+         +-----------+------------+
         |                             |                                |
         | 1. Request Token            |                                |
         |---------------------------->|                                |
         | 2. POST /api/users/push-token                                |
         |---------------------------->|                                |
         |                             | 3. Store Token in dka_users    |
         |                             |                                |
         |                             | 4. Dispatch Event (Chauffeur)  |
         |                             |------------------------------->|
         |                             |                                | 5. Push Alert
         | 6. Receive Alert on Device  |<-------------------------------+
         |<----------------------------|                                |
         | 7. Tap Notification (Deep Link: /mytrips/42)                 |
```

The server utilizes `expo-server-sdk` configured for HTTP v1 FCM. It manages automatic device token invalidation when Apple APNs or Google FCM report `DeviceNotRegistered`.

---

## 🏔 Offline-First & Himalayan Resilience Strategy

Remote journeys in Nepal (e.g. Muktinath, Manang, Upper Mustang, Kalinchowk) frequently cross areas with zero cellular connectivity. Drive Kendra Mobile provides:

1. **Static Content Bundling**: Complete official rate charts (`rateCategories.generated.ts`) and tour itineraries (`tourDetails.ts`) are bundled directly with the application.
2. **Encrypted Offline Voucher Storage** (`offlineVoucherStorage.ts`): Confirmed booking receipts are cached locally and viewable offline.
3. **Offline QR Code Generator** (`VoucherQrCode.tsx`): Displays cryptographically formatted booking data as a QR code for conductor verification without internet.
4. **Offline GPS Emergency SOS** (`EmergencyTripCard.tsx` & `EmergencySosModal.tsx`): Captures GPS coordinates via device sensors and crafts ready-to-send SMS messages to emergency dispatchers even without data connectivity.
5. **Offline Landmark Database** (`nepalLocations.ts`): Provides instant offline destination suggestions.

---

## 🔒 Security & Authentication Model

- **Session Security**: JWT tokens stored in device keychain/keystore via `expo-secure-store`.
- **Biometric Gatekeeper**: Hardware biometrics (Touch ID / Face ID) protect access to stored credentials.
- **Bot Honeypots**: Invisible form inputs filter automated bots.
- **SQL Injection Immunization**: 100% of SQL queries use positional parameterization (`$1, $2`).
- **Zero Live SQL Execution Rule**: Database modifications must follow the strict patch protocol ([`database/patches/`](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/database/patches/)).
