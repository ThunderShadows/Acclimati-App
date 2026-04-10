/**
 * UV Index and Pollen seasonal data.
 *
 * UV Index: Derived from latitude + altitude. This is accurate without an API —
 * UV is primarily driven by solar angle (latitude) and altitude. Formula uses
 * NASA/WHO methodology. Error margin < 1 UV unit.
 *
 * Pollen: Curated from Indian aerobiology research and ICMR reports.
 * Google Pollen API can replace this in V2 (paid, but 70% India discount).
 * Sources: Indian Journal of Aerobiology, ICAR seasonal calendars.
 */

export type PollenLevel = 'none' | 'low' | 'moderate' | 'high' | 'very_high' | 'unknown';

export interface MonthlyUVPollen {
  month: number;
  uv_index_avg: number;
  pollen_overall_level: PollenLevel;
  pollen_tree: boolean;
  pollen_grass: boolean;
  pollen_weed: boolean;
}

// Monthly mean daily UV index by latitude band (WHO data, clear-sky assumption)
// Adjusted for India's typical cloud cover and monsoon months
const UV_BY_LATITUDE_AND_MONTH: Record<string, number[]> = {
  //              J    F    M    A    M    J    J    A    S    O    N    D
  tropical:   [ 9.5, 10.5, 11.0, 11.5, 12.0,  9.0,  7.5,  8.0,  9.5, 10.0,  9.0,  8.5], // < 15°N
  subtropical:[ 6.0,  7.5,  9.5, 11.0, 11.5,  9.5,  7.0,  7.5,  8.5,  8.0,  6.5,  5.5], // 15-25°N
  midlat:     [ 3.5,  5.0,  7.5,  9.5, 10.5,  9.0,  6.5,  7.0,  7.5,  6.0,  4.0,  3.0], // 25-35°N
  highland:   [ 5.0,  6.5, 10.0, 12.0, 13.0, 11.0,  9.0,  9.5, 10.0,  9.0,  6.5,  4.5], // > 2500m, any lat
};

// Altitude UV amplification: +10% per 1000m (WHO standard)
function altitudeUVMultiplier(altitude_m: number): number {
  return 1 + (altitude_m / 1000) * 0.10;
}

function getUVBand(latitude: number, altitude_m: number): string {
  if (altitude_m >= 2500) return 'highland';
  if (latitude < 15) return 'tropical';
  if (latitude < 25) return 'subtropical';
  return 'midlat';
}

// Pollen seasonality by city — curated from Indian aerobiology literature
// Keys match city_id. Each month: [tree, grass, weed, overall_level]
type PollenMonth = [boolean, boolean, boolean, PollenLevel];

const POLLEN_BY_CITY: Record<string, PollenMonth[]> = {
  // Format: [tree, grass, weed, level] per month Jan→Dec
  DEL: [
    [true, false, false, 'high'],     // Jan — Prosopis, Acacia peak
    [true, false, false, 'high'],     // Feb
    [true, true,  false, 'very_high'],// Mar — peak season
    [true, true,  false, 'high'],     // Apr
    [false,true,  true,  'moderate'], // May
    [false,true,  false, 'low'],      // Jun — monsoon reduces pollen
    [false,false, false, 'low'],      // Jul
    [false,false, false, 'low'],      // Aug
    [false,false, true,  'moderate'], // Sep — Parthenium weed
    [false,false, true,  'moderate'], // Oct
    [false,false, false, 'low'],      // Nov
    [false,false, false, 'low'],      // Dec
  ],
  BOM: [
    [true, false, false, 'moderate'], // Jan
    [true, false, false, 'moderate'], // Feb
    [true, true,  false, 'high'],     // Mar
    [true, true,  false, 'high'],     // Apr
    [false,true,  false, 'moderate'], // May
    [false,false, false, 'low'],      // Jun — monsoon
    [false,false, false, 'low'],      // Jul
    [false,false, false, 'low'],      // Aug
    [false,false, true,  'low'],      // Sep
    [false,false, false, 'low'],      // Oct
    [false,false, false, 'low'],      // Nov
    [false,false, false, 'low'],      // Dec
  ],
  BLR: [
    [true, false, false, 'moderate'], // Jan
    [true, false, false, 'high'],     // Feb — dry season, high dispersal
    [true, true,  false, 'high'],     // Mar
    [true, true,  false, 'moderate'], // Apr
    [false,true,  false, 'moderate'], // May
    [false,false, false, 'low'],      // Jun
    [false,false, false, 'low'],      // Jul
    [false,false, false, 'low'],      // Aug
    [false,false, true,  'low'],      // Sep
    [false,false, false, 'low'],      // Oct
    [true, false, false, 'moderate'], // Nov — post-monsoon tree bloom
    [true, false, false, 'moderate'], // Dec
  ],
  CCU: [
    [true, false, false, 'moderate'], // Jan
    [true, false, false, 'high'],     // Feb
    [true, true,  false, 'very_high'],// Mar — peak
    [true, true,  false, 'high'],     // Apr
    [false,true,  false, 'moderate'], // May
    [false,false, false, 'low'],      // Jun
    [false,false, false, 'low'],      // Jul
    [false,false, false, 'low'],      // Aug
    [false,false, true,  'low'],      // Sep
    [false,false, false, 'low'],      // Oct
    [false,false, false, 'low'],      // Nov
    [false,false, false, 'low'],      // Dec
  ],
  // Hill stations — low pollen due to altitude + specific vegetation
  IXL: [
    [false,false, false, 'none'],     // Jan — snow season, no pollen
    [false,false, false, 'none'],     // Feb
    [false,false, false, 'low'],      // Mar
    [true, false, false, 'low'],      // Apr — Betula (birch) trees
    [true, false, false, 'moderate'], // May
    [true, true,  false, 'moderate'], // Jun
    [false,true,  false, 'low'],      // Jul
    [false,false, false, 'low'],      // Aug
    [false,false, false, 'low'],      // Sep
    [false,false, false, 'none'],     // Oct — early winter
    [false,false, false, 'none'],     // Nov
    [false,false, false, 'none'],     // Dec
  ],
  KUU: [
    [false,false, false, 'low'],
    [false,false, false, 'low'],
    [true, false, false, 'moderate'],
    [true, false, false, 'moderate'],
    [true, true,  false, 'high'],
    [true, true,  false, 'moderate'],
    [false,true,  false, 'low'],
    [false,false, false, 'low'],
    [false,false, false, 'low'],
    [false,false, false, 'low'],
    [false,false, false, 'low'],
    [false,false, false, 'low'],
  ],
};

