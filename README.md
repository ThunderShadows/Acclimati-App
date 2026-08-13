# Acclimate

An India-focused travel health acclimatization app. Enter your origin city, destination city, travel month, and health profile — get a personalized pre-trip preparation plan based on environmental deltas (altitude, AQI, humidity, temperature, pollen, UV, and more).

**Privacy-first:** health profile data stays on-device (encrypted). The server only ever sees city IDs + month — never personal health data. Recommendations are computed locally.

---

## Demo

<!--
  Add screenshots or a screen recording here, e.g.:

  | Onboarding | Result | History |
  |---|---|---|
  | ![Onboarding](docs/screenshots/onboarding.png) | ![Result](docs/screenshots/result.png) | ![History](docs/screenshots/history.png) |

  Or a GIF:
  ![Demo](docs/screenshots/demo.gif)
-->
*Screenshots / demo coming soon.*

---

## Architecture

Monorepo managed with Turborepo + npm workspaces.

```
acclimate/
├── packages/
│   └── engine/       Shared TypeScript engine — on-device risk computation
└── apps/
    ├── seeder/        Populates city environmental data (cities.json)
    ├── api/            Fastify server — serves public city data only
    └── mobile/        React Native (Expo) app
```

**Data flow:**

```
Open-Meteo Archive API ┐
AQICN / CPCB estimates ├─► seeder → cities.json ─► Fastify API ─► mobile app cache
UV / Pollen (curated)   ┘
                                                  UserProfile (on-device) ─► engine ─► RecommendationCard
```

| Data | Where it lives | Transmitted? |
|---|---|---|
| Health profile | `expo-secure-store` (AES-256) | Never |
| City env cache | `AsyncStorage` (30-day TTL) | Only city IDs + month |
| Recommendation result | Computed on-device | Never |

---

## Tech Stack

| Layer | Tech |
|---|---|
| Mobile | React Native 0.81.5, Expo SDK 54, React Navigation v6 |
| On-device storage | `expo-secure-store` (health profile), `AsyncStorage` (cache + trip history) |
| On-device computation | `@acclimate/engine` (shared TypeScript package) |
| API server | Fastify 4 (Node.js) |
| Build system | Turborepo + npm workspaces |
| Language | TypeScript throughout |
| Climate data | Open-Meteo Archive API (ERA5, free, no key) |
| AQI data | CPCB regional estimates (+ optional AQICN live token) |

---

## Getting Started

### Prerequisites
- Node.js and npm
- [Expo Go](https://expo.dev/go) on your phone (for testing on a physical device), or an iOS/Android simulator

### 1. Install dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Build the engine
```bash
cd packages/engine && node ../../node_modules/.bin/tsc && cd ../..
```

### 3. Seed city data
Only needed once, or when updating cities (output is gitignored — review before committing):
```bash
cd apps/seeder && npm run seed && cd ../..
```

### 4. Start the API server
```bash
cd apps/api && node ../../node_modules/.bin/tsx src/index.ts
```
Runs at `http://localhost:3001`.

### 5. Start the mobile app
```bash
cd apps/mobile && npx expo start
```

> **Testing on a physical device:** your phone and dev machine must be on the same Wi-Fi. Update `API_BASE_URL` in `apps/mobile/src/api.ts` to your machine's LAN IP.

---

## API

The API is stateless and read-only — it serves public city environmental data, nothing user-specific.

```
GET /health                          → { status: "ok", cities: 30 }
GET /v1/cities                       → all city summaries
GET /v1/cities?ids=DEL,BOM&month=6   → batch fetch, specific month
GET /v1/cities/:id                   → full city profile (all 12 months)
GET /v1/cities/:id?month=6           → city + specific month only
```

---

## Roadmap

- [ ] Production app icon / splash assets
- [ ] B2B API layer (recommendation-as-a-service for OTAs, HR platforms, insurers)
- [ ] Expand beyond the initial 30 seed cities
- [ ] EAS Build + app store submission
- [ ] Offline mode (serve last-cached data when API is unreachable)

---

## License

Private / unlicensed — all rights reserved.
