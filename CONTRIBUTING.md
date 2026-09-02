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
> 1. **Expo SDK Version**: This project runs on **Expo SDK 57** (React Native 0.86.2, React 19.2.3). Always refer to the exact versioned documentation at [https://docs.expo.dev/versions/v57.0.0/](https://docs.expo.dev/versions/v57.0.0/) before introducing native modules or altering configurations.
> 2. **Database Management Rules**:
>    - Maintain the complete base schema in [`database/database.sql`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/database.sql).
>    - Create new sequential patch files in [`database/patches/`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/patches/) (e.g. `002_add_xyz_table.sql`).
>    - **NEVER** run SQL queries directly on live databases. Migrations must be manually applied by administrators.
> 3. **Theming Architecture**: Always use `useThemedStyles` and design tokens from `src/theme/` (`colors.ts`, `spacing.ts`, `typography.ts`) to support both Light and Dark themes.

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
  - Reusable UI primitives belong in `src/components/ui/`.
  - Feature-specific screens belong in `src/screens/` (7 core screens: `HomeScreen`, `BookingScreen`, `MyTripsScreen`, `ProfileScreen`, `AuthScreen`, `OnboardingScreen`, `ContactScreen`).
  - API communication logic belongs in `src/api/`.
  - Offline resilience & geocoding utilities belong in `src/utils/` and `src/constants/`.
- **Theming**:
  - Never hardcode color hex codes (e.g. `#FFFFFF` or `#0F172A`) inside screen styles. Use `theme.colors.*` values.
  - Utilize `src/theme/spacing.ts` and `src/theme/typography.ts` tokens for consistency.
- **Haptic Feedback**: Integrate tactile feedback using `src/utils/haptics.ts` on primary user interactions.
- **Anti-Spam & Validation**: Include honeypot fields (`website_hp`) and validate Nepal phone numbers (`+977 98/97` or `01XXXXXXX`) on all form submissions.

---

## 🗺️ Interactive Map & Location Standards

- All interactive map views must use the zero-cost OpenStreetMap (OSM) / Leaflet architecture (`FullScreenMapPicker.tsx`).
- Do not introduce Google Maps API keys or third-party proprietary mapping SDKs.
- Address resolution must use `src/utils/geocoding.ts` (OSM Nominatim) with offline fallback to `src/constants/nepalLocations.ts`.

---

## 🗄 Database Modification Protocol

If your feature requires schema additions or alterations:
1. Update the base schema in [`database/database.sql`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/database.sql).
2. Create a new patch file in [`database/patches/`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/patches/) with standard naming:
   ```
   database/patches/002_your_feature_name.sql
   ```
3. Use `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` clauses to ensure idempotency.
4. Once verified and applied to production/staging, delete the applied patch file to keep `database/patches/` clean.

---

## 🧪 Testing & Quality Verification

Before committing changes, ensure that all automated quality checks pass:

### 1. TypeScript Static Typecheck
```bash
npm run typecheck
npm run typecheck --prefix server
```

### 2. Unit Test Suites (53 Total Tests)
```bash
# Client test suites (8 suites / 42 tests: AuthFlow, BookingScreen, BrandLogoAndSplash, GeocodingAndMapPicker, LocationPicker, Onboarding, ProfileScreen, RecentSearches)
npm test

# Server test suite (1 suite / 11 tests: validation, regex, and honeypot)
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
- [ ] All 53 automated tests pass (`npm test` and `npm test --prefix server`).
- [ ] Light and Dark theme visuals look crisp, accessible, and responsive.
- [ ] Any database alterations include both `database/database.sql` updates and a new numbered patch in `database/patches/`.
- [ ] Offline failover behaviors have been verified (e.g. offline trip vouchers, geocoding fallback, emergency SMS dispatch).
- [ ] No hardcoded API secrets or live production credentials in commit history.
