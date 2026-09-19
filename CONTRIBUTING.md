# 🤝 Contributing to Drive Kendra Mobile

Thank you for your interest in contributing to **Drive Kendra Mobile**! We welcome contributions to improve features, stability, documentation, offline resilience, and user experience.

Please review this guide before submitting pull requests or making modifications.

---

## 📑 Table of Contents

- [Core Principles & Rules](#-core-principles--rules)
- [Development Setup](#-development-setup)
- [Code Style & Standards](#-code-style--standards)
- [Interactive Map & Location Standards](#-interactive-map--location-standards)
- [Database Modification Protocol](#-database-modification-protocol)
- [Testing & Quality Verification](#-testing--quality-verification)
- [Commit & Pull Request Guidelines](#-commit--pull-request-guidelines)

---


## ⚠️ Core Principles & Rules

> [!IMPORTANT]
> 1. **Expo SDK Version**: This project runs on **Expo SDK 57** (React Native 0.86.3, React 19.2.3). Always refer to the exact versioned documentation at [https://docs.expo.dev/versions/v57.0.0/](https://docs.expo.dev/versions/v57.0.0/) before introducing native modules or altering configurations.
> 2. **Database Management Rules**:
>    - Maintain the complete base schema in [`database/database.sql`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/database.sql).
>    - Maintain the partner fleet schema in [`database/cr_database.sql`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/cr_database.sql).
>    - Create new sequential patch files in [`database/patches/`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/patches/) (patches `001`-`009` are consolidated into `database.sql`; new patches start at `010_your_feature.sql`).
>    - **NEVER** run SQL queries directly on live databases. Migrations must be manually applied by administrators.
> 3. **Theming Architecture**: Always use `useThemedStyles` and design tokens from `src/theme/` (`colors.ts`, `spacing.ts`, `typography.ts`) to support both Light and Dark themes.
> 4. **Production UX Hardening & App Store Compliance**:
>    - Support Apple Guideline 5.1.1(v) account deletion via `DELETE /api/users/account` and in-app Profile screen confirmation.
>    - Provide customer self-service cancellation for pending bookings via `PATCH /api/bookings/:id/cancel`.
>    - Provide in-screen biometric unlock cards with instant PIN/OTP fallback.
>    - Gate demo credentials and administrative direct links behind `__DEV__`.

---

## 💻 Development Setup

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **npm** or **yarn**
- **Expo Go** on your test device OR **Android Studio** emulator / **iOS Simulator** (macOS)
- Local or cloud **PostgreSQL 15+** database

### 2. Quick Setup
```bash
# Clone the repository
git clone https://github.com/Samman162/DriveKendra.Mobile.git
cd DriveKendra.Mobile

# Install client dependencies
npm install

# Install server dependencies
npm install --prefix server

# Copy environment templates
cp .env.example .env
cp server/.env.example server/.env

# Start both API server and Expo app concurrently
npm run dev
```

---

## 🎨 Code Style & Standards

- **TypeScript**: Strict mode is enabled (`tsconfig.json`). Avoid `any` types; use explicit interfaces and DTOs from `src/types/`.
- **Component Architecture**:
  - Reusable UI primitives and modals belong in `src/components/ui/` (including `CustomerNotificationsModal.tsx` for traveler alerts).
  - Feature-specific screens belong in `src/screens/`:
    - 7 Customer Screens:
      - `HomeScreen`: Hero greeting, booking search bar, road advisories, and notification center bell.
      - `BookingScreen`: Comprehensive reservation form with map pin picker, honeypot traps, and idempotency protection.
      - `MyTripsScreen`: Active/past trip cards, offline QR vouchers, customer self-service cancellation for pending bookings, and network error retry banner.
      - `ProfileScreen`: User profile, theme toggle, biometrics toggle, and Apple Guideline 5.1.1(v) account deletion flow.
      - `AuthScreen`: Sign In, Sign Up, OTP reset, in-screen biometric unlock card with PIN fallback, and `__DEV__`-gated demo credentials.
      - `OnboardingScreen`: First-launch walkthrough cards.
      - `ContactScreen`: 24/7 hotline, WhatsApp, and email assistance.
    - 3 Admin Portal Screens (`src/screens/admin/`): `AdminLoginScreen`, `AdminPinScreen`, `AdminDashboardScreen` (featuring Dispatch Desk with automated driver-vehicle pairing and agreed fare confirmation, Drivers Directory, Vehicle Fleet, Users Directory, Profile, and `AdminNotificationsModal.tsx`) rendered exclusively inside `AdminNavigator`.
  - Services belong in `src/services/` (e.g. `notificationService.ts` for Expo Push Notifications and permissions).
  - API communication logic belongs in `src/api/` (Client) and `server/src/routes/` (Backend: `auth.ts`, `bookings.ts` with `PATCH /:id/cancel`, `users.ts` with `DELETE /account`, `admin.ts`, plus `push.ts` dispatcher).
  - Offline resilience & geocoding utilities belong in `src/utils/` and `src/constants/`.
- **Theming**:
  - Never hardcode color hex codes (e.g. `#FFFFFF` or `#0F172A`) inside screen styles. Use `theme.colors.*` values.
  - Utilize `src/theme/spacing.ts` and `src/theme/typography.ts` tokens for consistency.
- **Haptic Feedback**: Integrate tactile feedback using `src/utils/haptics.ts` on primary user interactions.
- **Anti-Spam & Validation**: Include honeypot fields (`website_hp`), debounce duplicate submissions, and validate Nepal phone numbers (`+977 98/97` or `01XXXXXXX`) on all form submissions.

---

## 🗺️ Interactive Map & Location Standards

- All interactive map views must use the zero-cost OpenStreetMap (OSM) / Leaflet architecture (`FullScreenMapPicker.tsx`).
- Do not introduce Google Maps API keys or third-party proprietary mapping SDKs.
- Address resolution must use `src/utils/geocoding.ts` (OSM Nominatim) with offline fallback to `src/constants/nepalLocations.ts`.
- When location permissions are denied, provide direct deep-linking to system settings via `Linking.openSettings()`.

---

## 🗄 Database Modification Protocol

If your feature requires schema additions or alterations:
1. Update the base schema in [`database/database.sql`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/database.sql).
2. If modifying partner fleet structures, also update [`database/cr_database.sql`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/cr_database.sql).
3. Create a new patch file in [`database/patches/`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/patches/) with standard naming:
   ```
   database/patches/010_your_feature_name.sql
   ```
4. Use `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` clauses to ensure idempotency.
5. Once verified and applied to production/staging, delete the applied patch file to keep `database/patches/` clean.

---

## 🧪 Testing & Quality Verification

Before committing changes, ensure that all automated quality checks pass:

### 1. TypeScript Static Typecheck
```bash
npm run typecheck
npm run typecheck --prefix server
```

### 2. Unit & Integration Test Suites (146 Total Tests)
```bash
# Client test suites (12 suites / 71 tests: AdminFlow, AuthFlow, BookingScreen, BrandLogoAndSplash, GeocodingAndMapPicker, HomeScreen, LocationPicker, MyTripsConfirmationFlow, NotificationsFlow, Onboarding, ProfileScreen, RecentSearches)
npm test

# Server test suites (4 suites / 75 tests: validation schemas, phone regex, honeypot, apiEndpoints, fullTripLifecycleE2E, and adminEndpoints)
npm test --prefix server
```

---

## 🚀 Commit & Pull Request Guidelines

### Commit Message Format
Use standard conventional commit prefixes:
- `feat:` New feature or capability
- `fix:` Bug fix or patch
- `docs:` Documentation updates or additions
- `refactor:` Code refactoring without functionality changes
- `test:` Adding or updating tests
- `chore:` Dependency bumps, build configs, or maintenance

### Pull Request Checklist
- [ ] Code passes both client and server `npm run typecheck`.
- [ ] All 146 automated tests pass (`npm test` and `npm test --prefix server`).
- [ ] Light and Dark theme visuals look crisp, accessible, and responsive.
- [ ] Any database alterations include both `database/database.sql` updates and a new numbered patch in `database/patches/`.
- [ ] Offline failover behaviors have been verified (e.g. offline trip vouchers, geocoding fallback, emergency SMS dispatch, in-screen network retry banners).
- [ ] App Store compliance verified (Apple Guideline 5.1.1(v) account deletion, self-service cancellation, biometric recovery).
- [ ] No hardcoded API secrets or live production credentials in commit history (`__DEV__` gated).

