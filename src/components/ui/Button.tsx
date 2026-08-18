import React, { type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { radius, spacing } from '../../theme/spacing';
import { hapticFeedback } from '../../utils/haptics';

type ButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'navy' | 'outline';
  icon?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
};

export function Button({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  icon,
  size = 'md',
}: ButtonProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isDisabled = disabled || loading;
  const spinner = variant === 'primary' || variant === 'navy' ? colors.onAccent : colors.accent;

  const handlePress = () => {
    if (isDisabled) return;
    hapticFeedback.light();
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' && styles.sizeSm,
        size === 'lg' && styles.sizeLg,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        variant === 'navy' && styles.navy,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={spinner} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
          <Text
            style={[
              styles.label,
              size === 'sm' && styles.labelSm,
              (variant === 'primary' || variant === 'navy') && styles.onAccent,
              variant === 'secondary' && styles.secondaryLabel,
              variant === 'outline' && styles.outlineLabel,
              variant === 'ghost' && styles.ghostLabel,
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    base: {
      minHeight: 50,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    sizeSm: {
      minHeight: 38,
      paddingHorizontal: spacing.md,
      borderRadius: radius.sm,
    },
    sizeLg: {
      minHeight: 56,
      paddingHorizontal: spacing.xl,
      borderRadius: radius.lg,
    },
    primary: {
      backgroundColor: colors.accent,
    },
    secondary: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.accent,
    },
    ghost: {
      backgroundColor: 'transparent',
      elevation: 0,
      shadowOpacity: 0,
    },
    navy: {
      backgroundColor: colors.navy,
    },
    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.985 }],
    },
    disabled: {
      opacity: 0.45,
      elevation: 0,
    },
    contentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconContainer: {
      marginRight: spacing.xs + 2,
    },
    label: {
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: 0.2,
    },
    labelSm: {
      fontSize: 13,
      fontWeight: '700',
    },
    onAccent: {
      color: colors.onAccent,
    },
    secondaryLabel: {
      color: colors.text,
    },
    outlineLabel: {
      color: colors.accent,
    },
    ghostLabel: {
      color: colors.accent,
    },
  });
}
