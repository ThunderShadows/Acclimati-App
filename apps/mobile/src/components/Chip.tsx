import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, Font, Radius, Spacing } from '../theme';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function Chip({ label, selected, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.selected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    borderRadius:      Radius.full,
    borderWidth:       1.5,
    borderColor:       Colors.border,
    backgroundColor:   Colors.card,
    marginRight:       Spacing.sm,
    marginBottom:      Spacing.sm,
  },
  selected: {
    borderColor:     Colors.mid,
    backgroundColor: Colors.mid,
  },
  label: {
    fontSize:   Font.size.sm,
    fontWeight: Font.weight.medium,
    color:      Colors.textMuted,
  },
  labelSelected: {
    color: Colors.textOnDark,
  },
});
