import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { generateRecommendation } from '@acclimate/engine';
import type { RecommendationCard, RiskLevel, TimelineItem } from '@acclimate/engine';
import { fetchCities } from '../api';
import { RiskBadge } from '../components/RiskBadge';
import { RouteArc, ElevationChart } from '../components/RouteArc';
import { WeatherSticker } from '../components/WeatherSticker';
import { Colors, Radius, Spacing } from '../theme';
import { MONTHS } from '../cities';
import { addTripRecord } from '../storage';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;
type Tab = 'Overview' | 'Timeline' | 'Risks';

const DOMAIN_LABELS: Record<string, string> = {
  altitude: 'Altitude', humidity_shock: 'Humidity shift', heat_stress: 'Heat stress',
  cold_stress: 'Cold stress', air_quality: 'Air quality', uv_exposure: 'UV exposure',
  pollen_exposure: 'Pollen', gi_transition: 'Digestion', sleep_disruption: 'Sleep',
  thermoregulation: 'Thermoregulation', vector_disease: 'Vector disease',
};

const DOMAIN_ICONS: Record<string, string> = {
  altitude: '⛰', humidity_shock: '💧', heat_stress: '🌡', cold_stress: '🧊',
  air_quality: '🌬', uv_exposure: '☀', pollen_exposure: '🌿', gi_transition: '🥗',
  sleep_disruption: '🌙', thermoregulation: '⚡', vector_disease: '🦟',
};

const DOMAIN_DESC: Record<string, string> = {
  altitude: 'Thinner air above 1,500 m', humidity_shock: 'Moisture level change',
  heat_stress: 'Daytime temperature load', cold_stress: 'Low-temp exposure',
  air_quality: 'Particulate & ozone delta', uv_exposure: 'Skin & eye burn risk',
  pollen_exposure: 'Seasonal airborne allergens', gi_transition: 'Diet & microbiome change',
  sleep_disruption: 'Circadian adjustment', thermoregulation: 'Body heat balance',
  vector_disease: 'Mosquito-borne illness',
};

const PHASE_LABELS: Record<string, string> = {
  days_before: 'Before you go', day_of_travel: 'Travel day',
  first_3_days: 'First 3 days', ongoing: 'While you are there',
};

const RISK_HERO: Record<string, { bg: string; color: string; msg: string }> = {
  none:     { bg: '#D7ECDF', color: '#2E8266', msg: 'Enjoy the trip.' },
  low:      { bg: '#F2E6B7', color: '#7A6416', msg: 'Stay mindful.' },
  moderate: { bg: '#F6D9B8', color: '#B06528', msg: 'Prep ahead.' },
  high:     { bg: '#F5C9BF', color: '#B0362B', msg: 'Plan carefully.' },
  severe:   { bg: '#E3CEED', color: '#6B3A8F', msg: 'Consult a doctor.' },
};

const RISK_ORDER: RiskLevel[] = ['severe', 'high', 'moderate', 'low', 'none'];

