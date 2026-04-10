/**
 * Fetches 12-month climate averages from Open-Meteo ERA5 Archive API.
 * Free, no API key required. ERA5 is the global gold standard reanalysis dataset
 * used by meteorological agencies worldwide — fully accurate for India.
 *
 * Strategy: fetch 3 years of hourly data (2021–2023), aggregate to monthly averages.
 * 3-year average smooths out anomalous years better than a single year snapshot.
 */

import axios from 'axios';

const BASE_URL  = 'https://archive-api.open-meteo.com/v1/archive';
const START     = '2021-01-01';
const END       = '2023-12-31';

export interface MonthlyClimate {
  month: number;
  temp_avg_c: number;
  temp_min_c: number;
  temp_max_c: number;
  diurnal_range_c: number;
  humidity_avg_pct: number;
  humidity_min_pct: number;
  humidity_max_pct: number;
  rainfall_avg_mm: number;
  wind_speed_avg_kmh: number;
  pressure_hpa: number;
  is_monsoon_month: boolean;
  season: string;
}

function getSeason(month: number, latitude: number): string {
  const isTropical = latitude < 15;
  if (isTropical) {
    if ([6, 7, 8, 9].includes(month))  return 'monsoon';
    if ([10, 11].includes(month))       return 'post_monsoon';
    if ([12, 1, 2].includes(month))     return 'winter';
    return 'summer';
  }
  if ([12, 1, 2].includes(month))       return 'winter';
  if ([3, 4, 5].includes(month))        return 'spring';
  if ([6, 7, 8, 9].includes(month))     return 'monsoon';
  return 'post_monsoon';
}

function pressureFromAltitude(altitude_m: number): number {
  return Math.round(1013.25 * Math.pow(1 - altitude_m / 44330, 5.255) * 10) / 10;
}

/**
 * Aggregates flat hourly arrays into 12-month averages.
 * Each hourly entry has a corresponding ISO datetime string.
 */
function aggregateHourlyToMonthly(
  times: string[],
  temp: number[],
  humidity: number[],
  precip: number[],
  wind: number[],
  altitude_m: number,
  latitude: number
): MonthlyClimate[] {
  // Accumulators: index 0 = January … 11 = December
  const buckets = Array.from({ length: 12 }, () => ({
    temps: [] as number[],
    humidities: [] as number[],
    precips: [] as number[],
    winds: [] as number[],
    dailyMaxByDay: {} as Record<string, number>,
    dailyMinByDay: {} as Record<string, number>,
  }));

  for (let i = 0; i < times.length; i++) {
    const t = times[i];
    if (!t) continue;
    const date     = new Date(t);
    const monthIdx = date.getUTCMonth();     // 0–11
    const dayKey   = t.slice(0, 10);         // "2022-06-01"

    const b = buckets[monthIdx];
    if (temp[i] !== null && temp[i] !== undefined)     b.temps.push(temp[i]);
    if (humidity[i] !== null && humidity[i] !== undefined) b.humidities.push(humidity[i]);
    if (precip[i] !== null && precip[i] !== undefined) b.precips.push(precip[i]);
    if (wind[i] !== null && wind[i] !== undefined)     b.winds.push(wind[i]);

    // Track daily max/min for diurnal range
    if (temp[i] !== null && temp[i] !== undefined) {
      if (b.dailyMaxByDay[dayKey] === undefined || temp[i] > b.dailyMaxByDay[dayKey]) {
        b.dailyMaxByDay[dayKey] = temp[i];
      }
      if (b.dailyMinByDay[dayKey] === undefined || temp[i] < b.dailyMinByDay[dayKey]) {
        b.dailyMinByDay[dayKey] = temp[i];
      }
    }
  }

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  return buckets.map((b, idx) => {
    const month       = idx + 1;
    const tempAvg     = avg(b.temps);
    const dailyMaxes  = Object.values(b.dailyMaxByDay);
    const dailyMins   = Object.values(b.dailyMinByDay);
    const tempMax     = dailyMaxes.length ? Math.max(...dailyMaxes) : tempAvg + 5;
    const tempMin     = dailyMins.length  ? Math.min(...dailyMins)  : tempAvg - 5;
    // Average diurnal range (avg daily high - avg daily low across all days)
    const avgDailyMax = avg(dailyMaxes);
    const avgDailyMin = avg(dailyMins);
    const diurnal     = avgDailyMax - avgDailyMin;

    const humAvg = avg(b.humidities);
    const humMin = Math.max(0,   Math.round(humAvg * 0.70));
    const humMax = Math.min(100, Math.round(humAvg * 1.15));

    // Precip: sum per year averaged (hourly precip summed = monthly total / 3 years)
    const monthlyRain = b.precips.reduce((a, v) => a + v, 0) / 3;

    return {
      month,
      temp_avg_c:         Math.round(tempAvg  * 10) / 10,
      temp_min_c:         Math.round(tempMin  * 10) / 10,
      temp_max_c:         Math.round(tempMax  * 10) / 10,
      diurnal_range_c:    Math.round(diurnal  * 10) / 10,
      humidity_avg_pct:   Math.round(humAvg),
      humidity_min_pct:   humMin,
      humidity_max_pct:   humMax,
      rainfall_avg_mm:    Math.round(monthlyRain * 10) / 10,
      wind_speed_avg_kmh: Math.round(avg(b.winds) * 10) / 10,
      pressure_hpa:       pressureFromAltitude(altitude_m),
      is_monsoon_month:   getSeason(month, latitude) === 'monsoon',
      season:             getSeason(month, latitude),
    };
  });
}

export async function fetchClimate(
  latitude: number,
  longitude: number,
  altitude_m: number,
  cityName: string
): Promise<MonthlyClimate[]> {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        latitude,
        longitude,
        start_date: START,
        end_date:   END,
        hourly: [
          'temperature_2m',
          'relative_humidity_2m',
          'precipitation',
          'wind_speed_10m',
        ].join(','),
        timezone: 'auto',
      },
      timeout: 30000,   // archive API can be slower — 30s timeout
    });

    const hourly = response.data?.hourly;
    if (!hourly) throw new Error('No hourly data in Open-Meteo Archive response');

    const result = aggregateHourlyToMonthly(
      hourly.time,
      hourly.temperature_2m,
      hourly.relative_humidity_2m,
      hourly.precipitation,
      hourly.wind_speed_10m,
      altitude_m,
      latitude
    );

    console.log(`  ✓ Climate fetched for ${cityName} (ERA5 2021–2023)`);
    return result;

  } catch (err: any) {
    console.error(`  ✗ Climate fetch failed for ${cityName}: ${err.message}`);
    if (err.response?.data) {
      console.error(`    API response: ${JSON.stringify(err.response.data)}`);
    }
    throw err;
  }
}
