# Acclimate — Project Context

> Last updated: 2026-04-10

---

## What We're Building

**Acclimate** is an India-focused travel health acclimatization mobile app.

**Core concept:** User inputs origin city + destination city + travel month + personal health profile → receives a personalized pre-trip preparation plan based on environmental deltas (altitude, AQI, humidity, temperature, pollen, UV, etc.).

**Privacy-first architecture:** All user health data stays on-device. The server only serves city environmental data (public). Recommendations are computed locally using the engine package.

**Business model:**
- V1: Consumer mobile app for India (one-to-one city comparison)
- V2: B2B API/SDK sold to OTAs (MakeMyTrip, Ixigo, EaseMyTrip), corporate HR, and travel insurance companies

**Explicitly excluded:** Water quality (users drink bottled water, not local sources).

---

## Architecture

### Monorepo (Turborepo + npm workspaces)
```
acclimate/
├── packages/
│   └── engine/          ← Shared TypeScript engine (on-device computation)
└── apps/
    ├── seeder/          ← Data population scripts (runs once / when updating cities)
    ├── api/             ← Fastify server (serves city env data)
    └── mobile/          ← React Native + Expo app
```

### Data Flow
```
Open-Meteo Archive API  ──┐
AQICN / CPCB estimates  ──┤──► seeder → cities.json
UV/Pollen (curated)     ──┘

                            cities.json ──► Fastify API ──► mobile app cache
                                                               │
                                           UserProfile (device) ─► engine ──► RecommendationCard
```

### Privacy Model
| Data | Where it lives | Transmitted? |
|---|---|---|
| Health profile | `expo-secure-store` (AES-256) | Never |
| City env data cache | `AsyncStorage` (30-day TTL) | Only city IDs + month sent to API |
| Recommendation result | Computed on-device | Never |

---

## Tech Stack

| Layer | Tech |
|---|---|
| Mobile | React Native 0.76, Expo SDK 54 |
| Navigation | React Navigation (Native Stack) |
| On-device storage | `expo-secure-store` (health profile), `AsyncStorage` (city cache) |
| On-device computation | `@acclimate/engine` (shared TS package) |
| API server | Fastify 4 (Node.js) |
| Build system | Turborepo + npm workspaces |
| Language | TypeScript throughout |
| Climate data | Open-Meteo Archive API (ERA5, free, no key) |
| AQI data | CPCB regional estimates (pre-built) + optional AQICN live token |

---

## Completed Work

### ✅ Task 1 — Engine (`packages/engine/`)
Core on-device computation library. Built and compiled to `dist/`.

| File | Role |
|---|---|
| `src/types.ts` | All TypeScript interfaces (RiskLevel, City, UserProfile, RecommendationCard, etc.) |
| `src/delta.ts` | `computeDelta(origin, dest, profile)` → raw environmental differences |
| `src/scorer.ts` | `computeRiskScores(delta, profile, origin, dest)` → 11 risk domains |
| `src/advisor.ts` | `generateTimeline(scores, profile, delta)` → actionable advice items |
| `src/index.ts` | Public API: `generateRecommendation(origin, dest, profile)` → `RecommendationCard` |

**Key scorer logic:**
- Cardiac condition + any altitude → always severe
- Athlete → escalate down 1 level
- Flight mode + altitude → escalate up
- Recovering from illness → escalate all risks
- Overall: if altitude severe → severe; 2+ high factors → severe

**Risk domains:** altitude, humidity_shock, heat_stress, cold_stress, air_quality, uv_exposure, pollen_exposure, gi_transition, sleep_disruption, thermoregulation, vector_disease, overall

**Timeline phases:** `days_before` (with `days_before` count), `day_of_travel`, `first_3_days`, `ongoing`

---

### ✅ Task 2 — Seeder (`apps/seeder/`)

Populates `output/cities.json` with 30 Indian cities.

