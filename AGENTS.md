# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Database Management Rules

1. **Base Schema**: Always maintain and update the complete base database schema, tables, indexes, and functions in [`database/database.sql`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/database.sql) as the single canonical source of truth (written cleanly with full DDL definitions, not appended migration commands).
2. **Patches Folder**: For pending database updates, alterations, or incremental changes, create a new numbered patch file inside [`database/patches/`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/patches/) (patches `001`-`009` are consolidated into `database.sql`; new patches start at `010_your_feature.sql`).
3. **Patch Consolidation & Cleanup**: Once patches are applied by the administrator/developer to the target database and confirmed in [`database/database.sql`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/database.sql), delete the applied patch files from `database/patches/`.
4. **Execution Constraint**: **NEVER** run SQL queries directly on any live database yourself. Only produce the SQL files in `database/database.sql` and `database/patches/` for manual or administrator application.

---

# 🤖 Agent Coding Guidelines for Drive Kendra Mobile

This document outlines key technical guidelines, architectural patterns, and quality gates for AI agents operating in this repository.

---

## 🏛 Codebase Overview & Structure

Drive Kendra Mobile is a production-grade cross-platform mobile application for vehicle rentals and Himalayan tour expeditions in Nepal.

- **Mobile Client (`src/`)**: Built with React Native 0.86.3, Expo SDK 57, React 19.2.3, TypeScript strict mode, React Navigation v7 (4-tab bottom navigation + stack modal screens), and an isolated 2FA-secured Admin Portal (`AdminNavigator`).
- **Backend API (`server/`)**: Built with Hono v4, Node.js (`tsx watch`), Zod v4 validation, and `pg` PostgreSQL connection pool.
- **Database (`database/`)**: PostgreSQL 15+ canonical schema in [`database/database.sql`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/database.sql) and incremental patches in [`database/patches/`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/patches/).
- **Documentation (`docs/`)**: In-depth subsystem guides for Architecture, Offline Resilience, and Deployment.

---

## 🎯 Golden Rules for Code Generation

1. **Expo SDK 57 Compliance**:
   - Always verify APIs against Expo SDK 57 documentation.
   - Do not import deprecated or uninstalled Expo packages.
2. **Database Changes**:
   - When introducing new database columns or tables, modify [`database/database.sql`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/database.sql) AND create a new sequential file in [`database/patches/`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/patches/) (e.g. `010_your_feature.sql`).
   - Never execute queries on live databases.
3. **Theming & Design Tokens**:
   - Never use hardcoded hex colors or inline static color strings in screen styles.
   - Always wrap styles using `useThemedStyles((theme) => StyleSheet.create({ ... }))`.
   - Use color tokens (`theme.colors.*`), spacing tokens (`theme.spacing.*`), and typography constants (`src/theme/typography.ts`).
4. **TypeScript Discipline**:
   - Maintain 100% strict type safety.
   - Avoid `any` types. Utilize dedicated DTO types from `src/types/api.ts` and `src/types/auth.ts`.
5. **Interactive Mapping & Free Geocoding**:
   - Use OpenStreetMap / Leaflet via `FullScreenMapPicker.tsx` (using `react-native-webview` for mobile and `iframe` for web).
   - Never introduce paid or proprietary map SDK dependencies (e.g. Google Maps API keys).
   - Use `src/utils/geocoding.ts` for reverse geocoding via OSM Nominatim with fallback to `src/constants/nepalLocations.ts`.
6. **Himalayan Resilience & Offline Handling**:
   - All booking forms must pass honeypots (`website_hp`) and validate Nepal phone numbers (`+977 98/97` or `01XXXXXXX`).
   - Use `offlineVoucherStorage.ts` when persisting trip vouchers for off-grid access.
   - Use `offlineQueue.ts` for handling network disruptions during mutating operations.
   - Use `EmergencyTripCard.tsx` and `EmergencySosModal.tsx` for GPS emergency SOS dispatch to the 24/7 hotline (`+977 985-1363783`) and Tourist Police (`1144`).
7. **Strict Admin Stack Isolation & Dispatch Desk Workflow**:
   - Admin sessions (`role === 'admin'`) must render exclusively inside `AdminNavigator` (`AdminPinGate`, `AdminDashboardScreen` featuring Dispatch Desk, Drivers Directory, Vehicle Fleet, Users Directory, and Profile tabs). Admins must never see customer tabs or screens.
   - In the Dispatch Desk, selecting a verified partner driver automatically pairs and verifies their registered fleet vehicle, displays the vehicle specifications banner (plate, model, capacity), allows entering the final confirmed fare (`final_fare` in NPR), and atomically approves the expedition reservation.
   - Administrative endpoints in `server/src/routes/admin.ts` require 2FA authentication (credentials + 4-digit PIN) and set PostgreSQL RLS session `SET LOCAL app.is_admin = 'true'`.
8. **Owner, Driver & Vehicle Bidirectional Synchronization**:
   - Maintain strict bidirectional synchronization between `cr_owners` and `dka_owners` via PostgreSQL triggers (`sync_cr_to_dka_owners` / `sync_dka_to_cr_owners`), and between `cr_vehicles` and `dka_vehicles` via triggers (`sync_cr_vehicles_to_dka_vehicles` / `sync_dka_vehicles_to_cr_vehicles`), protected with `pg_trigger_depth() > 1` recursion guard.
   - Driver listings access the unified `cr_drivers` view and `/api/admin/drivers` endpoints. Adding a driver also assigns and registers their vehicle (`dka_vehicles`) in the same unified workflow.
9. **Real-Time Push Notifications & Notification Center**:
   - Manage push tokens via `src/services/notificationService.ts` and register devices via `POST /api/users/push-token`.
   - Dispatch real-time lifecycle alerts for booking submissions, driver/vehicle assignments, trip rejections, and completions using `recordAndPushTripNotification` (`server/src/push.ts`).
   - Maintain customer (`CustomerNotificationsModal.tsx`) and admin (`AdminNotificationsModal.tsx`) notification centers backed by `dka_notifications` and `dka_push_tokens`.

---

## 🧪 Verification Commands

Always run and verify these commands before concluding a task:

```bash
# 1. Check TypeScript compilation on both Client and Server
npm run typecheck
npm run typecheck --prefix server

# 2. Run automated test suites (12 Client Suites / 71 Tests, 4 Server Suites / 75 Tests - 146 Total)
npm test
npm test --prefix server
```

---

## 📚 Essential Documentation Links
- [Main README](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/README.md)
- [Server Guide](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/server/README.md)
- [Database Guide](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/README.md)
- [Architecture Blueprint](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/docs/ARCHITECTURE.md)
- [Himalayan Offline Strategy](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/docs/OFFLINE_AND_RESILIENCE.md)
- [Deployment & CI/CD Guide](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/docs/DEPLOYMENT.md)
- [Contributing Guidelines](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/CONTRIBUTING.md)
