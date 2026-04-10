/**
 * Computes monthly health risk levels per city.
 * Derived from climate data + city static facts — no external API needed.
 * Logic mirrors the engine's scorer.ts but applied city-wide (not user-specific).
 */

import { MonthlyClimate } from './climate';

export type RiskLevel = 'none' | 'low' | 'moderate' | 'high' | 'severe';

export interface MonthlyHealthRisks {
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

// Cities with high GI risk due to distinct regional cuisine
const HIGH_GI_CITIES = new Set(['CCU', 'VNS', 'JDH', 'JAI', 'GOI', 'COK', 'MAA']);

// Cities with seasonal vector disease risk (dengue/malaria endemic)
const VECTOR_RISK_CITIES = new Set([
  'DEL', 'BOM', 'CCU', 'MAA', 'COK', 'GAU', 'GOI', 'VNS', 'HYD', 'AMD',
]);

function aqiToRespiratoryRisk(aqi: number | null): RiskLevel {
  if (aqi === null) return 'low';
  if (aqi > 300) return 'severe';
  if (aqi > 200) return 'high';
  if (aqi > 100) return 'moderate';
  if (aqi > 50)  return 'low';
  return 'none';
}

function uvToRisk(uv: number): RiskLevel {
  if (uv >= 11) return 'severe';
  if (uv >= 8)  return 'high';
  if (uv >= 6)  return 'moderate';
  if (uv >= 3)  return 'low';
  return 'none';
}

function altitudeToSicknessRisk(altitude_m: number): RiskLevel {
  if (altitude_m >= 3500) return 'severe';
  if (altitude_m >= 2500) return 'high';
  if (altitude_m >= 1500) return 'moderate';
  if (altitude_m >= 900)  return 'low';
  return 'none';
}

function altitudeToSleepRisk(altitude_m: number): RiskLevel {
  if (altitude_m >= 3500) return 'high';
  if (altitude_m >= 2000) return 'moderate';
  if (altitude_m >= 900)  return 'low';
  return 'none';
}

export function computeHealthRisks(
  cityId: string,
  altitude_m: number,
  climate: MonthlyClimate[],
  aqiByMonth: (number | null)[],
  uvByMonth: number[]
): MonthlyHealthRisks[] {
  const altSickness = altitudeToSicknessRisk(altitude_m);
  const sleepBase   = altitudeToSleepRisk(altitude_m);

  return climate.map((c, i) => {
    const aqi = aqiByMonth[i];
    const uv  = uvByMonth[i];

    // Heat stress: wet bulb danger when temp + humidity both high
    let heatRisk: RiskLevel = 'none';
    if (c.temp_avg_c >= 40 && c.humidity_avg_pct >= 60) heatRisk = 'high';
    else if (c.temp_avg_c >= 38 && c.humidity_avg_pct >= 50) heatRisk = 'moderate';
    else if (c.temp_avg_c >= 35) heatRisk = 'low';

    // Cold stress: frostbite/hypothermia risk
    let coldRisk: RiskLevel = 'none';
    if (c.temp_min_c < -10) coldRisk = 'severe';
    else if (c.temp_min_c < 0) coldRisk = 'high';
    else if (c.temp_min_c < 5) coldRisk = 'moderate';
    else if (c.temp_min_c < 10 && altitude_m > 1500) coldRisk = 'low';

    // Vector disease: monsoon months in endemic cities
    let vectorRisk: RiskLevel = 'none';
    if (VECTOR_RISK_CITIES.has(cityId)) {
      if (c.is_monsoon_month) vectorRisk = 'high';
      else if (['post_monsoon'].includes(c.season)) vectorRisk = 'moderate';
      else if (['spring', 'summer'].includes(c.season)) vectorRisk = 'low';
    }

    // GI risk: higher in monsoon, and in cities with distinct cuisine
    let giRisk: RiskLevel = HIGH_GI_CITIES.has(cityId) ? 'moderate' : 'low';
    if (c.is_monsoon_month) {
      giRisk = giRisk === 'moderate' ? 'high' : 'moderate';
    }

    // Sleep risk: altitude base + large diurnal range compounds it
    let sleepRisk = sleepBase;
    if (c.diurnal_range_c > 20 && sleepRisk === 'none') sleepRisk = 'low';

    return {
      month: c.month,
      altitude_sickness_risk: altSickness,
      heat_stress_risk:       heatRisk,
      cold_stress_risk:       coldRisk,
      respiratory_risk:       aqiToRespiratoryRisk(aqi),
      vector_disease_risk:    vectorRisk,
      gi_risk:                giRisk,
      pollen_allergy_risk:    'low',  // placeholder — overridden by UV/pollen fetcher
      uv_burn_risk:           uvToRisk(uv),
      sleep_disruption_risk:  sleepRisk,
    };
  });
}
