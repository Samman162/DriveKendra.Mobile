# 🤝 Contributing to Drive Kendra Mobile

Thank you for your interest in contributing to **Drive Kendra Mobile**! We welcome contributions to improve features, stability, documentation, and user experience.

Please review this guide before submitting pull requests or making modifications.

---

## 📑 Table of Contents

- [Core Principles & Rules](#-core-principles--rules)
- [Development Setup](#-development-setup)
- [Code Style & Standards](#-code-style--standards)
- [Database Modification Protocol](#-database-modification-protocol)
- [Testing & Quality Verification](#-testing--quality-verification)
- [Commit & Pull Request Guidelines](#-commit--pull-request-guidelines)

---

## ⚠️ Core Principles & Rules

> [!IMPORTANT]
> 1. **Expo SDK Version**: This project runs on **Expo SDK 57**. Always refer to the exact versioned documentation at [https://docs.expo.dev/versions/v57.0.0/](https://docs.expo.dev/versions/v57.0.0/) before introducing native modules or altering configurations.
> 2. **Database Management Rules**:
>    - Maintain the complete base schema in [`database/database.sql`](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/database/database.sql).
>    - Create new sequential patch files in [`database/patches/`](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/database/patches/) (e.g. `003_add_xyz_table.sql`).
>    - **NEVER** run SQL queries directly on live databases. Migrations must be manually applied by administrators.
> 3. **Theming Architecture**: Always use `useThemedStyles` and tokens from `src/theme/` to support both Light and Dark themes.

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

- **TypeScript**: Strict mode is enabled. Avoid `any` types wherever possible; use explicit interfaces and types from `src/types/`.
- **Component Architecture**:
  - Reusable UI primitives belong in `src/components/ui/`.
  - Feature-specific screens belong in `src/screens/`.
  - API communication logic belongs in `src/api/`.
- **Theming**:
  - Never hardcode color hex codes (e.g. `#FFFFFF` or `#000000`) inside screen styles. Use `theme.colors.*` values.
  - Utilize `src/theme/spacing.ts` and `src/theme/typography.ts` tokens for consistency.
- **Haptic Feedback**: Integrate subtle haptic feedback using `src/utils/haptics.ts` on primary user interactions.

---

## 🗄 Database Modification Protocol

If your feature requires schema additions or alterations:
1. Update the base schema in [`database/database.sql`](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/database/database.sql).
2. Create a new patch file in [`database/patches/`](file:///c:/Users/Lenovo/OneDrive/Desktop/DriveKendra/DriveKendra.Mobile/database/patches/) with standard naming:
   ```
   database/patches/003_your_feature_name.sql
   ```
3. Use `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` clauses to ensure idempotency.

---

## 🧪 Testing & Quality Verification

Before committing changes, ensure that all automated quality checks pass:

### 1. TypeScript Static Typecheck
```bash
npm run typecheck
npm run typecheck --prefix server
```

### 2. Unit Test Suites
```bash
npm test
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
- [ ] All unit test suites pass (`npm test` and `npm test --prefix server`).
- [ ] Light and Dark theme visuals look crisp and accessible.
- [ ] Any database alterations include both `database/database.sql` updates and a new numbered patch in `database/patches/`.
- [ ] No hardcoded API secrets or live production credentials in commit history.
