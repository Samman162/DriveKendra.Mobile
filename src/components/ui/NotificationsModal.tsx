import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Bell, CheckCircle2, ChevronRight, Clock, Sparkles, Tag, X } from 'lucide-react-native';

import type { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { radius, spacing } from '../../theme/spacing';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  type: 'driver' | 'promo' | 'booking';
  unread: boolean;
}

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    title: '🚗 Driver Assigned for Tomorrow',
    body: 'Ram Bahadur (Scorpio 4x4 • Ba 2 Cha 8492) is assigned for your trip to Pokhara. Pickup: 7:00 AM.',
    time: '15m ago',
    type: 'driver',
    unread: true,
  },
  {
    id: 'n2',
    title: '🎉 Festive Discount Code: FESTIVE10',
    body: 'Enjoy 10% off on all Himalayan pilgrimage tours (Muktinath & Manakamana) this month.',
    time: '2h ago',
    type: 'promo',
    unread: true,
  },
  {
    id: 'n3',
    title: '✈️ Airport Transfer Confirmed',
    body: 'Your TIA terminal airport drop has been reserved. Driver will arrive 15 minutes before scheduled departure.',
    time: '1d ago',
    type: 'booking',
    unread: false,
  },
];

type NotificationsModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function NotificationsModal({ visible, onClose }: NotificationsModalProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Bell size={18} color={colors.accent} style={{ marginRight: 6 }} />
              <Text style={styles.title}>Notifications</Text>
              <View style={styles.unreadCountBadge}>
                <Text style={styles.unreadCountText}>2 New</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
            {MOCK_NOTIFICATIONS.map((item) => (
              <View key={item.id} style={[styles.notificationCard, item.unread && styles.notificationUnread]}>
                <View style={styles.topRow}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemTime}>{item.time}</Text>
                </View>
                <Text style={styles.itemBody}>{item.body}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      maxHeight: '80%',
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
    },
    unreadCountBadge: {
      backgroundColor: colors.accentSoft,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: radius.pill,
      marginLeft: spacing.sm,
    },
    unreadCountText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accent,
    },
    closeBtn: {
      padding: 4,
    },
    listContent: {
      gap: spacing.sm,
      paddingBottom: spacing.lg,
    },
    notificationCard: {
      backgroundColor: colors.elevated,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    notificationUnread: {
      borderColor: colors.accent,
      backgroundColor: colors.surface,
      borderLeftWidth: 4,
      borderLeftColor: colors.accent,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    itemTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.text,
      flex: 1,
    },
    itemTime: {
      fontSize: 11,
      color: colors.subtle,
      marginLeft: spacing.xs,
    },
    itemBody: {
      fontSize: 13,
      color: colors.muted,
      lineHeight: 18,
    },
  });
}
