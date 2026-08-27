import React from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Bell, CheckCheck, Clock, X } from 'lucide-react-native';

import type { InAppNotificationDto } from '../../types/api';
import type { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { radius, spacing } from '../../theme/spacing';
import { hapticFeedback } from '../../utils/haptics';

interface NotificationModalProps {
  visible: boolean;
  notifications: InAppNotificationDto[];
  onClose: () => void;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead?: () => void;
}

export function NotificationModal({
  visible,
  notifications,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationModalProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const renderItem = ({ item }: { item: InAppNotificationDto }) => {
    const formattedDate = new Date(item.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <Pressable
        style={[styles.itemCard, !item.isRead && styles.itemCardUnread]}
        onPress={() => {
          if (!item.isRead) {
            hapticFeedback.light();
            onMarkAsRead(item.id);
          }
        }}
      >
        <View style={styles.itemHeader}>
          <View style={styles.itemTitleRow}>
            {!item.isRead && <View style={styles.unreadDot} />}
            <Text style={[styles.itemTitle, !item.isRead && styles.itemTitleBold]}>
              {item.title}
            </Text>
          </View>
          <Text style={styles.itemTime}>
            <Clock size={11} color={colors.muted} /> {formattedDate}
          </Text>
        </View>
        <Text style={styles.itemMessage}>{item.message}</Text>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Bell size={20} color={colors.accent} />
              <Text style={styles.sheetTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount} new</Text>
                </View>
              )}
            </View>

            <View style={styles.headerActions}>
              {unreadCount > 0 && onMarkAllAsRead && (
                <Pressable
                  style={styles.markAllBtn}
                  onPress={() => {
                    hapticFeedback.light();
                    onMarkAllAsRead();
                  }}
                >
                  <CheckCheck size={16} color={colors.accent} />
                  <Text style={styles.markAllText}>Mark all read</Text>
                </Pressable>
              )}
              <Pressable
                style={styles.closeBtn}
                onPress={() => {
                  hapticFeedback.light();
                  onClose();
                }}
              >
                <X size={20} color={colors.muted} />
              </Pressable>
            </View>
          </View>

          {/* List or Empty State */}
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Bell size={40} color={colors.muted} style={{ opacity: 0.5 }} />
              <Text style={styles.emptyTitle}>All Caught Up!</Text>
              <Text style={styles.emptySubtitle}>
                You have no new trip updates or alerts at the moment.
              </Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Close Button */}
          <Pressable style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Close</Text>
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
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      maxHeight: '80%',
      minHeight: 380,
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
      gap: spacing.xs,
    },
    sheetTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    badge: {
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: radius.pill,
      marginLeft: spacing.xs,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.onAccent,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    markAllBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.xs,
      paddingVertical: 4,
    },
    markAllText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.accent,
    },
    closeBtn: {
      padding: spacing.xs,
    },
    listContent: {
      paddingVertical: spacing.md,
      gap: spacing.sm,
    },
    itemCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: 4,
    },
    itemCardUnread: {
      borderColor: colors.accent,
      backgroundColor: colors.elevated,
    },
    itemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    itemTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.accent,
    },
    itemTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    itemTitleBold: {
      fontWeight: '700',
      color: colors.accent,
    },
    itemTime: {
      fontSize: 11,
      color: colors.muted,
    },
    itemMessage: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.muted,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xxl,
      gap: spacing.xs,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginTop: spacing.sm,
    },
    emptySubtitle: {
      fontSize: 13,
      color: colors.muted,
      textAlign: 'center',
      paddingHorizontal: spacing.lg,
    },
    doneBtn: {
      backgroundColor: colors.accent,
      borderRadius: radius.md,
      minHeight: 46,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.sm,
    },
    doneBtnText: {
      color: colors.onAccent,
      fontSize: 15,
      fontWeight: '700',
    },
  });
}
