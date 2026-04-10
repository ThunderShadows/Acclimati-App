import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Font, Radius, Spacing } from '../theme';
import { RiskBadge } from '../components/RiskBadge';
import { useRecentTrips } from '../hooks/useRecentTrips';
import type { RootStackParamList } from '../../App';
import { MONTHS } from '../cities';
import type { RiskLevel } from '@acclimate/engine';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface PopularRoute {
  originId: string;
  originName: string;
  destId: string;
  destName: string;
  emoji: string;
  tag: string;
}

const POPULAR_ROUTES: PopularRoute[] = [
  { originId: 'DEL', originName: 'Delhi',     destId: 'IXL', destName: 'Leh',    emoji: '⛰️', tag: '3524m altitude change' },
  { originId: 'BOM', originName: 'Mumbai',    destId: 'GOI', destName: 'Goa',    emoji: '🌊', tag: 'Coastal escape' },
  { originId: 'DEL', originName: 'Delhi',     destId: 'SLV', destName: 'Shimla', emoji: '🌿', tag: 'Hill station' },
  { originId: 'BLR', originName: 'Bengaluru', destId: 'OOT', destName: 'Ooty',   emoji: '🌸', tag: 'Nilgiris' },
];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const { trips, refresh } = useRecentTrips();

  // Refresh trip history whenever the tab comes into focus
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header row ─────────────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingSmall}>{greeting()} 👋</Text>
            <Text style={styles.greetingLarge}>Plan your trip</Text>
          </View>
          <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.7}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* ── Hero CTA card ───────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.heroCard}
          onPress={() => navigation.navigate('CityPicker')}
          activeOpacity={0.88}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroLabel}>Where are you headed?</Text>
              <Text style={styles.heroCta}>Plan a new trip</Text>
              <Text style={styles.heroSub}>30 Indian cities · ERA5 climate data</Text>
            </View>
            <View style={styles.heroArrow}>
              <Text style={styles.heroArrowText}>→</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* ── Recent trips ───────────────────────────────────────────── */}
        {trips.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>RECENT TRIPS</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentRow}
            >
              {trips.map(trip => (
                <TouchableOpacity
                  key={trip.id}
                  style={styles.recentCard}
                  activeOpacity={0.8}
                  onPress={() =>
                    navigation.navigate('CityPicker')
                  }
                >
                  <Text style={styles.recentRoute} numberOfLines={1}>
                    {trip.originName} → {trip.destName}
                  </Text>
                  <Text style={styles.recentMonth}>{MONTHS[trip.month - 1]}</Text>
                  <View style={styles.recentBadgeRow}>
                    <RiskBadge level={trip.overall_risk as RiskLevel} size="sm" />
                  </View>
                  <Text style={styles.recentTime}>{relativeTime(trip.timestamp)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* ── Popular routes ──────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>POPULAR ROUTES</Text>
        <View style={styles.popularGrid}>
          {POPULAR_ROUTES.map(route => (
            <TouchableOpacity
              key={`${route.originId}-${route.destId}`}
              style={styles.popularCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('CityPicker')}
            >
              <Text style={styles.popularEmoji}>{route.emoji}</Text>
              <Text style={styles.popularRoute} numberOfLines={1}>
                {route.originName} → {route.destName}
              </Text>
              <Text style={styles.popularTag} numberOfLines={1}>
                {route.tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Privacy note ────────────────────────────────────────────── */}
        <Text style={styles.privacyNote}>
          All computation runs on your device. No health data shared.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function relativeTime(ts: number): string {
  const diffMs = Date.now() - ts;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: Spacing.xxl },

  // Header
  headerRow: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop:        Spacing.md,
    paddingBottom:     Spacing.lg,
  },
  greetingSmall: {
    fontSize:   Font.size.sm,
    color:      Colors.textMuted,
    marginBottom: 4,
  },
  greetingLarge: {
    fontSize:   Font.size.xxl,
    fontWeight: Font.weight.bold,
    color:      Colors.text,
  },
  settingsBtn: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: Colors.card,
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     '#000',
    shadowOpacity:   0.06,
    shadowRadius:    8,
    shadowOffset:    { width: 0, height: 2 },
    elevation:       2,
  },
  settingsIcon: { fontSize: 18 },

  // Hero card
  heroCard: {
    backgroundColor: Colors.hero,
    borderRadius:    Radius.xl,
    marginHorizontal: Spacing.lg,
    marginBottom:    Spacing.xl,
    shadowColor:     Colors.primary,
    shadowOpacity:   0.4,
    shadowRadius:    16,
    shadowOffset:    { width: 0, height: 6 },
    elevation:       8,
  },
  heroContent: {
    flexDirection:  'row',
    alignItems:     'center',
    padding:        Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  heroLeft: {
    flex: 1,
  },
  heroLabel: {
    fontSize:   Font.size.sm,
    color:      Colors.bright,
    marginBottom: 6,
    fontWeight: Font.weight.medium,
  },
  heroCta: {
    fontSize:   Font.size.xl,
    fontWeight: Font.weight.bold,
    color:      Colors.textOnDark,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: Font.size.xs,
    color:    'rgba(255,255,255,0.5)',
  },
  heroArrow: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: Colors.mid,
    alignItems:      'center',
    justifyContent:  'center',
    marginLeft:      Spacing.md,
  },
  heroArrowText: {
    fontSize:   Font.size.xl,
    color:      Colors.textOnDark,
    fontWeight: Font.weight.bold,
  },

  // Section labels
  sectionLabel: {
    fontSize:          Font.size.xs,
    fontWeight:        Font.weight.bold,
    color:             Colors.textMuted,
    letterSpacing:     0.8,
    marginBottom:      Spacing.md,
    marginTop:         Spacing.xs,
    paddingHorizontal: Spacing.lg,
  },

  // Recent trips
  recentRow: {
    paddingHorizontal: Spacing.lg,
    paddingBottom:     Spacing.lg,
    gap:               Spacing.md,
  },
  recentCard: {
    backgroundColor: Colors.card,
    borderRadius:    Radius.lg,
    padding:         Spacing.md,
    width:           160,
    shadowColor:     '#000',
    shadowOpacity:   0.05,
    shadowRadius:    8,
    shadowOffset:    { width: 0, height: 2 },
    elevation:       2,
  },
  recentRoute: {
    fontSize:    Font.size.sm,
    fontWeight:  Font.weight.semibold,
    color:       Colors.text,
    marginBottom: 4,
  },
  recentMonth: {
    fontSize:    Font.size.xs,
    color:       Colors.textMuted,
    marginBottom: 8,
  },
  recentBadgeRow: {
    marginBottom: 8,
  },
  recentTime: {
    fontSize: Font.size.xs,
    color:    Colors.textLight,
  },

  // Popular routes grid
  popularGrid: {
    flexDirection:     'row',
    flexWrap:          'wrap',
    paddingHorizontal: Spacing.lg,
    gap:               Spacing.md,
    marginBottom:      Spacing.lg,
  },
  popularCard: {
    backgroundColor: Colors.card,
    borderRadius:    Radius.lg,
    padding:         Spacing.md,
    width:           '47%',
    shadowColor:     '#000',
    shadowOpacity:   0.05,
    shadowRadius:    8,
    shadowOffset:    { width: 0, height: 2 },
    elevation:       2,
  },
  popularEmoji: {
    fontSize:    24,
    marginBottom: 8,
  },
  popularRoute: {
    fontSize:    Font.size.sm,
    fontWeight:  Font.weight.semibold,
    color:       Colors.text,
    marginBottom: 4,
  },
  popularTag: {
    fontSize: Font.size.xs,
    color:    Colors.textMuted,
  },

  // Privacy note
  privacyNote: {
    fontSize:   Font.size.xs,
    color:      Colors.textLight,
    textAlign:  'center',
    paddingHorizontal: Spacing.xl,
    marginTop:  Spacing.md,
  },
});
