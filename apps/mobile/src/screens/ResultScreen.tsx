/**
 * ResultScreen — tabbed result screen with Overview, Timeline, Risks tabs.
 * Saves trip to history on successful load.
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, ActivityIndicator, StatusBar,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { generateRecommendation } from '@acclimate/engine';
import type { RecommendationCard, RiskLevel, TimelineItem } from '@acclimate/engine';
import { fetchCities } from '../api';
import { RiskBadge } from '../components/RiskBadge';
import { Colors, Font, Radius, Spacing } from '../theme';
import { MONTHS } from '../cities';
import { addTripRecord } from '../storage';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;
type ActiveTab = 'overview' | 'timeline' | 'risks';

const RISK_DOMAIN_LABELS: Record<string, string> = {
  altitude:         'Altitude',
  humidity_shock:   'Humidity',
  heat_stress:      'Heat stress',
  cold_stress:      'Cold stress',
  air_quality:      'Air quality',
  uv_exposure:      'UV exposure',
  pollen_exposure:  'Pollen',
  gi_transition:    'GI / Stomach',
  sleep_disruption: 'Sleep',
  thermoregulation: 'Temp shift',
  vector_disease:   'Vector disease',
};

const RISK_DOMAIN_ICONS: Record<string, string> = {
  altitude:         '⛰️',
  humidity_shock:   '💧',
  heat_stress:      '🌡️',
  cold_stress:      '🧊',
  air_quality:      '🌫️',
  uv_exposure:      '☀️',
  pollen_exposure:  '🌸',
  gi_transition:    '🥗',
  sleep_disruption: '😴',
  thermoregulation: '🌡',
  vector_disease:   '🦟',
};

const PHASE_LABELS: Record<string, string> = {
  days_before:   'Before you travel',
  day_of_travel: 'Day of travel',
  first_3_days:  'First 3 days',
  ongoing:       'Ongoing',
};

const PHASE_COLORS: Record<string, string> = {
  days_before:   '#3B82F6',
  day_of_travel: '#8B5CF6',
  first_3_days:  '#10B981',
  ongoing:       '#6B7280',
};

const RISK_ORDER: RiskLevel[] = ['severe', 'high', 'moderate', 'low', 'none'];

export function ResultScreen({ navigation, route }: Props) {
  const { originId, originName, destId, destName, month, profile } = route.params;
  const [card,       setCard]       = useState<RecommendationCard | null>(null);
  const [error,      setError]      = useState<string | null>(null);
  const [activeTab,  setActiveTab]  = useState<ActiveTab>('overview');
  const savedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const { origin, destination } = await fetchCities(originId, destId, month);
        const result = generateRecommendation(origin, destination, profile);
        setCard(result);

        // Save to history exactly once
        if (!savedRef.current) {
          savedRef.current = true;
          await addTripRecord({
            id:           `${originId}-${destId}-${month}-${Date.now()}`,
            originId,
            originName,
            destId,
            destName,
            month,
            overall_risk: result.overall_risk,
            timestamp:    Date.now(),
          });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Could not load city data.';
        setError(msg);
      }
    })();
  }, []);

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Could not load data</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Text style={styles.retryText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!card) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.mid} />
          <Text style={styles.loadingText}>Analysing your trip…</Text>
          <Text style={styles.loadingSubtext}>Running on-device. No data sent.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const riskScores = card.risk_scores;
  const domainKeys = Object.keys(RISK_DOMAIN_LABELS) as (keyof typeof riskScores)[];

  // Top 3 high/severe/moderate domains for overview
  const topConcerns = domainKeys
    .filter(k => {
      const lvl = riskScores[k] as RiskLevel;
      return lvl === 'severe' || lvl === 'high' || lvl === 'moderate';
    })
    .sort((a, b) =>
      RISK_ORDER.indexOf(riskScores[a] as RiskLevel) -
      RISK_ORDER.indexOf(riskScores[b] as RiskLevel)
    )
    .slice(0, 3);

  // Group timeline by phase
  const phases: Record<string, TimelineItem[]> = {};
  for (const item of card.timeline) {
    if (!phases[item.phase]) phases[item.phase] = [];
    phases[item.phase].push(item);
  }
  const phaseOrder = ['days_before', 'day_of_travel', 'first_3_days', 'ongoing'];

  const sign = (n: number) => (n > 0 ? '+' : '');

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* ── Fixed dark header ───────────────────────────────────────────── */}
      <View style={styles.darkHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backText}>← Edit profile</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {originName} → {destName} · {MONTHS[month - 1]}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Hero risk card ──────────────────────────────────────────────── */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Overall Risk</Text>
          <Text style={[styles.heroRiskText, { color: Colors.risk[card.overall_risk].dot }]}>
            {card.overall_risk.toUpperCase()}
          </Text>

          {/* 4 stat boxes */}
          <View style={styles.statsGrid}>
            <StatBox
              label="Altitude change"
              value={`${sign(card.delta.altitude_diff_m)}${card.delta.altitude_diff_m}m`}
            />
            <StatBox
              label="Temp shift"
              value={`${sign(card.delta.temp_avg_diff_c)}${card.delta.temp_avg_diff_c.toFixed(1)}°C`}
            />
            <StatBox
              label="Humidity"
              value={`${sign(card.delta.humidity_diff_pct)}${card.delta.humidity_diff_pct.toFixed(0)}%`}
            />
            <StatBox
              label="AQI shift"
              value={card.delta.aqi_diff != null
                ? `${sign(card.delta.aqi_diff)}${card.delta.aqi_diff.toFixed(0)}`
                : '—'}
            />
          </View>
        </View>

        {/* ── Tab bar ─────────────────────────────────────────────────────── */}
        <View style={styles.tabBar}>
          {(['overview', 'timeline', 'risks'] as ActiveTab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Tab: Overview ───────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <View>
            {topConcerns.length > 0 && (
              <>
                <SectionLabel title="Top Concerns" />
                {topConcerns.map(key => (
                  <View key={String(key)} style={styles.concernCard}>
                    <Text style={styles.concernIcon}>{RISK_DOMAIN_ICONS[String(key)] ?? '•'}</Text>
                    <View style={styles.concernBody}>
                      <Text style={styles.concernName}>{RISK_DOMAIN_LABELS[String(key)]}</Text>
                      <Text style={styles.concernContext}>
                        {riskScores[key] === 'severe' || riskScores[key] === 'high'
                          ? 'Needs attention before travel.'
                          : 'Keep an eye on this.'}
                      </Text>
                    </View>
                    <RiskBadge level={riskScores[key] as RiskLevel} size="sm" />
                  </View>
                ))}
              </>
            )}

            <SectionLabel title="Environmental Delta" />
            <View style={styles.deltaTable}>
              <DeltaRow
                label="Temp shift"
                origin="Origin"
                dest="Destination"
                change={`${sign(card.delta.temp_avg_diff_c)}${card.delta.temp_avg_diff_c.toFixed(1)}°C`}
              />
              <DeltaRow
                label="Humidity"
                origin="Origin"
                dest="Destination"
                change={`${sign(card.delta.humidity_diff_pct)}${card.delta.humidity_diff_pct.toFixed(0)}%`}
              />
              <DeltaRow
                label="Altitude"
                origin="—"
                dest="—"
                change={`${sign(card.delta.altitude_diff_m)}${card.delta.altitude_diff_m}m`}
              />
              <DeltaRow
                label="Pressure"
                origin="—"
                dest="—"
                change={`${sign(card.delta.pressure_diff_hpa)}${card.delta.pressure_diff_hpa.toFixed(0)} hPa`}
              />
              <DeltaRow
                label="UV Index (dest)"
                origin="—"
                dest={card.delta.uv_index_dest != null ? `${card.delta.uv_index_dest.toFixed(1)}` : '—'}
                change="—"
                isLast
              />
            </View>
          </View>
        )}

        {/* ── Tab: Timeline ───────────────────────────────────────────────── */}
        {activeTab === 'timeline' && (
          <View>
            {phaseOrder.map(phase => {
              const items = phases[phase];
              if (!items?.length) return null;
              return (
                <View key={phase} style={styles.phaseGroup}>
                  <View style={styles.phaseHeader}>
                    <View style={[styles.phaseDot, { backgroundColor: PHASE_COLORS[phase] }]} />
                    <Text style={[styles.phaseTitle, { color: PHASE_COLORS[phase] }]}>
                      {PHASE_LABELS[phase]}
                    </Text>
                  </View>
                  {items.map((item, i) => (
                    <TimelineCard key={i} item={item} />
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* ── Tab: Risks ──────────────────────────────────────────────────── */}
        {activeTab === 'risks' && (
          <View>
            <SectionLabel title="Risk Domains" />
            <View style={styles.riskGrid}>
              {domainKeys.map(key => {
                const level = riskScores[key] as RiskLevel;
                if (!level) return null;
                return (
                  <View key={String(key)} style={styles.riskCell}>
                    <Text style={styles.riskCellIcon}>{RISK_DOMAIN_ICONS[String(key)] ?? '•'}</Text>
                    <Text style={styles.riskCellLabel}>{RISK_DOMAIN_LABELS[String(key)]}</Text>
                    <RiskBadge level={level} size="sm" />
                  </View>
                );
              })}
            </View>

            {card.data_notices.length > 0 && (
              <>
                <SectionLabel title="Data Notes" />
                {card.data_notices.map((n, i) => (
                  <View key={i} style={styles.noticeCard}>
                    <Text style={styles.noticeField}>{n.field.replace('_', ' ').toUpperCase()}</Text>
                    <Text style={styles.noticeMsg}>{n.message}</Text>
                  </View>
                ))}
              </>
            )}

            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerText}>{card.disclaimer}</Text>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionLabel({ title }: { title: string }) {
  return <Text style={styles.sectionLabel}>{title}</Text>;
}

function DeltaRow({
  label, origin, dest, change, isLast,
}: {
  label:   string;
  origin:  string;
  dest:    string;
  change:  string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.deltaRow, isLast && { borderBottomWidth: 0 }]}>
      <Text style={styles.deltaLabel}>{label}</Text>
      <Text style={styles.deltaCell}>{origin}</Text>
      <Text style={styles.deltaCell}>{dest}</Text>
      <Text style={[styles.deltaCell, styles.deltaCellChange]}>{change}</Text>
    </View>
  );
}

function TimelineCard({ item }: { item: TimelineItem }) {
  return (
    <View style={[styles.timelineCard, item.is_critical && styles.timelineCardCritical]}>
      <View style={styles.timelineCardTop}>
        <Text style={styles.timelineCategory}>{item.category}</Text>
        {item.is_critical && (
          <View style={styles.criticalBadge}>
            <Text style={styles.criticalText}>Critical</Text>
          </View>
        )}
        {item.phase === 'days_before' && item.days_before != null && (
          <Text style={styles.daysBeforeText}>{item.days_before}d before</Text>
        )}
      </View>
      <Text style={styles.timelineAdvice}>{item.advice}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: Spacing.xxl },

  centerContainer: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  errorIcon:    { fontSize: 40 },
  errorTitle:   { fontSize: Font.size.xl, fontWeight: Font.weight.bold, color: Colors.text },
  errorMsg:     { fontSize: Font.size.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  retryBtn:     { backgroundColor: Colors.mid, borderRadius: Radius.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  retryText:    { color: Colors.textOnDark, fontWeight: Font.weight.semibold },
  loadingText:  { fontSize: Font.size.lg, fontWeight: Font.weight.semibold, color: Colors.text, marginTop: Spacing.sm },
  loadingSubtext: { fontSize: Font.size.sm, color: Colors.textMuted },

  // Dark fixed header
  darkHeader: {
    backgroundColor:   Colors.primary,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical:   Spacing.md,
  },
  backBtn: {
    minWidth: 80,
  },
  backText: {
    fontSize:   Font.size.sm,
    color:      Colors.bright,
    fontWeight: Font.weight.medium,
  },
  headerTitle: {
    fontSize:   Font.size.sm,
    fontWeight: Font.weight.semibold,
    color:      Colors.textOnDark,
    flex:       1,
    textAlign:  'center',
  },

  // Hero card (dark bg)
  heroCard: {
    backgroundColor: Colors.hero,
    margin:          Spacing.lg,
    marginBottom:    0,
    borderRadius:    Radius.xl,
    padding:         Spacing.lg,
    shadowColor:     Colors.primary,
    shadowOpacity:   0.4,
    shadowRadius:    12,
    shadowOffset:    { width: 0, height: 4 },
    elevation:       6,
  },
  heroLabel: {
    fontSize:    Font.size.xs,
    color:       Colors.bright,
    fontWeight:  Font.weight.medium,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  heroRiskText: {
    fontSize:    Font.size.xxxl,
    fontWeight:  Font.weight.bold,
    marginBottom: Spacing.lg,
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    borderTopWidth:  1,
    borderTopColor:  'rgba(255,255,255,0.1)',
    paddingTop:     Spacing.md,
  },
  statBox:  { alignItems: 'center', flex: 1 },
  statValue: {
    fontSize:   Font.size.md,
    fontWeight: Font.weight.bold,
    color:      Colors.textOnDark,
    marginBottom: 4,
  },
  statLabel: {
    fontSize:  Font.size.xs,
    color:     'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },

  // Tab bar
  tabBar: {
    flexDirection:     'row',
    backgroundColor:   Colors.card,
    marginHorizontal:  Spacing.lg,
    marginTop:         Spacing.lg,
    marginBottom:      Spacing.md,
    borderRadius:      Radius.lg,
    padding:           4,
    shadowColor:       '#000',
    shadowOpacity:     0.05,
    shadowRadius:      6,
    shadowOffset:      { width: 0, height: 2 },
    elevation:         2,
  },
  tab: {
    flex:            1,
    paddingVertical: 10,
    alignItems:      'center',
    borderRadius:    Radius.md,
  },
  tabActive: {
    backgroundColor: Colors.mid,
    shadowColor:     Colors.mid,
    shadowOpacity:   0.3,
    shadowRadius:    6,
    shadowOffset:    { width: 0, height: 2 },
    elevation:       3,
  },
  tabText: {
    fontSize:   Font.size.sm,
    fontWeight: Font.weight.semibold,
    color:      Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.textOnDark,
  },

  sectionLabel: {
    fontSize:          Font.size.xs,
    fontWeight:        Font.weight.bold,
    color:             Colors.textMuted,
    letterSpacing:     0.8,
    marginBottom:      Spacing.sm,
    marginTop:         Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },

  // Concern cards (overview)
  concernCard: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    marginBottom:    Spacing.sm,
    borderRadius:    Radius.lg,
    padding:         Spacing.md,
    shadowColor:     '#000',
    shadowOpacity:   0.04,
    shadowRadius:    6,
    shadowOffset:    { width: 0, height: 2 },
    elevation:       2,
  },
  concernIcon: { fontSize: 24, marginRight: Spacing.md },
  concernBody: { flex: 1 },
  concernName: {
    fontSize:    Font.size.md,
    fontWeight:  Font.weight.semibold,
    color:       Colors.text,
    marginBottom: 2,
  },
  concernContext: { fontSize: Font.size.xs, color: Colors.textMuted },

  // Delta table (overview)
  deltaTable: {
    backgroundColor:   Colors.card,
    marginHorizontal:  Spacing.lg,
    borderRadius:      Radius.lg,
    marginBottom:      Spacing.md,
    overflow:          'hidden',
    shadowColor:       '#000',
    shadowOpacity:     0.04,
    shadowRadius:      6,
    shadowOffset:      { width: 0, height: 2 },
    elevation:         2,
  },
  deltaRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Spacing.md,
    paddingVertical:   12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  deltaLabel: {
    flex:       1.2,
    fontSize:   Font.size.xs,
    color:      Colors.textMuted,
    fontWeight: Font.weight.medium,
  },
  deltaCell: {
    flex:       1,
    fontSize:   Font.size.sm,
    color:      Colors.text,
    textAlign:  'right',
    fontWeight: Font.weight.medium,
  },
  deltaCellChange: {
    color:      Colors.mid,
    fontWeight: Font.weight.bold,
  },

  // Phase groups (timeline)
  phaseGroup:  { marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  phaseHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  Spacing.sm,
    gap:           Spacing.sm,
  },
  phaseDot:   { width: 8, height: 8, borderRadius: 4 },
  phaseTitle: { fontSize: Font.size.sm, fontWeight: Font.weight.bold },

  timelineCard: {
    backgroundColor:  Colors.card,
    borderRadius:     Radius.md,
    padding:          Spacing.md,
    marginBottom:     Spacing.sm,
    borderLeftWidth:  3,
    borderLeftColor:  Colors.border,
    shadowColor:      '#000',
    shadowOpacity:    0.04,
    shadowRadius:     6,
    shadowOffset:     { width: 0, height: 2 },
    elevation:        1,
  },
  timelineCardCritical: { borderLeftColor: '#EF4444' },
  timelineCardTop: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  6,
    gap:           Spacing.sm,
  },
  timelineCategory: {
    fontSize:   Font.size.sm,
    fontWeight: Font.weight.bold,
    color:      Colors.text,
    flex:       1,
  },
  criticalBadge: {
    backgroundColor:  '#FEF2F2',
    borderRadius:     Radius.full,
    paddingHorizontal: 8,
    paddingVertical:   2,
  },
  criticalText: { fontSize: Font.size.xs, fontWeight: Font.weight.bold, color: '#991B1B' },
  daysBeforeText: { fontSize: Font.size.xs, color: '#3B82F6', fontWeight: Font.weight.semibold },
  timelineAdvice: { fontSize: Font.size.sm, color: Colors.textMuted, lineHeight: 20 },

  // Risk grid (risks tab)
  riskGrid: {
    flexDirection:     'row',
    flexWrap:          'wrap',
    gap:               Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom:      Spacing.md,
  },
  riskCell: {
    backgroundColor: Colors.card,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    width:           '47%',
    shadowColor:     '#000',
    shadowOpacity:   0.04,
    shadowRadius:    6,
    shadowOffset:    { width: 0, height: 2 },
    elevation:       1,
  },
  riskCellIcon:  { fontSize: 22, marginBottom: 6 },
  riskCellLabel: {
    fontSize:    Font.size.xs,
    color:       Colors.textMuted,
    marginBottom: 6,
    fontWeight:  Font.weight.medium,
  },

  // Notices
  noticeCard: {
    backgroundColor:  '#FFFBEB',
    borderRadius:     Radius.md,
    padding:          Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom:     Spacing.sm,
    borderLeftWidth:  3,
    borderLeftColor:  '#F59E0B',
  },
  noticeField: { fontSize: Font.size.xs, fontWeight: Font.weight.bold, color: '#92400E', marginBottom: 4 },
  noticeMsg:   { fontSize: Font.size.sm, color: '#78350F', lineHeight: 18 },

  // Disclaimer
  disclaimer: {
    marginHorizontal: Spacing.lg,
    marginTop:        Spacing.md,
    padding:          Spacing.md,
    backgroundColor:  Colors.card,
    borderRadius:     Radius.md,
  },
  disclaimerText: {
    fontSize:  Font.size.xs,
    color:     Colors.textMuted,
    lineHeight: 18,
    textAlign: 'center',
  },
});
