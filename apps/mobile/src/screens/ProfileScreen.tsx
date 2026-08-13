import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { UserProfile } from '@acclimate/engine';
import { Colors, Radius, Spacing } from '../theme';
import { loadProfile, clearProfile } from '../storage';
import type { RootStackParamList } from '../../App';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

function profileLabel(profile: UserProfile | null) {
  if (!profile) return [];
  return [
    { label: 'Age group',   value: profile.age_group?.replace('_', '–') ?? '—' },
    { label: 'Activity',    value: profile.fitness_level ?? '—' },
    { label: 'Conditions',  value: [
        profile.has_cardiac_condition && 'Heart condition',
        profile.has_respiratory_condition && 'Respiratory',
        profile.is_recovering_from_illness && 'Recovering',
      ].filter(Boolean).join(', ') || 'None' },
    { label: 'Travel mode', value: profile.travel_mode ?? '—' },
    { label: 'Recovery',    value: profile.is_recovering_from_illness ? 'Recovering' : 'Feeling 100%' },
  ];
}

export function ProfileScreen() {
  const navigation = useNavigation<NavProp>();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useFocusEffect(useCallback(() => {
    loadProfile().then(setProfile);
  }, []));

  function handleClear() {
    Alert.alert('Clear all data', 'This will erase your health profile and trip history from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive',
        onPress: async () => { await clearProfile(); setProfile(null); },
      },
    ]);
  }

  const rows = profileLabel(profile);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg}/>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10 }}>
          <Text style={styles.title}>You</Text>
        </View>

        {/* Dark hero card */}
        <View style={styles.heroCard}>
          <View style={styles.heroBg}/>
          <View style={styles.avatar}>
            <Text style={{ fontSize: 22, fontWeight: '600', color: Colors.primary }}>T</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroName}>Traveler</Text>
            <Text style={styles.heroPrivacy}>🔒  On-device · encrypted</Text>
          </View>
        </View>

        {/* Health profile */}
        <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>HEALTH PROFILE</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Questionnaire', {
                originId: '', originName: '', destId: '', destName: '', month: 1, profileOnly: true,
              })}
            >
              <Text style={styles.editBtn}>✏ Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            {rows.map((r, i) => (
              <View key={i} style={[styles.row, i < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.line }]}>
                <Text style={styles.rowLabel}>{r.label}</Text>
                <Text style={styles.rowValue}>{r.value}</Text>
              </View>
            ))}
            {rows.length === 0 && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>No profile yet</Text>
                <Text style={styles.rowValue}>—</Text>
              </View>
            )}
          </View>
        </View>

        {/* Settings */}
        <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
          <Text style={styles.sectionLabel}>SETTINGS</Text>
          <View style={styles.card}>
            {[
              { label: 'Notifications', sub: 'Daily prep reminders' },
              { label: 'Privacy policy', sub: 'How your data stays yours' },
              { label: 'About Acclimate', sub: 'Version 1.0' },
            ].map((s, i, arr) => (
              <View key={i} style={[styles.settingRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.line }]}>
                <View>
                  <Text style={styles.settingLabel}>{s.label}</Text>
                  <Text style={styles.settingSub}>{s.sub}</Text>
                </View>
                <Text style={{ color: Colors.inkFaint, fontSize: 18 }}>›</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Danger zone */}
        <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 32 }}>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClear} activeOpacity={0.8}>
            <Text style={styles.clearText}>🗑  Clear all data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: 32 },
  title:  { fontSize: 26, fontWeight: '500', color: Colors.ink },

  heroCard: {
    marginHorizontal: 20, borderRadius: 18,
    backgroundColor: Colors.primary, padding: 18,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    overflow: 'hidden',
  },
  heroBg: {
    position: 'absolute', right: -30, top: -30,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: Colors.bright, opacity: 0.15,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: Colors.bright,
    alignItems: 'center', justifyContent: 'center',
  },
  heroName:    { fontSize: 18, fontWeight: '500', color: '#F6F3EC' },
  heroPrivacy: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 3 },

  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionLabel: { fontSize: 11, color: Colors.inkFaint, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '600' },
  editBtn: { fontSize: 12, fontWeight: '500', color: Colors.mid },

  card: {
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.line, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  rowLabel: { fontSize: 13, color: Colors.inkSoft },
  rowValue: { fontSize: 13, fontWeight: '500', color: Colors.ink, textAlign: 'right', maxWidth: '60%' },

  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13,
  },
  settingLabel: { fontSize: 14, fontWeight: '500', color: Colors.ink },
  settingSub:   { fontSize: 11, color: Colors.inkFaint, marginTop: 2 },

  clearBtn: {
    height: 48, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  clearText: { fontSize: 13, fontWeight: '600', color: Colors.coral },
});
