/**
 * Pushes apps/seeder/output/cities.json into the Supabase `cities` table
 * that backs the B2B recommendation Edge Function.
 *
 * This is a separate copy of city data from the one apps/api serves to the
 * mobile app (the flat file) — re-run this whenever apps/seeder/output is
 * regenerated and you want the B2B API to see the update.
 *
 * Usage:
 *   cd apps/b2b-api && npm run seed-cities
 *   npm run seed-cities -- --city DEL   # re-seed a single city
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const CITIES_FILE = path.join(__dirname, '../../seeder/output/cities.json');

interface SeededCity {
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
  monthly: unknown[];
  seeded_at: string;
}

async function main() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see .env.example).'
    );
  }

  if (!fs.existsSync(CITIES_FILE)) {
    throw new Error(
      `${CITIES_FILE} not found. Run "npm run seed" in apps/seeder first.`
    );
  }

  const cities: SeededCity[] = JSON.parse(fs.readFileSync(CITIES_FILE, 'utf-8'));

  // Optional filter: npm run seed-cities -- --city DEL
  const cityArgIdx = process.argv.indexOf('--city');
  const filterId = cityArgIdx !== -1 ? process.argv[cityArgIdx + 1]?.toUpperCase() : null;
  const toSeed = filterId ? cities.filter(c => c.city_id === filterId) : cities;

  if (filterId && toSeed.length === 0) {
    throw new Error(`City "${filterId}" not found in ${CITIES_FILE}.`);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const rows = toSeed.map(c => ({
    city_id: c.city_id,
    name: c.name,
    state: c.state,
    latitude: c.latitude,
    longitude: c.longitude,
    altitude_m: c.altitude_m,
    altitude_risk_zone: c.altitude_risk_zone,
    geological_type: c.geological_type,
    vegetation_biome: c.vegetation_biome,
    nearest_aqi_station_km: c.nearest_aqi_station_km,
    data_coverage_score: c.data_coverage_score,
    is_hill_station: c.is_hill_station,
    is_pilgrimage_site: c.is_pilgrimage_site,
    monthly: c.monthly,
    seeded_at: c.seeded_at,
  }));

  const { error, count } = await supabase
    .from('cities')
    .upsert(rows, { onConflict: 'city_id', count: 'exact' });

  if (error) {
    throw new Error(`Upsert failed: ${error.message}`);
  }

  console.log(`Seeded ${count ?? rows.length} / ${rows.length} cities into Supabase.`);
}

main().catch(err => {
  console.error(err.message ?? err);
  process.exit(1);
});
