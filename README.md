# 🚗 Drive Kendra Mobile

[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2057-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.86.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Hono API](https://img.shields.io/badge/API-Hono%20v4-E36002?style=for-the-badge&logo=hono&logoColor=white)](https://hono.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS%20%7C%20Web-success?style=for-the-badge)](https://drivekendra.com)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-Passing-brightgreen?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/Samman162/DriveKendra.Mobile)
[![Tests](https://img.shields.io/badge/Tests-116%20Passed-success?style=for-the-badge)](https://github.com/Samman162/DriveKendra.Mobile)

**Drive Kendra Mobile** is a standalone, production-grade cross-platform mobile application built with **React Native (Expo SDK 57)** and **TypeScript** for **Drive Kendra** — Nepal's premier vehicle rental and Himalayan tour transport service.

The mobile app includes its own lightweight, high-performance **Hono/Node.js API** in `server/`. It connects directly to the shared **PostgreSQL database**, operating independently while maintaining complete database compatibility, atomic transactional consistency, interactive zero-cost OpenStreetMap (OSM) map picking, and off-grid Himalayan resilience.

---

## 📑 Table of Contents

- [Key Highlights](#-key-highlights)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Feature Breakdown & 7 Core Screens](#-feature-breakdown--7-core-screens)
- [Interactive Map & Geocoding Engine](#-interactive-map--geocoding-engine)
- [Project Directory Structure](#-project-directory-structure)
- [Himalayan Offline-First Resilience](#-himalayan-offline-first-resilience)
- [Backend API Reference](#-backend-api-reference)
- [Database Schema & Migration Rules](#-database-schema--migration-rules)
- [Environment Configuration](#-environment-configuration)
- [Getting Started & Local Development](#-getting-started--local-development)
  - [Prerequisites](#prerequisites)
  - [Installation & First Run](#installation--first-run)
  - [Connecting Physical Devices & Emulators](#connecting-physical-devices--emulators)
- [Testing & Quality Verification (116 Tests)](#-testing--quality-verification-116-tests)
- [Building with EAS (Android & iOS)](#-building-with-eas-android--ios)
- [Design System & Theming](#-design-system--theming)
- [Security & Anti-Spam Architecture](#-security--anti-spam-architecture)
- [Comprehensive Documentation Index](#-comprehensive-documentation-index)
- [Troubleshooting & FAQs](#-troubleshooting--faqs)
- [License & Credits](#-license--credits)

---

## 🌟 Key Highlights

- 🗺️ **Interactive OpenStreetMap (OSM) Location Picker**: Free, interactive Leaflet map integration (`FullScreenMapPicker`) enabling users to visually pin pickup & dropoff coordinates anywhere across Nepal with zero third-party API key costs.
- 📍 **Free Reverse Geocoding & Nepal Dataset**: Instant coordinate-to-address resolution via OSM Nominatim with robust fallback to a bundled 77-district offline dataset (`nepalLocations.ts`, `geocoding.ts`).
- 🚙 **Fleet Options**: Mahindra Scorpios (4x4 SUV), 14-seater Toyota HiAce vans, comfortable sedans, and tourist buses.
- 🔒 **End-to-End Authentication & Biometrics**: Sign In, Sign Up, and OTP-based password reset with persistent session storage via `SecureStore` and TouchID / FaceID biometric verification.
- 📱 **Interactive Trip Management & Offline Vouchers**: View upcoming and completed reservations, vehicle plate numbers, assigned models, offline QR vouchers, and 24/7 dispatch hotline access.
- 🆘 **Himalayan Emergency SOS**: Offline GPS coordinate capture with pre-filled SMS emergency dispatch to rescue hotlines (`+977 985-1363783`) and tourist police (`1144`).
- 📄 **Instant PDF Voucher Generator**: Export official booking receipts and itinerary vouchers as PDFs with direct sharing to WhatsApp, Email, or AirDrop.
- 🌗 **Dual-Theme Engine**: Built-in Light and Dark modes with tactile haptic feedback on all interactions.
- 🛡️ **Anti-Spam & Validation**: Bot honeypots (`website_hp`), strict Nepal phone validation (`+977 98/97` or `01XXXXXXX`), and transactional SQL database writes with idempotency keys.

---

## 🏗 Architecture & Tech Stack

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
│  │ Offline Cache & Queue │ │ Network Status       │ │ OpenStreetMap  │ │
│  │ (Encrypted Vouchers)  │ │ Listener (NetInfo)   │ │ Leaflet Engine │ │
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
│  ┌───────────┴───────────┐                                              │
│  │ Transaction Manager   │                                              │
│  │ (Multi-Table Atomic)  │                                              │
│  └───────────┬───────────┘                                              │
└──────────────┼──────────────────────────────────────────────────────────┘
               │ PostgreSQL Connection Pool (pg)
               ▼
┌───────────────────────────────────────────────┐
│          PostgreSQL Database Server           │
│   (dka_bookings • dka_users • dka_idemp etc)  │
│          Stored Procedures & Indexes          │
└───────────────────────────────────────────────┘
```

### Frontend Stack
- **Framework**: [Expo](https://expo.dev) SDK 57 (React Native 0.86.2, React 19.2.3)
- **Language**: TypeScript 6.0 (Strict mode enabled)
- **Navigation**: `@react-navigation/native` v7, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack`
- **Mapping & WebViews**: `react-native-webview` (mobile Leaflet bridge) + HTML5 responsive canvas
- **Icons**: `lucide-react-native`
- **Pickers & UI Components**: `@react-native-community/datetimepicker`, `@shopify/flash-list`, `react-native-safe-area-context`, `react-native-screens`, `react-native-svg`
- **Native Hardware APIs**:
  - `expo-haptics` (Tactile haptic feedback)
  - `expo-local-authentication` (Biometrics: TouchID & FaceID)
  - `expo-secure-store` (Encrypted keychain / keystore credential storage)
  - `expo-location` (High-accuracy GPS coordinate extraction for SOS)
  - `expo-print` & `expo-sharing` (PDF itinerary and voucher export)
  - `@react-native-community/netinfo` (Network status monitoring)
- **HTTP Client**: `axios`

### Backend API Stack
- **Framework**: [Hono](https://hono.dev) v4 (`@hono/node-server`)
- **Runtime**: Node.js (ES Modules) with `tsx watch` for instant hot reloading
- **Database Driver**: `pg` (node-postgres connection pool)
- **Validation**: `zod` v4

---

## 📱 Feature Breakdown & 7 Core Screens

### 1. 🌟 Onboarding Walkthrough (`src/screens/OnboardingScreen.tsx`)
- First-launch welcome experience introducing travelers to Nepal vehicle rental services.
- Animated multi-slide cards highlighting 4x4 mountain fleet, 24/7 airport transfers, and offline resilience.
- Smooth page indicators, skip action, and persistent completion state in `onboardingStorage.ts`.

### 2. 🏠 Home Screen (`src/screens/HomeScreen.tsx`)
- **Personalized Header**: Top bar featuring user avatar, profile navigation, and theme mode toggle (`light` / `dark`).
- **Welcome Greeting**: Greets travelers by name or guest profile status.
- **Service Hub**: Quick action to start a vehicle booking reservation (`BookingScreen`).

### 3. 📝 Booking Engine (`src/screens/BookingScreen.tsx`)
- Comprehensive trip reservation form:
  - **Personal Details**: Full name, Nepal mobile number (`+977 98/97` or `01XXXXXXX`), optional email.
  - **Interactive Map Pinning**: OpenStreetMap / Leaflet location picker modal for visual pickup/dropoff coordinate selection.
  - **Departure Time Picker**: Quick presets (Early Morning, Morning, Afternoon, Evening) + custom native time picker (`TimePickerField`).
  - **Dates**: Pickup date and optional return date with multi-day quick offset chips.
  - **Trip Type**: Segmented One Way / Round Trip toggle.
  - **Vehicle Type**: Selection drawer for Sedan, Scorpio (4WD), HiAce (14-Seater), Coaster Bus.
  - **Passenger Stepper**: 1 to 50 passenger count adjuster.
  - **Spam Protection**: Invisible honeypot field (`website_hp`).
  - **Idempotency Header**: Unique `X-Idempotency-Key` prevents double-bookings on flaky networks.
  - **Success Modal**: Animated confirmation dialog with reference details.

### 4. 🎫 My Reservations & Vouchers (`src/screens/MyTripsScreen.tsx`)
- Active and past trip cards with status badges (`Confirmed`, `Completed`, `Cancelled`).
- Full trip details: Booking reference ID, route, date & time, assigned vehicle model, and registration plate.
- **Offline QR Voucher**: Display QR code for ticket verification without internet.
- **PDF Export**: Generate official receipt voucher via `expo-print` and share via `expo-sharing`.
- **24/7 Dispatch Hotline**: Instant one-tap phone call button to Drive Kendra operations (`+977 985-1363783`).
- **Emergency SOS**: Immediate mountain SOS modal with satellite GPS extraction.

### 5. 👤 User Profile (`src/screens/ProfileScreen.tsx`)
- **Guest Mode**: Sign in / Sign up prompts with feature highlights.
- **Authenticated Mode**:
  - User avatar and account details.
  - Quick action links: My Reservations, 24/7 Support Desk, Emergency Assistance.
  - Settings: Dark/Light theme toggle, Biometrics toggle, Privacy Policy.
  - Secure sign-out with confirmation modal.

### 6. 🔐 Authentication Flow (`src/screens/AuthScreen.tsx`)
- **Sign In**: Login with email or Nepal phone number + password.
- **Biometric Quick Login**: Touch ID / Face ID hardware unlock for stored credentials.
- **Sign Up**: New account registration with full name, email, phone, and password verification.
- **Forgot Password**: 3-step OTP recovery flow:
  1. Enter registered email/phone
  2. Verify 6-digit OTP code (`OtpInput` component)
  3. Set new secure password
- **Social Login UI**: Quick action buttons for third-party authentication.

### 7. 📞 Contact & Support (`src/screens/ContactScreen.tsx`)
- Direct phone call dispatch to 24/7 dispatch desk (`+977 985-1363783`).
- Instant WhatsApp chat deep link.
- Email dispatch to `info@drivekendra.com`.
- Office location information and 24/7 roadside assistance support.

---

## 🗺️ Interactive Map & Geocoding Engine

Drive Kendra Mobile includes a built-in OpenStreetMap (OSM) and Leaflet mapping subsystem that eliminates costly third-party API key billing:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Free Nepal Mapping Engine                       │
├─────────────────────────┬──────────────────────────────────────────────┤
│ Component / Utility     │ Functionality & Implementation               │
├─────────────────────────┼──────────────────────────────────────────────┤
│ FullScreenMapPicker.tsx │ Fullscreen Leaflet map with drag-and-pin     │
│ LocationPickerModal.tsx │ Nepal landmark & district selector modal     │
│ MapPinBrandBadge.tsx    │ Branded Drive Kendra amber pin marker        │
│ geocoding.ts            │ Free OSM Nominatim reverse geocoding         │
│ nepalLocations.ts       │ Bundled 77-district offline landmark database│
│ recentSearchesStorage.ts│ Local search history caching (AsyncStorage)  │
└─────────────────────────┴──────────────────────────────────────────────┘
```

1. **Zero API Cost**: Uses OpenStreetMap tiles served over Leaflet without requiring credit cards or Google Cloud Console billing.
2. **Reverse Geocoding**: When a user drops a pin, `geocoding.ts` queries OSM Nominatim for the street/landmark name, seamlessly falling back to the nearest landmark in `nepalLocations.ts` if offline.
3. **Smart Search & Recents**: Combines instant keyword filtering with recently selected locations stored locally.

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
│   ├── database.sql              # Master canonical PostgreSQL schema & procedures
│   └── README.md                 # Dedicated Database Management Guide
├── docs/                         # Specialized Technical Documentation
│   ├── ARCHITECTURE.md           # End-to-end system architecture blueprint
│   ├── OFFLINE_AND_RESILIENCE.md # Himalayan offline-first resilience strategy
│   └── DEPLOYMENT.md             # EAS builds, server hosting, and CI/CD guide
├── server/                       # Dedicated Hono Node.js Mobile API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts           # Login, register, OTP reset endpoints
│   │   │   ├── bookings.ts       # GET & POST /api/bookings with Idempotency & DB transaction
│   │   │   └── users.ts          # Profile update and push token registration
│   │   ├── db.ts                 # PostgreSQL connection pool & RLS client
│   │   ├── index.ts              # Hono app entry point & CORS configuration
│   │   └── validation.ts         # Input schemas, honeypot & phone validation
│   ├── __tests__/                # Server unit & integration tests (2 suites / 36 tests)
│   │   ├── apiEndpoints.test.ts  # Endpoints, auth, bookings, and idempotency tests (25 tests)
│   │   └── validation.test.ts    # Zod schemas & phone regex validation tests (11 tests)
│   ├── .env.example              # Server environment template
│   ├── package.json              # Server dependencies & scripts
│   ├── tsconfig.json             # Server TypeScript config
│   └── README.md                 # Dedicated Server API Reference
├── src/                          # React Native Application Source
│   ├── api/                      # Client API modules
│   │   ├── auth.ts               # Auth API calls & session handling
│   │   ├── bookings.ts           # Trip booking submission with idempotency
│   │   ├── client.ts             # Axios client with base URL configuration
│   │   ├── config.ts             # API URL constants
│   │   ├── offlineQueue.ts       # Action replay queue for offline mutations
│   │   └── users.ts              # Profile and push token API
│   ├── components/
│   │   ├── honeypot/             # Anti-spam HoneypotField component
│   │   │   └── HoneypotField.tsx
│   │   ├── onboarding/           # Onboarding slide illustrations
│   │   │   └── OnboardingIllustrations.tsx
│   │   └── ui/                   # Reusable themed UI components
│   │       ├── AppSplashScreen.tsx
│   │       ├── BrandLogo.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── DateField.tsx
│   │       ├── EmergencySosModal.tsx
│   │       ├── EmergencyTripCard.tsx
│   │       ├── FullScreenMapPicker.tsx
│   │       ├── LocationPickerModal.tsx
│   │       ├── ManAvatarIllustration.tsx
│   │       ├── MapPinBrandBadge.tsx
│   │       ├── OtpInput.tsx
│   │       ├── PasswordField.tsx
│   │       ├── RemoteImage.tsx
│   │       ├── Screen.tsx
│   │       ├── SectionHeader.tsx
│   │       ├── SegmentedControl.tsx
│   │       ├── SignupHeroIllustration.tsx
│   │       ├── SlideDrawerModal.tsx
│   │       ├── SocialAuthButtons.tsx
│   │       ├── Stepper.tsx
│   │       ├── SuccessModal.tsx
│   │       ├── TextField.tsx
│   │       ├── ThemeModeSelector.tsx
│   │       ├── ThemeToggle.tsx
│   │       ├── TimePickerField.tsx
│   │       └── VoucherQrCode.tsx
│   ├── constants/
│   │   ├── contact.ts            # Phone, WhatsApp, email, and address constants
│   │   ├── nepalLocations.ts     # 77 districts, tourist hubs, airports, highways
│   │   ├── validation.ts         # Validation rules and error strings
│   │   └── vehicles.ts           # Vehicle type IDs and mappings
│   ├── context/
│   │   └── AuthContext.tsx       # Auth provider with secure storage persistence
│   ├── hooks/
│   │   └── useNetworkStatus.ts   # Network connectivity listener
│   ├── navigation/
│   │   ├── AppNavigator.tsx      # Bottom tabs & stack navigators
│   │   ├── booking.ts            # Cross-screen booking navigation helpers
│   │   ├── navigationRef.ts      # Global navigation reference
│   │   └── types.ts              # React Navigation param lists
│   ├── screens/                  # 7 production screens
│   │   ├── AuthScreen.tsx        # SignIn, SignUp, and OTP reset
│   │   ├── BookingScreen.tsx     # Comprehensive booking engine with map picker
│   │   ├── ContactScreen.tsx     # 24/7 hotline, WhatsApp, and support
│   │   ├── HomeScreen.tsx        # Hero greeting, service selection, theme toggle
│   │   ├── MyTripsScreen.tsx     # Active/past reservations, QR voucher & PDF export
│   │   ├── OnboardingScreen.tsx  # First-launch onboarding walkthrough
│   │   └── ProfileScreen.tsx     # User profile, statistics, settings, theme toggle
│   ├── theme/
│   │   ├── ThemeProvider.tsx     # Theme context & hook
│   │   ├── colors.ts             # Light & Dark color palettes
│   │   ├── spacing.ts            # Radius and spacing tokens
│   │   ├── typography.ts         # Font size and weight definitions
│   │   └── useThemedStyles.ts    # Hook for dynamic stylesheet evaluation
│   ├── types/
│   │   ├── api.ts                # DTOs for bookings, vouchers, trips
│   │   └── auth.ts               # DTOs for auth, users, and tokens
│   └── utils/
│       ├── dates.ts              # Date formatting and comparison
│       ├── errors.ts             # Axios and runtime error extractors
│       ├── geocoding.ts          # Free OSM reverse geocoding & fallback coordinates
│       ├── haptics.ts            # Tactile feedback helpers
│       ├── offlineVoucherStorage.ts # Offline trip voucher storage
│       ├── onboardingStorage.ts  # Onboarding seen/completed persistent flag
│       ├── pdfGenerator.ts       # PDF receipt creation and sharing
│       ├── phone.ts              # Nepal phone number sanitization and checks
│       ├── recentSearchesStorage.ts # Recents location search history
│       └── secureStorage.ts      # Hardware encrypted credential storage
├── __tests__/                    # Client unit & integration test suites (10 suites / 58 tests)
│   ├── AuthFlow.test.tsx         # Auth & OTP interaction tests
│   ├── BookingScreen.test.tsx    # Booking form submission tests
│   ├── BrandLogoAndSplash.test.tsx # Brand assets and splash rendering tests
│   ├── GeocodingAndMapPicker.test.tsx # OSM Geocoding & coordinate tests
│   ├── HomeScreen.test.tsx       # Hero greeting, theme toggle, and services
│   ├── LocationPicker.test.tsx   # Landmark selector & filtering tests
│   ├── Onboarding.test.tsx       # First-launch onboarding walkthrough tests
│   ├── ProfileScreen.test.tsx    # User profile interactions & auth gate tests
│   └── RecentSearches.test.tsx   # Search caching & eviction tests
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

1. **Encrypted Offline Vouchers**: Confirmed trip vouchers are cached in local storage and accessible offline anytime.
2. **Offline QR Code Ticket**: Passengers can present high-contrast QR codes at checkpoints for instant verification.
3. **GPS Emergency SOS**: Captures latitude/longitude from GPS satellites and generates pre-filled emergency SMS messages to rescue hotlines (`+977 985-1363783`) and Tourist Police (`1144`).
4. **Offline Location Lookup**: 77 Nepal districts and landmarks bundled locally in `nepalLocations.ts` with reverse geocoding fallback in `geocoding.ts`.
5. **Offline Action Queue**: Mutations queued locally in `offlineQueue.ts` and synced when connection restores.

👉 *Read the full guide in [`docs/OFFLINE_AND_RESILIENCE.md`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/docs/OFFLINE_AND_RESILIENCE.md).*

---

## 🔌 Backend API Reference

Base URL (Development): `http://localhost:8787` (or LAN IP for physical mobile devices)

| Method | Endpoint | Description | Headers / Body | Response |
|---|---|---|---|---|
| `GET` | `/health` | Server and PostgreSQL health check | — | `{ "status": "online", "database": "connected" }` |
| `GET` | `/api/bookings` | Fetch active trip reservations with vehicle assignment | `?userId=` or `?phoneNumber=` | `{ "bookings": [...] }` |
| `POST` | `/api/bookings` | Submit new booking with Idempotency | `X-Idempotency-Key`, `BookingEntryDto` | `{ "message": "Booking submitted successfully", "bookingRef": "..." }` |
| `PUT` | `/api/users/profile` | Update user profile details | `{ userId, fullName, phone, avatarUrl }` | `{ "success": true }` |
| `POST` | `/api/users/push-token` | Register Expo push token | `{ pushToken, customerId, phoneNumber }` | `{ "success": true }` |
| `POST` | `/api/auth/login` | User login (email or phone) | `{ identifier, password }` | `{ user, token, message }` |
| `POST` | `/api/auth/register`| User registration | `{ name, email, phone, password }` | `{ user, token, message }` |
| `POST` | `/api/auth/forgot-password` | Send 6-digit OTP code | `{ identifier }` | `{ message, code }` |
| `POST` | `/api/auth/reset-password` | Reset password via OTP | `{ identifier, code, newPassword }` | `{ message }` |

👉 *Read the full API reference in [`server/README.md`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/server/README.md).*

---

## 🗄 Database Schema & Migration Rules

> [!IMPORTANT]
> **Strict Database Management Rules**:
> 1. **Base Schema**: Always maintain and update the master schema in [`database/database.sql`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/database.sql).
> 2. **Patches Folder**: For any pending database alterations, create a new numbered patch inside [`database/patches/`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/patches/) (e.g. `001_...`, `002_...`).
> 3. **Execution Constraint**: **NEVER** run SQL queries directly on live production/staging databases. Migrations are executed manually by database administrators.

👉 *Read the full database documentation in [`database/README.md`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/README.md).*

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

## 🧪 Testing & Quality Verification (116 Tests)

Run the automated test suites and static analysis tools:

```bash
# 1. Client & Server TypeScript Typecheck
npm run typecheck
npm run typecheck --prefix server

# 2. Client Jest Unit & Integration Tests (10 Suites / 58 Tests)
npm test

# 3. Server Jest Validation & Endpoint Tests (3 Suites / 58 Tests)
npm test --prefix server
```

---

## 📦 Building with EAS (Android & iOS)

Pre-configured EAS profiles in [`eas.json`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/eas.json):

```bash
# 1. Internal Development Client
npx eas-cli build --profile development --platform android

# 2. Standalone Preview APK (Direct install on Android phones)
npx eas-cli build --profile preview --platform android

# 3. Production Android App Bundle (.aab for Google Play Store)
npx eas-cli build --profile production --platform android
```

👉 *Read the full build and release guide in [`docs/DEPLOYMENT.md`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/docs/DEPLOYMENT.md).*

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

1. **Honeypot Bot Protection**: Hidden field `website_hp` filters automated bots from booking forms.
2. **Strict Nepal Phone Regex**: Pattern `/^(?:977)?(9[78]\d{8}|0[1-9]\d{7})$/` validates standard mobile (`98XXXXXXXX`, `97XXXXXXXX`) and regional landlines (`01XXXXXXX`).
3. **Idempotency Keys**: Generates SHA-256 request hashes and checks `dka_idempotency_keys` to prevent accidental double-bookings on flaky connections.
4. **Encrypted Secure Storage**: User tokens and biometrics are stored via `expo-secure-store` hardware encryption.
5. **Database RLS Safety**: All database interactions use `SET LOCAL app.is_admin = 'false'` to isolate public requests.
6. **Parameterized SQL Queries**: All queries use `$1, $2, ...` positional parameterization to eliminate SQL injection vulnerabilities.

---

## 📚 Comprehensive Documentation Index

| Document | Purpose |
|---|---|
| [System Architecture](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/docs/ARCHITECTURE.md) | Detailed architectural blueprint, topology, mapping engine, and security models |
| [Himalayan Offline Strategy](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/docs/OFFLINE_AND_RESILIENCE.md) | In-depth guide to offline vouchers, QR tickets, geocoding fallback, and GPS SOS |
| [Deployment & Operations](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/docs/DEPLOYMENT.md) | EAS build guide, server setup, PM2, Docker, and CI/CD |
| [Server API Documentation](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/server/README.md) | Complete Hono REST API reference with JSON payloads |
| [Database Management Guide](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/README.md) | PostgreSQL table definitions, procedures, and migration rules |
| [Contributing Guidelines](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/CONTRIBUTING.md) | Coding conventions, PR checklists, and developer setup |
| [Agent Guidelines](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/AGENTS.md) | Operational guidelines for AI coding assistants |
| [CLI Quick Reference](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/CLAUDE.md) | Rapid command cheatsheet |

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
| `npm test` | `jest` | Runs client unit and integration test suites (10 suites / 58 tests) |

---

## 📄 License & Credits

- **Copyright © 2026 Drive Kendra** — Nepal Car Rental & Tour Transport.
- **Headquarters**: Duwakot, Bhaktapur / Kathmandu, Nepal.
- **Dispatch**: `+977 985-1363783` • `info@drivekendra.com` • [drivekendra.com](https://drivekendra.com)
