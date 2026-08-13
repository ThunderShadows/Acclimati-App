import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../theme';
import { AcclimateLogo } from '../components/AcclimateLogo';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0.2)).current;
  const dot2 = useRef(new Animated.Value(0.2)).current;
  const dot3 = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();

    const pulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.2, duration: 400, useNativeDriver: true }),
        ])
      );
    pulse(dot1, 0).start();
    pulse(dot2, 180).start();
    pulse(dot3, 360).start();

    const timer = setTimeout(async () => {
      try {
        const done = await AsyncStorage.getItem('onboarding_done');
        navigation.replace(done === 'true' ? 'Main' : 'Onboarding');
      } catch {
        navigation.replace('Onboarding');
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <AcclimateLogo size={120} dark={true}/>
        <Text style={styles.title}>Acclimate</Text>
        <Text style={styles.tagline}>Your travel-health companion.</Text>
      </Animated.View>
      <View style={styles.dots}>
        {[dot1, dot2, dot3].map((a, i) => (
          <Animated.View key={i} style={[styles.dot, { opacity: a }]}/>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 34,
    fontWeight: '500',
    color: '#F6F3EC',
    letterSpacing: -0.5,
    marginTop: 8,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.3,
  },
  dots: {
    position: 'absolute',
    bottom: 80,
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.bright,
  },
});
