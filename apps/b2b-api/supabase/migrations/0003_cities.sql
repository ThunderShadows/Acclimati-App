-- City environmental data, mirroring apps/seeder/output/cities.json.
--
-- Locked down like the guide's `properties` table: RLS on, no policy, so the
-- anon key can never query it directly. Only the Edge Function (service role)
-- reads it to feed the recommendation engine. This is a separate copy from
-- apps/api's cities.json — the consumer app keeps reading the flat file
-- untouched; this table only backs the B2B endpoint.
--
-- `monthly` stores the same array of 12 monthly records the seeder produces
-- (temp, humidity, aqi, uv, pollen, and the nested `risks` object per month)
-- as jsonb, rather than exploding into columns — keeps this table a direct
-- mirror of the seeder output so re-seeding is a straight upsert.

create table public.cities (
  city_id                 text primary key,
  name                    text not null,
  state                   text not null,
  latitude                double precision not null,
  longitude               double precision not null,
  altitude_m              int not null,
  altitude_risk_zone      text not null,
  geological_type         text not null,
  vegetation_biome        text not null,
  nearest_aqi_station_km  double precision not null,
  data_coverage_score     int not null,
  is_hill_station         boolean not null default false,
  is_pilgrimage_site      boolean not null default false,
  monthly                 jsonb not null,
  seeded_at               timestamptz not null default now()
);

alter table public.cities enable row level security;
