import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Laptop, Moon, Sun } from 'lucide-react-native';

import { radius, spacing } from '../../theme/spacing';
import type { ThemeColors } from '../../theme/colors';
import { useTheme, type ThemePreference } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { hapticFeedback } from '../../utils/haptics';

type ThemeOption = {
  key: ThemePreference;
  label: string;
  subLabel: string;
  icon: typeof Sun;
};

const THEME_OPTIONS: ThemeOption[] = [
  {
    key: 'light',
    label: 'Light',
    subLabel: 'Alpine Day',
    icon: Sun,
  },
  {
    key: 'dark',
    label: 'Dark',
    subLabel: 'Himalayan Night',
    icon: Moon,
  },
  {
    key: 'system',
    label: 'System',
    subLabel: 'Device Default',
    icon: Laptop,
  },
];

type Props = {
  style?: object;
};

export function ThemeModeSelector({ style }: Props) {
  const { preference, setPreference, colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const handleSelect = (key: ThemePreference) => {
    hapticFeedback.selection();
    setPreference(key);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.grid}>
        {THEME_OPTIONS.map((opt) => {
          const isSelected = preference === opt.key;
          const Icon = opt.icon;

          return (
            <Pressable
              key={opt.key}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${opt.label} mode, ${opt.subLabel}`}
              onPress={() => handleSelect(opt.key)}
              style={({ pressed }) => [
                styles.optionCard,
                isSelected && styles.optionCardSelected,
                pressed && styles.optionCardPressed,
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  isSelected ? styles.iconWrapSelected : styles.iconWrapUnselected,
                ]}
              >
                <Icon
                  size={20}
                  color={isSelected ? colors.onAccent : colors.subtle}
                />
              </View>
              <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                {opt.label}
              </Text>
              <Text style={[styles.optionSub, isSelected && styles.optionSubSelected]}>
                {opt.subLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      width: '100%',
    },
    grid: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    optionCard: {
      flex: 1,
      backgroundColor: colors.elevated,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xs,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    optionCardSelected: {
      backgroundColor: colors.surface,
      borderColor: colors.accent,
    },
    optionCardPressed: {
      opacity: 0.85,
    },
    iconWrap: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    iconWrapSelected: {
      backgroundColor: colors.accent,
    },
    iconWrapUnselected: {
      backgroundColor: colors.accentSoft,
    },
    optionLabel: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
    },
    optionLabelSelected: {
      color: colors.accent,
      fontWeight: '900',
    },
    optionSub: {
      fontSize: 10,
      color: colors.muted,
      marginTop: 2,
      textAlign: 'center',
      fontWeight: '500',
    },
    optionSubSelected: {
      color: colors.text,
      fontWeight: '600',
    },
  });
}
