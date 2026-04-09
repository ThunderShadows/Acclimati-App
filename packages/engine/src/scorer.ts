import {
  City,
  EnvironmentalDelta,
  UserProfile,
  RiskScores,
  RiskLevel,
  PollenLevel,
} from './types';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const RISK_ORDER: RiskLevel[] = ['none', 'low', 'moderate', 'high', 'severe'];

/** Escalates a risk by N levels, capping at 'severe' */
function escalate(risk: RiskLevel, levels: number = 1): RiskLevel {
  const idx = Math.min(RISK_ORDER.indexOf(risk) + levels, RISK_ORDER.length - 1);
  return RISK_ORDER[idx];
}

/** Returns the highest of two risk levels */
function maxRisk(a: RiskLevel, b: RiskLevel): RiskLevel {
  return RISK_ORDER.indexOf(a) >= RISK_ORDER.indexOf(b) ? a : b;
}

function pollenToRisk(level: PollenLevel): RiskLevel {
  const map: Record<PollenLevel, RiskLevel> = {
    none: 'none', low: 'low', moderate: 'moderate',
    high: 'high', very_high: 'severe', unknown: 'low',
  };
  return map[level];
}

// ─────────────────────────────────────────────
// INDIVIDUAL RISK SCORERS
// ─────────────────────────────────────────────

function scoreAltitude(delta: EnvironmentalDelta, profile: UserProfile): RiskLevel {
  let risk: RiskLevel = 'none';

  // Base risk from absolute destination altitude zone
  if (delta.dest_altitude_zone === 'clinical') {
    risk = 'severe';
  } else if (delta.dest_altitude_zone === 'sub_clinical') {
    risk = 'moderate';
  }

  // Also factor in the delta itself — a gradual rise is less risky than a jump
  // Flying directly amplifies risk (no gradual acclimatization)
  if (delta.travel_mode === 'flight' && risk !== 'none') {
    risk = escalate(risk, 1);
  }

  // User modifiers
  if (profile.has_cardiac_condition && risk !== 'none') {
    risk = 'severe'; // cardiac + any altitude = always severe
  }
  if (profile.has_respiratory_condition) {
    risk = escalate(risk, 1);
  }
  if (profile.age_group === '55_plus') {
    risk = escalate(risk, 1);
  }
  if (profile.age_group === 'under_18') {
    risk = escalate(risk, 1);
  }
  if (profile.fitness_level === 'sedentary') {
    risk = escalate(risk, 1);
  }
  if (profile.fitness_level === 'athlete') {
    // Athletes acclimatize faster — one level down, but never below 'low' for clinical zones
    const idx = Math.max(RISK_ORDER.indexOf(risk) - 1, delta.dest_altitude_zone === 'clinical' ? 2 : 0);
    risk = RISK_ORDER[idx];
  }
  if (profile.activity_type === 'trekking' || profile.activity_type === 'sports') {
    risk = escalate(risk, 1); // exertion at altitude multiplies the risk
  }
  if (profile.is_recovering_from_illness) {
    risk = escalate(risk, 1);
  }

  return risk;
}

function scoreHumidityShock(delta: EnvironmentalDelta, profile: UserProfile): RiskLevel {
  const diff = Math.abs(delta.humidity_diff_pct);
  let risk: RiskLevel = 'none';

  if (diff >= 50) risk = 'high';
  else if (diff >= 30) risk = 'moderate';
  else if (diff >= 15) risk = 'low';

  // Going drier is harder on respiratory system than going more humid
  if (delta.humidity_diff_pct < -30) {
    risk = escalate(risk, 1);
  }

  if (profile.has_respiratory_condition) risk = escalate(risk, 1);
  if (!profile.has_ac_accommodation && delta.humidity_diff_pct > 30) {
    risk = escalate(risk, 1); // high humidity + no AC compounds heat regulation
  }

  return risk;
}

function scoreHeatStress(delta: EnvironmentalDelta, profile: UserProfile, dest: City): RiskLevel {
  let risk = dest.risks.heat_stress_risk; // from precomputed city data

  if (profile.age_group === '55_plus') risk = escalate(risk, 1);
  if (profile.fitness_level === 'sedentary') risk = escalate(risk, 1);
  if (profile.activity_type === 'trekking' || profile.activity_type === 'sports') {
    risk = escalate(risk, 1);
  }
  if (!profile.has_ac_accommodation) risk = escalate(risk, 1);

  return risk;
}

function scoreColdStress(delta: EnvironmentalDelta, profile: UserProfile, dest: City): RiskLevel {
  let risk = dest.risks.cold_stress_risk;

  // Large diurnal swing at destination compounds cold risk (even if avg is ok)
  if (delta.diurnal_range_dest > 20 && risk === 'none') risk = 'low';
  if (delta.diurnal_range_dest > 25) risk = escalate(risk, 1);

  if (profile.age_group === '55_plus') risk = escalate(risk, 1);
  if (profile.age_group === 'under_18') risk = escalate(risk, 1);

  return risk;
}

function scoreAirQuality(delta: EnvironmentalDelta, profile: UserProfile): RiskLevel {
  // Only flag if going to WORSE air (positive aqi_diff)
  if (delta.aqi_diff === null) return 'low'; // unknown — be cautious
  if (delta.aqi_diff <= 0) return 'none';    // going to cleaner air

  let risk: RiskLevel = 'none';
  if (delta.aqi_diff > 100) risk = 'high';
  else if (delta.aqi_diff > 50) risk = 'moderate';
  else if (delta.aqi_diff > 20) risk = 'low';

  if (profile.has_respiratory_condition) risk = escalate(risk, 2);
  if (profile.allergy_type === 'dust') risk = escalate(risk, 1);

  return risk;
}

