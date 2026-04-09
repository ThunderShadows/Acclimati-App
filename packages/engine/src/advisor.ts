import {
  RiskScores,
  UserProfile,
  EnvironmentalDelta,
  TimelineItem,
  RiskLevel,
} from './types';

// ─────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────

function item(
  phase: TimelineItem['phase'],
  category: string,
  advice: string,
  is_critical: boolean,
  days_before?: number
): TimelineItem {
  return { phase, category, advice, is_critical, days_before };
}

function atLeast(risk: RiskLevel, threshold: RiskLevel): boolean {
  const order = ['none', 'low', 'moderate', 'high', 'severe'];
  return order.indexOf(risk) >= order.indexOf(threshold);
}

// ─────────────────────────────────────────────
// ADVICE BLOCKS — one per risk domain
// ─────────────────────────────────────────────

function altitudeAdvice(scores: RiskScores, profile: UserProfile, delta: EnvironmentalDelta): TimelineItem[] {
  const items: TimelineItem[] = [];
  const r = scores.altitude;
  if (r === 'none') return items;

  if (r === 'severe') {
    items.push(item('days_before', 'Altitude', 'Consult your doctor about Diamox (acetazolamide) — start 1–2 days before arrival. Do not skip this step.', true, 7));
    items.push(item('days_before', 'Altitude', 'Begin increasing water intake to 3+ litres per day to pre-hydrate before the altitude change.', true, 5));
    items.push(item('days_before', 'Altitude', 'Avoid alcohol and heavy exercise for 3 days before departure — both slow acclimatization.', false, 3));
    items.push(item('day_of_travel', 'Altitude', 'Stay seated and avoid any physical exertion on travel day. Drink water throughout the journey.', true));

    if (delta.travel_mode === 'flight') {
      items.push(item('day_of_travel', 'Altitude', 'Flying directly to high altitude gives your body no gradual adjustment. Expect symptoms within the first 6–12 hours of arrival.', true));
    }

    items.push(item('first_3_days', 'Altitude', 'Rest completely on Day 1. No sightseeing, no trekking. Your body is adjusting to significantly reduced oxygen.', true));
    items.push(item('first_3_days', 'Altitude', 'Watch for: persistent headache, nausea, vomiting, loss of appetite, confusion. If two or more appear together, descend immediately.', true));
    items.push(item('first_3_days', 'Altitude', 'Do not ascend higher until you have spent at least 2 full days at your base altitude.', true));

    if (profile.activity_type === 'trekking') {
      items.push(item('first_3_days', 'Altitude', 'Trekking at this altitude without full acclimatization is dangerous. Wait until Day 4 minimum before any trail activity.', true));
    }
  }

  if (r === 'high' || r === 'moderate') {
    items.push(item('days_before', 'Altitude', 'Your destination is at sub-clinical altitude. Most people don\'t get altitude sickness, but sleep disruption and fatigue are common in the first 24–48 hours.', false, 3));
    items.push(item('days_before', 'Altitude', 'Increase your water intake gradually over the next 3 days.', false, 3));
    items.push(item('first_3_days', 'Altitude', 'Take your first day easy. Avoid strenuous activity on arrival day.', false));
    items.push(item('first_3_days', 'Altitude', 'If you develop a persistent headache after arrival, rest and hydrate before assuming it\'s altitude-related.', false));
  }

  if (profile.has_cardiac_condition) {
    items.push(item('days_before', 'Altitude', 'You have flagged a heart or blood pressure condition. Please get clearance from your cardiologist before traveling to this altitude. This is non-negotiable.', true, 14));
  }

  return items;
}

