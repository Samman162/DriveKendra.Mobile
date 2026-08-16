import { StyleSheet, Text, View } from 'react-native';

import type { ThemeColors } from '../../theme/colors';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function SectionHeader({
  tag,
  title,
  subtitle,
  light = false,
}: {
  tag?: string;
  title: string;
  subtitle?: string;
  light?: boolean;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.wrap}>
      {tag ? <Text style={[styles.tag, light && styles.tagLight]}>{tag}</Text> : null}
      <Text style={[styles.title, light && styles.titleLight]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, light && styles.subtitleLight]}>{subtitle}</Text> : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      marginBottom: spacing.lg,
    },
    tag: {
      ...typography.label,
      color: colors.accent,
      textTransform: 'uppercase',
      marginBottom: spacing.xs,
    },
    tagLight: {
      color: colors.highlight,
    },
    title: {
      ...typography.title,
      color: colors.text,
    },
    titleLight: {
      color: colors.onNavy,
    },
    subtitle: {
      ...typography.body,
      color: colors.muted,
      marginTop: spacing.xs,
    },
    subtitleLight: {
      color: '#CBD5E1',
    },
  });
}