function scoreUV(delta: EnvironmentalDelta, profile: UserProfile): RiskLevel {
  if (delta.uv_index_dest === null) return 'none';

  let risk: RiskLevel = 'none';
  if (delta.uv_index_dest >= 11) risk = 'severe';
  else if (delta.uv_index_dest >= 8) risk = 'high';
  else if (delta.uv_index_dest >= 6) risk = 'moderate';
  else if (delta.uv_index_dest >= 3) risk = 'low';

  // Altitude amplifies UV — ~10% more per 1000m
  // Already baked into city data, but flag for trekkers
  if (delta.dest_altitude_zone !== 'negligible' && profile.activity_type === 'trekking') {
    risk = escalate(risk, 1);
  }

  return risk;
}

function scorePollen(delta: EnvironmentalDelta, profile: UserProfile): RiskLevel {
  // Only relevant if user has allergies
  if (profile.allergy_type === 'none') return 'none';
  if (profile.allergy_type === 'prefer_not_to_say') {
    // Assume some sensitivity, use destination pollen level as base
    return pollenToRisk(delta.pollen_level_dest) === 'none' ? 'none' : 'low';
  }

  let risk = pollenToRisk(delta.pollen_level_dest);

  if (profile.allergy_type === 'pollen') risk = escalate(risk, 1);
  if (profile.has_respiratory_condition) risk = escalate(risk, 1);

  return risk;
}

function scoreGI(delta: EnvironmentalDelta, profile: UserProfile, dest: City): RiskLevel {
  let risk = dest.risks.gi_risk; // city baseline (cuisine region difference)

  // Monsoon at destination = higher GI risk (street food hygiene drops)
  if (delta.dest_is_monsoon) risk = escalate(risk, 1);

  // Diet mismatch: vegan/vegetarian traveling to heavy non-veg regions
  // and vice versa — handled via city's gi_risk, not user diet alone
  if (profile.is_recovering_from_illness) risk = escalate(risk, 1);

  // Dehydrated travelers are more susceptible to GI upset
  if (profile.hydration_level === 'low') risk = escalate(risk, 1);

  return risk;
}

function scoreSleep(delta: EnvironmentalDelta, profile: UserProfile): RiskLevel {
  let risk: RiskLevel = 'none';

  if (delta.dest_altitude_zone === 'clinical') risk = 'high';
  else if (delta.dest_altitude_zone === 'sub_clinical') risk = 'moderate';

  // Large diurnal range disrupts sleep even without altitude
  if (delta.diurnal_range_dest > 20 && risk === 'none') risk = 'low';

  if (profile.is_sleep_sensitive) risk = escalate(risk, 1);
  if (profile.travel_mode === 'flight' && delta.altitude_diff_m > 1000) {
    risk = escalate(risk, 1); // jet effect + altitude compound
  }

  return risk;
}

function scoreThermoregulation(delta: EnvironmentalDelta, profile: UserProfile): RiskLevel {
  // High diurnal swing at destination = body must constantly re-regulate
  let risk: RiskLevel = 'none';
  if (delta.diurnal_range_dest >= 25) risk = 'high';
  else if (delta.diurnal_range_dest >= 20) risk = 'moderate';
  else if (delta.diurnal_range_dest >= 15) risk = 'low';

  if (profile.age_group === '55_plus' || profile.age_group === 'under_18') {
    risk = escalate(risk, 1);
  }

  return risk;
}

// ─────────────────────────────────────────────
// OVERALL RISK — weighted by severity
// ─────────────────────────────────────────────

function computeOverall(scores: Omit<RiskScores, 'overall'>): RiskLevel {
  // Critical flags that alone push to severe
  if (scores.altitude === 'severe') return 'severe';

  const scoreValues = Object.values(scores).map(r => RISK_ORDER.indexOf(r));
  const max = Math.max(...scoreValues);
  const highCount = scoreValues.filter(v => v >= 3).length; // 'high' or 'severe'
  const moderateCount = scoreValues.filter(v => v === 2).length;

  // Multiple high-risk factors → escalate overall
  if (max >= 3 && highCount >= 2) return 'severe';
  if (max >= 3) return 'high';
  if (max === 2 && moderateCount >= 3) return 'high';
  if (max === 2) return 'moderate';
  if (max === 1) return 'low';
  return 'none';
}

// ─────────────────────────────────────────────
// PUBLIC FUNCTION
// ─────────────────────────────────────────────

export function computeRiskScores(
  delta: EnvironmentalDelta,
  profile: UserProfile,
  origin: City,
  destination: City
): RiskScores {
  const partial = {
    altitude:          scoreAltitude(delta, profile),
    humidity_shock:    scoreHumidityShock(delta, profile),
    heat_stress:       scoreHeatStress(delta, profile, destination),
    cold_stress:       scoreColdStress(delta, profile, destination),
    air_quality:       scoreAirQuality(delta, profile),
    uv_exposure:       scoreUV(delta, profile),
    pollen_exposure:   scorePollen(delta, profile),
    gi_transition:     scoreGI(delta, profile, destination),
    sleep_disruption:  scoreSleep(delta, profile),
    thermoregulation:  scoreThermoregulation(delta, profile),
    vector_disease:    destination.risks.vector_disease_risk,
  };

  return { ...partial, overall: computeOverall(partial) };
}