**30 seed cities (by priority):**
- Himalayan: Leh (IXL), Manali (KUU), Shimla (SLV), Dehradun (DED), Rishikesh (RIK), Srinagar (SXR), Darjeeling (DAR), Mussoorie (MSR)
- Metros: Delhi (DEL), Mumbai (BOM), Bengaluru (BLR), Kolkata (CCU), Chennai (MAA), Hyderabad (HYD), Pune (PNQ), Ahmedabad (AMD), Chandigarh (IXC)
- Coastal/desert: Goa (GOI), Kochi (COK), Jaipur (JAI), Jodhpur (JDH)
- South hills: Ooty (OOT), Munnar (MUN), Coorg (CRG), Kodaikanal (KDL)
- Northeast + misc: Guwahati (GAU), Shillong (SHL), Gangtok (GTK), Udaipur (UDR), Varanasi (VNS)

**Data sources per city:**
- Climate: Open-Meteo Archive API (`archive-api.open-meteo.com/v1/archive`), ERA5 hourly 2021–2023, aggregated to 12 monthly averages
- AQI: Pre-built CPCB regional monthly estimates (optional AQICN live via `AQICN_TOKEN` env var)
- UV: Computed from latitude band + altitude multiplier (WHO methodology)
- Pollen: Curated from Indian aerobiology literature
- Health risks: Derived from above data (no external API)

**Important fix:** Original code used `climate-api.open-meteo.com/v1/climate` with model names that no longer exist (returned 400). Replaced with the Archive API which works reliably.

**Output:** `apps/seeder/output/cities.json` — gitignored (commit only after manual review).

**Run:**
```bash
cd apps/seeder
npm run seed              # all 30 cities
npm run seed:city DEL     # single city re-seed
```

---

### ✅ Task 3 — API Server (`apps/api/`)

Fastify server that serves city data. Stateless, read-only. Loads `cities.json` at startup.

**Endpoints:**
```
GET /health                          → { status: "ok", cities: 30 }
GET /v1/cities                       → all 30 city summaries (no monthly payload)
GET /v1/cities?ids=DEL,BOM&month=6   → batch fetch with specific month data
GET /v1/cities/:id                   → full city profile (all 12 months)
GET /v1/cities/:id?month=6           → city + specific month only
```

**Verified sample data:**
- Delhi June: 32.2°C, AQI 110
- Mumbai June: 27.9°C, AQI 60
- Leh January: -7.5°C avg, -18.7°C min, altitude_sickness_risk: severe, cold_stress_risk: severe

**Run:**
```bash
cd apps/api
node ../../node_modules/.bin/tsx src/index.ts
# → http://localhost:3001
```

**Physical device:** Update `API_BASE_URL` in `apps/mobile/src/api.ts` to your LAN IP.

---

### ✅ Task 4 — Mobile App (`apps/mobile/`)

Expo SDK 54 + React Native 0.76.

**Screens:**

| Screen | File | Description |
|---|---|---|
| City Picker | `src/screens/CityPickerScreen.tsx` | Google Flights–style: origin/dest swap card + 12 month chips + modal city search |
| Questionnaire | `src/screens/QuestionnaireScreen.tsx` | 5 sections: About You / Health Conditions / Allergies / This Trip / Lifestyle. Chip selectors + toggles. Profile saved to SecureStore. |
| Result | `src/screens/ResultScreen.tsx` | Hero risk card + altitude/climate delta stats → 11-domain risk grid → timeline grouped by phase → data notices → disclaimer |

**Components:** `RiskBadge.tsx` (sm/md/lg, color-coded), `Chip.tsx` (selectable)

**Storage:**
- `expo-secure-store` → health profile (encrypted, ~400 bytes)
- `AsyncStorage` → city data cache (public, 30-day TTL, key: `city_cache_{ID}_{month}`)

**Design language:** Off-white bg (`#F5F7F9`), white cards, teal primary (`#0D7377`), risk palette (none=green, low=amber, moderate=orange, high=red, severe=purple)

