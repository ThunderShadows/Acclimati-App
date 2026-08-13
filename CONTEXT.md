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
| Mobile | React Native 0.81.5, Expo SDK 54 |
| Navigation | React Navigation v6 (Native Stack + Bottom Tabs) |
| On-device storage | `expo-secure-store` (health profile), `AsyncStorage` (city cache + trip history) |
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

**30 seed cities (correct IDs — these must match mobile cities.ts exactly):**
- Himalayan: Leh (IXL), Manali (KUU), Shimla (SLV), Dehradun (DED), Rishikesh (**RSH**), Srinagar (SXR), Darjeeling (DAR), Mussoorie (MSR)
- Metros: Delhi (DEL), Mumbai (BOM), Bengaluru (BLR), Kolkata (CCU), Chennai (MAA), Hyderabad (HYD), Pune (PNQ), Ahmedabad (AMD), Chandigarh (IXC)
- Coastal/desert: Goa (GOI), Kochi (COK), Jaipur (JAI), Jodhpur (JDH)
- South hills: Ooty (OOT), Munnar (**MNR**), Coorg (CRG), Kodaikanal (**KDK**)
- Northeast + misc: Guwahati (GAU), Shillong (SHL), Gangtok (GTK), Udaipur (UDR), Varanasi (VNS)

> ⚠️ IDs in bold were previously wrong in cities.ts (MUN→MNR, RIK→RSH, KDL→KDK). Now fixed.

**Data sources per city:**
- Climate: Open-Meteo Archive API (`archive-api.open-meteo.com/v1/archive`), ERA5 hourly 2021–2023, aggregated to 12 monthly averages
- AQI: Pre-built CPCB regional monthly estimates (optional AQICN live via `AQICN_TOKEN` env var)
- UV: Computed from latitude band + altitude multiplier (WHO methodology)
- Pollen: Curated from Indian aerobiology literature
- Health risks: Derived from above data (no external API)

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

**Run:**
```bash
cd apps/api
node ../../node_modules/.bin/tsx src/index.ts
# → http://localhost:3001
```

**Physical device:** `API_BASE_URL` in `apps/mobile/src/api.ts` is set to `http://192.168.1.90:3001` (LAN IP). Update if your machine IP changes.

---

### ✅ Task 4 — Mobile App (`apps/mobile/`)

Expo SDK 54 + React Native 0.81.5 + React 19.1.0. Full redesign with onboarding, bottom tabs, paginated questionnaire, tabbed results, and trip history.

#### Navigation Architecture

```
Splash
  └─ (onboarding_done?)
       ├─ NO  → Onboarding → Main
       └─ YES → Main

Main (Bottom Tabs)
  ├─ Home tab
  ├─ History tab
  └─ Profile tab

Modal stack (on top of Main):
  ├─ CityPicker  (slide_from_bottom modal)
  │    └─ Questionnaire  (slide_from_right)
  │         └─ Result  (slide_from_right)
  └─ Questionnaire (profileOnly mode, from Profile tab)
```

#### RootStackParamList (App.tsx)
```ts
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Main: undefined;
  CityPicker: {
    prefillOriginId?:   string;
    prefillOriginName?: string;
    prefillDestId?:     string;
    prefillDestName?:   string;
    prefillMonth?:      number;
  } | undefined;
  Questionnaire: {
    originId:    string;
    originName:  string;
    destId:      string;
    destName:    string;
    month:       number;
    profileOnly?: boolean;
  };
  Result: {
    originId: string; originName: string;
    destId:   string; destName:   string;
    month: number; profile: UserProfile;
  };
};
```

#### Screens

| Screen | File | Description |
|---|---|---|
| Splash | `src/screens/SplashScreen.tsx` | Dark bg, animated "A" logo, 2s delay → Main or Onboarding |
| Onboarding | `src/screens/OnboardingScreen.tsx` | 3-slide horizontal pager, progress dots, saves onboarding_done flag |
| Home | `src/screens/HomeScreen.tsx` | Greeting, dark hero CTA card, recent trips (horizontal scroll), popular routes (2-col grid) |
| History | `src/screens/HistoryScreen.tsx` | FlatList of past trips with RiskBadge; tapping pre-fills CityPicker |
| Profile | `src/screens/ProfileScreen.tsx` | Read-only health profile display; Edit → profileOnly Questionnaire; Clear → SecureStore delete |
| CityPicker | `src/screens/CityPickerScreen.tsx` | Dark header + white card; origin/dest swap; 12 month chips; modal city search; reads prefill params |
| Questionnaire | `src/screens/QuestionnaireScreen.tsx` | 5-step paginated form, animated progress bar; profileOnly mode saves and goes to Main |
| Result | `src/screens/ResultScreen.tsx` | Tabbed: Overview / Timeline / Risks; "Done ✓" → Main; "← Edit" → goBack; saves trip to history |

#### Components

