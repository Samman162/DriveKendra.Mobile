import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';

import type { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { radius, spacing } from '../../theme/spacing';

type SuccessModalProps = {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
};

export function SuccessModal({ visible, title, message, onClose }: SuccessModalProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <CheckCircle2 color={colors.success} size={42} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <Pressable onPress={onClose} style={styles.ok}>
            <Text style={styles.okLabel}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
    },
    card: {
      width: '100%',
      maxWidth: 420,
      alignSelf: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.xl,
      alignItems: 'center',
      gap: spacing.sm,
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '700',
      textAlign: 'center',
    },
    message: {
      color: colors.muted,
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    ok: {
      alignSelf: 'stretch',
      backgroundColor: colors.accent,
      borderRadius: radius.md,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    okLabel: {
      color: colors.onAccent,
      fontWeight: '700',
    },
  });
}
