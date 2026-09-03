import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Sparkles, KeyRound } from 'lucide-react-native';

import type { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { radius, spacing } from '../../theme/spacing';

type SocialAuthButtonsProps = {
  onQuickDemoFill?: (email: string, pass: string) => void;
  onGooglePress?: () => void;
  onApplePress?: () => void;
};

export function SocialAuthButtons({
  onQuickDemoFill,
  onGooglePress,
  onApplePress,
}: SocialAuthButtonsProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const hasSocial = Boolean(onGooglePress || onApplePress);
  return (
    <View style={styles.container}>
      {hasSocial && (
        <>
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.buttonRow}>
            {onGooglePress && (
              <Pressable
                accessibilityRole="button"
                onPress={onGooglePress}
                style={({ pressed }) => [styles.socialBtn, pressed && styles.btnPressed]}
              >
                <Text style={styles.socialBtnText}>Google</Text>
              </Pressable>
            )}

            {onApplePress && (
              <Pressable
                accessibilityRole="button"
                onPress={onApplePress}
                style={({ pressed }) => [styles.socialBtn, pressed && styles.btnPressed]}
              >
                <Text style={styles.socialBtnText}>Apple</Text>
              </Pressable>
            )}
          </View>
        </>
      )}

      {onQuickDemoFill && (
        <View style={styles.demoBox}>
          <View style={styles.demoHeader}>
            <KeyRound size={14} color={colors.highlight} />
            <Text style={styles.demoTitle}>Quick Demo Login</Text>
          </View>
          <View style={styles.demoButtonsRow}>
            <Pressable
              onPress={() => onQuickDemoFill('+977 9851363783', 'password123')}
              style={({ pressed }) => [styles.demoChip, pressed && styles.btnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Quick fill demo credentials for Samman Chhetri"
              testID="demo-login-samman-btn"
            >
              <Sparkles size={14} color={colors.accent} style={{ marginRight: 6 }} />
              <Text style={styles.demoChipText}>Samman Chhetri (Customer)</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      marginTop: spacing.md,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: spacing.md,
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      color: colors.subtle,
      fontSize: 12,
      fontWeight: '600',
      paddingHorizontal: spacing.sm,
      textTransform: 'uppercase',
    },
    buttonRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    socialBtn: {
      flex: 1,
      minHeight: 46,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    socialBtnText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    btnPressed: {
      opacity: 0.8,
      transform: [{ scale: 0.98 }],
    },
    demoBox: {
      marginTop: spacing.md,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.elevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    demoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: spacing.xs,
    },
    demoTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    demoButtonsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    demoChip: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
      borderRadius: radius.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.accentSoft,
    },
    demoChipText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '600',
    },
  });
}
