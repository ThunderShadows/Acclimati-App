import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, StatusBar, Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { UserProfile } from '@acclimate/engine';
import { Colors, Font, Radius, Spacing } from '../theme';
import { loadProfile, clearProfile } from '../storage';
import type { RootStackParamList } from '../../App';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

// ─── Label maps ───────────────────────────────────────────────────────────────

const AGE_LABELS: Record<string, string> = {
  under_18: 'Under 18',
  '18_35':  '18–35',
  '35_55':  '35–55',
  '55_plus': '55+',
};
const FITNESS_LABELS: Record<string, string> = {
  sedentary: 'Sedentary',
  moderate:  'Moderate',
  active:    'Active',
  athlete:   'Athlete',
};
const DIET_LABELS: Record<string, string> = {
  vegetarian:     'Vegetarian',
  non_vegetarian: 'Non-vegetarian',
  vegan:          'Vegan',
};
const HYDRATION_LABELS: Record<string, string> = {
  low:      'Less than 1L',
  moderate: '1–2L',
  high:     'More than 2L',
};
const ALLERGY_LABELS: Record<string, string> = {
  none:              'None',
  dust:              'Dust / Mould',
  pollen:            'Pollen',
  prefer_not_to_say: 'Prefer not to say',
};
const TRAVEL_MODE_LABELS: Record<string, string> = {
  flight: '✈️ Flight',
  train:  '🚆 Train',
  road:   '🚗 Road',
};
const ACTIVITY_LABELS: Record<string, string> = {
  office:      'Office work',
  sightseeing: 'Sightseeing',
  trekking:    'Trekking',
  pilgrimage:  'Pilgrimage',
  sports:      'Sports',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function BoolRow({ label, value }: { label: string; value: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={[styles.boolBadge, { backgroundColor: value ? '#FEF2F2' : '#F0FDF4' }]}>
        <Text style={[styles.boolText, { color: value ? '#991B1B' : '#166534' }]}>
          {value ? 'Yes' : 'No'}
        </Text>
      </View>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProfileScreen() {
  const navigation = useNavigation<NavProp>();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useFocusEffect(useCallback(() => {
    loadProfile().then(setProfile);
  }, []));

  async function handleClear() {
    Alert.alert(
      'Clear Profile',
      'This will permanently delete your saved health profile. You can always create a new one.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await clearProfile();
            setProfile(null);
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Health Profile</Text>
          <Text style={styles.subtitle}>Stored securely on your device</Text>
        </View>

        {profile == null ? (
          /* Empty state */
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🩺</Text>
            <Text style={styles.emptyTitle}>No profile yet</Text>
            <Text style={styles.emptySubtitle}>
              Complete a health questionnaire to personalise your trip recommendations.
            </Text>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('CityPicker')}
              activeOpacity={0.85}
            >
              <Text style={styles.editBtnText}>Complete your profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* About You */}
            <ProfileSection title="About You">
              <ProfileRow label="Age group"    value={AGE_LABELS[profile.age_group]    ?? profile.age_group} />
              <ProfileRow label="Fitness level" value={FITNESS_LABELS[profile.fitness_level] ?? profile.fitness_level} />
            </ProfileSection>

            {/* Health */}
            <ProfileSection title="Health Conditions">
              <BoolRow label="Cardiac condition"      value={profile.has_cardiac_condition} />
              <BoolRow label="Respiratory condition"  value={profile.has_respiratory_condition} />
              <BoolRow label="Recovering from illness" value={profile.is_recovering_from_illness} />
              <BoolRow label="Sleep sensitive"        value={profile.is_sleep_sensitive} />
            </ProfileSection>

            {/* Allergies */}
            <ProfileSection title="Allergies">
              <ProfileRow label="Known allergies" value={ALLERGY_LABELS[profile.allergy_type] ?? profile.allergy_type} />
            </ProfileSection>

            {/* Travel preferences */}
            <ProfileSection title="Travel Preferences">
              <ProfileRow label="Travel mode"   value={TRAVEL_MODE_LABELS[profile.travel_mode] ?? profile.travel_mode} />
              <ProfileRow label="Main activity" value={ACTIVITY_LABELS[profile.activity_type]  ?? profile.activity_type} />
              <ProfileRow label="Stay duration" value={`${profile.stay_duration_days} days`} />
              <BoolRow    label="AC accommodation" value={profile.has_ac_accommodation} />
            </ProfileSection>

            {/* Lifestyle */}
            <ProfileSection title="Lifestyle">
              <ProfileRow label="Diet"       value={DIET_LABELS[profile.diet_type]           ?? profile.diet_type} />
              <ProfileRow label="Hydration"  value={HYDRATION_LABELS[profile.hydration_level] ?? profile.hydration_level} />
            </ProfileSection>

            {/* Actions */}
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('CityPicker')}
              activeOpacity={0.85}
            >
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.clearBtn}
              onPress={handleClear}
              activeOpacity={0.85}
            >
              <Text style={styles.clearBtnText}>Clear Profile</Text>
            </TouchableOpacity>

            {/* Privacy note */}
            <View style={styles.privacyCard}>
              <Text style={styles.privacyText}>
                🔐 Encrypted on-device. Never transmitted.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },

  header: { marginBottom: Spacing.xl },
  title:  {
    fontSize:   Font.size.xxl,
    fontWeight: Font.weight.bold,
    color:      Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: Font.size.sm,
    color:    Colors.textMuted,
  },

  // Empty state
  emptyContainer: {
    alignItems:     'center',
    paddingVertical: Spacing.xxl,
  },
  emptyEmoji: {
    fontSize:    56,
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
    lineHeight:  22,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },

  // Sections
  section:     { marginBottom: Spacing.md },
  sectionTitle: {
    fontSize:    Font.size.xs,
    fontWeight:  Font.weight.bold,
    color:       Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius:    Radius.lg,
    paddingHorizontal: Spacing.md,
    shadowColor:     '#000',
    shadowOpacity:   0.04,
    shadowRadius:    8,
    shadowOffset:    { width: 0, height: 2 },
    elevation:       2,
  },

  // Rows
  row: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  rowLabel: {
    fontSize:   Font.size.sm,
    color:      Colors.textMuted,
    flex:       1,
  },
  rowValue: {
    fontSize:   Font.size.sm,
    fontWeight: Font.weight.medium,
    color:      Colors.text,
    textAlign:  'right',
  },
  boolBadge: {
    borderRadius:      Radius.full,
    paddingHorizontal: 10,
    paddingVertical:   3,
  },
  boolText: {
    fontSize:   Font.size.xs,
    fontWeight: Font.weight.semibold,
  },

  // Buttons
  editBtn: {
    backgroundColor: Colors.mid,
    borderRadius:    Radius.lg,
    paddingVertical:  16,
    alignItems:      'center',
    marginTop:       Spacing.md,
    shadowColor:     Colors.mid,
    shadowOpacity:   0.3,
    shadowRadius:    8,
    shadowOffset:    { width: 0, height: 3 },
    elevation:       4,
  },
  editBtnText: {
    fontSize:   Font.size.md,
    fontWeight: Font.weight.semibold,
    color:      Colors.textOnDark,
  },
  clearBtn: {
    borderWidth:     1.5,
    borderColor:     Colors.coral,
    borderRadius:    Radius.lg,
    paddingVertical:  14,
    alignItems:      'center',
    marginTop:       Spacing.md,
  },
  clearBtnText: {
    fontSize:   Font.size.md,
    fontWeight: Font.weight.semibold,
    color:      Colors.coral,
  },

  // Privacy
  privacyCard: {
    backgroundColor: Colors.card,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    marginTop:       Spacing.lg,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  privacyText: {
    fontSize: Font.size.xs,
    color:    Colors.textMuted,
  },
});
