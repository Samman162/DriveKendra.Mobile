import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Linking from 'expo-linking';
import {
  AlertTriangle,
  Headphones,
  MessageCircle,
  PhoneCall,
  ShieldAlert,
  X,
} from 'lucide-react-native';

import type { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { radius, spacing } from '../../theme/spacing';
import { hapticFeedback } from '../../utils/haptics';
import { CONTACT_INFO } from '../../constants/contact';

interface EmergencySosModalProps {
  visible: boolean;
  onClose: () => void;
  bookingRef?: string;
}

export function EmergencySosModal({
  visible,
  onClose,
  bookingRef,
}: EmergencySosModalProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const dialNumber = (phone: string) => {
    hapticFeedback.medium();
    Linking.openURL(`tel:${phone}`);
  };

  const sendWhatsAppSos = () => {
    hapticFeedback.medium();
    const refText = bookingRef ? ` (Trip Ref: ${bookingRef})` : '';
    const message = encodeURIComponent(
      `🚨 EMERGENCY SOS - Drive Kendra Mobile App${refText}. I require urgent roadside / trip assistance. Please contact me immediately.`,
    );
    Linking.openURL(`https://wa.me/9779851363783?text=${message}`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.sosIconCircle}>
                <AlertTriangle size={22} color={colors.onNavy} />
              </View>
              <View>
                <Text style={styles.sheetTitle}>Emergency SOS Assistance</Text>
                <Text style={styles.sheetSubtitle}>24/7 Roadside & Security Dispatch Nepal</Text>
              </View>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={colors.muted} />
            </Pressable>
          </View>

          {bookingRef && (
            <View style={styles.refBanner}>
              <Text style={styles.refText}>
                Active Trip: <Text style={styles.refHighlight}>{bookingRef}</Text>
              </Text>
            </View>
          )}

          {/* Direct Action Grid */}
          <View style={styles.actionsContainer}>
            {/* 1. Drive Kendra 24/7 Hotline */}
            <Pressable
              style={[styles.sosCard, styles.sosCardPrimary]}
              onPress={() => dialNumber(CONTACT_INFO.phoneRaw)}
            >
              <View style={styles.cardIconBox}>
                <Headphones size={24} color={colors.onNavy} />
              </View>
              <View style={styles.cardTextBox}>
                <Text style={styles.cardTitlePrimary}>Drive Kendra 24/7 Hotline</Text>
                <Text style={styles.cardSubtitlePrimary}>Direct Roadside & Dispatch Command</Text>
              </View>
              <PhoneCall size={20} color={colors.onNavy} />
            </Pressable>

            {/* 2. WhatsApp Urgent SOS */}
            <Pressable style={styles.sosCard} onPress={sendWhatsAppSos}>
              <View style={[styles.cardIconBoxSecondary, { backgroundColor: '#25D36620' }]}>
                <MessageCircle size={20} color="#25D366" />
              </View>
              <View style={styles.cardTextBox}>
                <Text style={styles.cardTitle}>WhatsApp Dispatch Desk</Text>
                <Text style={styles.cardSubtitle}>Share live GPS location & photos</Text>
              </View>
            </Pressable>

            {/* 4. Nepal Tourist Police 1144 */}
            <Pressable
              style={styles.sosCard}
              onPress={() => dialNumber('1144')}
            >
              <View style={[styles.cardIconBoxSecondary, { backgroundColor: '#3B82F620' }]}>
                <ShieldAlert size={20} color="#3B82F6" />
              </View>
              <View style={styles.cardTextBox}>
                <Text style={styles.cardTitle}>Nepal Tourist Police (1144)</Text>
                <Text style={styles.cardSubtitle}>Toll-free tourist safety & assistance</Text>
              </View>
            </Pressable>

            {/* 5. Nepal Police Emergency 100 */}
            <Pressable
              style={styles.sosCard}
              onPress={() => dialNumber('100')}
            >
              <View style={[styles.cardIconBoxSecondary, { backgroundColor: '#EF444420' }]}>
                <AlertTriangle size={20} color="#EF4444" />
              </View>
              <View style={styles.cardTextBox}>
                <Text style={styles.cardTitle}>Nepal Police Emergency (100)</Text>
                <Text style={styles.cardSubtitle}>Nationwide rapid response</Text>
              </View>
            </Pressable>
          </View>

          {/* Close */}
          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Dismiss</Text>
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
      justifyContent: 'flex-end',
      alignItems: 'center',
      width: '100%',
    },
    sheet: {
      width: '100%',
      maxWidth: 540,
      alignSelf: 'center',
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      paddingTop: spacing.lg,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    sosIconCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: '#EF4444',
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheetTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    sheetSubtitle: {
      fontSize: 12,
      color: colors.muted,
    },
    closeBtn: {
      padding: spacing.xs,
    },
    refBanner: {
      backgroundColor: colors.elevated,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      marginTop: spacing.sm,
    },
    refText: {
      fontSize: 12,
      color: colors.muted,
    },
    refHighlight: {
      fontWeight: '700',
      color: colors.accent,
    },
    actionsContainer: {
      paddingVertical: spacing.md,
      gap: spacing.sm,
    },
    sosCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.md,
    },
    sosCardPrimary: {
      backgroundColor: colors.error,
      borderColor: colors.error,
    },
    cardIconBox: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardIconBoxSecondary: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.elevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTextBox: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    cardSubtitle: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
    },
    cardTitlePrimary: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.onNavy,
    },
    cardSubtitlePrimary: {
      fontSize: 12,
      color: colors.onNavy,
      opacity: 0.9,
      marginTop: 2,
    },
    cancelBtn: {
      backgroundColor: colors.elevated,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.xs,
    },
    cancelBtnText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
  });
}
