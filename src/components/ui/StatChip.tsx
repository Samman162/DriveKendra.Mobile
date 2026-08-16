import { StyleSheet, Text, View } from 'react-native';

import type { ThemeColors } from '../../theme/colors';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { radius, spacing } from '../../theme/spacing';

export function StatChip({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.chip}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    chip: {
      flex: 1,
      minWidth: 72,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
    },
    value: {
      color: colors.highlight,
      fontSize: 20,
      fontWeight: '800',
    },
    label: {
      color: '#CBD5E1',
      fontSize: 11,
      fontWeight: '600',
      marginTop: 4,
      textAlign: 'center',
    },
  });
}
