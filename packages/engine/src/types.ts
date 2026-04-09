// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

export type RiskLevel = 'none' | 'low' | 'moderate' | 'high' | 'severe';
export type AltitudeZone = 'negligible' | 'sub_clinical' | 'clinical';
export type GeologicalType = 'coastal' | 'inland_plains' | 'plateau' | 'valley' | 'mountain' | 'desert' | 'hilly';
export type VegetationBiome = 'tropical_humid' | 'arid' | 'semi_arid' | 'temperate' | 'alpine' | 'coastal_humid' | 'deciduous';
export type PollenLevel = 'none' | 'low' | 'moderate' | 'high' | 'very_high' | 'unknown';
export type Season = 'winter' | 'spring' | 'summer' | 'monsoon' | 'post_monsoon';
export type TravelMode = 'flight' | 'train' | 'road';
export type AgeGroup = 'under_18' | '18_35' | '35_55' | '55_plus';
export type FitnessLevel = 'sedentary' | 'moderate' | 'active' | 'athlete';
export type DietType = 'vegetarian' | 'non_vegetarian' | 'vegan';
export type HydrationLevel = 'low' | 'moderate' | 'high'; // < 1L | 1-2L | 2L+
export type ActivityType = 'office' | 'sightseeing' | 'trekking' | 'pilgrimage' | 'sports';
export type AllergyType = 'dust' | 'pollen' | 'none' | 'prefer_not_to_say';

// ─────────────────────────────────────────────
// SERVER DATA — City Environmental Profile
// ─────────────────────────────────────────────

export interface CityClimate {
  month: number;                   // 1-12
  temp_avg_c: number;
  temp_min_c: number;
  temp_max_c: number;
  diurnal_range_c: number;         // day-night swing
  humidity_avg_pct: number;
  humidity_min_pct: number;
  humidity_max_pct: number;
  aqi_avg: number | null;          // null = no station data
  pm25_avg: number | null;
  uv_index_avg: number | null;
  pollen_overall_level: PollenLevel;
  pollen_tree: boolean;
  pollen_grass: boolean;
  pollen_weed: boolean;
  wind_speed_avg_kmh: number | null;
  rainfall_avg_mm: number | null;
  is_monsoon_month: boolean;
  season: Season;
  pressure_hpa: number;
}

export interface CityHealthRisks {
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
}

export interface City {
  city_id: string;
  name: string;
  state: string;
  altitude_m: number;
  altitude_risk_zone: AltitudeZone;
  geological_type: GeologicalType;
  vegetation_biome: VegetationBiome;
  nearest_aqi_station_km: number;
  data_coverage_score: number;     // 1-5
  is_hill_station: boolean;
  is_pilgrimage_site: boolean;
  climate: CityClimate;            // for the travel month
  risks: CityHealthRisks;
}

// ─────────────────────────────────────────────
// DEVICE DATA — User Profile (never leaves device)
// ─────────────────────────────────────────────

export interface UserProfile {
  age_group: AgeGroup;
  fitness_level: FitnessLevel;
  diet_type: DietType;
  hydration_level: HydrationLevel;
  allergy_type: AllergyType;
  has_respiratory_condition: boolean;
  has_cardiac_condition: boolean;
  is_recovering_from_illness: boolean;
  is_sleep_sensitive: boolean;
  has_ac_accommodation: boolean;
  activity_type: ActivityType;
  travel_mode: TravelMode;
  stay_duration_days: number;
}

// ─────────────────────────────────────────────
// ENGINE INTERNALS — Delta & Scores
// ─────────────────────────────────────────────

export interface EnvironmentalDelta {
  altitude_diff_m: number;           // positive = going higher
  humidity_diff_pct: number;         // negative = going drier
  temp_avg_diff_c: number;
  diurnal_range_dest: number;        // destination day-night swing
  aqi_diff: number | null;           // positive = going to worse air
  uv_index_dest: number | null;
  pollen_level_dest: PollenLevel;
  pollen_tree_dest: boolean;
  pollen_grass_dest: boolean;
  pollen_weed_dest: boolean;
  pressure_diff_hpa: number;         // negative = lower pressure at dest
  dest_is_monsoon: boolean;
  dest_season: Season;
  dest_altitude_zone: AltitudeZone;
  dest_geological_type: GeologicalType;
  dest_vegetation_biome: VegetationBiome;
  travel_mode: TravelMode;           // affects dehydration, pressure change pace
}

export interface RiskScores {
  altitude: RiskLevel;
  humidity_shock: RiskLevel;
  heat_stress: RiskLevel;
  cold_stress: RiskLevel;
  air_quality: RiskLevel;
  uv_exposure: RiskLevel;
  pollen_exposure: RiskLevel;
  gi_transition: RiskLevel;
  sleep_disruption: RiskLevel;
  thermoregulation: RiskLevel;       // driven by diurnal range
  vector_disease: RiskLevel;         // from city_health_risks
  overall: RiskLevel;
}

// ─────────────────────────────────────────────
// ENGINE OUTPUT — Recommendation Card
// ─────────────────────────────────────────────

export type TimelinePhase = 'days_before' | 'day_of_travel' | 'first_3_days' | 'ongoing';

export interface TimelineItem {
  phase: TimelinePhase;
  days_before?: number;              // e.g. 5 means "5 days before travel"
  category: string;                  // "Hydration" | "Altitude" | "Sleep" | etc.
  advice: string;
  is_critical: boolean;              // true = red flag, must-do
}

export interface DataQualityNotice {
  field: string;
  message: string;
}

export interface RecommendationCard {
  origin: string;
  destination: string;
  travel_month: number;
  overall_risk: RiskLevel;
  risk_scores: RiskScores;
  delta: EnvironmentalDelta;
  timeline: TimelineItem[];
  data_notices: DataQualityNotice[]; // e.g. "AQI based on station 48km away"
  disclaimer: string;
}