function humidityAdvice(scores: RiskScores, profile: UserProfile, delta: EnvironmentalDelta): TimelineItem[] {
  const items: TimelineItem[] = [];
  const r = scores.humidity_shock;
  if (r === 'none') return items;

  const goingDrier = delta.humidity_diff_pct < -15;
  const goingMoreHumid = delta.humidity_diff_pct > 15;

  if (goingDrier && atLeast(r, 'moderate')) {
    items.push(item('days_before', 'Humidity', `Your destination is significantly drier than where you live (${Math.abs(Math.round(delta.humidity_diff_pct))}% less humid). Dry air dehydrates your nasal passages and airways.`, false, 3));
    items.push(item('day_of_travel', 'Humidity', 'Use a saline nasal spray on the travel day and for the first 2–3 days at destination. Helps nasal membranes adjust.', false));
    items.push(item('first_3_days', 'Humidity', 'Increase water intake by at least 500ml/day compared to your normal intake.', false));

    if (profile.has_respiratory_condition) {
      items.push(item('first_3_days', 'Humidity', 'You have a respiratory condition. Dry air is a direct trigger. Keep your inhaler or prescribed medication accessible at all times.', true));
    }
  }

  if (goingMoreHumid && atLeast(r, 'moderate')) {
    items.push(item('days_before', 'Humidity', `Your destination is significantly more humid (${Math.round(delta.humidity_diff_pct)}% higher). Your body\'s ability to cool itself through sweating will be reduced.`, false, 2));
    items.push(item('first_3_days', 'Humidity', 'Avoid heavy physical activity outdoors during peak heat hours (11am–4pm) for the first 3 days.', false));
    items.push(item('first_3_days', 'Humidity', 'Wear breathable, light-coloured cotton clothing. Synthetic fabrics trap heat in humid conditions.', false));
  }

  return items;
}

function airQualityAdvice(scores: RiskScores, profile: UserProfile, delta: EnvironmentalDelta): TimelineItem[] {
  const items: TimelineItem[] = [];
  const r = scores.air_quality;
  if (r === 'none') return items;

  if (atLeast(r, 'high')) {
    items.push(item('days_before', 'Air Quality', 'Air quality at your destination is significantly worse than where you live. Carry an N95 or FFP2 mask — surgical masks do not block fine particles (PM2.5).', true, 3));
    if (profile.has_respiratory_condition) {
      items.push(item('days_before', 'Air Quality', 'High-pollution environments are a direct asthma/respiratory trigger. Consult your doctor about adjusting your medication plan for the duration of travel.', true, 5));
    }
    items.push(item('first_3_days', 'Air Quality', 'Limit outdoor exposure during morning (6–10am) when pollution tends to peak in Indian cities.', false));
  }

  if (r === 'moderate') {
    items.push(item('day_of_travel', 'Air Quality', 'Air quality at your destination is noticeably worse than home. Consider carrying a disposable N95 mask for outdoor use.', false));
  }

  if (delta.aqi_diff === null) {
    items.push(item('first_3_days', 'Air Quality', 'Air quality data for your destination is limited. Monitor how your breathing feels and reduce outdoor exposure if you notice irritation.', false));
  }

  return items;
}

function uvAdvice(scores: RiskScores, profile: UserProfile, delta: EnvironmentalDelta): TimelineItem[] {
  const items: TimelineItem[] = [];
  const r = scores.uv_exposure;
  if (!atLeast(r, 'moderate')) return items;

  if (atLeast(r, 'high')) {
    items.push(item('days_before', 'UV', 'UV intensity at your destination is very high. At altitude, UV radiation increases by ~10% per 1000m — sunburn happens much faster than at sea level.', false, 2));
    items.push(item('day_of_travel', 'UV', 'Pack SPF 50+ sunscreen, UV-protective sunglasses, and a wide-brim hat. These are necessities, not optional at this destination.', true));
    items.push(item('first_3_days', 'UV', 'Apply sunscreen every 2 hours when outdoors. Reapplication is critical — most people apply once and skip the rest.', false));
  } else {
    items.push(item('day_of_travel', 'UV', 'UV index at your destination is elevated. Use SPF 30+ sunscreen for any extended outdoor activity.', false));
  }

  return items;
}

