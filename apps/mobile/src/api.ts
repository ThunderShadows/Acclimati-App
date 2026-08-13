/**
 * API client — fetches city environmental data from the Fastify server.
 *
 * On simulator/emulator: localhost works for iOS, 10.0.2.2 for Android.
 * On physical device: update API_BASE_URL to your machine's LAN IP.
 *   e.g. 'http://192.168.1.100:3001'
 *
 * City data is public — no auth, no user data transmitted.
 */

import type { City, RiskLevel } from '@acclimate/engine';
import { saveCityCache, loadCityCache } from './storage';

// LAN IP of the machine running the API server (auto-detected: 192.168.1.90)
export const API_BASE_URL = 'http://192.168.1.90:3001';

// ─── Raw API shapes (what the server actually returns) ────────────────────────

interface ApiMonthData {
  month: number;
  temp_avg_c: number;
  temp_min_c: number;
  temp_max_c: number;
  diurnal_range_c: number;
  humidity_avg_pct: number;
  humidity_min_pct: number;
  humidity_max_pct: number;
  aqi_avg: number | null;
  pm25_avg: number | null;
  aqi_data_source: string;
  uv_index_avg: number;
  pollen_overall_level: string;
  pollen_tree: boolean;
  pollen_grass: boolean;
  pollen_weed: boolean;
  wind_speed_avg_kmh: number;
  rainfall_avg_mm: number;
  pressure_hpa: number;
  is_monsoon_month: boolean;
  season: string;
  risks: {
    month: number;
    altitude_sickness_risk: RiskLevel;
    heat_stress_risk: RiskLevel;
    cold_stress_risk: RiskLevel;
    respiratory_risk: RiskLevel;
    vector_disease_risk: RiskLevel;
    gi_risk: RiskLevel;
    pollen_allergy_risk: RiskLevel;
    uv_burn_risk: RiskLevel;
    sleep_disruption_risk: RiskLevel;
  };
}

interface ApiCityResponse {
  city_id: string;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  altitude_m: number;
  altitude_risk_zone: string;
  geological_type: string;
  vegetation_biome: string;
  nearest_aqi_station_km: number;
  data_coverage_score: number;
  is_hill_station: boolean;
  is_pilgrimage_site: boolean;
  month_data: ApiMonthData;
}

// ─── Mapper — API response → engine City type ─────────────────────────────────

function mapToEngineCity(raw: ApiCityResponse): City {
  const m = raw.month_data;

  const climate: City['climate'] = {
    month:               m.month,
    temp_avg_c:          m.temp_avg_c,
    temp_min_c:          m.temp_min_c,
    temp_max_c:          m.temp_max_c,
    diurnal_range_c:     m.diurnal_range_c,
    humidity_avg_pct:    m.humidity_avg_pct,
    humidity_min_pct:    m.humidity_min_pct,
    humidity_max_pct:    m.humidity_max_pct,
    aqi_avg:             m.aqi_avg,
    pm25_avg:            m.pm25_avg,
    uv_index_avg:        m.uv_index_avg,
    pollen_overall_level: m.pollen_overall_level as City['climate']['pollen_overall_level'],
    pollen_tree:         m.pollen_tree,
    pollen_grass:        m.pollen_grass,
    pollen_weed:         m.pollen_weed,
    wind_speed_avg_kmh:  m.wind_speed_avg_kmh,
    rainfall_avg_mm:     m.rainfall_avg_mm,
    is_monsoon_month:    m.is_monsoon_month,
    season:              m.season as City['climate']['season'],
    pressure_hpa:        m.pressure_hpa,
  };

  return {
    city_id:              raw.city_id,
    name:                 raw.name,
    state:                raw.state,
    altitude_m:           raw.altitude_m,
    altitude_risk_zone:   raw.altitude_risk_zone as City['altitude_risk_zone'],
    geological_type:      raw.geological_type as City['geological_type'],
    vegetation_biome:     raw.vegetation_biome as City['vegetation_biome'],
    nearest_aqi_station_km: raw.nearest_aqi_station_km,
    data_coverage_score:  raw.data_coverage_score,
    is_hill_station:      raw.is_hill_station,
    is_pilgrimage_site:   raw.is_pilgrimage_site,
    climate,
    risks:                m.risks,
  };
}

// ─── Fetch with cache ─────────────────────────────────────────────────────────

type ApiRawResponse = ApiCityResponse & { error?: string };

export async function fetchCities(
  originId: string,
  destId: string,
  month: number
): Promise<{ origin: City; destination: City }> {
  // Check cache first
  const [cachedOrigin, cachedDest] = await Promise.all([
    loadCityCache<ApiCityResponse>(originId, month),
    loadCityCache<ApiCityResponse>(destId, month),
  ]);

  const idsToFetch = [
    ...(!cachedOrigin ? [originId] : []),
    ...(!cachedDest   ? [destId]   : []),
  ];

  if (idsToFetch.length > 0) {
    const url = `${API_BASE_URL}/v1/cities?ids=${idsToFetch.join(',')}&month=${month}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
    const fetched: ApiRawResponse[] = await res.json();

    // Check for not_found before caching anything
    for (const city of fetched) {
      if (city.error === 'not_found') {
        throw new Error(`City "${city.city_id}" not found in database. The app may need a data update.`);
      }
      if (!city.month_data) {
        throw new Error(`No data for ${city.city_id} in month ${month}.`);
      }
    }

    // Cache only valid responses
    await Promise.all(
      fetched.map(city => saveCityCache(city.city_id, month, city))
    );

    // Build result directly from the fresh fetch (avoid re-reading cache)
    const freshMap: Record<string, ApiCityResponse> = Object.fromEntries(
      fetched.map(c => [c.city_id, c])
    );

    const o = freshMap[originId] ?? cachedOrigin;
    const d = freshMap[destId]   ?? cachedDest;

    if (!o || !d) throw new Error('Failed to load city data after fetch');
    return { origin: mapToEngineCity(o), destination: mapToEngineCity(d) };
  }

  return {
    origin:      mapToEngineCity(cachedOrigin!),
    destination: mapToEngineCity(cachedDest!),
  };
}
