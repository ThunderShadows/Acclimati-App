import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, Path, G, Line } from 'react-native-svg';

interface Props {
  size?: number;
  dark?: boolean;
  interactive?: boolean;
}

export function AcclimateLogo({ size = 80, dark = false, interactive = true }: Props) {
  const ink = dark ? '#F6F3EC' : '#0B2D32';
  const glow = '#16A896';

  const breatheAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const orbitAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, { toValue: 1.04, duration: 2250, useNativeDriver: true }),
        Animated.timing(breatheAnim, { toValue: 1, duration: 2250, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 24000, useNativeDriver: true })
    ).start();

    Animated.loop(
      Animated.timing(orbitAnim, { toValue: 1, duration: 8000, useNativeDriver: true })
    ).start();
  }, []);

  const spinDeg = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const orbitDeg = orbitAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const scale = size / 100;

  const content = (
    <View style={{ width: size, height: size }}>
      {/* Spinning outer ring */}
      <Animated.View
        style={{
          position: 'absolute', width: size, height: size,
          transform: [{ rotate: spinDeg }],
        }}
      >
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="46" fill="none" stroke={ink} strokeOpacity="0.18" strokeWidth="1" strokeDasharray="2 4"/>
        </Svg>
      </Animated.View>

      {/* Static elements */}
      <Svg width={size} height={size} viewBox="0 0 100 100" style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="skyG" x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0" stopColor={glow} stopOpacity="0.18"/>
            <Stop offset="1" stopColor={glow} stopOpacity="0"/>
          </LinearGradient>
        </Defs>
        <Circle cx="50" cy="50" r="40" fill="url(#skyG)"/>
        <Line x1="12" y1="62" x2="88" y2="62" stroke={ink} strokeOpacity="0.25" strokeWidth="0.8"/>
        {/* Orbit dashed circle */}
        <Circle cx="50" cy="50" r="38" fill="none" stroke={glow} strokeOpacity="0.3" strokeWidth="1" strokeDasharray="2 3"/>
        {/* Sun dot */}
        <Circle cx="72" cy="24" r="4" fill={glow}/>
        {/* Center compass dot */}
        <Circle cx="50" cy="50" r="3" fill={ink}/>
        <Circle cx="50" cy="50" r="1.5" fill={glow}/>
      </Svg>

      {/* Breathing mountain */}
      <Animated.View
        style={{
          position: 'absolute', width: size, height: size,
          transform: [{ scale: breatheAnim }],
        }}
      >
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Path d="M 22 62 L 38 32 L 50 48 L 62 28 L 78 62 Z" fill={ink}/>
          <Path d="M 38 32 L 44 40 L 41 42 Z" fill={glow} opacity="0.9"/>
          <Path d="M 62 28 L 68 38 L 65 40 Z" fill={glow} opacity="0.9"/>
        </Svg>
      </Animated.View>

      {/* Orbiting traveler dot */}
      <Animated.View
        style={{
          position: 'absolute', width: size, height: size,
          transform: [{ rotate: orbitDeg }],
        }}
      >
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="88" cy="50" r="2.5" fill={glow}/>
          <Circle cx="88" cy="50" r="5" fill={glow} opacity="0.25"/>
        </Svg>
      </Animated.View>
    </View>
  );

  if (!interactive) return content;
  return <View>{content}</View>;
}
