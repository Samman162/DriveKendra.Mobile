# 🏔️ Offline-First & Himalayan Resilience Strategy

[![Offline Resilient](https://img.shields.io/badge/Offline-First%20Architecture-success?style=for-the-badge)](https://drivekendra.com)
[![Nepal Tested](https://img.shields.io/badge/Tested%20In-Himalayas%20%7C%20High%20Altitude-orange?style=for-the-badge)](https://drivekendra.com)

Traveling through Nepal often involves mountainous routes with zero cellular coverage—such as the **Muktinath 4WD Trail**, **Kalinchowk Kuri Village**, **Upper Mustang**, **Besisahar - Manang**, and deep valleys along the **Prithvi Highway**.

**Drive Kendra Mobile** is engineered from the ground up with an **offline-first resilience model** to guarantee uninterrupted access to vital travel vouchers, vehicle assignments, emergency services, and location search anywhere in the Himalayas.

---

## 📑 Table of Contents

- [The Himalayan Connectivity Challenge](#-the-himalayan-connectivity-challenge)
- [Core Resilience Components](#-core-resilience-components)
  - [1. Offline Voucher Storage (`offlineVoucherStorage.ts`)](#1-offline-voucher-storage-offlinevoucherstoragets)
  - [2. Offline QR Code Verification (`VoucherQrCode.tsx`)](#2-offline-qr-code-verification-voucherqrcodetsx)
  - [3. Emergency SOS & Offline GPS Capture (`EmergencyTripCard.tsx` & `EmergencySosModal.tsx`)](#3-emergency-sos--offline-gps-capture-emergencytripcardtsx--emergencysosmodaltsx)
  - [4. Bundled Geographic Landmark Database (`nepalLocations.ts`)](#4-bundled-geographic-landmark-database-nepallocationsts)
  - [5. Geocoding Fallback Engine (`geocoding.ts`)](#5-geocoding-fallback-engine-geocodingts)
  - [6. Local Search & Onboarding Cache (`recentSearchesStorage.ts`, `onboardingStorage.ts`)](#6-local-search--onboarding-cache-recentsearchesstoragets-onboardingstoragets)
  - [7. Dynamic Offline Action Queue (`offlineQueue.ts`)](#7-dynamic-offline-action-queue-offlinequeuets)
  - [8. Network Status Listener (`useNetworkStatus.ts`)](#8-network-status-listener-usenetworkstatusts)
- [Data Flow During Offline Operations](#-data-flow-during-offline-operations)
- [Testing Offline Scenarios](#-testing-offline-scenarios)

---

## ⛰ The Himalayan Connectivity Challenge

Standard mobile applications fail in remote mountainous regions because they depend on persistent cloud connectivity for:
- Retrieving trip and voucher confirmations at police checkpoints or toll gates.
- Accessing emergency assistance hotlines or vehicle plate numbers.
- Resolving dropoff or pickup coordinates when data connectivity is lost.
- Handling network disconnects during form submission (resulting in duplicate bookings or dropped requests).

Drive Kendra Mobile eliminates these points of failure through localized caching, optimistic UI updates, and hardware sensor integration.

---

## 🛠 Core Resilience Components

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Himalayan Offline Stack                       │
├────────────────────────┬───────────────────────────────────────────────┤
│  Component             │ Role & Implementation                         │
├────────────────────────┼───────────────────────────────────────────────┤
│  offlineVoucherStorage │ Persistent trip voucher storage (AsyncStorage)│
│  VoucherQrCode.tsx     │ Standalone QR code ticket verification        │
│  EmergencyTripCard.tsx │ GPS location + SMS emergency dispatch         │
│  EmergencySosModal.tsx │ 24/7 dispatch hotline + rescue police SOS     │
│  nepalLocations.ts     │ 77-district offline landmark database         │
│  geocoding.ts          │ Reverse geocoding with local fallback         │
│  recentSearchesStorage │ Local recent destination history              │
│  offlineQueue.ts       │ Action replay queue on reconnect              │
│  onboardingStorage.ts  │ Persistent first-launch state caching         │
│  useNetworkStatus.ts   │ Real-time connectivity state banner           │
└────────────────────────┴───────────────────────────────────────────────┘
```

---

### 1. Offline Voucher Storage (`offlineVoucherStorage.ts`)

When a reservation is confirmed or viewed in the app, its metadata (booking ID, vehicle plate, model, route, timestamps, emergency hotline) is automatically serialized and cached in local storage:

- **Storage Adapter**: AsyncStorage with structured JSON serialization.
- **Cache Policy**: Stored indefinitely until explicitly updated or replaced.
- **Failover**: If the backend API is unreachable, the **MyTrips** screen seamlessly displays cached vouchers with an `Offline Mode` indicator badge.

---

### 2. Offline QR Code Verification (`VoucherQrCode.tsx`)

At high-altitude checkpoints, tourist police posts, or national park entry gates (e.g. Annapurna Conservation Area Project - ACAP), officials can verify passenger bookings via QR code without an active internet connection.

- **Payload Structure**:
```json
{
  "ref": "DK-2026-0042",
  "code": "DK-VCH-8492",
  "vehicle": "Mahindra Scorpio 4x4",
  "plate": "Ba 2 Cha 8492",
  "route": "Kathmandu -> Muktinath"
}
```
- Rendered natively using `react-native-svg` with high-contrast error-correcting QR symbology.

---

### 3. Emergency SOS & Offline GPS Capture (`EmergencyTripCard.tsx` & `EmergencySosModal.tsx`)

In emergency situations (e.g. landslides, breakdowns, road blockages), travelers can trigger immediate assistance directly from the app:

1. **Hardware GPS Extraction**: Queries `expo-location` with high-accuracy satellite polling.
2. **Offline Coordinate Conversion**: Extracts latitude, longitude, and elevation without requiring map tile loading.
3. **SMS Dispatch Bridge**: Pre-populates native SMS/MMS messages with formatted emergency GPS links to Drive Kendra's 24/7 hotline (`+977 985-1363783`) and tourist police (`1144`).

```
🚨 EMERGENCY SOS - DRIVE KENDRA MOUNTAIN RESCUE
Booking: DK-2026-0042
Route: Kathmandu ➔ Muktinath
Vehicle: Mahindra Scorpio 4x4 (Ba 2 Cha 8492)
Dispatch: +977 985-1363783
GPS: 28.816700, 83.866700 (±10m)
Maps: https://maps.google.com/?q=28.816700,83.866700
Status: Emergency assistance/mechanical support required.
```

---

### 4. Bundled Geographic Landmark Database (`nepalLocations.ts`)

Bundles exhaustive geographic data directly inside the client binary:
- All **77 administrative districts** of Nepal across 7 provinces.
- Major tourist hubs: Pokhara Lakeside, Chitwan Sauraha, Lumbini Peace Garden, Nagarkot, Bandipur, Dhulikhel.
- High-altitude trek gateways: Jomsom, Besisahar, Syabrubesi, Dhunche, Lukla, Manang.
- Airport terminals: TIA Kathmandu, Pokhara International (PIA), Gautam Buddha International (GBIA), Biratnagar, Nepalgunj.

---

### 5. Geocoding Fallback Engine (`geocoding.ts`)

When an interactive map pin is dropped:
1. First attempts free reverse geocoding via OpenStreetMap (OSM) Nominatim.
2. If network request fails or device is offline, executes a Euclidean distance algorithm against the bundled coordinates in `nepalLocations.ts` to identify the closest landmark and district.

---

### 6. Local Search & Onboarding Cache (`recentSearchesStorage.ts`, `onboardingStorage.ts`)

- Caches frequently selected destinations and recent searches in AsyncStorage with LRU eviction.
- Tracks onboarding walkthrough completion status without requiring an authenticated account or internet ping.

---

### 7. Dynamic Offline Action Queue (`offlineQueue.ts`)

If a user performs an action while offline:
- The mutation is queued in `src/api/offlineQueue.ts`.
- The UI reflects the change optimistically.
- As soon as the device regains internet connection, the queue drains automatically in FIFO sequence.

---

### 8. Network Status Listener (`useNetworkStatus.ts`)

Utilizes `@react-native-community/netinfo` to provide instant feedback to the user:
- Displays a non-intrusive banner when connectivity drops.
- Automatically retries pending background requests when network status flips back to `isConnected: true`.

---

## 🔄 Data Flow During Offline Operations

```mermaid
sequenceDiagram
    autonumber
    actor Traveler as Traveler in Himalayas
    participant Client as Mobile App (Offline)
    participant Storage as Local Storage
    participant GPS as Device GPS Sensors
    participant Hotline as Emergency SMS / 1144

    Note over Client: Internet Connection Lost (No 4G/3G)
    Traveler->>Client: Open My Trips / Voucher
    Client->>Storage: Read Cached Voucher (offlineVoucherStorage)
    Storage-->>Client: Returns Trip Details & Vehicle Plate
    Client-->>Traveler: Renders Offline Voucher & QR Code

    Traveler->>Client: Tap Emergency SOS
    Client->>GPS: Query Current Satellite Location
    GPS-->>Client: Returns Lat: 28.8167, Lng: 83.8667
    Client->>Hotline: Launch Native SMS with GPS Coordinates
    Hotline-->>Traveler: SMS Sent over GSM/Satellite
```

---

## 🧪 Testing Offline Scenarios

1. **Simulate Airplane Mode**:
   - On Android Emulator: Toggle Airplane Mode via Extended Controls (`...` ➔ `Cellular` ➔ `Data status: Denied`).
   - On iOS Simulator: Toggle Wi-Fi off or disable network interfaces via Network Link Conditioner.
2. **Verify Screen Behavior**:
   - Open **My Trips**: Verify cached voucher loads with vehicle and route info and offline badge.
   - Open **Location Picker**: Test offline search across all 77 districts.
   - Open **Emergency Assistance**: Tap GPS SOS to ensure pre-populated SMS payload is generated.
