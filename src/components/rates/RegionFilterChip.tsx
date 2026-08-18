import React, { memo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { radius, spacing } from '../../theme/spacing';
import type { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { hapticFeedback } from '../../utils/haptics';

export interface RegionFilterChipProps {
  id: string;
  label: string;
  count?: number;
  selected: boolean;
  onSelect: (id: string) => void;
}

export const RegionFilterChip = memo(
  function RegionFilterChip({
    id,
    label,
    count,
    selected,
    onSelect,
  }: RegionFilterChipProps) {
    const { colors } = useTheme();
    const styles = useThemedStyles(createStyles);

    const handlePress = () => {
      hapticFeedback.selection();
      onSelect(id);
    };

    return (
      <Pressable
        onPress={handlePress}
        style={[styles.chip, selected && styles.chipSelected]}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={`Filter by ${label}`}
      >
        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
          {label}
        </Text>
        {count !== undefined && (
          <Text style={[styles.countBadge, selected && styles.countBadgeSelected]}>
            {count}
          </Text>
        )}
      </Pressable>
    );
  },
  (prev, next) =>
    prev.selected === next.selected &&
    prev.count === next.count &&
    prev.label === next.label &&
    prev.id === next.id,
);

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: spacing.md,
      paddingVertical: 7,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: spacing.xs,
    },
    chipSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    chipText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.muted,
    },
    chipTextSelected: {
      color: colors.onAccent,
    },
    countBadge: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.subtle,
      backgroundColor: colors.elevated,
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: radius.sm,
      overflow: 'hidden',
    },
    countBadgeSelected: {
      color: colors.accent,
      backgroundColor: '#FFFFFF',
    },
  });
}
