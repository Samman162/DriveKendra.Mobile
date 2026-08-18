# Drive Kendra Mobile

Standalone Expo (SDK 57) TypeScript app for **Drive Kendra** — Nepal car rental and tour transport.

This app has its **own API** in `server/`. It shares only the **PostgreSQL database** with the website. It does not call the website ASP.NET API.

## Features

- Home, fleet, official rates, airport, wedding, and tour packages
- Book a trip (`POST /api/bookings`)
- Live fleet stats (`GET /api/stats`)
- Traveler reviews (`GET` / `POST /api/reviews`)
- Call / WhatsApp / email deep links

## Run both (API + app)

From `DriveKendra.Mobile` (set `server/.env` `DATABASE_URL` first):

```bash
npm install
npm run dev
```

That starts the Hono API on `http://localhost:8787` and Expo in one terminal, like `dotnet run` starting the website API and Angular together. Logs are prefixed `[api]` and `[app]`. Ctrl+C stops both.

In the Expo output:

- Press **`s`** to use Expo Go, then scan the QR code on your phone
- Press **`a`** for an Android emulator (`EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8787/api`)
- Press **`w`** for a browser layout preview

To run them in two terminals instead:

```bash
npm run server
npx expo start
```

## Environment

| Variable | Default |
|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | `http://localhost:8787/api` |

On a physical phone, use your computer's LAN IP, for example `http://192.168.1.10:8787/api`.

## Typecheck

```bash
npx tsc --noEmit
npm run typecheck --prefix server
```

## EAS builds

```bash
npx eas-cli build --profile preview --platform android
npx eas-cli build --profile production --platform android
```

- `development` — internal dev client
- `preview` — APK for device testing
- `production` — Android App Bundle
