/**
 * QuestionnaireScreen — paginated 5-step health profile.
 * One section per page, progress bar at top.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch,
  ScrollView, SafeAreaView, StatusBar, Animated, ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Chip } from '../components/Chip';
import { Colors, Font, Radius, Spacing } from '../theme';
import { saveProfile, loadProfile } from '../storage';
import type { RootStackParamList } from '../../App';
import type { UserProfile } from '@acclimate/engine';

type Props = NativeStackScreenProps<RootStackParamList, 'Questionnaire'>;

const TOTAL_STEPS = 5;

const DEFAULT_PROFILE: UserProfile = {
  age_group:                    '18_35',
  fitness_level:                'moderate',
  diet_type:                    'non_vegetarian',
  hydration_level:              'moderate',
  allergy_type:                 'none',
  has_respiratory_condition:    false,
  has_cardiac_condition:        false,
  is_recovering_from_illness:   false,
  is_sleep_sensitive:           false,
  has_ac_accommodation:         true,
  activity_type:                'sightseeing',
  travel_mode:                  'flight',
  stay_duration_days:           5,
};

export function QuestionnaireScreen({ navigation, route }: Props) {
  const { originId, originName, destId, destName, month } = route.params;
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(true);

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadProfile().then(saved => {
      if (saved) setProfile(saved);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue:         step / TOTAL_STEPS,
      duration:        300,
      useNativeDriver: false,
    }).start();
  }, [step]);

  function set<K extends keyof UserProfile>(key: K, val: UserProfile[K]) {
    setProfile(prev => ({ ...prev, [key]: val }));
  }

  async function handleNext() {
    if (step < TOTAL_STEPS) {
      setStep(s => s + 1);
    } else {
      await saveProfile(profile);
      navigation.navigate('Result', {
        originId, originName, destId, destName, month, profile,
      });
    }
  }

  function handleBack() {
    if (step > 1) setStep(s => s - 1);
    else          navigation.goBack();
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ flex: 1 }} color={Colors.mid} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />

      {/* ── Progress bar ───────────────────────────────────────────────── */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange:  [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.stepLabel}>Step {step} of {TOTAL_STEPS}</Text>
      </View>

      {/* ── Step content ───────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 && <Step1 profile={profile} set={set} />}
        {step === 2 && <Step2 profile={profile} set={set} />}
        {step === 3 && <Step3 profile={profile} set={set} />}
        {step === 4 && <Step4 profile={profile} set={set} />}
        {step === 5 && <Step5 profile={profile} set={set} />}
      </ScrollView>

      {/* ── Bottom navigation bar ──────────────────────────────────────── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.backBtnNav, step === 1 && styles.hidden]}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.nextBtn}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>
            {step === TOTAL_STEPS ? 'Get My Plan →' : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

type SetFn = <K extends keyof UserProfile>(key: K, val: UserProfile[K]) => void;

function StepHeader({ emoji, title }: { emoji: string; title: string }) {
  return (
    <View style={stepStyles.header}>
      <View style={stepStyles.emojiCircle}>
        <Text style={stepStyles.emoji}>{emoji}</Text>
      </View>
      <Text style={stepStyles.title}>{title}</Text>
    </View>
  );
}

function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={stepStyles.fieldBlock}>
      <Text style={stepStyles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function ChipRow<T extends string>({
  options, value, onChange,
}: {
  options: { value: T; label: string }[];
  value:   T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={stepStyles.chipRow}>
      {options.map(o => (
        <Chip
          key={o.value}
          label={o.label}
          selected={value === o.value}
          onPress={() => onChange(o.value)}
        />
      ))}
    </View>
  );
}

function ToggleRow({
  label, sublabel, value, onChange,
}: {
  label:     string;
  sublabel?: string;
  value:     boolean;
  onChange:  (v: boolean) => void;
}) {
  return (
    <View style={stepStyles.toggleRow}>
      <View style={{ flex: 1, marginRight: Spacing.md }}>
        <Text style={stepStyles.toggleLabel}>{label}</Text>
        {sublabel && <Text style={stepStyles.toggleSub}>{sublabel}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: Colors.border, true: Colors.bright }}
        thumbColor={Colors.card}
      />
    </View>
  );
}

// ─── Step 1: About You ────────────────────────────────────────────────────────

function Step1({ profile, set }: { profile: UserProfile; set: SetFn }) {
  return (
    <View>
      <StepHeader emoji="👤" title="Tell us about yourself" />
      <FieldBlock label="Age group">
        <ChipRow
          options={[
            { value: 'under_18', label: 'Under 18' },
            { value: '18_35',    label: '18–35' },
            { value: '35_55',    label: '35–55' },
            { value: '55_plus',  label: '55+' },
          ]}
          value={profile.age_group}
          onChange={v => set('age_group', v as UserProfile['age_group'])}
        />
      </FieldBlock>
      <FieldBlock label="Fitness level">
        <ChipRow
          options={[
            { value: 'sedentary', label: 'Sedentary' },
            { value: 'moderate',  label: 'Moderate' },
            { value: 'active',    label: 'Active' },
            { value: 'athlete',   label: 'Athlete' },
          ]}
          value={profile.fitness_level}
          onChange={v => set('fitness_level', v as UserProfile['fitness_level'])}
        />
      </FieldBlock>
    </View>
  );
}

// ─── Step 2: Health Conditions ────────────────────────────────────────────────

function Step2({ profile, set }: { profile: UserProfile; set: SetFn }) {
  return (
    <View>
      <StepHeader emoji="🩺" title="Any health conditions?" />
      <View style={stepStyles.card}>
        <ToggleRow
          label="Heart or cardiac condition"
          sublabel="E.g. hypertension, arrhythmia, valve disease"
          value={profile.has_cardiac_condition}
          onChange={v => set('has_cardiac_condition', v)}
        />
        <ToggleRow
          label="Respiratory condition"
          sublabel="E.g. asthma, COPD, bronchitis"
          value={profile.has_respiratory_condition}
          onChange={v => set('has_respiratory_condition', v)}
        />
        <ToggleRow
          label="Currently recovering from illness"
          sublabel="Surgery, infection, or recent hospitalisation"
          value={profile.is_recovering_from_illness}
          onChange={v => set('is_recovering_from_illness', v)}
        />
        <ToggleRow
          label="Sensitive to sleep disruption"
          sublabel="Insomnia, shift work, CPAP user"
          value={profile.is_sleep_sensitive}
          onChange={v => set('is_sleep_sensitive', v)}
        />
      </View>
      <Text style={stepStyles.hint}>Toggle on if any apply to you.</Text>
    </View>
  );
}

// ─── Step 3: Allergies ────────────────────────────────────────────────────────

function Step3({ profile, set }: { profile: UserProfile; set: SetFn }) {
  return (
    <View>
      <StepHeader emoji="🌿" title="Any known allergies?" />
      <FieldBlock label="Known allergies">
        <ChipRow
          options={[
            { value: 'none',              label: 'None' },
            { value: 'dust',              label: 'Dust / Mould' },
            { value: 'pollen',            label: 'Pollen' },
            { value: 'prefer_not_to_say', label: 'Prefer not to say' },
          ]}
          value={profile.allergy_type}
          onChange={v => set('allergy_type', v as UserProfile['allergy_type'])}
        />
      </FieldBlock>
    </View>
  );
}

// ─── Step 4: This Trip ────────────────────────────────────────────────────────

function Step4({ profile, set }: { profile: UserProfile; set: SetFn }) {
  return (
    <View>
      <StepHeader emoji="✈️" title="About this trip" />
      <FieldBlock label="How are you travelling?">
        <ChipRow
          options={[
            { value: 'flight', label: '✈️ Flight' },
            { value: 'train',  label: '🚆 Train' },
            { value: 'road',   label: '🚗 Road' },
          ]}
          value={profile.travel_mode}
          onChange={v => set('travel_mode', v as UserProfile['travel_mode'])}
        />
      </FieldBlock>
      <FieldBlock label="Main activity">
        <ChipRow
          options={[
            { value: 'office',      label: 'Office work' },
            { value: 'sightseeing', label: 'Sightseeing' },
            { value: 'trekking',    label: 'Trekking' },
            { value: 'pilgrimage',  label: 'Pilgrimage' },
            { value: 'sports',      label: 'Sports' },
          ]}
          value={profile.activity_type}
          onChange={v => set('activity_type', v as UserProfile['activity_type'])}
        />
      </FieldBlock>
      <FieldBlock label={`Stay duration: ${profile.stay_duration_days} days`}>
        <View style={stepStyles.durationRow}>
          {[1, 3, 5, 7, 10, 14, 21, 30].map(d => (
            <TouchableOpacity
              key={d}
              style={[
                stepStyles.dayBtn,
                profile.stay_duration_days === d && stepStyles.dayBtnSelected,
              ]}
              onPress={() => set('stay_duration_days', d)}
              activeOpacity={0.7}
            >
              <Text style={[
                stepStyles.dayBtnText,
                profile.stay_duration_days === d && stepStyles.dayBtnTextSelected,
              ]}>
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </FieldBlock>
      <View style={stepStyles.card}>
        <ToggleRow
          label="AC / climate-controlled accommodation"
          value={profile.has_ac_accommodation}
          onChange={v => set('has_ac_accommodation', v)}
        />
      </View>
    </View>
  );
}

// ─── Step 5: Lifestyle ────────────────────────────────────────────────────────

function Step5({ profile, set }: { profile: UserProfile; set: SetFn }) {
  return (
    <View>
      <StepHeader emoji="🥗" title="Your lifestyle" />
      <FieldBlock label="Diet">
        <ChipRow
          options={[
            { value: 'vegetarian',     label: 'Vegetarian' },
            { value: 'non_vegetarian', label: 'Non-veg' },
            { value: 'vegan',          label: 'Vegan' },
          ]}
          value={profile.diet_type}
          onChange={v => set('diet_type', v as UserProfile['diet_type'])}
        />
      </FieldBlock>
      <FieldBlock label="Daily water intake">
        <ChipRow
          options={[
            { value: 'low',      label: 'Less than 1L' },
            { value: 'moderate', label: '1–2L' },
            { value: 'high',     label: 'More than 2L' },
          ]}
          value={profile.hydration_level}
          onChange={v => set('hydration_level', v as UserProfile['hydration_level'])}
        />
      </FieldBlock>
      <View style={stepStyles.privacyNote}>
        <Text style={stepStyles.privacyText}>
          🔐 Your health data is encrypted on this device and never shared.
        </Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  progressContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop:        Spacing.md,
    paddingBottom:     Spacing.sm,
    backgroundColor:   Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  progressTrack: {
    height:          4,
    backgroundColor: Colors.border,
    borderRadius:    2,
    overflow:        'hidden',
    marginBottom:    Spacing.sm,
  },
  progressFill: {
    height:          4,
    backgroundColor: Colors.mid,
    borderRadius:    2,
  },
  stepLabel: {
    fontSize:   Font.size.xs,
    color:      Colors.textMuted,
    fontWeight: Font.weight.medium,
  },

  scroll: {
    padding:       Spacing.lg,
    paddingBottom: Spacing.md,
  },

  bottomBar: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical:   Spacing.md,
    backgroundColor:   Colors.card,
    borderTopWidth:    1,
    borderTopColor:    Colors.border,
    shadowColor:       '#000',
    shadowOpacity:     0.06,
    shadowRadius:      8,
    shadowOffset:      { width: 0, height: -2 },
    elevation:         4,
  },
  backBtnNav: {
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
  },
  backBtnText: {
    fontSize:   Font.size.md,
    color:      Colors.textMuted,
    fontWeight: Font.weight.medium,
  },
  hidden: { opacity: 0 },
  nextBtn: {
    backgroundColor: Colors.mid,
    borderRadius:    Radius.lg,
    paddingVertical:  14,
    paddingHorizontal: Spacing.xl,
    shadowColor:     Colors.mid,
    shadowOpacity:   0.3,
    shadowRadius:    8,
    shadowOffset:    { width: 0, height: 3 },
    elevation:       4,
  },
  nextBtnText: {
    fontSize:   Font.size.md,
    fontWeight: Font.weight.bold,
    color:      Colors.textOnDark,
  },
});

const stepStyles = StyleSheet.create({
  header: {
    alignItems:  'center',
    marginBottom: Spacing.xl,
  },
  emojiCircle: {
    width:           80,
    height:          80,
    borderRadius:    40,
    backgroundColor: Colors.primary,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    Spacing.md,
    shadowColor:     Colors.primary,
    shadowOpacity:   0.3,
    shadowRadius:    12,
    shadowOffset:    { width: 0, height: 4 },
    elevation:       6,
  },
  emoji: {
    fontSize: 36,
  },
  title: {
    fontSize:   Font.size.xl,
    fontWeight: Font.weight.bold,
    color:      Colors.text,
    textAlign:  'center',
  },

  fieldBlock: { marginBottom: Spacing.lg },
  fieldLabel: {
    fontSize:    Font.size.sm,
    fontWeight:  Font.weight.semibold,
    color:       Colors.textMuted,
    marginBottom: Spacing.sm,
    letterSpacing: 0.3,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },

  card: {
    backgroundColor: Colors.card,
    borderRadius:    Radius.lg,
    paddingHorizontal: Spacing.md,
    marginBottom:    Spacing.md,
    shadowColor:     '#000',
    shadowOpacity:   0.04,
    shadowRadius:    8,
    shadowOffset:    { width: 0, height: 2 },
    elevation:       2,
  },
  toggleRow: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  toggleLabel: {
    fontSize:   Font.size.md,
    fontWeight: Font.weight.medium,
    color:      Colors.text,
  },
  toggleSub: {
    fontSize:  Font.size.xs,
    color:     Colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },

  durationRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           Spacing.sm,
  },
  dayBtn: {
    width:           44,
    height:          44,
    borderRadius:    Radius.sm,
    borderWidth:     1.5,
    borderColor:     Colors.border,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: Colors.card,
  },
  dayBtnSelected:     { borderColor: Colors.mid, backgroundColor: Colors.mid },
  dayBtnText:         { fontSize: Font.size.sm, fontWeight: Font.weight.semibold, color: Colors.textMuted },
  dayBtnTextSelected: { color: Colors.textOnDark },

  hint: {
    fontSize:   Font.size.xs,
    color:      Colors.textLight,
    textAlign:  'center',
    marginTop:  Spacing.sm,
    marginBottom: Spacing.md,
  },

  privacyNote: {
    backgroundColor: Colors.card,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    marginTop:       Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  privacyText: {
    fontSize:  Font.size.xs,
    color:     Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
