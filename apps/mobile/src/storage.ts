/**
 * Storage layer:
 *   - Health profile → expo-secure-store (AES-256 encrypted on-device)
 *   - City cache     → AsyncStorage (public env data, 30-day TTL)
 *   - Trip history   → AsyncStorage (public trip metadata, max 10 records)
 *
 * User health data NEVER leaves this device.
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile } from '@acclimate/engine';

const PROFILE_KEY     = 'acclimate_health_profile';
const TRIP_HISTORY_KEY = 'trip_history';
const CACHE_TTL_MS    = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_HISTORY     = 10;

// ─── Health Profile ───────────────────────────────────────────────────────────

export async function saveProfile(profile: UserProfile): Promise<void> {
  await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(profile));
}

export async function loadProfile(): Promise<UserProfile | null> {
  const raw = await SecureStore.getItemAsync(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export async function clearProfile(): Promise<void> {
  await SecureStore.deleteItemAsync(PROFILE_KEY);
}

// ─── Trip History ─────────────────────────────────────────────────────────────

export interface TripRecord {
  id: string;
  originId: string;
  originName: string;
  destId: string;
  destName: string;
  month: number;
  overall_risk: string;
  timestamp: number;
}

export async function loadTripHistory(): Promise<TripRecord[]> {
  const raw = await AsyncStorage.getItem(TRIP_HISTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as TripRecord[];
  } catch {
    return [];
  }
}

export async function saveTripHistory(trips: TripRecord[]): Promise<void> {
  await AsyncStorage.setItem(TRIP_HISTORY_KEY, JSON.stringify(trips));
}

export async function addTripRecord(record: TripRecord): Promise<TripRecord[]> {
  const existing = await loadTripHistory();
  // Remove duplicates (same origin+dest+month)
  const deduped = existing.filter(
    t => !(t.originId === record.originId && t.destId === record.destId && t.month === record.month)
  );
  // Prepend new record and limit to MAX_HISTORY
  const updated = [record, ...deduped].slice(0, MAX_HISTORY);
  await saveTripHistory(updated);
  return updated;
}

export async function clearTripHistory(): Promise<void> {
  await AsyncStorage.removeItem(TRIP_HISTORY_KEY);
}

// ─── City Cache ───────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  ts: number; // epoch ms
}

function cityKey(cityId: string, month: number): string {
  return `city_cache_${cityId}_${month}`;
}

export async function saveCityCache<T>(cityId: string, month: number, data: T): Promise<void> {
  const entry: CacheEntry<T> = { data, ts: Date.now() };
  await AsyncStorage.setItem(cityKey(cityId, month), JSON.stringify(entry));
}

export async function loadCityCache<T>(cityId: string, month: number): Promise<T | null> {
  const raw = await AsyncStorage.getItem(cityKey(cityId, month));
  if (!raw) return null;
  try {
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.ts > CACHE_TTL_MS) {
      await AsyncStorage.removeItem(cityKey(cityId, month));
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}
