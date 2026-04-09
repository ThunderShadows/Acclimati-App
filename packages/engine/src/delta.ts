import { City, EnvironmentalDelta, UserProfile } from './types';

/**
 * Computes the raw environmental difference between origin and destination.
 * Pure data transformation — no scoring or advice here.
 */
export function computeDelta(
  origin: City,
  destination: City,
  profile: UserProfile
): EnvironmentalDelta {
  const o = origin.climate;
  const d = destination.climate;

  const aqiDiff =
    o.aqi_avg !== null && d.aqi_avg !== null
      ? d.aqi_avg - o.aqi_avg   // positive = worse air at destination
      : null;

  return {
    altitude_diff_m:       destination.altitude_m - origin.altitude_m,
    humidity_diff_pct:     d.humidity_avg_pct - o.humidity_avg_pct,  // negative = drier dest
    temp_avg_diff_c:       d.temp_avg_c - o.temp_avg_c,
    diurnal_range_dest:    d.diurnal_range_c,
    aqi_diff:              aqiDiff,
    uv_index_dest:         d.uv_index_avg,
    pollen_level_dest:     d.pollen_overall_level,
    pollen_tree_dest:      d.pollen_tree,
    pollen_grass_dest:     d.pollen_grass,
    pollen_weed_dest:      d.pollen_weed,
    pressure_diff_hpa:     d.pressure_hpa - o.pressure_hpa,          // negative = lower at dest
    dest_is_monsoon:       d.is_monsoon_month,
    dest_season:           d.season,
    dest_altitude_zone:    destination.altitude_risk_zone,
    dest_geological_type:  destination.geological_type,
    dest_vegetation_biome: destination.vegetation_biome,
    travel_mode:           profile.travel_mode,
  };
}