export function ResultScreen({ navigation, route }: Props) {
  const { originId, originName, destId, destName, month, profile } = route.params;
  const [card, setCard] = useState<RecommendationCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('Overview');
  const [originCity, setOriginCity] = useState<any>(null);
  const [destCity, setDestCity] = useState<any>(null);
  const savedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const { origin, destination } = await fetchCities(originId, destId, month);
        setOriginCity(origin);
        setDestCity(destination);
        const result = generateRecommendation(origin, destination, profile);
        setCard(result);
        if (!savedRef.current) {
          savedRef.current = true;
          await addTripRecord({
            id: `${originId}-${destId}-${month}-${Date.now()}`,
            originId, originName, destId, destName, month,
            overall_risk: result.overall_risk, timestamp: Date.now(),
          });
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Could not load city data.');
      }
    })();
  }, []);

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <Text style={{ fontSize: 32, marginBottom: 16 }}>⚠️</Text>
          <Text style={styles.errorTitle}>Could not load data</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.retryText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!card) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary}/>
          <Text style={styles.loadingText}>Analysing your trip…</Text>
          <Text style={styles.loadingSub}>Running on-device. No data sent.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hero = RISK_HERO[card.overall_risk] ?? RISK_HERO.low;
  const domainKeys = Object.keys(DOMAIN_LABELS);
  const riskScores = card.risk_scores as unknown as Record<string, RiskLevel>;

  // Group timeline
  const phases: Record<string, TimelineItem[]> = {};
  for (const item of card.timeline) {
    if (!phases[item.phase]) phases[item.phase] = [];
    phases[item.phase].push(item);
  }

  const topItems = card.timeline.filter(t => t.is_critical).slice(0, 3).concat(
  card.timeline.filter(t => !t.is_critical)
).slice(0, 3);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg}/>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.headerBack}>← Edit</Text>
        </TouchableOpacity>
        <Text style={styles.headerLabel}>Your plan</Text>
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => navigation.navigate('Main')}
          activeOpacity={0.85}
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Trip hero */}
        <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
          <Text style={styles.eyebrow}>{MONTHS[month - 1]} trip</Text>
          <Text style={styles.tripTitle}>{originName} → {destName}</Text>
          {/* Risk hero card */}
          <View style={[styles.riskHero, { backgroundColor: hero.bg }]}>
            <View style={[styles.riskDot, { backgroundColor: hero.color }]}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                {(card.overall_risk[0] ?? '?').toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.riskLabel, { color: hero.color }]}>Overall risk</Text>
              <Text style={[styles.riskLevel, { color: hero.color }]}>
                {card.overall_risk.charAt(0).toUpperCase() + card.overall_risk.slice(1)}
              </Text>
            </View>
            <Text style={[styles.riskMsg, { color: hero.color }]}>{hero.msg}</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
          <View style={styles.tabs}>
            {(['Overview', 'Timeline', 'Risks'] as Tab[]).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.tabBtn, tab === t && styles.tabBtnOn]}
                onPress={() => setTab(t)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }}>
          {tab === 'Overview' && (
            <View style={{ gap: 16 }}>
              {/* Route arc */}
              <View style={styles.card}>
                <RouteArc
                  origin={{ name: originName, alt: originCity?.altitude_m ?? 0 }}
                  dest={{ name: destName, alt: destCity?.altitude_m ?? 0 }}
                  height={100}
                />
                {originCity && destCity && (
                  <ElevationChart
                    originAlt={originCity.altitude_m}
                    destAlt={destCity.altitude_m}
                    height={64}
                  />
                )}
              </View>

              {/* What changes stickers */}
              {originCity && destCity && (
                <View>
                  <Text style={styles.subLabel}>WHAT CHANGES</Text>
                  <View style={styles.stickersGrid}>
                    <WeatherSticker icon="thermo" value={destCity.climate?.temp_avg_c ?? '—'} unit="°C" label={`was ${originCity.climate?.temp_avg_c ?? '—'}°`}/>
                    <WeatherSticker icon="droplet" value={destCity.climate?.humidity_avg_pct ?? '—'} unit="%" label={`was ${originCity.climate?.humidity_avg_pct ?? '—'}%`}/>
                    <WeatherSticker icon="mountain" value={destCity.altitude_m} unit="m" label={`was ${originCity.altitude_m}m`}/>
                    <WeatherSticker icon="wind" value={destCity.climate?.aqi_avg ?? '—'} unit="aqi" label={`was ${originCity.climate?.aqi_avg ?? '—'}`}/>
                    <WeatherSticker icon="sun" value={destCity.climate?.uv_index_avg ?? '—'} unit="uv" label={`was ${originCity.climate?.uv_index_avg ?? '—'}`}/>
                    <WeatherSticker icon="leaf" value={destCity.climate?.pollen_overall_level ?? '—'} unit="" label={`was ${originCity.climate?.pollen_overall_level ?? '—'}`}/>
                  </View>
                </View>
              )}

              {/* Top actions */}
              {topItems.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.subLabel}>TOP ACTIONS</Text>
                  {topItems.map((item, i) => (
                    <View key={i} style={[styles.actionRow, i < topItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.line }]}>
                      <View style={styles.actionIcon}>
                        <Text style={{ fontSize: 14 }}>{PHASE_ICON[item.phase] ?? '·'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.actionTitle}>{item.category}</Text>
                        <Text style={styles.actionBody}>{item.advice}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {tab === 'Timeline' && (
            <View style={{ gap: 14 }}>
              {['days_before', 'day_of_travel', 'first_3_days', 'ongoing'].map(phase => {
                const items = phases[phase];
                if (!items?.length) return null;
                return (
                  <View key={phase}>
                    <Text style={[styles.subLabel, { color: Colors.mid }]}>{PHASE_LABELS[phase]?.toUpperCase()}</Text>
                    <View style={{ gap: 8 }}>
                      {items.map((item, i) => (
                        <View key={i} style={styles.timelineCard}>
                          <View style={styles.timelineIcon}>
                            <Text style={{ fontSize: 16 }}>{PHASE_ICON[item.phase] ?? '·'}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            {item.days_before != null && (
                              <Text style={styles.daysBefore}>{item.days_before} DAYS BEFORE</Text>
                            )}
                            <Text style={[styles.timelineTitle, item.is_critical && { color: Colors.coral }]}>{item.category}</Text>
                            <Text style={styles.timelineBody}>{item.advice}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
              {card.timeline.length === 0 && (
                <Text style={{ textAlign: 'center', color: Colors.inkFaint, fontSize: 13, padding: 40 }}>
                  No preparation needed. Have a great trip.
                </Text>
              )}
            </View>
          )}

          {tab === 'Risks' && (
            <View style={{ gap: 8 }}>
              {domainKeys.map(key => {
                const level = riskScores[key] ?? 'none';
                const riskColors = Colors.risk[level as keyof typeof Colors.risk];
                return (
                  <View key={key} style={[styles.riskRow, { borderColor: Colors.line }]}>
                    <View style={styles.domainIcon}>
                      <Text style={{ fontSize: 16 }}>{DOMAIN_ICONS[key] ?? '·'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.domainLabel}>{DOMAIN_LABELS[key]}</Text>
                      <Text style={styles.domainDesc}>{DOMAIN_DESC[key]}</Text>
                    </View>
                    <RiskBadge level={level} size="sm"/>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const PHASE_ICON: Record<string, string> = {
  days_before: '📋', day_of_travel: '✈', first_3_days: '⛰', ongoing: '🕐',
};

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 0,
  },
  headerBack:  { fontSize: 14, color: Colors.inkFaint, letterSpacing: 0.5 },
  headerLabel: { fontSize: 12, color: Colors.inkFaint, letterSpacing: 0.5 },
  doneBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 999,
  },
  doneBtnText: { fontSize: 12, fontWeight: '600', color: '#F6F3EC' },

  scroll: { paddingBottom: 32 },
  eyebrow: { fontSize: 11, color: Colors.inkFaint, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '600' },
  tripTitle: { fontSize: 28, lineHeight: 32, fontWeight: '500', color: Colors.ink, marginTop: 6, marginBottom: 14 },

  riskHero: {
    borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  riskDot: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  riskLabel: { fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '600' },
  riskLevel: { fontSize: 18, fontWeight: '500', marginTop: 2 },
  riskMsg:   { fontSize: 11, opacity: 0.8, textAlign: 'right', lineHeight: 16 },

  tabs: {
    flexDirection: 'row', gap: 4, padding: 4,
    backgroundColor: Colors.surface2, borderRadius: 12,
  },
  tabBtn: {
    flex: 1, height: 36, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  tabBtnOn: { backgroundColor: Colors.surface, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 2, elevation: 1 },
  tabText:   { fontSize: 13, fontWeight: '500', color: Colors.inkSoft },
  tabTextOn: { color: Colors.ink },

  subLabel: {
    fontSize: 11, color: Colors.inkFaint, letterSpacing: 1,
    textTransform: 'uppercase', fontWeight: '600', marginBottom: 10,
  },

  card: {
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.line,
    padding: 14, paddingBottom: 16,
  },

  stickersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  actionRow: {
    flexDirection: 'row', gap: 12, paddingVertical: 10,
  },
  actionIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.tealSoft, alignItems: 'center', justifyContent: 'center',
  },
  actionTitle: { fontSize: 13, fontWeight: '600', color: Colors.ink },
  actionBody:  { fontSize: 12, color: Colors.inkSoft, marginTop: 2, lineHeight: 17 },

  timelineCard: {
    flexDirection: 'row', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.line, padding: 12,
  },
  timelineIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: Colors.tealSoft, alignItems: 'center', justifyContent: 'center',
  },
  daysBefore:    { fontSize: 10, color: Colors.inkFaint, fontWeight: '600', letterSpacing: 0.5 },
  timelineTitle: { fontSize: 14, fontWeight: '600', color: Colors.ink, marginTop: 2 },
  timelineBody:  { fontSize: 12, color: Colors.inkSoft, marginTop: 3, lineHeight: 17 },

  riskRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, padding: 12,
  },
  domainIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: Colors.tealSoft, alignItems: 'center', justifyContent: 'center',
  },
  domainLabel: { fontSize: 13, fontWeight: '600', color: Colors.ink },
  domainDesc:  { fontSize: 11, color: Colors.inkFaint, marginTop: 2 },

  errorTitle:   { fontSize: 20, fontWeight: '600', color: Colors.ink, marginBottom: 8 },
  errorMsg:     { fontSize: 13, color: Colors.inkSoft, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  retryBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.lg,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  retryText:    { color: '#F6F3EC', fontWeight: '600', fontSize: 14 },
  loadingText:  { fontSize: 16, fontWeight: '500', color: Colors.ink, marginTop: 16 },
  loadingSub:   { fontSize: 12, color: Colors.inkFaint, marginTop: 4 },
});
