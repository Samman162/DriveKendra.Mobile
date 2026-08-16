# Drive Kendra Mobile

Standalone Expo (SDK 57) TypeScript app for **Drive Kendra** — Nepal car rental and tour transport.

This repository is the mobile client only. The website, admin dashboard, and ASP.NET Core API live in a separate repo: [Samman162/CarRental](https://github.com/Samman162/CarRental).

## Features

- Home, fleet, official rates, airport, wedding, and tour packages (customer website companion)
- Book a trip (`POST /api/PublicBookings`)
- Live fleet stats (`GET /api/publicstats`)
- Traveler reviews (`GET` / `POST /api/PublicReviews`)
- Call / WhatsApp / email deep links

## Run locally

```bash
npm install
copy .env.example .env
npx expo start
```

In the Expo terminal:

- Press **`s`** to use Expo Go, then scan the QR code on your phone
- Press **`a`** for an Android emulator
- Press **`w`** for a browser layout preview (live API calls are CORS-limited on localhost)

## Environment

| Variable | Default |
|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | `https://carrental-api-x74e.onrender.com/api` |

## Typecheck

```bash
npx tsc --noEmit
```

## EAS builds

```bash
npx eas-cli build --profile preview --platform android
npx eas-cli build --profile production --platform android
```

- `development` — internal dev client
- `preview` — APK for device testing
- `production` — Android App Bundle
