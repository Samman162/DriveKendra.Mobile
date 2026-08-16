import { useCallback } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { hasAdminApiKey } from '../api/config';
import { Card } from '../components/ui/Card';
import { Screen } from '../components/ui/Screen';
import { useNotifications } from '../hooks/useSignalR';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { relativeTime } from '../utils/dates';

export function NotificationsScreen() {
  const { notifications, connectionState, loadHistory, markRead, markAllRead, unreadCount } =
    useNotifications();

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory]),
  );

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={loadHistory}
          tintColor={colors.highlight}
          colors={[colors.highlight]}
        />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Alerts</Text>
          <Text style={styles.subtitle}>
            {connectionState === 'connected' ? 'Live SignalR connected' : 'Waiting for live connection'}
          </Text>
        </View>
        {unreadCount > 0 ? (
          <Pressable onPress={markAllRead}>
            <Text style={styles.markAll}>Mark all read</Text>
          </Pressable>
        ) : null}
      </View>

      {!hasAdminApiKey() ? (
        <Text style={styles.hint}>
          Historical alerts need EXPO_PUBLIC_ADMIN_API_KEY. Live broadcasts still appear here.
        </Text>
      ) : null}

      {notifications.length === 0 ? (
        <Card>
          <Text style={styles.emptyTitle}>No alerts yet</Text>
          <Text style={styles.emptyCopy}>Live alerts will appear here as bookings and partner applications arrive.</Text>
        </Card>
      ) : (
        notifications.map((item) => (
          <Pressable key={item.notificationId} onPress={() => markRead(item.notificationId)}>
            <Card style={[styles.row, !item.isRead && styles.unread]}>
              <View style={styles.rowHeader}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.time}>{relativeTime(item.createdAt)}</Text>
              </View>
              <Text style={styles.rowMessage}>{item.message}</Text>
              {item.notificationType ? (
                <Text style={styles.type}>{item.notificationType}</Text>
              ) : null}
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.muted,
    marginTop: 4,
  },
  markAll: {
    color: colors.highlight,
    fontWeight: '700',
  },
  hint: {
    color: colors.subtle,
    marginBottom: spacing.md,
    fontSize: 13,
  },
  emptyTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  emptyCopy: {
    color: colors.muted,
  },
  row: {
    marginBottom: spacing.md,
  },
  unread: {
    borderColor: colors.highlight,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  rowTitle: {
    color: colors.text,
    fontWeight: '700',
    flex: 1,
  },
  time: {
    color: colors.subtle,
    fontSize: 12,
  },
  rowMessage: {
    color: colors.muted,
    lineHeight: 20,
  },
  type: {
    color: colors.highlight,
    marginTop: spacing.sm,
    fontSize: 12,
    fontWeight: '700',
  },
});
