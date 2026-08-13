# Acclimate — Mobile App

## Prerequisites

Node.js 18+, npm, and [Expo Go](https://expo.dev/client) on your phone.

## Full setup (first time)

```bash
# 1. Install all dependencies (from monorepo root)
cd /path/to/acclimate
npm install --legacy-peer-deps

# 2. Build the engine package
cd packages/engine && node ../../node_modules/.bin/tsc

# 3. Seed city data — fetches ERA5 climate data for 30 Indian cities
#    Takes 2–5 min depending on connection. Safe to re-run.
cd apps/seeder && npm run seed

# Retry any cities that timed out individually:
npm run seed:city DEL
npm run seed:city BOM
# etc.
```

## Running in development

### Terminal 1 — API server
```bash
cd apps/api
node ../../node_modules/.bin/tsx src/index.ts
# → Acclimate API running on http://localhost:3001
```

### Terminal 2 — Mobile app
```bash
cd apps/mobile
npx expo start
```

Then press:
- `a` — open Android Emulator
- `i` — open iOS Simulator
- Scan the QR code with **Expo Go** on a physical device

If the QR scan fails, try tunnel mode (works through firewalls):
```bash
npx expo start --tunnel
# Install ngrok if prompted: npm install @expo/ngrok --legacy-peer-deps
```

## Physical device setup

Your phone and dev machine must be on the same Wi-Fi. Update the API URL to your machine's LAN IP:

```ts
// apps/mobile/src/api.ts  line ~15
export const API_BASE_URL = 'http://192.168.X.X:3001';
```

Find your LAN IP:
```bash
ip addr show | grep "inet 192"   # Linux
ifconfig | grep "inet 192"       # macOS
ipconfig                         # Windows
```

Also open port 3001 if your firewall blocks it:
```bash
sudo ufw allow 3001
```

## Screens

| Screen | File | Description |
|---|---|---|
| Splash | `src/screens/SplashScreen.tsx` | Animated logo, routes to Onboarding or Main |
| Onboarding | `src/screens/OnboardingScreen.tsx` | 3-slide intro (arc visual, stickers, privacy) |
| Home | `src/screens/HomeScreen.tsx` | Greeting, hero CTA, recent trip, popular routes |
| City Picker | `src/screens/CityPickerScreen.tsx` | Origin/destination + month, route arc preview |
| Questionnaire | `src/screens/QuestionnaireScreen.tsx` | 5-step health profile (saved encrypted) |
| Result | `src/screens/ResultScreen.tsx` | Overview / Timeline / Risks tabs |
| History | `src/screens/HistoryScreen.tsx` | Past trips with risk badges |
| Profile | `src/screens/ProfileScreen.tsx` | Health profile display + settings |
| Notifications | `src/screens/NotificationsScreen.tsx` | Pre-trip / D-day / post-arrival reminders |

## Components

| Component | File | Description |
|---|---|---|
| AcclimateLogo | `src/components/AcclimateLogo.tsx` | Animated SVG compass-mountain logo |
| RouteArc | `src/components/RouteArc.tsx` | SVG arc between two cities |
| ElevationChart | `src/components/RouteArc.tsx` | SVG altitude profile |
| WeatherSticker | `src/components/WeatherSticker.tsx` | Single-metric card (temp, AQI, UV…) |
| RiskBadge | `src/components/RiskBadge.tsx` | Colour-coded risk level pill |
| Chip | `src/components/Chip.tsx` | Selectable chip for questionnaire options |

## Privacy model

| Data | Storage | Transmitted? |
|---|---|---|
| Health profile | `expo-secure-store` (AES-256) | Never |
| City env data | `AsyncStorage` (30-day TTL) | Only city IDs + month sent to API |
| Trip history | `AsyncStorage` (max 10 records) | Never |
| Recommendation | Computed on-device | Never |

## Troubleshooting

| Problem | Fix |
|---|---|
| "Network request failed" | Update `API_BASE_URL` in `src/api.ts` to your LAN IP |
| "Could not load remote update" | Use `npx expo start --tunnel` |
| Port 3001 unreachable | Run `sudo ufw allow 3001` |
| Seed timeouts | Retry individual cities: `npm run seed:city <ID>` |
| Peer dependency conflicts | Use `npm install --legacy-peer-deps` |
