// Acclimate B2B Recommendation API — the gatekeeper Edge Function.
//
// Validates the partner's API key, enforces a tier-based rate limit, loads
// the requested cities, and runs the SAME on-device engine used by the
// mobile app (packages/engine) to compute a RecommendationCard.
//
// Unlike the consumer app, the traveler profile in the request body DOES
// cross the network here (a partner's backend is calling on a traveler's
// behalf). We deliberately never persist it: api_requests only logs
// user_id + timestamp + status, never the profile or the result.
//
// NOTE: this imports packages/engine's source directly by relative path.
// Deno executes .ts natively, so no build step is needed — but this means
// `supabase functions deploy` must be run from a checkout where
// packages/engine/src is present at this relative location (true for this
// monorepo). Verify with a local `supabase functions serve` before deploying.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts";
import {
  generateRecommendation,
  type City,
  type UserProfile,
} from "../../../../../packages/engine/src/index.ts";

const RATE_LIMITS: Record<string, number> = {
  trial: 5,    // requests per minute
  paid: 100,
};

serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  // 1. get the key from the header
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) return json({ error: "Missing API key" }, 401);

  // 2. hash the incoming key
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(apiKey)
  );
  const hashedKey = encodeHex(new Uint8Array(hashBuffer));

  // 3. connect with the service role key (server-side only)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // 4. validate the key against the stored fingerprint
  const { data: keyData, error: keyError } = await supabase
    .from("api_keys")
    .select("user_id")
    .eq("key_hash", hashedKey)
    .single();

  if (keyError || !keyData) return json({ error: "Invalid API key" }, 401);

  // 5. look up the partner's tier for the rate limit
  const { data: partner, error: partnerError } = await supabase
    .from("partners")
    .select("tier")
    .eq("user_id", keyData.user_id)
    .single();

  if (partnerError || !partner) return json({ error: "No partner record for this key" }, 401);
  const limit = RATE_LIMITS[partner.tier] ?? RATE_LIMITS.trial;

  // 6. rate limit: count this partner's requests in the last 60 seconds
  const windowStart = new Date(Date.now() - 60_000).toISOString();
  const { count } = await supabase
    .from("api_requests")
    .select("*", { count: "exact", head: true })
    .eq("user_id", keyData.user_id)
    .gte("created_at", windowStart);

  if ((count ?? 0) >= limit) return json({ error: "Rate limit exceeded" }, 429);

  // 7. parse and validate the request body
  let body: {
    origin_city_id?: string;
    dest_city_id?: string;
    month?: number;
    profile?: UserProfile;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Body must be valid JSON" }, 400);
  }

  const { origin_city_id, dest_city_id, month, profile } = body;
  if (!origin_city_id || !dest_city_id || !month || !profile) {
    return json(
      { error: "origin_city_id, dest_city_id, month, and profile are all required" },
      400
    );
  }
  if (month < 1 || month > 12) {
    return json({ error: "month must be 1-12" }, 400);
  }

  // 8. load both cities
  const { data: cityRows, error: cityError } = await supabase
    .from("cities")
    .select("*")
    .in("city_id", [origin_city_id.toUpperCase(), dest_city_id.toUpperCase()]);

  if (cityError) return json({ error: "Failed to load city data" }, 500);

  const originRow = cityRows?.find(c => c.city_id === origin_city_id.toUpperCase());
  const destRow = cityRows?.find(c => c.city_id === dest_city_id.toUpperCase());
  if (!originRow) return json({ error: `Unknown city: ${origin_city_id}` }, 404);
  if (!destRow) return json({ error: `Unknown city: ${dest_city_id}` }, 404);

  let origin: City, destination: City;
  try {
    origin = mapRowToCity(originRow, month);
    destination = mapRowToCity(destRow, month);
  } catch (err) {
    return json({ error: (err as Error).message }, 404);
  }

  // 9. run the engine — same computation the mobile app runs on-device
  const recommendation = generateRecommendation(origin, destination, profile);

  // 10. log usage (billing/rate-limit metering only — never the profile or result)
  await supabase.from("api_requests").insert({
    user_id: keyData.user_id,
    endpoint: "recommendation",
    status: 200,
  });

  return json(recommendation, 200);
});

// Reshapes a `cities` table row (seeder-shaped: flat monthly[] with nested
// risks) into the engine's City type for the requested month. Mirrors
// apps/mobile/src/api.ts:mapToEngineCity — keep the two in sync.
function mapRowToCity(row: Record<string, unknown>, month: number): City {
  const monthly = row.monthly as Array<Record<string, unknown>>;
  const m = monthly.find(x => x.month === month);
  if (!m) throw new Error(`No data for ${row.city_id} in month ${month}`);

  return {
    city_id: row.city_id as string,
    name: row.name as string,
    state: row.state as string,
    altitude_m: row.altitude_m as number,
    altitude_risk_zone: row.altitude_risk_zone as City["altitude_risk_zone"],
    geological_type: row.geological_type as City["geological_type"],
    vegetation_biome: row.vegetation_biome as City["vegetation_biome"],
    nearest_aqi_station_km: row.nearest_aqi_station_km as number,
    data_coverage_score: row.data_coverage_score as number,
    is_hill_station: row.is_hill_station as boolean,
    is_pilgrimage_site: row.is_pilgrimage_site as boolean,
    climate: {
      month: m.month as number,
      temp_avg_c: m.temp_avg_c as number,
      temp_min_c: m.temp_min_c as number,
      temp_max_c: m.temp_max_c as number,
      diurnal_range_c: m.diurnal_range_c as number,
      humidity_avg_pct: m.humidity_avg_pct as number,
      humidity_min_pct: m.humidity_min_pct as number,
      humidity_max_pct: m.humidity_max_pct as number,
      aqi_avg: m.aqi_avg as number | null,
      pm25_avg: m.pm25_avg as number | null,
      uv_index_avg: m.uv_index_avg as number | null,
      pollen_overall_level: m.pollen_overall_level as City["climate"]["pollen_overall_level"],
      pollen_tree: m.pollen_tree as boolean,
      pollen_grass: m.pollen_grass as boolean,
      pollen_weed: m.pollen_weed as boolean,
      wind_speed_avg_kmh: m.wind_speed_avg_kmh as number | null,
      rainfall_avg_mm: m.rainfall_avg_mm as number | null,
      is_monsoon_month: m.is_monsoon_month as boolean,
      season: m.season as City["climate"]["season"],
      pressure_hpa: m.pressure_hpa as number,
    },
    risks: m.risks as City["risks"],
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
