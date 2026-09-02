# 🚀 Drive Kendra Mobile & API Deployment Guide

[![EAS Build](https://img.shields.io/badge/EAS-Build%20Ready-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/eas)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/Samman162/DriveKendra.Mobile)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)

This document describes how to deploy, build, release, and maintain the **Drive Kendra Mobile App**, the **Hono Backend API**, and the **PostgreSQL Database**.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [1. Mobile Application Build with EAS](#1-mobile-application-build-with-eas)
  - [EAS Configuration Profiles (`eas.json`)](#eas-configuration-profiles-easjson)
  - [Building Development Client](#building-development-client)
  - [Building Preview Standalone APK (Android)](#building-preview-standalone-apk-android)
  - [Building Production App Bundle (Google Play Store & iOS App Store)](#building-production-app-bundle-google-play-store--ios-app-store)
- [2. Backend API Deployment (`server/`)](#2-backend-api-deployment-server)
  - [Option A: Standalone Node.js with PM2 (Recommended)](#option-a-standalone-nodejs-with-pm2-recommended)
  - [Option B: Containerized Docker Deployment](#option-b-containerized-docker-deployment)
  - [Reverse Proxy & SSL Configuration (Nginx)](#reverse-proxy--ssl-configuration-nginx)
- [3. PostgreSQL Database Setup & Migrations](#3-postgresql-database-setup--migrations)
  - [Initial Database Provisioning](#initial-database-provisioning)
  - [Applying Sequential Patches](#applying-sequential-patches)
- [4. CI/CD Automation with GitHub Actions](#4-cicd-automation-with-github-actions)
- [5. Environment Secrets & Variables Checklist](#5-environment-secrets--variables-checklist)

---

## 🏗 Overview

The Drive Kendra deployment architecture consists of:
1. **Client**: Cross-platform React Native app distributed via Google Play Store / Apple TestFlight / Standalone APK.
2. **API**: Hono v4 REST server hosted on a cloud VPS (Ubuntu 22.04+ / Debian) behind Nginx with SSL.
3. **Database**: Managed PostgreSQL 15+ (e.g. AWS RDS, DigitalOcean, Neon, Supabase, or self-hosted).

---

## 1. Mobile Application Build with EAS

### EAS Configuration Profiles (`eas.json`)
The project includes predefined build profiles:

```json
{
  "cli": {
    "version": ">= 15.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

### Building Development Client
Creates a custom build including native modules for on-device debugging:
```bash
npx eas-cli build --profile development --platform android
```

### Building Preview Standalone APK (Android)
Generates a direct installable `.apk` file for beta testing without Expo Go:
```bash
npx eas-cli build --profile preview --platform android
```

### Building Production App Bundle (Google Play Store & iOS App Store)
Generates an optimized `.aab` for Android Google Play Store or IPA for iOS App Store:
```bash
# Android Production AAB
npx eas-cli build --profile production --platform android

# iOS Production Build (requires Apple Developer Program)
npx eas-cli build --profile production --platform ios
```

---

## 2. Backend API Deployment (`server/`)

### Option A: Standalone Node.js with PM2 (Recommended)

1. **Clone repo onto your Linux server**:
   ```bash
   git clone https://github.com/Samman162/DriveKendra.Mobile.git
   cd DriveKendra.Mobile/server
   ```

2. **Install production dependencies**:
   ```bash
   npm ci --omit=dev
   ```

3. **Configure production environment**:
   ```bash
   cp .env.example .env
   nano .env
   ```
   Set `DATABASE_URL` and `PORT=8787`.

4. **Launch with PM2 Process Manager**:
   ```bash
   npm install -g pm2 tsx
   pm2 start "npx tsx src/index.ts" --name "drivekendra-api"
   pm2 save
   pm2 startup
   ```

---

### Option B: Containerized Docker Deployment

Create a `Dockerfile` inside `server/`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src/ ./src/

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./

EXPOSE 8787
CMD ["npx", "tsx", "src/index.ts"]
```

Build and run:
```bash
docker build -t drivekendra-api .
docker run -d -p 8787:8787 --env-file .env --name dk-api drivekendra-api
```

---

### Reverse Proxy & SSL Configuration (Nginx)

Place behind Nginx with Let's Encrypt SSL:

```nginx
server {
    server_name api-mobile.drivekendra.com;

    location / {
        proxy_pass http://127.0.0.1:8787;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/api-mobile.drivekendra.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api-mobile.drivekendra.com/privkey.pem;
}
```

---

## 3. PostgreSQL Database Setup & Migrations

> [!WARNING]
> Remember the fundamental database rule: **NEVER run SQL queries directly from automated agents or unvetted scripts**. Always review and execute migrations manually.

### Initial Database Provisioning
Run the canonical base schema on your fresh database:
```bash
psql -U postgres -h <DB_HOST> -d car_rental_db -f database/database.sql
```

### Applying Sequential Patches
When pending patches exist in [`database/patches/`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/database/patches/), run patch files in ascending numeric order:
```bash
psql -U postgres -h <DB_HOST> -d car_rental_db -f database/patches/<patch_name>.sql
```
Once applied to all target environments and verified in `database.sql`, remove the applied patch file from `database/patches/`.

---

## 4. CI/CD Automation with GitHub Actions

The repository includes a fully configured workflow in [`.github/workflows/ci-cd.yml`](file:///c:/Users/Lenovo/Desktop/DriveKendra/DriveKendra.Mobile/.github/workflows/ci-cd.yml) that triggers on every push and pull request to `main` and `develop`:

1. **Static Analysis & Typechecking**:
   - `npm run typecheck` (Client TypeScript check)
   - `npm run typecheck --prefix server` (Server TypeScript check)
2. **Automated Unit & Integration Tests**:
   - `npm test` (Client Jest test suites - 8 suites / 42 tests)
   - `npm test --prefix server` (Server Jest test suites - 1 suite / 11 tests)
3. **EAS Build Verification**:
   - Verifies `eas.json` schema configuration on release branch commits.

---

## 5. Environment Secrets & Variables Checklist

| Variable Name | Scope | Description |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | Client (`.env`) | Base URL pointing to the Hono API (e.g. `https://api-mobile.drivekendra.com/api`) |
| `DATABASE_URL` | Server (`server/.env`)| PostgreSQL connection string |
| `PORT` | Server (`server/.env`)| Port number (default: `8787`) |
| `EXPO_ACCESS_TOKEN` | Server (`server/.env`)| Optional token for high-volume push notifications |
| `EXPO_TOKEN` | GitHub Secrets | Token for automated EAS CLI build verification |