function pollenAdvice(scores: RiskScores, profile: UserProfile, delta: EnvironmentalDelta): TimelineItem[] {
  const items: TimelineItem[] = [];
  const r = scores.pollen_exposure;
  if (r === 'none') return items;

  const types: string[] = [];
  if (delta.pollen_tree_dest) types.push('tree');
  if (delta.pollen_grass_dest) types.push('grass');
  if (delta.pollen_weed_dest) types.push('weed');

  const typeStr = types.length > 0 ? ` (${types.join(', ')} pollen)` : '';

  if (atLeast(r, 'high')) {
    items.push(item('days_before', 'Pollen', `Pollen levels at your destination are high${typeStr}. If you have pollen sensitivity, start an antihistamine 2–3 days before travel to build up coverage.`, true, 3));
    items.push(item('first_3_days', 'Pollen', 'Keep windows closed in accommodation, especially in the morning when pollen dispersal peaks.', false));
  } else if (r === 'moderate') {
    items.push(item('day_of_travel', 'Pollen', `Pollen levels at destination are moderate${typeStr}. Carry antihistamines and use them if symptoms appear.`, false));
  }

  return items;
}

function giAdvice(scores: RiskScores, profile: UserProfile, delta: EnvironmentalDelta): TimelineItem[] {
  const items: TimelineItem[] = [];
  const r = scores.gi_transition;
  if (r === 'none') return items;

  if (atLeast(r, 'moderate')) {
    items.push(item('days_before', 'Gut Health', 'Your digestive system will be adjusting to a new food environment. Start a probiotic supplement 3–5 days before travel to prepare your gut flora.', false, 5));
    items.push(item('first_3_days', 'Gut Health', 'Introduce local cuisine gradually. Eat at one new local dish per meal rather than going all-in on the first day.', false));
    items.push(item('day_of_travel', 'Gut Health', 'Carry ORS (Oral Rehydration Salts) sachets. They are your first line of response if GI issues start — not antibiotics.', false));
  }

  if (delta.dest_is_monsoon) {
    items.push(item('first_3_days', 'Gut Health', 'It\'s monsoon season at your destination. Avoid street food, raw salads, and ice in drinks for the first few days — GI infection rates are higher during monsoon.', true));
  }

  return items;
}

function sleepAdvice(scores: RiskScores, profile: UserProfile, delta: EnvironmentalDelta): TimelineItem[] {
  const items: TimelineItem[] = [];
  const r = scores.sleep_disruption;
  if (r === 'none') return items;

  if (atLeast(r, 'high')) {
    items.push(item('days_before', 'Sleep', 'Sleep disruption at altitude is very common — your brain wakes itself up due to lower oxygen. Expect this, especially in the first 2–3 nights.', false, 2));
    items.push(item('first_3_days', 'Sleep', 'Sleep with your head slightly elevated. Avoid sleeping pills — they suppress breathing and worsen altitude effects.', true));
    items.push(item('first_3_days', 'Sleep', 'Consider 0.5mg Melatonin to ease into sleep. Do not use sedative antihistamines (Benadryl) at altitude.', false));
  } else if (r === 'moderate') {
    items.push(item('first_3_days', 'Sleep', 'You may sleep poorly for the first 1–2 nights due to the altitude and environmental change. This is normal and usually resolves by Night 3.', false));
  }

  if (profile.is_sleep_sensitive) {
    items.push(item('days_before', 'Sleep', 'Since you are already sensitive to sleep changes, plan a lighter schedule for the first 2 days. Do not book early-morning activities on Day 1.', false, 2));
  }

  return items;
}

function thermoregulationAdvice(scores: RiskScores, profile: UserProfile, delta: EnvironmentalDelta): TimelineItem[] {
  const items: TimelineItem[] = [];
  if (!atLeast(scores.thermoregulation, 'moderate')) return items;

  items.push(item('days_before', 'Temperature', `Day-night temperature swing at your destination is ${delta.diurnal_range_dest.toFixed(0)}°C. Mornings and evenings can be significantly colder than midday.`, false, 1));
  items.push(item('day_of_travel', 'Temperature', 'Pack layers — not just warm clothes. A fleece mid-layer you can add or remove is more useful than a single heavy jacket.', false));
  items.push(item('first_3_days', 'Temperature', 'Do not leave accommodation in the morning or evening dressed for midday temperatures. The swing is real and rapid.', false));

  return items;
}