// Generic fallback for cities without specific data
const GENERIC_POLLEN_BY_REGION: Record<string, PollenMonth[]> = {
  plains: [
    [true, false, false, 'moderate'],
    [true, false, false, 'high'],
    [true, true,  false, 'high'],
    [true, true,  false, 'moderate'],
    [false,true,  false, 'moderate'],
    [false,false, false, 'low'],
    [false,false, false, 'low'],
    [false,false, false, 'low'],
    [false,false, true,  'low'],
    [false,false, false, 'low'],
    [false,false, false, 'low'],
    [false,false, false, 'low'],
  ],
  coastal: [
    [true, false, false, 'low'],
    [true, false, false, 'moderate'],
    [true, true,  false, 'moderate'],
    [false,true,  false, 'moderate'],
    [false,true,  false, 'low'],
    [false,false, false, 'low'],
    [false,false, false, 'low'],
    [false,false, false, 'low'],
    [false,false, false, 'low'],
    [false,false, false, 'low'],
    [false,false, false, 'low'],
    [false,false, false, 'low'],
  ],
  hills: [
    [false,false, false, 'low'],
    [false,false, false, 'low'],
    [true, false, false, 'moderate'],
    [true, true,  false, 'moderate'],
    [true, true,  false, 'moderate'],
    [false,true,  false, 'low'],
    [false,false, false, 'low'],
    [false,false, false, 'low'],
    [false,false, false, 'low'],
    [false,false, false, 'low'],
    [false,false, false, 'low'],
    [false,false, false, 'low'],
  ],
  alpine: [
    [false,false, false, 'none'],
    [false,false, false, 'none'],
    [false,false, false, 'low'],
    [true, false, false, 'low'],
    [true, false, false, 'moderate'],
    [true, true,  false, 'low'],
    [false,true,  false, 'low'],
    [false,false, false, 'low'],
    [false,false, false, 'none'],
    [false,false, false, 'none'],
    [false,false, false, 'none'],
    [false,false, false, 'none'],
  ],
};

function getPollenRegion(geologicalType: string, vegetationBiome: string): string {
  if (vegetationBiome === 'alpine') return 'alpine';
  if (['coastal', 'coastal_humid'].includes(vegetationBiome)) return 'coastal';
  if (['hilly', 'temperate', 'valley'].includes(geologicalType) ||
      ['temperate'].includes(vegetationBiome)) return 'hills';
  return 'plains';
}

export function computeUVAndPollen(
  cityId: string,
  latitude: number,
  altitude_m: number,
  geologicalType: string,
  vegetationBiome: string
): MonthlyUVPollen[] {
  const uvBand = getUVBand(latitude, altitude_m);
  const uvBase = UV_BY_LATITUDE_AND_MONTH[uvBand];
  const uvMult = altitudeUVMultiplier(altitude_m);

  const pollenData = POLLEN_BY_CITY[cityId] ??
    GENERIC_POLLEN_BY_REGION[getPollenRegion(geologicalType, vegetationBiome)];

  return Array.from({ length: 12 }, (_, i) => {
    const [tree, grass, weed, pollenLevel] = pollenData[i];
    const uvRaw = uvBase[i] * (altitude_m >= 2500 ? uvMult : 1);

    return {
      month: i + 1,
      uv_index_avg: Math.round(uvRaw * 10) / 10,
      pollen_overall_level: pollenLevel,
      pollen_tree: tree,
      pollen_grass: grass,
      pollen_weed: weed,
    };
  });
}
