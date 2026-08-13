import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch,
  ScrollView, StatusBar, Animated, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Radius, Spacing } from '../theme';
import { saveProfile, loadProfile } from '../storage';
import type { RootStackParamList } from '../../App';
import type { UserProfile } from '@acclimate/engine';

type Props = NativeStackScreenProps<RootStackParamList, 'Questionnaire'>;

const TOTAL_STEPS = 5;

const DEFAULT_PROFILE: UserProfile = {
  age_group: '18_35', fitness_level: 'moderate', diet_type: 'non_vegetarian',
  hydration_level: 'moderate', allergy_type: 'none',
  has_respiratory_condition: false, has_cardiac_condition: false,
  is_recovering_from_illness: false, is_sleep_sensitive: false,
  has_ac_accommodation: true, activity_type: 'sightseeing',
  travel_mode: 'flight', stay_duration_days: 5,
};

export function QuestionnaireScreen({ navigation, route }: Props) {
  const { originId, originName, destId, destName, month, profileOnly } = route.params;
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadProfile().then(saved => { if (saved) setProfile(saved); setLoading(false); });
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, { toValue: step / TOTAL_STEPS, duration: 300, useNativeDriver: false }).start();
  }, [step]);

  function set<K extends keyof UserProfile>(key: K, val: UserProfile[K]) {
    setProfile(prev => ({ ...prev, [key]: val }));
  }

  async function handleNext() {
    if (step < TOTAL_STEPS) {
      setStep(s => s + 1);
    } else {
      await saveProfile(profile);
      if (profileOnly) navigation.navigate('Main');
      else navigation.navigate('Result', { originId, originName, destId, destName, month, profile });
    }
  }

  function handleBack() {
    if (step > 1) setStep(s => s - 1);
    else if (profileOnly) navigation.navigate('Main');
    else navigation.goBack();
  }

  if (loading) return <SafeAreaView style={styles.safe}><ActivityIndicator style={{ flex: 1 }} color={Colors.primary}/></SafeAreaView>;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg}/>

      {/* Header */}
      <View style={styles.topRow}>
        <TouchableOpacity onPress={handleBack} hitSlop={8}>
          <Text style={{ fontSize: 20, color: Colors.ink }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.stepLabel}>{profileOnly ? 'Edit Profile · ' : ''}Step {step} of {TOTAL_STEPS}</Text>
        <View style={{ width: 28 }}/>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, {
          width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }]}/>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>About you</Text>
        {step === 1 && <Step1 profile={profile} set={set}/>}
        {step === 2 && <Step2 profile={profile} set={set}/>}
        {step === 3 && <Step3 profile={profile} set={set}/>}
        {step === 4 && <Step4 profile={profile} set={set}/>}
        {step === 5 && <Step5 profile={profile} set={set}/>}
      </ScrollView>

      <View style={styles.footer}>
        {step === TOTAL_STEPS ? (
          <TouchableOpacity style={styles.btn} onPress={handleNext} activeOpacity={0.85}>
            <Text style={styles.btnText}>{profileOnly ? '✓ Save profile' : '✦ See my plan'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btn} onPress={handleNext} activeOpacity={0.85}>
            <Text style={styles.btnText}>Continue →</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

type SetFn = <K extends keyof UserProfile>(key: K, val: UserProfile[K]) => void;

function StepTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <View style={{ marginBottom: 26 }}>
      <Text style={styles.stepTitle}>{title}</Text>
      {sub && <Text style={styles.stepSub}>{sub}</Text>}
    </View>
  );
}

function OptionBtn({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.optBtn, selected && styles.optBtnOn]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.optText, selected && styles.optTextOn]}>{label}</Text>
      {selected && <Text style={{ fontSize: 16, color: Colors.primary }}>✓</Text>}
    </TouchableOpacity>
  );
}

function ToggleRow({ label, sublabel, value, onChange }: { label: string; sublabel?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1, marginRight: Spacing.md }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {sublabel && <Text style={styles.toggleSub}>{sublabel}</Text>}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: Colors.line, true: Colors.bright }} thumbColor="#fff"/>
    </View>
  );
}

function Step1({ profile, set }: { profile: UserProfile; set: SetFn }) {
  return (
    <View>
      <StepTitle title="Your age" sub="Pick the closest match — you can change this anytime."/>
      {[
        { val: 'under_18', label: 'Under 18' },
        { val: '18_35',    label: '18–35' },
        { val: '35_55',    label: '35–55' },
        { val: '55_plus',  label: '55+' },
      ].map(o => (
        <OptionBtn key={o.val} label={o.label} selected={profile.age_group === o.val}
          onPress={() => { set('age_group', o.val as UserProfile['age_group']); setTimeout(() => {}, 260); }}/>
      ))}
    </View>
  );
}

