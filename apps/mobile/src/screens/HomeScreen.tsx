import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Radius, Spacing } from '../theme';
import { RiskBadge } from '../components/RiskBadge';
import { AcclimateLogo } from '../components/AcclimateLogo';
import { RouteArc } from '../components/RouteArc';
import { useRecentTrips } from '../hooks/useRecentTrips';
import type { RootStackParamList } from '../../App';
import { MONTHS } from '../cities';
import type { RiskLevel } from '@acclimate/engine';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const POPULAR_ROUTES = [
  { originId: 'DEL', originName: 'Delhi',     destId: 'IXL', destName: 'Leh',    note: '3,308 m up',    icon: '⛰' },
  { originId: 'BOM', originName: 'Mumbai',    destId: 'GOI', destName: 'Goa',    note: 'Coastal escape', icon: '💧' },
  { originId: 'BLR', originName: 'Bengaluru', destId: 'OOT', destName: 'Ooty',   note: 'Nilgiris',      icon: '🌿' },
  { originId: 'DEL', originName: 'Delhi',     destId: 'SLV', destName: 'Shimla', note: 'Hill station',  icon: '⛰' },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const { trips, refresh } = useRecentTrips();

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const recent = trips[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg}/>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <AcclimateLogo size={40} dark={false}/>
            <View>
              <Text style={styles.greeting}>{greeting()}</Text>
              <Text style={styles.name}>Traveler</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => navigation.navigate('Notifications' as any)}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 18 }}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Hero CTA */}
        <TouchableOpacity
          style={styles.hero}
          onPress={() => navigation.navigate('CityPicker')}
          activeOpacity={0.88}
        >
          <View style={styles.heroBg}/>
          <View style={styles.heroContent}>
            <Text style={styles.heroEyebrow}>Plan a trip</Text>
            <Text style={styles.heroTitle}>Where are you{'\n'}headed next?</Text>
            <Text style={styles.heroSub}>Get a personal plan based on your{'\n'}body & the climate difference.</Text>
            <View style={styles.heroRow}>
              <Text style={styles.heroCta}>Start now</Text>
              <View style={styles.heroArrow}>
                <Text style={{ color: Colors.primary, fontSize: 14, fontWeight: '700' }}>→</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Recent trip */}
        {recent && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>CONTINUE</Text>
              <TouchableOpacity onPress={() => navigation.navigate('CityPicker')}>
                <Text style={styles.seeAll}>All trips →</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.recentCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('CityPicker', {
                prefillOriginId: recent.originId,
                prefillOriginName: recent.originName,
                prefillDestId: recent.destId,
                prefillDestName: recent.destName,
                prefillMonth: recent.month,
              })}
            >
              <View style={styles.recentTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recentRoute}>{recent.originName} → {recent.destName}</Text>
                  <Text style={styles.recentMeta}>{MONTHS[recent.month - 1]} · last viewed {relativeTime(recent.timestamp)}</Text>
                </View>
                <RiskBadge level={recent.overall_risk as RiskLevel} size="sm"/>
              </View>
              <View style={{ marginTop: 14 }}>
                <RouteArc
                  origin={{ name: recent.originName, alt: 0 }}
                  dest={{ name: recent.destName, alt: 0 }}
                  height={80}
                  showAlt={false}
                />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Popular routes */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>POPULAR ROUTES</Text>
          <View style={styles.grid}>
            {POPULAR_ROUTES.map(r => (
              <TouchableOpacity
                key={`${r.originId}-${r.destId}`}
                style={styles.routeCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('CityPicker', {
                  prefillOriginId: r.originId, prefillOriginName: r.originName,
                  prefillDestId: r.destId, prefillDestName: r.destName,
                })}
              >
                <Text style={styles.routeIcon}>{r.icon}</Text>
                <Text style={styles.routeTitle}>{r.originName} → {r.destName}</Text>
                <Text style={styles.routeNote}>{r.note}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 14 }}/>
      </ScrollView>
    </SafeAreaView>
  );
}

function relativeTime(ts: number) {
  const d = Math.floor((Date.now() - ts) / 86400000);
  if (d < 1) return 'today';
  if (d === 1) return '1d ago';
  return `${d}d ago`;
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: Spacing.xxl },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  greeting:   { fontSize: 12, color: Colors.inkFaint, letterSpacing: 0.3 },
  name:       { fontSize: 20, fontWeight: '500', color: Colors.ink },
  bellBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.line,
    alignItems: 'center', justifyContent: 'center',
  },

  hero: {
    marginHorizontal: 20, marginTop: 8, borderRadius: 24,
    backgroundColor: Colors.primary, overflow: 'hidden',
  },
  heroBg: {
    position: 'absolute', top: -40, right: -40, width: 180, height: 180,
    borderRadius: 90,
    backgroundColor: Colors.bright, opacity: 0.15,
  },
  heroContent: { padding: 22 },
  heroEyebrow: {
    fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.7)', marginBottom: 8,
  },
  heroTitle: {
    fontSize: 26, lineHeight: 30, fontWeight: '500',
    color: '#F6F3EC', marginBottom: 10,
  },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 20, marginBottom: 22 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroCta: { fontSize: 13, fontWeight: '600', color: Colors.bright },
  heroArrow: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.bright, alignItems: 'center', justifyContent: 'center',
  },

  section: { paddingHorizontal: 20, paddingTop: 20 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionLabel: { fontSize: 11, color: Colors.inkFaint, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '600' },
  seeAll: { fontSize: 12, color: Colors.mid, fontWeight: '500' },

  recentCard: {
    backgroundColor: Colors.surface, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.line, padding: 16,
  },
  recentTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  recentRoute: { fontSize: 18, fontWeight: '500', color: Colors.ink },
  recentMeta:  { fontSize: 11, color: Colors.inkFaint, marginTop: 4 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  routeCard: {
    width: '47.5%', backgroundColor: Colors.surface,
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: Colors.line,
  },
  routeIcon:  { fontSize: 20, marginBottom: 10 },
  routeTitle: { fontSize: 15, fontWeight: '500', color: Colors.ink, lineHeight: 19 },
  routeNote:  { fontSize: 11, color: Colors.inkFaint, marginTop: 4 },
});
