import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ThemeColors } from '../../theme/colors';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { radius, spacing } from '../../theme/spacing';

type StepperProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  error?: string;
};

export function Stepper({ label, value, min, max, onChange, error }: StepperProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onChange(Math.max(min, value - 1))}
          style={styles.control}
        >
          <Text style={styles.controlLabel}>-</Text>
        </Pressable>
        <Text style={styles.value}>{value}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => onChange(Math.min(max, value + 1))}
          style={styles.control}
        >
          <Text style={styles.controlLabel}>+</Text>
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
      marginBottom: spacing.xs,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    control: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    controlLabel: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '700',
    },
    value: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
      minWidth: 32,
      textAlign: 'center',
    },
    error: {
      color: colors.error,
      fontSize: 12,
      marginTop: spacing.xs,
    },
  });
}