function Step2({ profile, set }: { profile: UserProfile; set: SetFn }) {
  return (
    <View>
      <StepTitle title="Activity level" sub="Pick the closest match."/>
      {[
        { val: 'sedentary', label: 'Sedentary' },
        { val: 'moderate',  label: 'Moderate' },
        { val: 'active',    label: 'Active' },
        { val: 'athlete',   label: 'Athlete' },
      ].map(o => (
        <OptionBtn key={o.val} label={o.label} selected={profile.fitness_level === o.val}
          onPress={() => set('fitness_level', o.val as UserProfile['fitness_level'])}/>
      ))}
    </View>
  );
}

function Step3({ profile, set }: { profile: UserProfile; set: SetFn }) {
  return (
    <View>
      <StepTitle title="Any conditions?" sub="Select all that apply. Stays private on your device."/>
      <View style={styles.card}>
        <ToggleRow label="Heart or cardiac condition" sublabel="E.g. hypertension, arrhythmia" value={profile.has_cardiac_condition} onChange={v => set('has_cardiac_condition', v)}/>
        <ToggleRow label="Respiratory condition" sublabel="E.g. asthma, COPD" value={profile.has_respiratory_condition} onChange={v => set('has_respiratory_condition', v)}/>
        <ToggleRow label="Recovering from illness" sublabel="Recent surgery or infection" value={profile.is_recovering_from_illness} onChange={v => set('is_recovering_from_illness', v)}/>
        <ToggleRow label="Sensitive to sleep disruption" value={profile.is_sleep_sensitive} onChange={v => set('is_sleep_sensitive', v)}/>
      </View>
    </View>
  );
}

function Step4({ profile, set }: { profile: UserProfile; set: SetFn }) {
  return (
    <View>
      <StepTitle title="How are you traveling?" sub="Pick the closest match."/>
      {[
        { val: 'flight', label: '✈️  Flying' },
        { val: 'train',  label: '🚆  Train' },
        { val: 'road',   label: '🚗  Driving' },
      ].map(o => (
        <OptionBtn key={o.val} label={o.label} selected={profile.travel_mode === o.val}
          onPress={() => set('travel_mode', o.val as UserProfile['travel_mode'])}/>
      ))}
    </View>
  );
}

function Step5({ profile, set }: { profile: UserProfile; set: SetFn }) {
  return (
    <View>
      <StepTitle title="Recovering from illness?" sub="Pick the closest match."/>
      {[
        { val: false, label: 'No, feeling 100%' },
        { val: true,  label: 'Yes, recently ill' },
      ].map(o => (
        <OptionBtn key={String(o.val)} label={o.label} selected={profile.is_recovering_from_illness === o.val}
          onPress={() => set('is_recovering_from_illness', o.val)}/>
      ))}
      <View style={[styles.card, { marginTop: 20, padding: 14 }]}>
        <Text style={{ fontSize: 12, color: Colors.inkSoft, lineHeight: 18 }}>
          🔐 <Text style={{ fontWeight: '600', color: Colors.ink }}>Nothing leaves your device.</Text>{' '}
          Your health info is encrypted on your phone and never sent to a server.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  topRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 0,
  },
  stepLabel: { fontSize: 12, color: Colors.inkFaint, letterSpacing: 0.5 },
  progressTrack: {
    height: 3, backgroundColor: Colors.line, marginHorizontal: 20, marginTop: 12,
    borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: 3, backgroundColor: Colors.primary, borderRadius: 3 },
  eyebrow: {
    fontSize: 11, color: Colors.mid, letterSpacing: 1.2,
    textTransform: 'uppercase', fontWeight: '600', marginBottom: 10,
  },
  scroll:    { padding: 20, paddingBottom: 20 },
  stepTitle: { fontSize: 26, lineHeight: 31, fontWeight: '500', color: Colors.ink },
  stepSub:   { fontSize: 13, color: Colors.inkSoft, marginTop: 8, lineHeight: 19 },
  optBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderRadius: 14, marginBottom: 10,
    borderWidth: 1.5, borderColor: Colors.line,
    backgroundColor: Colors.surface,
  },
  optBtnOn: { borderColor: Colors.primary, backgroundColor: Colors.tealSoft },
  optText:   { fontSize: 15, fontWeight: '500', color: Colors.ink },
  optTextOn: { color: Colors.primary },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.line,
    paddingHorizontal: 16, marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.line,
  },
  toggleLabel: { fontSize: 14, fontWeight: '500', color: Colors.ink },
  toggleSub:   { fontSize: 11, color: Colors.inkFaint, marginTop: 2, lineHeight: 16 },
  footer: {
    paddingHorizontal: 20, paddingBottom: 24, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: Colors.line, backgroundColor: Colors.bg,
  },
  btn: {
    height: 52, borderRadius: Radius.lg, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  btnText: { fontSize: 15, fontWeight: '600', color: '#F6F3EC', letterSpacing: 0.2 },
});
