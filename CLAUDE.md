# CLAUDE.md - Drive Kendra Mobile Assistant Guide

@AGENTS.md

## 🚀 Quick Command Reference

### Development
```bash
# Start both Hono API + Expo Metro bundler concurrently (recommended)
npm run dev

# Start Expo bundler alone (Expo Go)
npm start

# Start Hono API server alone in watch mode
npm run server

# Platform-specific starters
npm run android
npm run ios
npm run web
```

### Static Analysis & Testing (90 Automated Tests)
```bash
# Static TypeScript typecheck (Client & Server)
npm run typecheck
npm run typecheck --prefix server

# Run all Jest test suites (Client: 9 suites / 54 tests, Server: 2 suites / 36 tests - 90 Total)
npm test
npm test --prefix server

# Run specific client test suites (9 Suites)
npx jest __tests__/HomeScreen.test.tsx
npx jest __tests__/BookingScreen.test.tsx
npx jest __tests__/AuthFlow.test.tsx
npx jest __tests__/LocationPicker.test.tsx
npx jest __tests__/GeocodingAndMapPicker.test.tsx
npx jest __tests__/Onboarding.test.tsx
npx jest __tests__/RecentSearches.test.tsx
npx jest __tests__/BrandLogoAndSplash.test.tsx
npx jest __tests__/ProfileScreen.test.tsx

# Run specific server test suites (2 Suites)
npm test --prefix server -- __tests__/validation.test.ts
npm test --prefix server -- __tests__/apiEndpoints.test.ts
```

### Building & Packaging (EAS CLI)
```bash
# Build internal development client for on-device native debugging
npx eas-cli build --profile development --platform android

# Build standalone preview APK for Android beta testing (direct install)
npx eas-cli build --profile preview --platform android

# Build production release AAB for Google Play Store
npx eas-cli build --profile production --platform android
```

---

## 🏛 Core Guidelines & Architecture Rules

1. **Expo SDK 57**: Read the versioned docs at [https://docs.expo.dev/versions/v57.0.0/](https://docs.expo.dev/versions/v57.0.0/) before adding or configuring native modules.
2. **Database Management**:
   - Maintain the complete base schema in [`database/database.sql`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/database.sql).
   - Add incremental changes as numbered patches in [`database/patches/`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/patches/).
   - **NEVER** run SQL queries directly on live databases.
3. **Interactive OpenStreetMap (OSM) Map Picking**:
   - Use `FullScreenMapPicker.tsx` (Leaflet OSM via `react-native-webview` on mobile and `iframe` on web).
   - Zero third-party API key costs. Use `geocoding.ts` for Nominatim reverse geocoding with fallback to `nepalLocations.ts`.
4. **Theming**:
   - Always wrap styles with `useThemedStyles((theme) => StyleSheet.create({ ... }))`.
   - Use color tokens (`theme.colors.*`), spacing tokens (`theme.spacing.*`), and typography constants (`src/theme/typography.ts`) for dynamic Light and Dark modes.
5. **Himalayan Offline Resilience**:
   - Use `offlineVoucherStorage`, `offlineQueue`, `EmergencyTripCard` (GPS offline SOS), `EmergencySosModal`, `VoucherQrCode`, and bundled location database (`nepalLocations.ts`) for off-grid resilience.
6. **Form Validation & Anti-Spam**:
   - All booking forms must pass honeypots (`website_hp`) and validate Nepal phone numbers (`+977 98/97` or `01XXXXXXX`).

---

## 📚 Specialized Documentation
- [Main Readme](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/README.md)
- [Server API Guide](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/server/README.md)
- [Database Schema Guide](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/README.md)
- [System Architecture](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/docs/ARCHITECTURE.md)
- [Offline Resilience Guide](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/docs/OFFLINE_AND_RESILIENCE.md)
- [Deployment Guide](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/docs/DEPLOYMENT.md)
- [Contributing Guide](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/CONTRIBUTING.md)
