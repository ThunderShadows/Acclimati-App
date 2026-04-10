/**
 * Main seeder — orchestrates all fetchers and writes city data to JSON.
 *
 * Output: apps/seeder/output/cities.json
 * This file is read by the API server at startup.
 *
 * Usage:
 *   npm run seed              — seed all 30 cities
 *   npm run seed:city DEL     — seed a single city by city_id
 *
 * Rate limiting: 1.5s delay between cities to respect API limits.
 */

import * as fs from 'fs';
import * as path from 'path';
import { SEED_CITIES } from './cities';
import { fetchClimate } from './fetchers/climate';
import { fetchAQI } from './fetchers/aqi';
import { computeUVAndPollen } from './fetchers/uv-pollen';
import { computeHealthRisks } from './fetchers/health-risks';

const OUTPUT_DIR  = path.join(__dirname, '..', 'output');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'cities.json');
const DELAY_MS    = 1500; // between city fetches — respect Open-Meteo rate limit

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function seedCity(city: typeof SEED_CITIES[0]): Promise<object> {
  console.log(`\n[${city.city_id}] ${city.name}, ${city.state} (${city.altitude_m}m)`);

  // 1. Climate — Open-Meteo (free, 30-year ERA5 normals)
  const climate = await fetchClimate(
    city.latitude, city.longitude, city.altitude_m, city.name
  );

  // 2. AQI — CPCB-based regional estimates (or live AQICN if token is set)
  const aqiData = await fetchAQI(
    city.latitude, city.longitude, city.city_id, city.name
  );

  // 3. UV + Pollen — derived/curated (no API call)
  const uvPollen = computeUVAndPollen(
    city.city_id,
    city.latitude,
    city.altitude_m,
    city.geological_type,
    city.vegetation_biome
  );
  console.log(`  ✓ UV + Pollen computed for ${city.name}`);

  // 4. Health Risks — derived from above data (no API call)
  const aqiByMonth = aqiData.map(a => a.aqi_avg);
  const uvByMonth  = uvPollen.map(u => u.uv_index_avg);
  const risks = computeHealthRisks(
    city.city_id, city.altitude_m, climate, aqiByMonth, uvByMonth
  );
  console.log(`  ✓ Health risks computed for ${city.name}`);

  // 5. Merge all monthly data into one array
  const monthly = climate.map((c, i) => ({
    ...c,
    aqi_avg:              aqiData[i].aqi_avg,
    pm25_avg:             aqiData[i].pm25_avg,
    aqi_data_source:      aqiData[i].data_source,
    uv_index_avg:         uvPollen[i].uv_index_avg,
    pollen_overall_level: uvPollen[i].pollen_overall_level,
    pollen_tree:          uvPollen[i].pollen_tree,
    pollen_grass:         uvPollen[i].pollen_grass,
    pollen_weed:          uvPollen[i].pollen_weed,
    risks:                risks[i],
  }));

  // 6. Altitude risk zone
  let altitude_risk_zone: string;
  if (city.altitude_m >= 2500) altitude_risk_zone = 'clinical';
  else if (city.altitude_m >= 900) altitude_risk_zone = 'sub_clinical';
  else altitude_risk_zone = 'negligible';

  return {
    city_id:                  city.city_id,
    name:                     city.name,
    state:                    city.state,
    latitude:                 city.latitude,
    longitude:                city.longitude,
    altitude_m:               city.altitude_m,
    altitude_risk_zone,
    geological_type:          city.geological_type,
    vegetation_biome:         city.vegetation_biome,
    nearest_aqi_station_km:   city.nearest_aqi_station_km,
    data_coverage_score:      city.data_coverage_score,
    is_hill_station:          city.is_hill_station,
    is_pilgrimage_site:       city.is_pilgrimage_site,
    monthly,
    seeded_at:                new Date().toISOString(),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const singleCityArg = args.indexOf('--city') !== -1
    ? args[args.indexOf('--city') + 1]?.toUpperCase()
    : null;

  const citiesToSeed = singleCityArg
    ? SEED_CITIES.filter(c => c.city_id === singleCityArg)
    : SEED_CITIES;

  if (citiesToSeed.length === 0) {
    console.error(`City "${singleCityArg}" not found in seed list.`);
    console.error(`Available IDs: ${SEED_CITIES.map(c => c.city_id).join(', ')}`);
    process.exit(1);
  }

  // Load existing output if it exists (so we can update single cities without losing others)
  let existing: Record<string, object> = {};
  if (fs.existsSync(OUTPUT_FILE)) {
    const raw = fs.readFileSync(OUTPUT_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Array<{ city_id: string }>;
    existing = Object.fromEntries(parsed.map(c => [c.city_id, c]));
    console.log(`Loaded ${Object.keys(existing).length} existing cities from output file.`);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`\nSeeding ${citiesToSeed.length} city/cities...\n`);
  const results: Record<string, object> = { ...existing };
  const failed: string[] = [];

  for (let i = 0; i < citiesToSeed.length; i++) {
    const city = citiesToSeed[i];
    try {
      results[city.city_id] = await seedCity(city);
    } catch (err: any) {
      console.error(`  ✗ Failed to seed ${city.name}: ${err.message}`);
      failed.push(city.city_id);
    }

    // Rate limiting — skip delay after last city
    if (i < citiesToSeed.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  // Write output as an array (easier for the API to serve)
  const output = Object.values(results);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`\n✓ Seeded ${output.length} cities → ${OUTPUT_FILE}`);
  if (failed.length > 0) {
    console.warn(`\n⚠ Failed cities: ${failed.join(', ')}`);
    console.warn('Re-run with: npm run seed:city <CITY_ID> to retry individual cities.');
  }
}

main().catch(err => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
