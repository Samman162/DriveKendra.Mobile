import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Info,
  RefreshCw,
  Sparkles,
  TriangleAlert,
  X,
} from 'lucide-react-native';

import type { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { radius, spacing } from '../../theme/spacing';
import { hapticFeedback } from '../../utils/haptics';
import { getUserNotifications, markNotificationAsRead } from '../../api/users';
import type { CustomerNotification } from '../../types/api';

interface CustomerNotificationsModalProps {
  visible: boolean;
  onClose: () => void;
  userId?: number;
  phoneNumber?: string;
  onUnreadCountChange?: (count: number) => void;
}

export function CustomerNotificationsModal({
  visible,
  onClose,
  userId,
  phoneNumber,
  onUnreadCountChange,
}: CustomerNotificationsModalProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUserNotifications({ userId, phoneNumber });
      setNotifications(data);
      const unread = data.filter((n) => !n.isRead).length;
      onUnreadCountChange?.(unread);
    } catch {
      // Ignore network errors in offline/graceful mode
    } finally {
      setLoading(false);
    }
  }, [userId, phoneNumber, onUnreadCountChange]);

  useEffect(() => {
    if (visible) {
      void loadNotifications();
    }
  }, [visible, loadNotifications]);

  const handleMarkRead = async (id: number) => {
    hapticFeedback.light();
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    try {
      await markNotificationAsRead(id);
      const unread = notifications.filter((n) => n.id !== id && !n.isRead).length;
      onUnreadCountChange?.(unread);
    } catch {
      // ignore
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'booking_confirmed':
      case 'driver_assigned':
        return <CheckCircle2 size={18} color={colors.success} />;
      case 'booking_rejected':
      case 'trip_cancelled':
        return <TriangleAlert size={18} color={colors.error} />;
      case 'trip_dispatched':
      case 'trip_completed':
        return <Sparkles size={18} color={colors.highlight} />;
      case 'trip_requested':
      case 'booking_pending':
        return <Clock size={18} color={colors.accent} />;
      default:
        return <CheckCircle2 size={18} color={colors.accent} />;
    }
  };

  const renderItem = ({ item }: { item: CustomerNotification }) => {
    const formattedDate = new Date(item.createdAt).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={[styles.card, !item.isRead && styles.cardUnread]}>
        <View style={styles.cardHeader}>
          <View style={styles.iconWrap}>{getIconForType(item.type)}</View>
          <View style={styles.headerInfo}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardTime}>
              <Clock size={11} color={colors.subtle} /> {formattedDate}
            </Text>
          </View>
          {!item.isRead && (
            <Pressable
              onPress={() => handleMarkRead(item.id)}
              style={({ pressed }) => [styles.markReadBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Mark notification as read"
            >
              <Check size={12} color={colors.onAccent} />
              <Text style={styles.markReadText}>Read</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.cardMessage}>{item.message}</Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.bellBadge}>
                <Bell size={18} color={colors.accent} />
              </View>
              <View>
                <Text style={styles.title}>Notifications &amp; Alerts</Text>
                <Text style={styles.subtitle}>
                  Real-time updates for your booked trips
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <Pressable
                onPress={() => {
                  hapticFeedback.light();
                  void loadNotifications();
                }}
                style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Refresh notifications"
              >
                <RefreshCw size={18} color={colors.text} />
              </Pressable>

              <Pressable
                onPress={onClose}
                style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Close notifications modal"
              >
                <X size={20} color={colors.text} />
              </Pressable>
            </View>
          </View>

          {/* Body */}
          {loading && notifications.length === 0 ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={styles.loadingText}>Fetching updates...</Text>
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.centerContainer}>
              <Bell size={40} color={colors.subtle} />
              <Text style={styles.emptyTitle}>No Notifications Yet</Text>
              <Text style={styles.emptySub}>
                You will receive real-time updates when your trip is confirmed or assigned.
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
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      maxHeight: '85%',
      minHeight: '45%',
      paddingBottom: spacing.xl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    bellBadge: {
      width: 38,
      height: 38,
      borderRadius: radius.pill,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      fontSize: 12,
      color: colors.subtle,
      marginTop: 2,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    iconBtn: {
      padding: spacing.xs,
      borderRadius: radius.sm,
    },
    pressed: {
      opacity: 0.7,
    },
    centerContainer: {
      padding: spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 200,
    },
    loadingText: {
      marginTop: spacing.md,
      fontSize: 13,
      color: colors.subtle,
    },
    emptyTitle: {
      marginTop: spacing.md,
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    emptySub: {
      marginTop: spacing.xs,
      fontSize: 12,
      color: colors.subtle,
      textAlign: 'center',
      paddingHorizontal: spacing.xl,
    },
    listContent: {
      padding: spacing.md,
      gap: spacing.sm,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.xs,
    },
    cardUnread: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    iconWrap: {
      marginRight: spacing.sm,
    },
    headerInfo: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    cardTime: {
      fontSize: 11,
      color: colors.subtle,
      marginTop: 2,
    },
    markReadBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.sm,
      gap: 4,
    },
    markReadText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.onAccent,
    },
    cardMessage: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.text,
      marginTop: spacing.xs,
    },
  });
