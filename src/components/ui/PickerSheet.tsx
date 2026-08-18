import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ThemeColors } from '../../theme/colors';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { radius, spacing } from '../../theme/spacing';

export type PickerOption = {
  id: number;
  name: string;
};

type PickerSheetProps = {
  label: string;
  value: number | null;
  options: readonly PickerOption[];
  onChange: (id: number) => void;
  error?: string;
  placeholder?: string;
};

export function PickerSheet({
  label,
  value,
  options,
  onChange,
  error,
  placeholder = 'Select an option',
}: PickerSheetProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chips}>
        {options.map((option) => {
          const active = option.id === value;
          return (
            <Pressable
              key={option.id}
              onPress={() => onChange(option.id)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                {option.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!value ? <Text style={styles.hint}>{placeholder}</Text> : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      marginBottom: spacing.md,
    },
    label: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: '600',
      marginBottom: spacing.sm,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    chip: {
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    chipActive: {
      backgroundColor: colors.navy,
      borderColor: colors.navy,
    },
    chipLabel: {
      color: colors.muted,
      fontWeight: '600',
      fontSize: 13,
    },
    chipLabelActive: {
      color: colors.onNavy,
    },
    error: {
      color: colors.error,
      fontSize: 12,
      marginTop: spacing.xs,
    },
    hint: {
      color: colors.subtle,
      fontSize: 12,
      marginTop: spacing.xs,
    },
  });
}