function hydrationAdvice(scores: RiskScores, profile: UserProfile): TimelineItem[] {
  const items: TimelineItem[] = [];

  // Flight dehydration is universal
  if (profile.travel_mode === 'flight') {
    items.push(item('day_of_travel', 'Hydration', 'Cabin air humidity is 10–15% — far drier than any Indian city. Drink at least one glass of water per hour of flight. Avoid alcohol and coffee on flight day.', false));
  }

  // Low hydration baseline needs targeted advice
  if (profile.hydration_level === 'low') {
    items.push(item('days_before', 'Hydration', 'You currently drink less than 1 litre of water a day. Any travel stressor — altitude, heat, or dry air — will hit you harder when under-hydrated. Begin increasing intake now.', true, 5));
  }

  return items;
}

function vectorDiseaseAdvice(scores: RiskScores, delta: EnvironmentalDelta): TimelineItem[] {
  const items: TimelineItem[] = [];
  if (!atLeast(scores.vector_disease, 'moderate')) return items;

  if (delta.dest_is_monsoon) {
    items.push(item('days_before', 'Disease Risk', 'Dengue and other mosquito-borne illnesses are active at your destination during this season. Use DEET-based repellent (not just natural alternatives).', true, 3));
    items.push(item('first_3_days', 'Disease Risk', 'Wear long sleeves and full trousers at dawn and dusk when mosquito activity peaks. Keep accommodation windows shut or use nets.', false));
  }

  return items;
}

function illnessRecoveryAdvice(profile: UserProfile): TimelineItem[] {
  if (!profile.is_recovering_from_illness) return [];
  return [
    item('days_before', 'Health Status', 'You are currently recovering from an illness. Travel stressors (altitude, new food, climate change) compound an already-active immune response. Consider delaying travel by 5–7 days if possible, or consult your doctor.', true, 3),
  ];
}

// ─────────────────────────────────────────────
// SORT ORDER
// ─────────────────────────────────────────────

const PHASE_ORDER: Record<TimelineItem['phase'], number> = {
  days_before: 0, day_of_travel: 1, first_3_days: 2, ongoing: 3,
};

function sortTimeline(items: TimelineItem[]): TimelineItem[] {
  return items.sort((a, b) => {
    const phaseOrder = PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase];
    if (phaseOrder !== 0) return phaseOrder;
    // Within "days_before", sort descending (furthest first)
    if (a.phase === 'days_before' && b.phase === 'days_before') {
      return (b.days_before ?? 0) - (a.days_before ?? 0);
    }
    // Critical items first within same phase
    return b.is_critical === a.is_critical ? 0 : b.is_critical ? 1 : -1;
  });
}

// ─────────────────────────────────────────────
// PUBLIC FUNCTION
// ─────────────────────────────────────────────

export function generateTimeline(
  scores: RiskScores,
  profile: UserProfile,
  delta: EnvironmentalDelta
): TimelineItem[] {
  const all = [
    ...illnessRecoveryAdvice(profile),    // always first if flagged
    ...altitudeAdvice(scores, profile, delta),
    ...hydrationAdvice(scores, profile),
    ...humidityAdvice(scores, profile, delta),
    ...airQualityAdvice(scores, profile, delta),
    ...uvAdvice(scores, profile, delta),
    ...pollenAdvice(scores, profile, delta),
    ...giAdvice(scores, profile, delta),
    ...sleepAdvice(scores, profile, delta),
    ...thermoregulationAdvice(scores, profile, delta),
    ...vectorDiseaseAdvice(scores, delta),
  ];

  return sortTimeline(all);
}