| Component | File | Description |
|---|---|---|
| RiskBadge | `src/components/RiskBadge.tsx` | sm/md/lg size, color-coded by RiskLevel |
| Chip | `src/components/Chip.tsx` | Selectable chip for questionnaire options |

#### Hooks

| Hook | File | Description |
|---|---|---|
| useRecentTrips | `src/hooks/useRecentTrips.ts` | Wraps trip history storage; exports trips, addTrip, clearTrips, refresh |

#### Storage (`src/storage.ts`)
- `expo-secure-store` → health profile (encrypted, ~400 bytes, key: `user_profile`)
- `AsyncStorage` → city data cache (public, 30-day TTL, key: `city_cache_{ID}_{month}`)
- `AsyncStorage` → trip history (max 10 records, key: `trip_history`)

#### Theme (`src/theme.ts`)
- Primary palette: `#0B2D32` (dark teal bg), `#0D7C82` (mid), `#16A896` (bright)
- Hero color: `Colors.hero` (dark gradient-like)
- Risk palette: none=green, low=amber, moderate=orange, high=red, severe=purple (each with bg, text, border)
- Coral: `Colors.coral` (for destructive actions)

#### Popular Routes (HomeScreen)
```ts
DEL → IXL  ⛰️  "3524m altitude change"
BOM → GOI  🌊  "Coastal escape"
DEL → SLV  🌿  "Hill station"
BLR → OOT  🌸  "Nilgiris"
```

---

## Known Issues / Fixes Applied

| Issue | Fix |
|---|---|
| Open-Meteo Climate API returning 400 | Switched to Archive API (ERA5 hourly 2021–2023) |
| `main` field in package.json pointing to missing path | Created `index.js` with `registerRootComponent`, set `"main": "index.js"` |
| Expo Go SDK mismatch (SDK 51 vs 54) | Upgraded all packages to exact SDK 54 compatible versions |
| Missing asset files (icon.png, splash.png) | Removed from `app.json` (only needed for production builds) |
| Peer dependency conflicts during install | Use `npm install --legacy-peer-deps` |
| "Network request failed" on physical device | Changed `API_BASE_URL` from `localhost` to `192.168.1.90` (LAN IP) |
| "cannot read property 'month' of undefined" for Munnar/Rishikesh/Kodaikanal | Fixed wrong city IDs in cities.ts (MUN→MNR, RIK→RSH, KDL→KDK); added not_found guard in api.ts |
| api.ts caching not_found responses | Added explicit error check before caching; build result from freshMap not re-read cache |
| Navigation: popular routes not prefilling CityPicker | Pass prefillOriginId/Name/DestId/Name as params |
| Navigation: history taps not prefilling CityPicker | Pass all prefill params including prefillMonth |
| Navigation: Profile "Edit" not working | Navigate to Questionnaire with profileOnly:true, empty origin/dest |
| Navigation: Result had no way back to tabs | Added "Done ✓" button → navigation.navigate('Main') |
| Navigation: profileOnly Questionnaire back button crash | Check profileOnly before goBack; navigate to Main instead |

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

> **Physical device:** Ensure your phone and dev machine are on the same Wi-Fi. The API URL is already set to `192.168.1.90:3001`. Update `API_BASE_URL` in `src/api.ts` if your machine IP changes.

---

## What's Next (Pending)

- [ ] **Production assets** — Add `icon.png`, `splash.png` for `app.json`
- [ ] **B2B API layer** — POST health profile + route → `RecommendationCard` JSON response for OTAs/HR/insurers
- [ ] **More cities** — Expand beyond 30 seed cities
- [ ] **EAS Build** — Production build config, app store submission
- [ ] **Settings screen** — Wire up the ⚙️ button on HomeScreen
- [ ] **Offline mode** — Serve last-cached city data when API unreachable

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
│       └── dist/                     ← Compiled output
└── apps/
    ├── seeder/
    │   ├── src/
    │   │   ├── cities.ts             ← 30 city definitions + IDs
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
        ├── App.tsx                   ← NavigationContainer + Stack + Bottom Tabs
        ├── app.json                  ← Expo config (SDK 54)
        ├── metro.config.js           ← Monorepo watchFolders config
        └── src/
            ├── theme.ts              ← Colors, Font, Radius, Spacing
            ├── cities.ts             ← 30 city picker options (IDs must match seeder)
            ├── storage.ts            ← SecureStore (profile) + AsyncStorage (cache, history)
            ├── api.ts                ← Fetch + cache city data (LAN IP: 192.168.1.90)
            ├── components/
            │   ├── RiskBadge.tsx
            │   └── Chip.tsx
            ├── hooks/
            │   └── useRecentTrips.ts
            └── screens/
                ├── SplashScreen.tsx
                ├── OnboardingScreen.tsx
                ├── HomeScreen.tsx
                ├── HistoryScreen.tsx
                ├── ProfileScreen.tsx
                ├── CityPickerScreen.tsx
                ├── QuestionnaireScreen.tsx
                └── ResultScreen.tsx
```
