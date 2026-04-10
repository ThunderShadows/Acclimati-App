import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Font, Radius, Spacing } from '../theme';
import type { RiskLevel } from '@acclimate/engine';

interface Props {
  level: RiskLevel;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const LABELS: Record<RiskLevel, string> = {
  none:     'None',
  low:      'Low',
  moderate: 'Moderate',
  high:     'High',
  severe:   'Severe',
};

export function RiskBadge({ level, label, size = 'md' }: Props) {
  const palette = Colors.risk[level];
  const isLg    = size === 'lg';
  const isSm    = size === 'sm';

  return (
    <View style={[
      styles.base,
      { backgroundColor: palette.bg, borderColor: palette.border, borderWidth: 1 },
      isLg && styles.lg,
      isSm && styles.sm,
    ]}>
      <View style={[styles.dot, { backgroundColor: palette.dot }, isSm && styles.dotSm]} />
      <Text style={[
        styles.text,
        { color: palette.text },
        isLg && styles.textLg,
        isSm && styles.textSm,
      ]}>
        {label ?? LABELS[level]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection:     'row',
    alignItems:        'center',
    alignSelf:         'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical:   4,
    borderRadius:      Radius.full,
    gap: 5,
  },
  lg: {
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
  },
  sm: {
    paddingHorizontal: 6,
    paddingVertical:   2,
  },
  dot: {
    width:        7,
    height:       7,
    borderRadius: 4,
  },
  dotSm: {
    width:  5,
    height: 5,
  },
  text: {
    fontSize:   Font.size.sm,
    fontWeight: Font.weight.semibold,
  },
  textLg: {
    fontSize:   Font.size.lg,
    fontWeight: Font.weight.bold,
  },
  textSm: {
    fontSize: Font.size.xs,
  },
});
