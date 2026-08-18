# 📲 Push Notifications Architecture & Pipeline

[![Expo Notifications](https://img.shields.io/badge/Expo-Notifications%20SDK%2057-000020?style=for-the-badge&logo=expo&logoColor=white)](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/)
[![Expo Server SDK](https://img.shields.io/badge/Server%20SDK-expo--server--sdk-4169E1?style=for-the-badge)](https://github.com/expo/expo-server-sdk-node)
[![Firebase Cloud Messaging](https://img.shields.io/badge/FCM-HTTP%20v1%20Ready-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/docs/cloud-messaging)

This document provides a comprehensive guide to the **Push Notification Pipeline** implemented in Drive Kendra Mobile across the client, backend server, database, and Expo Push Service.

---

## 📑 Table of Contents

- [Overview & Architecture](#-overview--architecture)
- [Client-Side Implementation (`usePushNotifications.ts`)](#-client-side-implementation-usepushnotificationsts)
  - [Permission Handling & Device Token Extraction](#permission-handling--device-token-extraction)
  - [Android Notification Channels](#android-notification-channels)
  - [Foreground & Background Listeners](#foreground--background-listeners)
  - [Deep Linking & Route Navigation](#deep-linking--route-navigation)
- [Server-Side Implementation (`server/src/services/notifications.ts`)](#-server-side-implementation-serversrcservicesnotificationsts)
  - [Expo Server SDK Configuration](#expo-server-sdk-configuration)
  - [Notification Dispatch Triggers](#notification-dispatch-triggers)
  - [Receipt Verification & Token Cleanup](#receipt-verification--token-cleanup)
- [Database Schema & Delivery Audit Log](#-database-schema--delivery-audit-log)
- [Notification Events Matrix](#-notification-events-matrix)
- [Testing & Debugging Push Notifications](#-testing--debugging-push-notifications)

---

## 🏗 Overview & Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Client Token Lifecycle                                                   │
│    App Launch ──► Request Permission ──► Extract Token ──► Register Token   │
│                                                                │            │
│ 2. Server Event Dispatch                                       ▼            │
│    Fleet Action (e.g. Driver Assigned) ──► Query Customer Push Token        │
│                                                     │                       │
│ 3. Expo Push Network                                ▼                       │
│    Hono Dispatcher ──────────────────────► Expo Push Service (FCM v1 / APNs)│
│                                                     │                       │
│ 4. Client Presentation                              ▼                       │
│    Banner / Sound / Badge ◄────────────── Android / iOS OS Push Delivery    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📱 Client-Side Implementation (`usePushNotifications.ts`)

Located in [`src/hooks/usePushNotifications.ts`](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/src/hooks/usePushNotifications.ts).

### Permission Handling & Device Token Extraction
On app startup, the hook requests user permission and obtains a unique Expo Push Token:
```typescript
const { status: existingStatus } = await Notifications.getPermissionsAsync();
let finalStatus = existingStatus;

if (existingStatus !== 'granted') {
  const { status } = await Notifications.requestPermissionsAsync();
  finalStatus = status;
}

if (finalStatus === 'granted') {
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
  });
  // Register with backend
  await registerPushTokenApi({
    pushToken: tokenData.data,
    phoneNumber: user?.phone,
    devicePlatform: Platform.OS,
  });
}
```

### Android Notification Channels
For Android 8.0 (API level 26) and above, notification channels are registered with distinct importance and vibration patterns:
- `default`: General platform alerts and updates.
- `bookings`: High-priority booking confirmations and driver assignments with sound and vibration.
- `reminders`: Upcoming trip departure alerts.

### Foreground & Background Listeners
- **`addNotificationReceivedListener`**: Handles notifications received while the app is active and foregrounded.
- **`addNotificationResponseReceivedListener`**: Fires when a traveler taps a notification banner, extracting payload data for navigation.

### Deep Linking & Route Navigation
When the user taps an alert, the payload is inspected:
- `screen: 'MyTrips'` ➔ Navigates directly to the specific reservation (`bookingId`).
- `screen: 'Emergency'` ➔ Opens emergency contacts and offline SOS.

---

## ⚙️ Server-Side Implementation (`server/src/services/notifications.ts`)

### Expo Server SDK Configuration
The server initializes the Expo SDK client with HTTP/2 support and optional access tokens for enterprise throughput:
```typescript
import { Expo } from 'expo-server-sdk';

const expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN || undefined,
  useFcmV1: true,
});
```

### Notification Dispatch Triggers

#### 1. Booking Confirmed
Triggers when fleet management accepts and confirms a reservation:
```typescript
await triggerBookingConfirmedNotification(bookingId);
```
- **Title**: `Booking Confirmed! 🚗`
- **Body**: `Your trip (DK-2026-0042) to Pokhara has been confirmed.`

#### 2. Driver Assigned
Triggers when a chauffeur is assigned to a trip:
```typescript
await triggerDriverAssignedNotification(bookingId, {
  driverName: 'Bikash Gurung',
  driverPhone: '+977 9841998877',
  vehiclePlate: 'Ba 12 Cha 3456',
  vehicleModel: 'Mahindra Scorpio 4x4',
});
```
- **Title**: `Driver Assigned: Bikash Gurung`
- **Body**: `Your driver Bikash Gurung (Ba 12 Cha 3456) has been assigned. Tap to contact.`

#### 3. 24-Hour Trip Reminder
Automated reminder scheduled 24 hours prior to pickup date:
```typescript
await trigger24HourReminderNotification(bookingId);
```

#### 4. Tribhuvan Airport (TIA) Flight Delay Alert
Updates travelers when incoming flight schedules change:
```typescript
await triggerFlightDelayAlertNotification(bookingId, {
  flightNumber: 'RA-206',
  delayMinutes: 45,
  newArrivalTime: '14:30',
  airline: 'Nepal Airlines',
});
```

### Receipt Verification & Token Cleanup
The server audits push ticket receipts:
- If a delivery error indicates `DeviceNotRegistered`, the server immediately calls `invalidatePushToken()` to clear the stale token from `cr_customers`, avoiding wasted push quota.

---

## 🗄 Database Schema & Delivery Audit Log

All dispatched notifications are persisted in `cr_notifications`:

```sql
CREATE TABLE IF NOT EXISTS cr_notifications (
    notification_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES cr_customers(customer_id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_entity_id INTEGER,
    notification_type VARCHAR(100) NOT NULL,
    push_status VARCHAR(50) DEFAULT 'delivered',
    payload JSONB,
    ticket_id VARCHAR(255),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 📋 Notification Events Matrix

| Event Type | Priority | Channel ID | Sound | Payload Keys |
|---|---|---|---|---|
| `BookingConfirmed` | `high` | `bookings` | `default` | `bookingId`, `bookingRef`, `screen` |
| `DriverAssigned` | `high` | `bookings` | `default` | `bookingId`, `driverName`, `driverPhone`, `vehiclePlate`, `screen` |
| `TripReminder` | `normal` | `reminders` | `default` | `bookingId`, `pickupDate`, `screen` |
| `FlightDelay` | `high` | `bookings` | `default` | `bookingId`, `flightNumber`, `delayMinutes`, `newArrivalTime` |

---

## 🧪 Testing & Debugging Push Notifications

### 1. Test via Expo Push Notification Tool
1. Retrieve your Expo Push Token from the mobile app console logs.
2. Visit [https://expo.dev/notifications](https://expo.dev/notifications).
3. Paste the token and send a test payload:
```json
{
  "title": "Drive Kendra Test Alert",
  "body": "Hello from Kathmandu!",
  "data": { "screen": "MyTrips", "bookingId": 42 }
}
```

### 2. Test via Server API
Dispatch an automated driver assignment alert via curl or Postman:
```bash
curl -X POST http://localhost:8787/api/notifications/dispatch-driver-assigned \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": 1,
    "driverName": "Sunil Maharjan",
    "driverPhone": "+977 9841234567",
    "vehiclePlate": "Ba 15 Cha 8899",
    "vehicleModel": "Toyota HiAce Super GL"
  }'
```
