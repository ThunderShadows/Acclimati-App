import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, SafeAreaView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Font } from '../theme';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(async () => {
      try {
        const done = await AsyncStorage.getItem('onboarding_done');
        if (done === 'true') {
          navigation.replace('Main');
        } else {
          navigation.replace('Onboarding');
        }
      } catch {
        navigation.replace('Onboarding');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View
        style={[
          styles.container,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Logo circle */}
        <View style={styles.logoCircle}>
          <Text style={styles.logoLetter}>A</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Acclimate</Text>

        {/* Tagline */}
        <Text style={styles.tagline}>Prepare. Arrive. Thrive.</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: Colors.primary,
  },
  container: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoCircle: {
    width:           100,
    height:          100,
    borderRadius:    50,
    backgroundColor: Colors.mid,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    24,
    shadowColor:     Colors.bright,
    shadowOpacity:   0.5,
    shadowRadius:    20,
    shadowOffset:    { width: 0, height: 8 },
    elevation:       12,
  },
  logoLetter: {
    fontSize:   Font.size.xxxl,
    fontWeight: Font.weight.bold,
    color:      Colors.textOnDark,
    lineHeight: Font.size.xxxl + 4,
  },
  title: {
    fontSize:      Font.size.xxl + 4,
    fontWeight:    Font.weight.bold,
    color:         Colors.textOnDark,
    letterSpacing: 1,
    marginBottom:  12,
  },
  tagline: {
    fontSize:      Font.size.md,
    color:         Colors.bright,
    letterSpacing: 0.5,
    fontWeight:    Font.weight.medium,
  },
});
