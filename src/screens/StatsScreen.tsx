import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { MessageCircle } from 'lucide-react-native';

import { getPublicStats } from '../api/stats';
import { Card } from '../components/ui/Card';
import { Screen } from '../components/ui/Screen';
import { CONTACT_INFO } from '../constants/contact';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import type { PublicStatsDto } from '../types/api';
import { extractErrorMessage } from '../utils/errors';

const emptyStats: PublicStatsDto = {
  fleet_count: 0,
  completed_trips: 0,
  cities_covered: 0,
  review_count: 0,
  average_rating: 0,
};

export function StatsScreen() {
  const [stats, setStats] = useState<PublicStatsDto>(emptyStats);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getPublicStats();
      setStats({
        fleet_count: Number(data.fleet_count) || 0,
        completed_trips: Number(data.completed_trips) || 0,
        cities_covered: Number(data.cities_covered) || 0,
        review_count: Number(data.review_count) || 0,
        average_rating: Number(data.average_rating) || 0,
      });
      setError('');
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not load live fleet stats.'));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <View style={styles.flex}>
      <Screen
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={load}
            tintColor={colors.highlight}
            colors={[colors.highlight]}
          />
        }
      >
        <Text style={styles.title}>Fleet snapshot</Text>
        <Text style={styles.subtitle}>Live numbers from the Drive Kendra dispatch system.</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.grid}>
          <StatCard label="Active fleet" value={stats.fleet_count} />
          <StatCard label="Completed trips" value={stats.completed_trips} />
          <StatCard label="Cities covered" value={stats.cities_covered} />
          <StatCard label="Reviews" value={stats.review_count} />
        </View>

        <Card style={styles.ratingCard}>
          <Text style={styles.ratingLabel}>Average customer rating</Text>
          <Text style={styles.ratingValue}>{stats.average_rating.toFixed(1)} / 5</Text>
        </Card>
      </Screen>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Chat on WhatsApp"
        onPress={() => Linking.openURL(CONTACT_INFO.whatsappLink)}
        style={styles.fab}
      >
        <MessageCircle color={colors.background} size={22} />
        <Text style={styles.fabLabel}>WhatsApp</Text>
      </Pressable>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.muted,
    marginBottom: spacing.lg,
    fontSize: 14,
  },
  error: {
    color: colors.error,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    width: '47%',
    flexGrow: 1,
  },
  statValue: {
    color: colors.accent,
    fontSize: 28,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.muted,
    marginTop: spacing.xs,
  },
  ratingCard: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  ratingLabel: {
    color: colors.muted,
  },
  ratingValue: {
    color: colors.highlight,
    fontSize: 32,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: colors.success,
    borderRadius: 999,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fabLabel: {
    color: colors.background,
    fontWeight: '800',
  },
});