**Run:**
```bash
cd apps/mobile
npx expo start    # then press i (iOS) / a (Android) / scan QR
```

---

## Known Issues / Fixes Applied

| Issue | Fix |
|---|---|
| Open-Meteo Climate API returning 400 | Switched to Archive API (ERA5 hourly 2021–2023) |
| `main` field in package.json pointing to missing path | Created `index.js` with `registerRootComponent`, set `"main": "index.js"` |
| Expo Go SDK 54 vs project SDK 51 mismatch | Upgraded all packages to SDK 54 compatible versions |
| Missing asset files (icon.png, splash.png) | Removed from `app.json` (only needed for production builds) |
| Peer dependency conflicts during install | Use `npm install --legacy-peer-deps` |

---

## How to Run Everything

```bash
# 1. Install all deps (from monorepo root)
cd /home/sumanth/Desktop/acclimate
npm install --legacy-peer-deps

# 2. Build the engine
cd packages/engine && node ../../node_modules/.bin/tsc

# 3. Seed city data (only needed once or when updating cities)
cd apps/seeder && npm run seed

# 4. Start API server (Terminal 1)
cd apps/api && node ../../node_modules/.bin/tsx src/index.ts

# 5. Start mobile app (Terminal 2)
cd apps/mobile && npx expo start
```

---

## What's Next (Pending)

- [ ] **UI polish** — Mobbin-inspired design (couldn't access Mobbin directly; needs browser session)
- [ ] **B2B API layer** — Same engine output as JSON over REST for enterprise clients (OTAs, HR platforms, insurers). POST a health profile, get back `RecommendationCard`.
- [ ] **More cities** — Expand beyond 30 seed cities
- [ ] **Production build** — EAS Build, app store submission
- [ ] **Assets** — Add icon.png, splash.png for production `app.json`
- [ ] **Physical device test** — Update `API_BASE_URL` in `apps/mobile/src/api.ts` to LAN IP

---

## File Reference

```
acclimate/
├── CONTEXT.md                        ← This file
├── package.json                      ← Workspace root
├── turbo.json                        ← Turborepo config
├── tsconfig.json                     ← Root TS config
├── packages/
│   └── engine/
│       ├── package.json              ← @acclimate/engine
│       ├── src/
│       │   ├── types.ts
│       │   ├── delta.ts
│       │   ├── scorer.ts
│       │   ├── advisor.ts
│       │   └── index.ts
│       └── dist/                     ← Compiled output (gitignore candidate)
└── apps/
    ├── seeder/
    │   ├── src/
    │   │   ├── cities.ts             ← 30 city definitions
    │   │   ├── seed.ts               ← Orchestrator
    │   │   └── fetchers/
    │   │       ├── climate.ts        ← Open-Meteo Archive API
    │   │       ├── aqi.ts            ← CPCB estimates + AQICN
    │   │       ├── uv-pollen.ts      ← Derived UV + pollen
    │   │       └── health-risks.ts   ← Derived risk levels
    │   └── output/
    │       └── cities.json           ← GITIGNORED — review before committing
    ├── api/
    │   └── src/
    │       └── index.ts              ← Fastify server
    └── mobile/
        ├── index.js                  ← Entry point (registerRootComponent)
        ├── App.tsx                   ← NavigationContainer + Stack
        ├── app.json                  ← Expo config (SDK 54, no assets yet)
        ├── metro.config.js           ← Monorepo watchFolders config
        └── src/
            ├── theme.ts
            ├── cities.ts             ← 30 city picker options
            ├── storage.ts            ← SecureStore + AsyncStorage wrappers
            ├── api.ts                ← Fetch + cache city data
            ├── components/
            │   ├── RiskBadge.tsx
            │   └── Chip.tsx
            └── screens/
                ├── CityPickerScreen.tsx
                ├── QuestionnaireScreen.tsx
                └── ResultScreen.tsx
```
