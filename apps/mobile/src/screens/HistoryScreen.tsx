import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, SafeAreaView, StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Font, Radius, Spacing } from '../theme';
import { RiskBadge } from '../components/RiskBadge';
import { useRecentTrips } from '../hooks/useRecentTrips';
import type { TripRecord } from '../hooks/useRecentTrips';
import type { RootStackParamList } from '../../App';
import { MONTHS } from '../cities';
import type { RiskLevel } from '@acclimate/engine';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

function relativeTime(ts: number): string {
  const diffMs  = Date.now() - ts;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)  return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return '1 day ago';
  return `${diffDay} days ago`;
}

export function HistoryScreen() {
  const navigation = useNavigation<NavProp>();
  const { trips, refresh } = useRecentTrips();

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  function renderEmpty() {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🗺️</Text>
        <Text style={styles.emptyTitle}>No trips yet</Text>
        <Text style={styles.emptySubtitle}>
          Plan your first trip to see it here
        </Text>
        <TouchableOpacity
          style={styles.emptyBtn}
          onPress={() => navigation.navigate('CityPicker')}
          activeOpacity={0.85}
        >
          <Text style={styles.emptyBtnText}>Plan your first trip</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderTrip({ item }: { item: TripRecord }) {
    return (
      <TouchableOpacity
        style={styles.tripCard}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('CityPicker')}
      >
        <View style={styles.tripCardLeft}>
          <Text style={styles.tripRoute}>
            {item.originName} → {item.destName}
          </Text>
          <Text style={styles.tripMeta}>
            {MONTHS[item.month - 1]}
          </Text>
          <Text style={styles.tripTime}>{relativeTime(item.timestamp)}</Text>
        </View>
        <View style={styles.tripCardRight}>
          <RiskBadge level={item.overall_risk as RiskLevel} size="sm" />
          <Text style={styles.tripArrow}>›</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
      <View style={styles.header}>
        <Text style={styles.title}>Past Trips</Text>
        <Text style={styles.subtitle}>
          {trips.length > 0
            ? `${trips.length} trip${trips.length > 1 ? 's' : ''} recorded`
            : 'Your trip history appears here'}
        </Text>
      </View>
      <FlatList
        data={trips}
        keyExtractor={item => item.id}
        renderItem={renderTrip}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.list,
          trips.length === 0 && styles.listEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop:        Spacing.md,
    paddingBottom:     Spacing.lg,
  },
  title: {
    fontSize:   Font.size.xxl,
    fontWeight: Font.weight.bold,
    color:      Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: Font.size.sm,
    color:    Colors.textMuted,
  },

  list:      { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  listEmpty: { flex: 1 },

  separator: { height: Spacing.sm },

  // Trip card
  tripCard: {
    backgroundColor: Colors.card,
    borderRadius:    Radius.lg,
    padding:         Spacing.md,
    flexDirection:   'row',
    alignItems:      'center',
    shadowColor:     '#000',
    shadowOpacity:   0.05,
    shadowRadius:    8,
    shadowOffset:    { width: 0, height: 2 },
    elevation:       2,
  },
  tripCardLeft: {
    flex: 1,
  },
  tripRoute: {
    fontSize:    Font.size.md,
    fontWeight:  Font.weight.semibold,
    color:       Colors.text,
    marginBottom: 4,
  },
  tripMeta: {
    fontSize:    Font.size.sm,
    color:       Colors.textMuted,
    marginBottom: 8,
  },
  tripTime: {
    fontSize: Font.size.xs,
    color:    Colors.textLight,
  },
  tripCardRight: {
    alignItems:  'center',
    gap:         Spacing.sm,
    marginLeft:  Spacing.md,
  },
  tripArrow: {
    fontSize:   Font.size.xl,
    color:      Colors.textLight,
    lineHeight: Font.size.xl + 2,
  },

  // Empty state
  emptyContainer: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyEmoji: {
    fontSize:    60,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize:    Font.size.xl,
    fontWeight:  Font.weight.bold,
    color:       Colors.text,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize:    Font.size.md,
    color:       Colors.textMuted,
    textAlign:   'center',
    marginBottom: Spacing.xl,
    lineHeight:  22,
  },
  emptyBtn: {
    backgroundColor: Colors.mid,
    borderRadius:    Radius.lg,
    paddingVertical:  14,
    paddingHorizontal: Spacing.xl,
  },
  emptyBtnText: {
    fontSize:   Font.size.md,
    fontWeight: Font.weight.semibold,
    color:      Colors.textOnDark,
  },
});
