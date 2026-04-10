# Acclimate — Mobile App

## Prerequisites

```bash
npm install -g expo-cli          # or use npx expo directly
```

## Running in development

### 1. Start the API server (separate terminal)
```bash
cd apps/api
node ../../node_modules/.bin/tsx src/index.ts
# → Acclimate API running on http://localhost:3001
```

### 2. Start the Expo app
```bash
cd apps/mobile
npx expo start
```

Then press:
- `i` — open iOS Simulator
- `a` — open Android Emulator
- Scan QR code with Expo Go app on physical device

## Physical device setup

Update `src/api.ts` line 14:
```ts
export const API_BASE_URL = 'http://192.168.X.X:3001'; // your LAN IP
```
Find your LAN IP: `ifconfig | grep "inet 192"` (macOS/Linux) or `ipconfig` (Windows)

## Screens

| Screen | File | Description |
|---|---|---|
| City Picker | `src/screens/CityPickerScreen.tsx` | Origin/destination + month |
| Questionnaire | `src/screens/QuestionnaireScreen.tsx` | Health profile (saved encrypted) |
| Result | `src/screens/ResultScreen.tsx` | Risk breakdown + timeline |

## Privacy model

- Health profile → `expo-secure-store` (AES-256 on-device, never transmitted)
- City data cache → `AsyncStorage` (public env data, 30-day TTL)
- All computation runs on-device via `@acclimate/engine`
- API server receives only: city IDs + travel month. No user data.
