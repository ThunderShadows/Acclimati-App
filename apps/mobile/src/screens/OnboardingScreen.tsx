import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, ScrollView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '../theme';
import { RouteArc } from '../components/RouteArc';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width: W } = Dimensions.get('window');

const SLIDES = [
  {
    tag:    'Know before you go',
    title:  'See what changes when you travel',
    body:   'Altitude, air, humidity, pollen — we compare your home city to your destination, month by month.',
    visual: 'arc' as const,
  },
  {
    tag:    'Personal to you',
    title:  'A plan shaped by your body',
    body:   'Tell us about your health once. Your plan adapts to what matters for you.',
    visual: 'stickers' as const,
  },
  {
    tag:    'Private by design',
    title:  'Your health stays on your phone',
    body:   'Profile data never leaves your device. We only ask the server about public city data.',
    visual: 'lock' as const,
  },
];

async function completeOnboarding() {
  await AsyncStorage.setItem('onboarding_done', 'true');
}

export function OnboardingScreen({ navigation }: Props) {
  const [idx, setIdx] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const goNext = async () => {
    if (idx < SLIDES.length - 1) {
      const next = idx + 1;
      scrollRef.current?.scrollTo({ x: next * W, animated: true });
      setIdx(next);
    } else {
      await completeOnboarding();
      navigation.replace('Main');
    }
  };

  const skip = async () => {
    await completeOnboarding();
    navigation.replace('Main');
  };

  const s = SLIDES[idx];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.wordmark}>Acclimate</Text>
        <TouchableOpacity onPress={skip} hitSlop={8}>
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={[styles.slide, { width: W }]}>
            <View style={styles.visual}>
              {slide.visual === 'arc' && (
                <View style={{ width: '90%' }}>
                  <RouteArc
                    origin={{ name: 'Bengaluru', alt: 920 }}
                    dest={{ name: 'Ooty', alt: 2240 }}
                    height={150}
                  />
                </View>
              )}
              {slide.visual === 'stickers' && (
                <View style={styles.stickersGrid}>
                  {[
                    { icon: '🌡', val: '17°C', label: 'Cooler' },
                    { icon: '🌬', val: 'AQI 24', label: 'Cleaner air' },
                    { icon: '⛰', val: '+1.3km', label: 'Higher' },
                    { icon: '☀', val: 'UV 11', label: 'Stronger' },
                  ].map((s, j) => (
                    <View key={j} style={styles.miniSticker}>
                      <Text style={{ fontSize: 22 }}>{s.icon}</Text>
                      <Text style={styles.stickerVal}>{s.val}</Text>
                      <Text style={styles.stickerLabel}>{s.label}</Text>
                    </View>
                  ))}
                </View>
              )}
              {slide.visual === 'lock' && (
                <View style={styles.lockBox}>
                  <View style={styles.lockIcon}>
                    <Text style={{ fontSize: 36 }}>🔒</Text>
                  </View>
                  <Text style={styles.lockCaption}>On-device · AES-256</Text>
                </View>
              )}
            </View>

            <View style={styles.copy}>
              <Text style={styles.tag}>{slide.tag}</Text>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.body}>{slide.body}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === idx && styles.dotActive]}/>
          ))}
        </View>
        <TouchableOpacity style={styles.btn} onPress={goNext} activeOpacity={0.85}>
          <Text style={styles.btnText}>{idx < 2 ? 'Continue' : 'Get started'} →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Spacing.md,
    paddingBottom: 8,
  },
  wordmark: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  },
  skip: {
    fontSize: 13,
    color: Colors.inkSoft,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  visual: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    backgroundColor: Colors.surface2,
    borderColor: Colors.line,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stickersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 16,
    width: '100%',
  },
  miniSticker: {
    width: '46%',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'flex-start',
    gap: 4,
  },
  stickerVal: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.ink,
  },
  stickerLabel: {
    fontSize: 11,
    color: Colors.inkFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  lockBox: {
    alignItems: 'center',
    gap: 12,
  },
  lockIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockCaption: {
    fontSize: 11,
    color: Colors.inkFaint,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  copy: {
    marginTop: 28,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tag: {
    fontSize: 11,
    color: Colors.mid,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '500',
    color: Colors.ink,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    color: Colors.inkSoft,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 12,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 18,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.line,
  },
  dotActive: {
    width: 22,
    backgroundColor: Colors.primary,
  },
  btn: {
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F6F3EC',
    letterSpacing: 0.2,
  },
});
