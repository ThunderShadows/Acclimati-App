import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Radius, Spacing } from '../theme';
import { RiskBadge } from '../components/RiskBadge';
import { useRecentTrips } from '../hooks/useRecentTrips';
import type { RootStackParamList } from '../../App';
import { MONTHS } from '../cities';
import type { RiskLevel } from '@acclimate/engine';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function HistoryScreen() {
  const navigation = useNavigation<NavProp>();
  const { trips, refresh } = useRecentTrips();

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg}/>
      <View style={styles.header}>
        <Text style={styles.title}>Trips</Text>
        <Text style={styles.sub}>{trips.length} saved · on this device</Text>
      </View>

      {trips.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Text style={{ fontSize: 28 }}>✈</Text>
          </View>
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptySub}>Plan your first one from the Home tab.</Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={t => t.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.tripCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('CityPicker', {
                prefillOriginId: item.originId, prefillOriginName: item.originName,
                prefillDestId: item.destId, prefillDestName: item.destName,
                prefillMonth: item.month,
              })}
            >
              <View style={styles.tripIcon}>
                <Text style={{ fontSize: 18 }}>📍</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.tripRoute}>{item.originName} → {item.destName}</Text>
                <Text style={styles.tripMeta}>{MONTHS[item.month - 1]} · {relativeTime(item.timestamp)}</Text>
              </View>
              <RiskBadge level={item.overall_risk as RiskLevel} size="sm"/>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function relativeTime(ts: number) {
  const d = Math.floor((Date.now() - ts) / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  return `${d}d ago`;
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10 },
  title:  { fontSize: 26, fontWeight: '500', color: Colors.ink },
  sub:    { fontSize: 13, color: Colors.inkFaint, marginTop: 4 },

  empty:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.line,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '500', color: Colors.ink },
  emptySub:   { fontSize: 13, color: Colors.inkFaint, marginTop: 6 },

  list: { paddingHorizontal: 20, paddingBottom: 32, gap: 10 },
  tripCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.line, padding: 14,
  },
  tripIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: Colors.tealSoft, alignItems: 'center', justifyContent: 'center',
  },
  tripRoute: { fontSize: 16, fontWeight: '500', color: Colors.ink },
  tripMeta:  { fontSize: 11, color: Colors.inkFaint, marginTop: 3 },
});
