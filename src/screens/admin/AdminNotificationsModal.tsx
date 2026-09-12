import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Bell,
  CheckCircle2,
  Clock,
  Megaphone,
  Radio,
  RefreshCw,
  Send,
  Sparkles,
  TriangleAlert,
  User,
  X,
} from 'lucide-react-native';

import type { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { radius, spacing } from '../../theme/spacing';
import { hapticFeedback } from '../../utils/haptics';
import { broadcastAdminNotification, getAdminNotifications } from '../../api/admin';
import type { AdminNotification } from '../../types/admin';

interface AdminNotificationsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AdminNotificationsModal({ visible, onClose }: AdminNotificationsModalProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [activeSubTab, setActiveSubTab] = useState<'list' | 'direct'>('list');
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Direct Trip Alert state
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertUserId, setAlertUserId] = useState('');
  const [alertBookingId, setAlertBookingId] = useState('');
  const [isSending, setIsSending] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminNotifications();
      setNotifications(data);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      void loadNotifications();
    }
  }, [visible, loadNotifications]);

  const handleSendDirectAlert = async () => {
    if (!alertUserId.trim()) {
      Alert.alert('Missing Traveler', 'Please specify the target traveler user ID.');
      return;
    }
    if (!alertTitle.trim()) {
      Alert.alert('Missing Title', 'Please enter a notification title.');
      return;
    }
    if (!alertMessage.trim()) {
      Alert.alert('Missing Message', 'Please enter notification message content.');
      return;
    }

    setIsSending(true);
    hapticFeedback.medium();
    try {
      const parsedUserId = parseInt(alertUserId.trim(), 10);
      const parsedBookingId = alertBookingId.trim() ? parseInt(alertBookingId.trim(), 10) : undefined;
      const res = await broadcastAdminNotification({
        userId: isNaN(parsedUserId) ? undefined : parsedUserId,
        bookingId: isNaN(parsedBookingId as number) ? undefined : parsedBookingId,
        title: alertTitle.trim(),
        message: alertMessage.trim(),
        type: 'trip_update',
      });

      hapticFeedback.success();
      Alert.alert('Notification Dispatched', res.message || 'Traveler has been notified successfully.');
      setAlertTitle('');
      setAlertMessage('');
      setAlertUserId('');
      setAlertBookingId('');
      setActiveSubTab('list');
      await loadNotifications();
    } catch (err: unknown) {
      hapticFeedback.error();
      const msg = err instanceof Error ? err.message : 'Alert transmission failed.';
      Alert.alert('Dispatch Error', msg);
    } finally {
      setIsSending(false);
    }
  };

  const renderNotificationItem = ({ item }: { item: AdminNotification }) => {
    const formattedDate = new Date(item.createdAt).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={styles.notifCard}>
        <View style={styles.notifCardTop}>
          <View style={styles.notifTypeBadge}>
            <Bell size={12} color={colors.accent} />
            <Text style={styles.notifTypeText}>{item.type.replace('_', ' ').toUpperCase()}</Text>
          </View>
          <Text style={styles.notifTime}>
            <Clock size={11} color={colors.subtle} /> {formattedDate}
          </Text>
        </View>

        <Text style={styles.notifTitle}>{item.title}</Text>
        <Text style={styles.notifMessage}>{item.message}</Text>

        <View style={styles.notifFooter}>
          {item.userName ? (
            <View style={styles.userRow}>
              <User size={12} color={colors.subtle} />
              <Text style={styles.userRowText}>
                {item.userName} {item.userPhone ? `(${item.userPhone})` : ''}
              </Text>
            </View>
          ) : (
            <View style={styles.userRow}>
              <User size={12} color={colors.subtle} />
              <Text style={styles.userRowText}>Traveler #{item.userId}</Text>
            </View>
          )}

          {item.bookingId ? (
            <Text style={styles.bookingRefText}>Trip #{item.bookingId}</Text>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Top Bar */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.bellBadge}>
                <Megaphone size={18} color={colors.accent} />
              </View>
              <View>
                <Text style={styles.title}>Admin Notifications Desk</Text>
                <Text style={styles.subtitle}>Real-time trip notifications &amp; traveler updates</Text>
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

          {/* Sub Navigation */}
          <View style={styles.subTabsRow}>
            <Pressable
              onPress={() => {
                hapticFeedback.selection();
                setActiveSubTab('list');
              }}
              style={[styles.subTab, activeSubTab === 'list' && styles.subTabActive]}
            >
              <Text style={[styles.subTabText, activeSubTab === 'list' && styles.subTabTextActive]}>
                Trip Alerts Log ({notifications.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                hapticFeedback.selection();
                setActiveSubTab('direct');
              }}
              style={[styles.subTab, activeSubTab === 'direct' && styles.subTabActive]}
            >
              <Text style={[styles.subTabText, activeSubTab === 'direct' && styles.subTabTextActive]}>
                + New Broadcast
              </Text>
            </Pressable>
          </View>

          {/* Tab Content */}
          {activeSubTab === 'list' ? (
            loading && notifications.length === 0 ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={styles.loadingText}>Loading trip notifications...</Text>
              </View>
            ) : notifications.length === 0 ? (
              <View style={styles.centerContainer}>
                <Bell size={40} color={colors.subtle} />
                <Text style={styles.emptyTitle}>No Trip Alerts</Text>
                <Text style={styles.emptySub}>
                  Automatic trip requests, driver assignments, and trip status alerts will appear here.
                </Text>
              </View>
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderNotificationItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            )
          ) : (
            <ScrollView contentContainerStyle={styles.formContainer} showsVerticalScrollIndicator={false}>
              <Text style={styles.formTitle}>Send Direct Trip Update</Text>
              <Text style={styles.formSub}>
                Send a real-time notification directly to a traveler regarding their expedition.
              </Text>

              {/* Recipient User ID target */}
              <Text style={styles.inputLabel}>Traveler User ID *</Text>
              <TextInput
                style={styles.input}
                value={alertUserId}
                onChangeText={setAlertUserId}
                placeholder="e.g. 10"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
              />

              {/* Optional Booking ID target */}
              <Text style={styles.inputLabel}>Trip Booking ID (Optional)</Text>
              <TextInput
                style={styles.input}
                value={alertBookingId}
                onChangeText={setAlertBookingId}
                placeholder="e.g. 25"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
              />

              {/* Title input */}
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.input}
                value={alertTitle}
                onChangeText={setAlertTitle}
                placeholder="e.g. Driver Arrived at Pickup Location"
                placeholderTextColor={colors.muted}
              />

              {/* Message input */}
              <Text style={styles.inputLabel}>Message Content *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={alertMessage}
                onChangeText={setAlertMessage}
                placeholder="e.g. Your Scorpio SUV (BA 2 PA 9988) is parked at the hotel gate..."
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={4}
              />

              {/* Send Button */}
              <Pressable
                onPress={handleSendDirectAlert}
                disabled={isSending}
                style={({ pressed }) => [styles.submitBtn, pressed && styles.pressed]}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color={colors.onAccent} />
                ) : (
                  <>
                    <Send size={16} color={colors.onAccent} />
                    <Text style={styles.submitBtnText}>Dispatch Trip Alert</Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
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
      maxHeight: '90%',
      minHeight: '60%',
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
    subTabsRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.elevated,
    },
    subTab: {
      flex: 1,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    subTabActive: {
      borderBottomColor: colors.accent,
      backgroundColor: colors.surface,
    },
    subTabText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.subtle,
    },
    subTabTextActive: {
      color: colors.accent,
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
    notifCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.xs,
    },
    notifCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    notifTypeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.accentSoft,
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: radius.xs,
    },
    notifTypeText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.accent,
    },
    notifTime: {
      fontSize: 11,
      color: colors.subtle,
    },
    notifTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    notifMessage: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.text,
      marginTop: spacing.xs,
    },
    notifFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
      paddingTop: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    userRowText: {
      fontSize: 11,
      color: colors.subtle,
    },
    bookingRefText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.accent,
    },
    formContainer: {
      padding: spacing.lg,
      gap: spacing.sm,
    },
    formTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    formSub: {
      fontSize: 12,
      color: colors.subtle,
      marginBottom: spacing.sm,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
      marginTop: spacing.xs,
    },
    typeSelectorRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    typePill: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.elevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    typePillActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    typePillText: {
      fontSize: 12,
      color: colors.text,
    },
    typePillTextActive: {
      color: colors.onAccent,
      fontWeight: '700',
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 14,
      color: colors.text,
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    submitBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      backgroundColor: colors.accent,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      marginTop: spacing.md,
    },
    submitBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.onAccent,
    },
  });
