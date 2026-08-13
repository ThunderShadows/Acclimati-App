import React from 'react';
import { View, Text } from 'react-native';
import { Colors, Radius } from '../theme';

const ICON_MAP: Record<string, string> = {
  thermo:   '🌡',
  droplet:  '💧',
  mountain: '⛰',
  wind:     '🌬',
  sun:      '☀',
  leaf:     '🌿',
};

interface Props {
  icon: string;
  value: string | number;
  unit: string;
  label: string;
}

export function WeatherSticker({ icon, value, unit, label }: Props) {
  return (
    <View style={{
      backgroundColor: Colors.surface,
      borderColor: Colors.line,
      borderWidth: 1,
      borderRadius: Radius.lg,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    }}>
      <View style={{
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: Colors.bg,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 18 }}>{ICON_MAP[icon] || '·'}</Text>
      </View>
      <View>
        <Text style={{ fontSize: 17, color: Colors.ink, fontWeight: '500' }}>
          {value}<Text style={{ fontSize: 11, color: Colors.inkSoft }}>{unit ? ` ${unit}` : ''}</Text>
        </Text>
        <Text style={{ fontSize: 10, color: Colors.inkFaint, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</Text>
      </View>
    </View>
  );
}
