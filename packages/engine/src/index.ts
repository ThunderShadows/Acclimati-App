import { City, UserProfile, RecommendationCard, DataQualityNotice } from './types';
import { computeDelta } from './delta';
import { computeRiskScores } from './scorer';
import { generateTimeline } from './advisor';

const DISCLAIMER =
  'This report is for informational and wellness preparation purposes only. ' +
  'It is not a medical diagnosis or prescription. Consult a qualified doctor ' +
  'before making any health decisions, especially if you have pre-existing conditions.';

// ─────────────────────────────────────────────
// DATA QUALITY NOTICES
// Transparent about where data is estimated or missing
// ─────────────────────────────────────────────

function buildDataNotices(origin: City, destination: City): DataQualityNotice[] {
  const notices: DataQualityNotice[] = [];

  if (destination.nearest_aqi_station_km > 50) {
    notices.push({
      field: 'air_quality',
      message: `AQI data for ${destination.name} is based on the nearest monitoring station, ${destination.nearest_aqi_station_km}km away. Actual local air quality may differ.`,
    });
  }

  if (destination.climate.aqi_avg === null) {
    notices.push({
      field: 'air_quality',
      message: `No AQI monitoring data available for ${destination.name}. Air quality advice is based on regional estimates only.`,
    });
  }

  if (destination.climate.pollen_overall_level === 'unknown') {
    notices.push({
      field: 'pollen',
      message: `Pollen data for ${destination.name} is not available for this period. If you have allergies, take precautionary antihistamines.`,
    });
  }

  if (destination.data_coverage_score <= 2) {
    notices.push({
      field: 'general',
      message: `Environmental data for ${destination.name} is limited. Some recommendations are based on regional patterns rather than local measurements.`,
    });
  }

  return notices;
}

// ─────────────────────────────────────────────
// PUBLIC API
// Call this on-device with local user profile + downloaded city data
// ─────────────────────────────────────────────

/**
 * Generates a full acclimatization recommendation card.
 *
 * @param origin      - City data downloaded from server for origin city
 * @param destination - City data downloaded from server for destination city
 * @param profile     - User health profile (stored locally, never sent to server)
 * @returns           - RecommendationCard rendered on-device
 *
 * No user health data is ever transmitted. This function runs entirely on-device.
 */
export function generateRecommendation(
  origin: City,
  destination: City,
  profile: UserProfile
): RecommendationCard {
  const delta    = computeDelta(origin, destination, profile);
  const scores   = computeRiskScores(delta, profile, origin, destination);
  const timeline = generateTimeline(scores, profile, delta);
  const notices  = buildDataNotices(origin, destination);

  return {
    origin:        origin.name,
    destination:   destination.name,
    travel_month:  origin.climate.month,
    overall_risk:  scores.overall,
    risk_scores:   scores,
    delta,
    timeline,
    data_notices:  notices,
    disclaimer:    DISCLAIMER,
  };
}

// Re-export types for consumers (app UI, B2B API layer)
export type {
  City,
  UserProfile,
  RecommendationCard,
  RiskScores,
  TimelineItem,
  EnvironmentalDelta,
  RiskLevel,
} from './types';
