# CLAUDE.md - Drive Kendra Mobile Assistant Guide

@AGENTS.md

## 🚀 Quick Command Reference

### Development
```bash
# Start both Hono API + Expo Metro bundler concurrently
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

### Static Analysis & Testing
```bash
# Static TypeScript typecheck (Client & Server)
npm run typecheck
npm run typecheck --prefix server

# Run Jest unit tests
npm test
npm test --prefix server
```

### Building & Packaging
```bash
# Build standalone preview APK for Android
npx eas-cli build --profile preview --platform android

# Build production release AAB for Google Play Store
npx eas-cli build --profile production --platform android
```

---

## 🏛 Core Guidelines & Architecture Rules

1. **Expo SDK 57**: Read the versioned docs at [https://docs.expo.dev/versions/v57.0.0/](https://docs.expo.dev/versions/v57.0.0/) before adding or configuring native modules.
2. **Database Management**:
   - Maintain the complete base schema in [`database/database.sql`](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/database/database.sql).
   - Add incremental changes as numbered patches in [`database/patches/`](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/database/patches/).
   - **NEVER** run SQL queries directly on live databases.
3. **Theming**: Use `useThemedStyles` hook with tokens from `src/theme/` to support dynamic Light and Dark modes.
4. **Himalayan Offline Resilience**: Use `offlineVoucherStorage`, `offlineQueue`, `EmergencyTripCard` (GPS offline SOS), and `rateCategories.generated.ts` for off-grid resilience.
5. **Push Notifications**: Expo Server SDK + FCM v1 in `server/src/services/notifications.ts`, registered via `/api/users/push-token` and managed in `src/hooks/usePushNotifications.ts`.

---

## 📚 Specialized Documentation
- [Root Readme](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/README.md)
- [Server API Guide](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/server/README.md)
- [Database Schema Guide](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/database/README.md)
- [System Architecture](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/docs/ARCHITECTURE.md)
- [Offline Resilience Guide](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/docs/OFFLINE_AND_RESILIENCE.md)
- [Push Notification Pipeline](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/docs/PUSH_NOTIFICATIONS.md)
- [Deployment Guide](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/docs/DEPLOYMENT.md)
- [Contributing Guide](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/CONTRIBUTING.md)
