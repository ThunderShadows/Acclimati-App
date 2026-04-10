/**
 * Acclimate API Server — serves city environmental data to the mobile app.
 *
 * Design: stateless, read-only. Loads cities.json at startup and serves it.
 * No user data is ever received or stored here.
 *
 * Endpoints:
 *   GET /health                        — liveness probe
 *   GET /v1/cities                     — all cities (metadata only, no monthly data)
 *   GET /v1/cities/:id                 — single city full profile
 *   GET /v1/cities?ids=DEL,BOM&month=6 — batch fetch specific month data
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import * as fs from 'fs';
import * as path from 'path';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MonthlyData {
  month: number;
  [key: string]: unknown;
}

interface CityRecord {
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
  monthly: MonthlyData[];
  seeded_at: string;
}

// ─── Data loader ─────────────────────────────────────────────────────────────

const CITIES_FILE = path.join(__dirname, '../../seeder/output/cities.json');

function loadCities(): Map<string, CityRecord> {
  if (!fs.existsSync(CITIES_FILE)) {
    throw new Error(
      `cities.json not found at ${CITIES_FILE}. Run "npm run seed" in apps/seeder first.`
    );
  }
  const raw = fs.readFileSync(CITIES_FILE, 'utf-8');
  const arr = JSON.parse(raw) as CityRecord[];
  const map = new Map<string, CityRecord>();
  for (const city of arr) {
    map.set(city.city_id, city);
  }
  console.log(`Loaded ${map.size} cities from cities.json`);
  return map;
}

// ─── Server ──────────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '0.0.0.0';

async function start() {
  const cities = loadCities();

  const app = Fastify({ logger: { level: 'warn' } });

  await app.register(cors, {
    origin: true,   // allow all origins (mobile app makes local requests)
    methods: ['GET'],
  });

  // ── GET /health ────────────────────────────────────────────────────────────
  app.get('/health', async (_req, reply) => {
    reply.send({ status: 'ok', cities: cities.size, ts: new Date().toISOString() });
  });

  // ── GET /v1/cities — all city summaries (no monthly payload) ───────────────
  app.get('/v1/cities', async (req, reply) => {
    const query = req.query as Record<string, string>;
    const idsParam = query.ids;
    const monthParam = query.month;

    // Batch mode: ?ids=DEL,BOM&month=6
    if (idsParam) {
      const ids = idsParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
      const month = monthParam ? parseInt(monthParam, 10) : null;

      if (month !== null && (isNaN(month) || month < 1 || month > 12)) {
        return reply.status(400).send({ error: 'month must be 1–12' });
      }

      const result = ids.map(id => {
        const city = cities.get(id);
        if (!city) return { city_id: id, error: 'not_found' };

        if (month !== null) {
          // Return city metadata + only the requested month
          const { monthly, ...meta } = city;
          const monthData = monthly.find(m => m.month === month) ?? null;
          return { ...meta, month_data: monthData };
        }

        return city;
      });

      return reply.send(result);
    }

    // No ids param — return all city summaries (stripped of monthly data for payload size)
    const summaries = Array.from(cities.values()).map(({ monthly: _m, ...meta }) => meta);
    return reply.send(summaries);
  });

  // ── GET /v1/cities/:id — single city full profile ──────────────────────────
  app.get<{ Params: { id: string }; Querystring: { month?: string } }>(
    '/v1/cities/:id',
    async (req, reply) => {
      const id = req.params.id.toUpperCase();
      const city = cities.get(id);

      if (!city) {
        return reply.status(404).send({ error: 'City not found', city_id: id });
      }

      const monthParam = req.query.month;
      if (monthParam) {
        const month = parseInt(monthParam, 10);
        if (isNaN(month) || month < 1 || month > 12) {
          return reply.status(400).send({ error: 'month must be 1–12' });
        }
        const { monthly, ...meta } = city;
        const monthData = monthly.find(m => m.month === month) ?? null;
        return reply.send({ ...meta, month_data: monthData });
      }

      return reply.send(city);
    }
  );

  await app.listen({ port: PORT, host: HOST });
  console.log(`Acclimate API running on http://localhost:${PORT}`);
  console.log(`  GET /health`);
  console.log(`  GET /v1/cities`);
  console.log(`  GET /v1/cities?ids=DEL,BOM&month=6`);
  console.log(`  GET /v1/cities/:id`);
  console.log(`  GET /v1/cities/:id?month=6`);
}

start().catch(err => {
  console.error('Fatal startup error:', err.message);
  process.exit(1);
});
