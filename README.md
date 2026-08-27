# 🚗 Drive Kendra Mobile

[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2057-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.86.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Hono API](https://img.shields.io/badge/API-Hono%20v4-E36002?style=for-the-badge&logo=hono&logoColor=white)](https://hono.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS%20%7C%20Web-success?style=for-the-badge)](https://drivekendra.com)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-Passing-brightgreen?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/Samman162/DriveKendra.Mobile)

**Drive Kendra Mobile** is a standalone, production-grade cross-platform mobile application built with **React Native (Expo SDK 57)** and **TypeScript** for **Drive Kendra** — Nepal's premier vehicle rental and Himalayan tour transport service.

The mobile app includes its own lightweight, high-performance **Hono/Node.js API** in `server/`. It connects directly to the shared **PostgreSQL database**, operating independently while maintaining complete database compatibility, atomic transactional consistency, push notification delivery, and off-grid Himalayan resilience.

---

## 📑 Table of Contents

- [Key Highlights](#-key-highlights)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Feature Breakdown & Screens](#-feature-breakdown--screens)
- [Project Directory Structure](#-project-directory-structure)
- [Himalayan Offline-First Resilience](#-himalayan-offline-first-resilience)
- [Push Notification Pipeline](#-push-notification-pipeline)
- [Backend API Reference](#-backend-api-reference)
- [Database Schema & Migration Rules](#-database-schema--migration-rules)
- [Environment Configuration](#-environment-configuration)
- [Getting Started & Local Development](#-getting-started--local-development)
  - [Prerequisites](#prerequisites)
  - [Installation & First Run](#installation--first-run)
  - [Connecting Physical Devices & Emulators](#connecting-physical-devices--emulators)
- [Testing & Quality Verification](#-testing--quality-verification)
- [Building with EAS (Android & iOS)](#-building-with-eas-android--ios)
- [Design System & Theming](#-design-system--theming)
- [Security & Anti-Spam Architecture](#-security--anti-spam-architecture)
- [Comprehensive Documentation Index](#-comprehensive-documentation-index)
- [Troubleshooting & FAQs](#-troubleshooting--faqs)
- [License & Credits](#-license--credits)

---

## 🌟 Key Highlights

- 🏔️ **Himalayan Tours & Expeditions**: Muktinath 4WD pilgrimage, Kalinchowk snow trips, Manakamana temple packages, and Pokhara/Chitwan multi-day routes with dynamic per-person rate calculators.
- 🚙 **Nepal Fleet Showcase**: 4x4 Mahindra Scorpios, 14-seater Toyota HiAce vans, luxury sedans, and 35-seater tourist coaches with luggage and passenger capacity specs.
- 📋 **Official Nepal Fare Matrix**: Government and NTVA rate chart covering hundreds of routes across all 7 provinces of Nepal with real-time search and filter.
- ✈️ **24/7 TIA Airport Transfers**: Fixed upfront rate calculator for Tribhuvan International Airport pickups and drops with flight tracking, delay adjustment, and nameboard greeting.
- 💍 **Wedding & VIP Luxury Cars**: Ceremonial luxury vehicles with floral decoration tiers (Silver, Gold, Platinum, VIP Vintage) and suited chauffeurs.
- 🔒 **End-to-End Authentication & Biometrics**: Sign In, Sign Up, and OTP-based password reset with persistent session storage via SecureStore and TouchID / FaceID biometric verification.
- 📱 **Interactive Trip Management & Offline Vouchers**: View upcoming and completed reservations, driver contact details, vehicle plate numbers, offline QR vouchers, and direct re-booking.
- 📲 **Push Notification Pipeline**: Real-time push alerts for booking confirmations, chauffeur assignment, 24-hour departure reminders, and TIA airport flight delays.
- 🆘 **Himalayan Emergency SOS**: Offline GPS coordinate capture with pre-filled SMS emergency dispatch to rescue hotlines and tourist police.
- 📄 **Instant PDF Voucher Generator**: Export official booking receipts and itinerary vouchers as PDFs with direct sharing to WhatsApp and email.
- 🌗 **Dual-Theme Engine**: Built-in Light and Dark modes with tactile haptic feedback on all interactions.
- 🛡️ **Anti-Spam & Validation**: Bot honeypots, strict Nepal phone validation (`+977 98/97` or `01XXXXXXX`), and transactional SQL database writes with idempotency keys.

---

## 🏗 Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Drive Kendra Mobile Client                       │
│       (Expo SDK 57 • React Native 0.86.2 • TypeScript Strict Mode)      │
│                                                                         │
│  ┌───────────────────────┐ ┌──────────────────────┐ ┌────────────────┐ │
│  │ React Navigation v7   │ │ Theme & UI System    │ │ Auth & Bio SDK │ │
│  │ (Tabs, Stacks, Modal) │ │ (useThemedStyles)    │ │ (SecureStore)  │ │
│  └───────────┬───────────┘ └──────────────────────┘ └────────────────┘ │
│              │                                                          │
│  ┌───────────┴───────────┐ ┌──────────────────────┐ ┌────────────────┐ │
│  │ Offline Cache & Queue │ │ Push Notification    │ │ PDF & QR Code  │ │
│  │ (Encrypted Vouchers)  │ │ Listener (Expo Push) │ │ Engine         │ │
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

### Frontend Stack
- **Framework**: [Expo](https://expo.dev) SDK 57 (React Native 0.86.2, React 19.2.3)
- **Language**: TypeScript 6.0 (Strict mode)
- **Navigation**: `@react-navigation/native` v7, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack`
- **Icons**: `lucide-react-native`
- **Pickers & UI Components**: `@react-native-community/datetimepicker`, `@gorhom/bottom-sheet`, `@shopify/flash-list`, `react-native-safe-area-context`, `react-native-screens`, `react-native-svg`
- **Native Hardware APIs**:
  - `expo-haptics` (Tactile feedback)
  - `expo-local-authentication` (Biometrics: Fingerprint & FaceID)
  - `expo-secure-store` (Encrypted keychain / keystore credential storage)
  - `expo-location` (High-accuracy GPS coordinate extraction for SOS)
  - `expo-notifications` (Remote push notification registration & handling)
  - `expo-print` & `expo-sharing` (PDF itinerary and voucher export)
  - `@react-native-community/netinfo` (Network status monitoring)
- **HTTP Client**: `axios`

### Backend API Stack
- **Framework**: [Hono](https://hono.dev) v4 (`@hono/node-server`)
- **Runtime**: Node.js (ES Modules) with `tsx watch` for instant hot reloading
- **Database Driver**: `pg` (node-postgres connection pool)
- **Validation**: `zod` v4
- **Push Notification Service**: `expo-server-sdk` (configured for FCM v1)

---

## 📱 Feature Breakdown & Screens

### 1. 🏠 Home Screen (`src/screens/HomeScreen.tsx`)
- **Hero & Live Stats**: Real-time stats chip bar (`GET /api/stats`) displaying fleet size, completed trips, cities covered, and average traveler rating.
- **Category Filter**: Instant category switching (All Fleet, 4x4 SUV, HiAce Vans, Sedans, Tourist Buses).
- **Interactive Nepal Route Map**: Visual waypoint preview card showing route distances, durations, and scenic highlights.
- **Popular Routes**: Quick fares for Kathmandu ➔ Pokhara, TIA Airport, Manakamana, Chitwan, and Nagarkot with one-tap booking pre-fill.
- **Fleet Showcase**: Featured vehicle strip cards with specifications and instant booking triggers.
- **Verified Traveler Reviews**: Horizontal carousel of customer reviews (`GET /api/reviews`) with star ratings and verified badges.
- **FAQs Accordion**: Essential booking and cancellation policies.

### 2. 🧭 Explore Hub (`src/screens/ExploreScreen.tsx`)
- Hub screen organizing all core rental categories into visual service tiles:
  - **Vehicle Fleet & Specifications**
  - **Official Nepal Rate Chart**
  - **Airport TIA Transfers**
  - **Wedding & VIP Luxury Cars**
  - **Curated Tour Expeditions**

### 3. 🚙 Fleet Catalog (`src/screens/FleetScreen.tsx`)
- Detailed catalog of vehicles:
  - **Mahindra Scorpio 4x4 S11**: High ground clearance for off-road mountain passes.
  - **Toyota HiAce Super GL / EV Van**: 14-seater touring vans with AC and reclining seats.
  - **Toyota Corolla / Suzuki Dzire**: Comfortable sedans for city and highway transit.
  - **Toyota Coaster / Tourist Bus**: 22–35 seaters for large groups and pilgrimages.
- Filter by category and instant keyword search.
- Passenger, luggage, fuel type, and transmission indicators.

### 4. 📊 Official Rate Chart (`src/screens/RatesScreen.tsx`)
- Complete rate catalog from Kathmandu to all major destinations in Nepal:
  - Kathmandu Valley sightseeing & day excursions
  - Pokhara, Chitwan, Lumbini, Biratnagar, Janakpur
  - Mountain destinations: Kalinchowk, Manakamana, Besisahar, Jomsom, Dhunche
- Search by destination or filter across all 7 provinces.
- Side-by-side fare comparison across Car, Scorpio/Jeep, HiAce, and Coaster Bus.
- One-click selection to prefill the booking form with rate details.

### 5. ✈️ Airport Transfers (`src/screens/AirportScreen.tsx`)
- Tribhuvan International Airport (TIA) transfer booking:
  - **Direction Toggle**: Airport Pickup (TIA ➔ City) or Airport Drop (City ➔ TIA).
  - **Destination Selector**: Major Kathmandu Valley areas (Thamel, Lazimpat, Lalitpur, Bhaktapur, Budhanilkantha, Nagarkot, etc.).
  - **Vehicle Type**: Standard Sedan, 4WD Scorpio, or HiAce Van.
  - **Fixed Upfront Fares**: Includes airport parking, luggage assistance, and 60 minutes of free flight-delay waiting.

### 6. 💍 Wedding & VIP Cars (`src/screens/WeddingScreen.tsx`)
- Luxury wedding convoy and VIP chauffeur booking:
  - **Fleet Tiers**: Silver Elegance (Sedan), Gold Royal (Scorpio 4x4), Platinum Majesty (Prado/Land Cruiser), Vintage Classic.
  - **Duration Packages**: Half Day (4 hrs), Full Day (8 hrs), Multi-Day Wedding Convoy.
  - **Decoration Options**: Minimal Ribbon Bows, Fresh Rose & Orchid Wrap, Deluxe Royal Garland.
  - Dynamic estimated price calculator with customized booking pre-fill.

### 7. 🏔️ Tours & Expeditions (`src/screens/ToursScreen.tsx` & `src/screens/TourDetailScreen.tsx`)
- Dedicated itineraries for premier Nepal tour packages:
  - **Muktinath 4WD Pilgrimage** (3 Days / 2 Nights via Pokhara & Jomsom)
  - **Manakamana Temple Day Trip** (Same-Day / Overnight cable car transport)
  - **Kalinchowk Snow & Kuri Village** (2 Days / 1 Night mountain tour)
- Interactive Pax rate matrix (pricing per person based on group size).
- Included vs Excluded service lists, mountain preparation tips, and FAQs.

### 8. 📝 Booking Engine (`src/screens/BookingScreen.tsx`)
- Comprehensive trip booking form:
  - **Personal Details**: Full name, Nepal mobile number (`+977 98/97` or `01XXXXXXX`), optional email (autofilled when logged in).
  - **Route**: Pickup and dropoff locations with quick-chip suggestions.
  - **Dates**: Pickup date and optional return date using native date pickers with validation.
  - **Trip Type**: Segmented One Way / Round Trip toggle.
  - **Vehicle Type**: Selection sheet for Sedan, Scorpio (4WD), HiAce (14-Seater), Coaster Bus.
  - **Passenger Stepper**: 1 to 50 passenger count adjuster.
  - **Promo Codes**: Interactive coupon sheet with instant discount calculations (`DRIVE2026`, `NAMASTE10`, `HIMALAYA15`).
  - **Spam Protection**: Invisible honeypot field.
  - **Idempotency Header**: Unique `X-Idempotency-Key` prevents double-bookings on flaky networks.
  - **Success Modal**: Animated confirmation dialog with reference details.

### 9. 🔐 Authentication Flow (`src/screens/AuthScreen.tsx`)
- **Sign In**: Login with email or Nepal phone number + password.
- **Biometric Quick Login**: Touch ID / Face ID hardware unlock for stored credentials.
- **Sign Up**: New account registration with full name, email, phone, and password strength verification.
- **Forgot Password**: 3-step OTP recovery flow:
  1. Enter registered email/phone
  2. Verify 6-digit OTP code (`OtpInput` component)
  3. Set new secure password
- **Social Login UI**: Quick actions for Google, Apple, and Phone OTP auth.

### 10. 👤 User Profile (`src/screens/ProfileScreen.tsx`)
- **Guest Mode**: Sign in / Sign up prompts with feature highlights.
- **Authenticated Mode**:
  - User avatar and verified account badge.
  - Member statistics (total bookings, active trips, reward points).
  - Quick action links: My Reservations, Official Rates, Emergency Assistance.
  - Settings: Dark/Light theme toggle, Notification preferences, Biometrics toggle, Privacy Policy.
  - Secure sign-out with confirmation modal.

### 11. 🎫 My Reservations & Vouchers (`src/screens/MyTripsScreen.tsx`)
- Active and past trip cards with status badges (`Confirmed`, `Completed`, `Cancelled`).
- Full trip details: Booking reference ID, route, date & time, vehicle plate number, and assigned driver details.
- **Offline QR Voucher**: Display QR code for ticket verification without internet.
- **PDF Export**: Generate official receipt voucher via `expo-print` and share via `expo-sharing`.
- Direct driver call and WhatsApp buttons.

### 12. 📞 Contact & Support (`src/screens/ContactScreen.tsx`)
- Direct phone call dispatch (`+977 985-1363783`).
- Instant WhatsApp chat deep link.
- Email dispatch to `info@drivekendra.com`.
- Interactive review submission form (`POST /api/reviews`) with star rating and trip title.
- Expandable FAQs and 24/7 roadside assistance hotline.

---

## 📁 Project Directory Structure

```
DriveKendra.Mobile/
├── .github/                      # GitHub Actions CI/CD workflows
│   └── workflows/
│       └── ci-cd.yml             # Typecheck, unit tests, and EAS config validation
├── assets/                       # App icons, splash screens, and adaptive icons
├── database/                     # PostgreSQL Database Management
│   ├── patches/                  # Sequential SQL migration patches
│   │   └── .gitkeep              # Retained for future incremental migrations
│   ├── database.sql              # Master canonical PostgreSQL schema & procedures
│   └── README.md                 # Dedicated Database Management Guide
├── docs/                         # Specialized Technical Documentation
│   ├── ARCHITECTURE.md           # End-to-end system architecture blueprint
│   ├── OFFLINE_AND_RESILIENCE.md # Himalayan offline-first resilience strategy
│   ├── PUSH_NOTIFICATIONS.md     # Push notification pipeline & triggers
│   └── DEPLOYMENT.md             # EAS builds, server hosting, and CI/CD guide
├── server/                       # Dedicated Hono Node.js Mobile API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts           # Login, register, OTP reset endpoints
│   │   │   ├── bookings.ts       # POST /api/bookings with Idempotency & DB transaction
│   │   │   ├── notifications.ts  # Push notification trigger routes
│   │   │   ├── reviews.ts        # GET / POST /api/reviews endpoints
│   │   │   ├── stats.ts          # GET /api/stats platform statistics
│   │   │   └── users.ts          # POST /api/users/push-token registration
│   │   ├── services/
│   │   │   └── notifications.ts  # Push notification dispatcher (Expo SDK / FCM v1)
│   │   ├── db.ts                 # PostgreSQL connection pool & RLS client
│   │   ├── index.ts              # Hono app entry point & CORS configuration
│   │   └── validation.ts         # Input schemas, honeypot & phone validation
│   ├── __tests__/                # Server unit tests
│   │   └── validation.test.ts    # Zod schemas & phone regex validation tests
│   ├── .env.example              # Server environment template
│   ├── package.json              # Server dependencies & scripts
│   ├── tsconfig.json             # Server TypeScript config
│   └── README.md                 # Dedicated Server API Reference
├── src/                          # React Native Application Source
│   ├── api/                      # Client API modules
│   │   ├── auth.ts               # Auth API calls & demo fallbacks
│   │   ├── bookings.ts           # Trip booking submission with idempotency
│   │   ├── cache.ts              # Local data caching engine
│   │   ├── client.ts             # Axios client with base URL configuration
│   │   ├── config.ts             # API URL constants
│   │   ├── offlineQueue.ts       # Action replay queue for offline mutations
│   │   ├── reviews.ts            # Testimonials retrieval & submission
│   │   ├── stats.ts              # Live platform stats
│   │   └── users.ts              # Push token registration API
│   ├── components/
│   │   ├── honeypot/             # Anti-spam HoneypotField component
│   │   │   └── HoneypotField.tsx
│   │   ├── rates/                # Rate filtering and table components
│   │   └── ui/                   # 26 reusable themed UI components
│   │       ├── Button.tsx        # Variants: primary, secondary, subtle, outline, danger
│   │       ├── Card.tsx          # Themed surface container
│   │       ├── DateField.tsx     # Native date picker wrapper
│   │       ├── EmergencyTripCard.tsx # Offline SOS & GPS dispatch card
│   │       ├── FaqList.tsx       # Expandable accordion list
│   │       ├── MapRoutePreview.tsx # Scenic route visualization card
│   │       ├── NotificationsModal.tsx # In-app notification tray
│   │       ├── OtpInput.tsx      # 6-digit OTP verification box
│   │       ├── PasswordField.tsx # Secure input with show/hide toggle
│   │       ├── PickerSheet.tsx   # Modal bottom sheet selection
│   │       ├── PromoCodeSheet.tsx# Discount coupon sheet
│   │       ├── QuoteCard.tsx     # Price quote display
│   │       ├── RemoteImage.tsx   # Image loader with placeholder
│   │       ├── ReviewCard.tsx    # Traveler review card
│   │       ├── Screen.tsx        # SafeArea scrollable screen wrapper
│   │       ├── SectionHeader.tsx # Standard section header with badge
│   │       ├── SegmentedControl.tsx # Pill-style toggle control
│   │       ├── SocialAuthButtons.tsx # Google/Apple/Phone login buttons
│   │       ├── StatChip.tsx      # Metric highlight chip
│   │       ├── Stepper.tsx       # Numeric increment/decrement
│   │       ├── SuccessModal.tsx  # Confirmation modal
│   │       ├── TextField.tsx     # Floating label text input
│   │       ├── ThemeToggle.tsx   # Light/Dark mode switcher button
│   │       ├── TourCard.tsx      # Tour package card
│   │       ├── VehicleCard.tsx   # Fleet vehicle card & strip card
│   │       └── VoucherQrCode.tsx # Offline QR code ticket renderer
│   ├── constants/
│   │   ├── contact.ts            # Phone, WhatsApp, email, and address constants
│   │   ├── validation.ts         # Validation rules and error strings
│   │   └── vehicles.ts           # Vehicle type IDs and mappings
│   ├── content/                  # Bundled offline content & rate catalogs
│   │   ├── airport.ts            # Airport transfer routes and rates
│   │   ├── faqs.ts               # FAQs for all screens
│   │   ├── rateCategories.generated.ts # Full Nepal official rate chart
│   │   ├── rates.ts              # Rate helper utilities and column types
│   │   ├── tourDetails.ts        # Muktinath, Manakamana, Kalinchowk pricing
│   │   ├── tours.ts              # Curated tour package list
│   │   ├── vehicles.ts           # Fleet catalog with specs and images
│   │   └── wedding.ts            # Wedding car tiers and decor options
│   ├── context/
│   │   └── AuthContext.tsx       # Auth provider with secure storage persistence
│   ├── hooks/
│   │   ├── useBiometrics.ts      # Hardware FaceID/TouchID authentication
│   │   ├── useCachedData.ts      # Cached query fetcher
│   │   ├── useNetworkStatus.ts   # Network connectivity listener
│   │   └── usePushNotifications.ts # Expo push notifications hook
│   ├── navigation/
│   │   ├── AppNavigator.tsx      # Bottom tabs & stack navigators
│   │   ├── booking.ts            # Cross-screen booking navigation helpers
│   │   ├── navigationRef.ts      # Global navigation reference
│   │   └── types.ts              # React Navigation param lists
│   ├── screens/                  # 13 feature screens
│   │   ├── AirportScreen.tsx     # TIA airport transfer calculator & booking
│   │   ├── AuthScreen.tsx        # SignIn, SignUp, and OTP reset
│   │   ├── BookingScreen.tsx     # Comprehensive booking engine
│   │   ├── ContactScreen.tsx     # 24/7 hotline, WhatsApp, and review submission
│   │   ├── ExploreScreen.tsx     # Visual service categories hub
│   │   ├── FleetScreen.tsx       # Fleet vehicle catalog with specifications
│   │   ├── HomeScreen.tsx        # Hero stats, route map, featured fleet, reviews
│   │   ├── MyTripsScreen.tsx     # Active/past reservations, QR voucher & PDF export
│   │   ├── ProfileScreen.tsx     # User profile, statistics, settings, theme toggle
│   │   ├── RatesScreen.tsx       # 7-province official Nepal fare matrix
│   │   ├── TourDetailScreen.tsx  # Itinerary, packing guide, and pax rate table
│   │   ├── ToursScreen.tsx       # Curated Himalayan tour expeditions
│   │   └── WeddingScreen.tsx     # VIP & ceremonial convoy packages
│   ├── theme/
│   │   ├── ThemeProvider.tsx     # Theme context & hook
│   │   ├── colors.ts             # Light & Dark color palettes
│   │   ├── spacing.ts            # Radius and spacing tokens
│   │   ├── typography.ts         # Font size and weight definitions
│   │   └── useThemedStyles.ts    # Hook for dynamic stylesheet evaluation
│   ├── types/
│   │   ├── api.ts                # DTOs for bookings, reviews, stats
│   │   └── auth.ts               # DTOs for auth, users, and tokens
│   └── utils/
│       ├── dates.ts              # Date formatting and comparison
│       ├── errors.ts             # Axios and runtime error extractors
│       ├── haptics.ts            # Tactile feedback helpers
│       ├── offlineVoucherStorage.ts # Encrypted offline trip voucher storage
│       ├── pdfGenerator.ts       # PDF receipt creation and sharing
│       ├── phone.ts              # Nepal phone number sanitization and checks
│       └── secureStorage.ts      # Hardware encrypted credential storage
├── __tests__/                    # Client unit & integration test suites
│   ├── AuthFlow.test.tsx         # Auth & OTP interaction tests
│   └── BookingScreen.test.tsx    # Booking form submission tests
├── .env.example                  # Client environment template
├── AGENTS.md                     # Agent coding rules and guidelines
├── app.config.ts                 # Dynamic Expo configuration
├── App.tsx                       # Root React Native component
├── CLAUDE.md                     # CLI quick reference
├── CONTRIBUTING.md               # Contributor guidelines
├── eas.json                      # EAS build configurations
├── index.ts                      # Expo entry point
├── package.json                  # Root dependencies and scripts
└── tsconfig.json                 # Client TypeScript configuration
```

---

## 🏔 Himalayan Offline-First Resilience

Traveling through Nepal often involves high-altitude passes and remote valleys without 4G/3G connectivity. Drive Kendra Mobile provides:

1. **Bundled Offline Rate Sheets**: Access the official Nepal fare matrix across 7 provinces without cellular network.
2. **Encrypted Offline Vouchers**: Confirmed trip vouchers are cached in local storage and accessible offline anytime.
3. **Offline QR Code Ticket**: Passengers can present high-contrast QR codes at checkpoints for instant verification.
4. **GPS Emergency SOS**: Captures latitude/longitude from GPS satellites and generates pre-filled emergency SMS messages to rescue hotlines (`+977 985-1363783`) and Tourist Police (`1144`).

👉 *Read the full guide in [`docs/OFFLINE_AND_RESILIENCE.md`](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/docs/OFFLINE_AND_RESILIENCE.md).*

---

## 📲 Push Notification Pipeline

The app integrates an automated push notification pipeline powered by **Expo Notifications** and **Expo Server SDK (FCM v1)**:

- **Chauffeur Assignment**: Real-time push alert with driver name, direct phone dialer, and vehicle plate number.
- **Booking Confirmation**: Instant confirmation notice when reservations are approved.
- **24-Hour Trip Reminder**: Departure reminder 24 hours prior to trip time.
- **TIA Airport Flight Delay Alerts**: Automatic updates if incoming flights to Kathmandu are delayed.
- **Token Invalidation**: Server cleans up stale tokens when receiving `DeviceNotRegistered` receipts.

👉 *Read the full guide in [`docs/PUSH_NOTIFICATIONS.md`](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/docs/PUSH_NOTIFICATIONS.md).*

---

## 🔌 Backend API Reference

Base URL (Development): `http://localhost:8787` (or LAN IP for physical mobile devices)

| Method | Endpoint | Description | Headers / Body | Response |
|---|---|---|---|---|
| `GET` | `/health` | Server and PostgreSQL health check | — | `{ "ok": true }` |
| `GET` | `/api/stats` | Live platform metrics | — | `PublicStatsDto` |
| `POST` | `/api/bookings` | Submit new booking with Idempotency | `X-Idempotency-Key`, `BookingEntryDto` | `{ "message": "Booking submitted successfully", "bookingRef": "..." }` |
| `POST` | `/api/users/push-token` | Register Expo push token | `{ pushToken, customerId, phoneNumber }` | `{ "success": true }` |
| `POST` | `/api/notifications/dispatch-driver-assigned` | Dispatch driver alert | `{ bookingId, driverName, driverPhone, vehiclePlate }` | `{ "result": { "success": true } }` |
| `POST` | `/api/notifications/dispatch-booking-status` | Dispatch status alert | `{ bookingId, status }` | `{ "message": "..." }` |
| `POST` | `/api/notifications/dispatch-trip-reminder` | Dispatch 24h reminder | `{ bookingId }` | `{ "message": "..." }` |
| `POST` | `/api/notifications/dispatch-flight-delay` | Dispatch flight delay | `{ bookingId, flightNumber, delayMinutes }` | `{ "message": "..." }` |
| `POST` | `/api/notifications/verify-receipts` | Verify Expo push delivery tickets | `{ receiptIds }` | `{ "receipts": [...] }` |
| `GET` | `/api/reviews` | Fetch approved reviews | — | `PublicReviewDto[]` |
| `POST` | `/api/reviews` | Submit customer review | `CreateReviewDto` | `{ "message": "Thank you! ..." }` |
| `POST` | `/api/auth/login` | User login (email or phone) | `{ identifier, password }` | `{ user, token, message }` |
| `POST` | `/api/auth/register`| User registration | `{ name, email, phone, password }` | `{ user, token, message }` |
| `POST` | `/api/auth/forgot-password` | Send 6-digit OTP code | `{ identifier }` | `{ message, code }` |
| `POST` | `/api/auth/reset-password` | Reset password via OTP | `{ identifier, code, newPassword }` | `{ message }` |

👉 *Read the full API reference in [`server/README.md`](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/server/README.md).*

---

## 🗄 Database Schema & Migration Rules

> [!IMPORTANT]
> **Strict Database Management Rules**:
> 1. **Base Schema**: Always maintain and update the master schema in [`database/database.sql`](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/database/database.sql).
> 2. **Patches Folder**: For any pending database alterations, create a new numbered patch inside [`database/patches/`](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/database/patches/) (e.g. `001_...`, `002_...`).
> 3. **Execution Constraint**: **NEVER** run SQL queries directly on live production/staging databases. Migrations are executed manually by database administrators.

👉 *Read the full database documentation in [`database/README.md`](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/database/README.md).*

---

## ⚙️ Environment Configuration

### 1. Root Client Environment (`.env`)
Create a `.env` file in the root directory:

```env
# Point to your Hono server (use your PC's LAN IP for physical device testing)
EXPO_PUBLIC_API_BASE_URL=http://localhost:8787/api
```

### 2. Backend Server Environment (`server/.env`)
Create a `.env` file inside `server/`:

```env
# PostgreSQL connection string (supports standard URI or ADO.NET format)
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/car_rental_db
PORT=8787
EXPO_ACCESS_TOKEN=
```

---

## 🚀 Getting Started & Local Development

### Prerequisites
- **Node.js**: `v20.x` or higher
- **npm** or **yarn**
- **Expo Go App** (on physical phone) OR **Android Studio** / **Xcode**
- **PostgreSQL 15+** database

---

### Installation & First Run

1. **Clone the repository and install root dependencies**:
   ```bash
   npm install
   ```

2. **Install backend server dependencies**:
   ```bash
   npm install --prefix server
   ```

3. **Start both Backend API and Expo Bundler concurrently in one terminal**:
   ```bash
   npm run dev
   ```
   > 💡 Starts the Hono API on `http://localhost:8787` (`[api]`) and the Expo Metro Bundler (`[app]`).

---

### Connecting Physical Devices & Emulators

| Target | `EXPO_PUBLIC_API_BASE_URL` | Instructions |
|---|---|---|
| **Android Emulator** | `http://10.0.2.2:8787/api` | Press **`a`** in the Expo terminal |
| **iOS Simulator** | `http://localhost:8787/api` | Press **`i`** in the Expo terminal |
| **Physical Phone (Expo Go)** | `http://<YOUR_LAN_IP>:8787/api` *(e.g., `http://192.168.1.15:8787/api`)* | Scan the QR code with Expo Go. **Ensure phone and PC share the same Wi-Fi.** |
| **Web Browser** | `http://localhost:8787/api` | Press **`w`** in the Expo terminal |

---

## 🧪 Testing & Quality Verification

Run the automated test suites and static analysis tools:

```bash
# 1. Client & Server TypeScript Typecheck
npm run typecheck
npm run typecheck --prefix server

# 2. Client Jest Unit & Integration Tests
npm test

# 3. Server Jest Validation & Endpoint Tests
npm test --prefix server
```

---

## 📦 Building with EAS (Android & iOS)

Pre-configured EAS profiles in [`eas.json`](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/eas.json):

```bash
# 1. Internal Development Client
npx eas-cli build --profile development --platform android

# 2. Standalone Preview APK (Direct install on Android phones)
npx eas-cli build --profile preview --platform android

# 3. Production Android App Bundle (.aab for Google Play Store)
npx eas-cli build --profile production --platform android
```

👉 *Read the full build and release guide in [`docs/DEPLOYMENT.md`](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/docs/DEPLOYMENT.md).*

---

## 🎨 Design System & Theming

Drive Kendra Mobile uses a custom theme architecture in `src/theme/`:

- **Color Palettes** (`colors.ts`):
  - **Light Mode**: Clean slate background (`#F1F5F9`), crisp white surfaces (`#FFFFFF`), warm amber brand accent (`#D97706`), deep navy headers (`#0F172A`).
  - **Dark Mode**: Midnight navy background (`#0F172A`), elevated slate surfaces (`#1E293B`), golden amber accents (`#F59E0B`), high-contrast text (`#F8FAFC`).
- **Dynamic Themed Hook** (`useThemedStyles.ts`): Automatically re-evaluates stylesheets when the theme toggles without re-mounting the component tree.
- **Haptic Feedback** (`haptics.ts`): Tactile responses for button taps, tab switching, and success states using `expo-haptics`.

---

## 🛡️ Security & Anti-Spam Architecture

1. **Honeypot Bot Protection**: Hidden field `website_hp` filters automated bots from booking and review forms.
2. **Strict Nepal Phone Regex**: Pattern `/^(?:977)?(9[78]\d{8}|0[1-9]\d{7})$/` validates standard mobile (`98XXXXXXXX`, `97XXXXXXXX`) and regional landlines (`01XXXXXXX`).
3. **Idempotency Keys**: Generates SHA-256 request hashes and checks `dka_idempotency_keys` to prevent accidental double-bookings on flaky connections.
4. **Encrypted Secure Storage**: User tokens and biometrics are stored via `expo-secure-store` hardware encryption.
5. **Database RLS Safety**: All database interactions use `SET LOCAL app.is_admin = 'false'` to isolate public requests.
6. **Parameterized SQL Queries**: All queries use `$1, $2, ...` positional parameterization to eliminate SQL injection vulnerabilities.

---

## 📚 Comprehensive Documentation Index

| Document | Purpose |
|---|---|
| [System Architecture](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/docs/ARCHITECTURE.md) | Detailed architectural blueprint, topology, and security models |
| [Himalayan Offline Strategy](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/docs/OFFLINE_AND_RESILIENCE.md) | In-depth guide to offline vouchers, QR tickets, and GPS SOS |
| [Push Notifications Pipeline](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/docs/PUSH_NOTIFICATIONS.md) | End-to-end push notification lifecycle and trigger reference |
| [Deployment & Operations](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/docs/DEPLOYMENT.md) | EAS build guide, server setup, PM2, Docker, and CI/CD |
| [Server API Documentation](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/server/README.md) | Complete Hono REST API reference with JSON payloads |
| [Database Management Guide](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/database/README.md) | PostgreSQL table definitions, procedures, and migration rules |
| [Contributing Guidelines](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/CONTRIBUTING.md) | Coding conventions, PR checklists, and developer setup |
| [Agent Guidelines](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/AGENTS.md) | Operational guidelines for AI coding assistants |
| [CLI Quick Reference](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/CLAUDE.md) | Rapid command cheatsheet |

---

## ❓ Troubleshooting & FAQs

### Q: Expo Go says "Project is incompatible with this version of Expo Go"
> **A**: This project uses **Expo SDK 57**. Update the **Expo Go** app on your phone to match SDK 57, or create a development build using `npm run android` / `npx eas-cli build --profile preview`.

### Q: Network request failed on physical phone
> **A**: Ensure your phone is connected to the same Wi-Fi network as your computer, and update `.env`:
> ```env
> EXPO_PUBLIC_API_BASE_URL=http://<YOUR_LOCAL_PC_IP>:8787/api
> ```
> Restart Expo with `npx expo start -c` to clear the cache.

### Q: Database connection error on `npm run server`
> **A**: Verify that PostgreSQL is running and credentials in `server/.env` are valid. Test with `SELECT 1;`.

---

## 📜 All Available NPM Scripts

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `concurrently -n api,app ...` | Starts both Hono API and Expo dev server concurrently |
| `npm start` | `expo start --go` | Starts Expo Metro bundler with Expo Go support |
| `npm run android` | `expo start --android` | Launches app directly on Android emulator/device |
| `npm run ios` | `expo start --ios` | Launches app directly on iOS simulator (macOS) |
| `npm run web` | `expo start --web` | Starts React Native Web development server |
| `npm run server` | `npm run dev --prefix server` | Starts only the Hono backend server in watch mode |
| `npm run typecheck` | `tsc --noEmit` | Runs static TypeScript typechecking across the client |
| `npm test` | `jest` | Runs client unit and integration test suites |

---

## 📄 License & Credits

- **Copyright © 2026 Drive Kendra** — Nepal Car Rental & Tour Transport.
- **Headquarters**: Duwakot, Bhaktapur / Kathmandu, Nepal.
- **Dispatch**: `+977 985-1363783` • `info@drivekendra.com` • [drivekendra.com](https://drivekendra.com)
