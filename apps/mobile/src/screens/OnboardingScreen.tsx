import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Dimensions, SafeAreaView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Font, Radius, Spacing } from '../theme';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slide {
  emoji: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    emoji: '⛰️',
    title: 'Know before you go',
    body: "See exactly how your destination's altitude, air quality, and climate will affect your body.",
  },
  {
    emoji: '🔒',
    title: 'Your health stays private',
    body: 'Your medical profile never leaves your device. We only fetch public weather data.',
  },
  {
    emoji: '⚡',
    title: 'Ready in 2 minutes',
    body: 'Answer a quick health questionnaire and get a personalised preparation plan instantly.',
  },
];

async function completeOnboarding() {
  await AsyncStorage.setItem('onboarding_done', 'true');
}

export function OnboardingScreen({ navigation }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);
  const isLast = activeIndex === SLIDES.length - 1;

  async function handleNext() {
    if (isLast) {
      await completeOnboarding();
      navigation.replace('Main');
    } else {
      const nextIndex = activeIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setActiveIndex(nextIndex);
    }
  }

  async function handleSkip() {
    await completeOnboarding();
    navigation.replace('Main');
  }

  function onViewableItemsChanged({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActiveIndex(viewableItems[0].index);
    }
  }

  const viewabilityConfig = { viewAreaCoveragePercentThreshold: 50 };
  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig, onViewableItemsChanged },
  ]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Skip button */}
      <View style={styles.skipRow}>
        {!isLast ? (
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipBtn} />
        )}
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={styles.emojiCircle}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideBody}>{item.body}</Text>
          </View>
        )}
      />

      {/* Bottom controls */}
      <View style={styles.bottom}>
        {/* Progress dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>

        {/* CTA button */}
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>
            {isLast ? 'Get Started' : 'Next'}
          </Text>
          {!isLast && <Text style={styles.ctaArrow}>→</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: Colors.primary,
  },
  skipRow: {
    flexDirection:   'row',
    justifyContent:  'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingTop:      Spacing.md,
  },
  skipBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
  },
  skipText: {
    color:      Colors.bright,
    fontSize:   Font.size.md,
    fontWeight: Font.weight.medium,
  },

  slide: {
    width:          SCREEN_WIDTH,
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  emojiCircle: {
    width:           120,
    height:          120,
    borderRadius:    60,
    backgroundColor: Colors.mid,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    Spacing.xl,
    shadowColor:     Colors.bright,
    shadowOpacity:   0.4,
    shadowRadius:    16,
    shadowOffset:    { width: 0, height: 6 },
    elevation:       10,
  },
  emoji: {
    fontSize: 52,
  },
  slideTitle: {
    fontSize:      Font.size.xxl,
    fontWeight:    Font.weight.bold,
    color:         Colors.textOnDark,
    textAlign:     'center',
    marginBottom:  Spacing.md,
    letterSpacing: 0.3,
  },
  slideBody: {
    fontSize:   Font.size.md,
    color:      Colors.bright,
    textAlign:  'center',
    lineHeight: 24,
    fontWeight: Font.weight.regular,
  },

  bottom: {
    paddingHorizontal: Spacing.lg,
    paddingBottom:     Spacing.xl,
  },
  dotsRow: {
    flexDirection:  'row',
    justifyContent: 'center',
    alignItems:     'center',
    marginBottom:   Spacing.lg,
    gap:            8,
  },
  dot: {
    width:         8,
    height:        8,
    borderRadius:  4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    width:           24,
    backgroundColor: Colors.bright,
  },

  ctaBtn: {
    flexDirection:   'row',
    backgroundColor: Colors.mid,
    borderRadius:    Radius.lg,
    paddingVertical:  16,
    paddingHorizontal: Spacing.lg,
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     Colors.mid,
    shadowOpacity:   0.5,
    shadowRadius:    12,
    shadowOffset:    { width: 0, height: 4 },
    elevation:       6,
    gap:             8,
  },
  ctaText: {
    fontSize:   Font.size.lg,
    fontWeight: Font.weight.bold,
    color:      Colors.textOnDark,
  },
  ctaArrow: {
    fontSize:   Font.size.lg,
    color:      Colors.textOnDark,
  },
});
