import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { PhoneCall } from 'lucide-react-native';

import { getApprovedReviews } from '../api/reviews';
import { getPublicStats } from '../api/stats';
import { Button } from '../components/ui/Button';
import { FaqList } from '../components/ui/FaqList';
import { ReviewCard } from '../components/ui/ReviewCard';
import { Screen } from '../components/ui/Screen';
import { SectionHeader } from '../components/ui/SectionHeader';
import { StatChip } from '../components/ui/StatChip';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { TourCard } from '../components/ui/TourCard';
import { VehicleStripCard } from '../components/ui/VehicleCard';
import { CONTACT_INFO } from '../constants/contact';
import { HOME_FAQS } from '../content/faqs';
import { TOUR_PACKAGES } from '../content/tours';
import { FLEET_VEHICLES } from '../content/vehicles';
import { navigateToBook } from '../navigation/booking';
import type { HomeStackParamList, RootTabParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeProvider';
import { useThemedStyles } from '../theme/useThemedStyles';
import { radius, spacing } from '../theme/spacing';
import type { PublicReviewDto, PublicStatsDto } from '../types/api';
import { extractErrorMessage } from '../utils/errors';

const emptyStats: PublicStatsDto = {
  fleet_count: 0,
  completed_trips: 0,
  cities_covered: 0,
  review_count: 0,
  average_rating: 0,
};

const ROUTES = [
  { label: 'Pokhara Rates', target: 'rates' as const },
  { label: 'Manakamana', tourId: 'manakamana' as const },
  { label: 'Muktinath 4x4', tourId: 'muktinath' as const },
  { label: 'Kalinchowk', tourId: 'kalinchowk' as const },
  { label: 'Airport', target: 'airport' as const },
];

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>,
  BottomTabNavigationProp<RootTabParamList>
>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [stats, setStats] = useState<PublicStatsDto>(emptyStats);
  const [reviews, setReviews] = useState<PublicReviewDto[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [nextStats, nextReviews] = await Promise.all([getPublicStats(), getApprovedReviews()]);
      setStats({
        fleet_count: Number(nextStats.fleet_count) || 0,
        completed_trips: Number(nextStats.completed_trips) || 0,
        cities_covered: Number(nextStats.cities_covered) || 0,
        review_count: Number(nextStats.review_count) || 0,
        average_rating: Number(nextStats.average_rating) || 0,
      });
      setReviews(nextReviews.slice(0, 4));
      setError('');
    } catch (err) {
      setError(
        extractErrorMessage(err, 'Could not reach the booking desk. The server may be starting — try again.'),
      );
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const openRoute = (item: (typeof ROUTES)[number]) => {
    if (item.tourId) {
      navigation.navigate('Tours', { screen: 'TourDetail', params: { tourId: item.tourId } });
      return;
    }
    if (item.target === 'airport') {
      navigation.navigate('Explore', { screen: 'Airport' });
      return;
    }
    navigation.navigate('Explore', { screen: 'Rates' });
  };

  return (
    <Screen
      padded={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.accent} colors={[colors.accent]} />
      }
    >
      <StatusBar style="light" />
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Text style={styles.badge}>#1 RATED CAR RENTAL IN NEPAL</Text>
          <ThemeToggle variant="onNavy" />
        </View>
        <Text style={styles.heroTitle}>Premier car rental with professional hill drivers</Text>
        <Text style={styles.heroCopy}>
          24/7 TIA transfers, 4x4 Himalayan tours, and chauffeur-driven Scorpios, HiAce vans, and tourist buses.
        </Text>
        <View style={styles.heroActions}>
          <View style={styles.heroBtn}>
            <Button label="Book your trip" onPress={() => navigateToBook(navigation, {})} />
          </View>
          <Pressable onPress={() => Linking.openURL(CONTACT_INFO.telLink)} style={styles.callBtn}>
            <PhoneCall color={colors.highlight} size={18} />
            <Text style={styles.callText}>Call</Text>
          </Pressable>
        </View>
        <View style={styles.stats}>
          <StatChip value={stats.completed_trips} label="Trips" />
          <StatChip value={stats.fleet_count} label="Fleet" />
          <StatChip value={stats.cities_covered} label="Cities" />
          <StatChip
            value={stats.average_rating ? `${stats.average_rating}` : '—'}
            label={`${stats.review_count} reviews`}
          />
        </View>
        {error ? (
          <View style={styles.errorBlock}>
            <Text style={styles.error}>{error}</Text>
            <Pressable onPress={() => void load()} style={styles.retry}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.routeLabel}>Popular routes</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.routeRow}>
          {ROUTES.map((item) => (
            <Pressable key={item.label} onPress={() => openRoute(item)} style={styles.routeChip}>
              <Text style={styles.routeChipText}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <SectionHeader tag="OUR FLEET" title="Premium vehicles with local drivers" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fleetRow}>
          {FLEET_VEHICLES.map((vehicle) => (
            <VehicleStripCard
              key={vehicle.id}
              vehicle={vehicle}
              onPress={() =>
                navigateToBook(navigation, {
                  vehicleTypeId: vehicle.vehicleTypeId,
                  additionalDetails: `Requested fleet: ${vehicle.name}`,
                })
              }
            />
          ))}
        </ScrollView>
        <Button
          label="Browse full fleet"
          variant="secondary"
          onPress={() => navigation.navigate('Explore', { screen: 'Fleet' })}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader tag="CURATED EXPERIENCES" title="Popular tour packages" />
        {TOUR_PACKAGES.slice(0, 3).map((tour) => (
          <TourCard
            key={tour.id}
            tour={tour}
            onPress={() => {
              if (tour.detailId) {
                navigation.navigate('Tours', { screen: 'TourDetail', params: { tourId: tour.detailId } });
                return;
              }
              if (tour.exploreTarget === 'airport') {
                navigation.navigate('Explore', { screen: 'Airport' });
                return;
              }
              navigation.navigate('Explore', { screen: 'Rates' });
            }}
          />
        ))}
        <Button label="See all tours" variant="secondary" onPress={() => navigation.navigate('Tours')} />
      </View>

      <View style={styles.section}>
        <SectionHeader tag="HOW IT WORKS" title="Rent in four easy steps" />
        {[
          ['01', 'Choose route & date'],
          ['02', 'Select vehicle type'],
          ['03', 'Instant confirmation'],
          ['04', 'Enjoy your journey'],
        ].map(([num, title]) => (
          <View key={num} style={styles.step}>
            <Text style={styles.stepNum}>{num}</Text>
            <Text style={styles.stepTitle}>{title}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <SectionHeader tag="TRAVELER REVIEWS" title="What guests say" />
        {reviews.length === 0 ? (
          <Text style={styles.empty}>Verified reviews will appear here.</Text>
        ) : (
          reviews.map((review, index) => <ReviewCard key={`${review.customer_name}-${index}`} review={review} />)
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader tag="FAQ" title="Before you book" />
        <FaqList items={HOME_FAQS} />
      </View>
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  hero: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  badge: {
    color: colors.highlight,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroTitle: {
    color: colors.onNavy,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
    marginTop: spacing.sm,
  },
  heroCopy: {
    color: '#CBD5E1',
    marginTop: spacing.md,
    lineHeight: 22,
  },
  heroActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  heroBtn: {
    flex: 1,
  },
  callBtn: {
    width: 64,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  callText: {
    color: colors.highlight,
    fontSize: 11,
    fontWeight: '800',
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  error: {
    color: '#FCA5A5',
    flex: 1,
  },
  errorBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  retry: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  retryText: {
    color: colors.highlight,
    fontWeight: '800',
    fontSize: 12,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  },
  routeLabel: {
    color: colors.subtle,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  routeRow: {
    paddingRight: spacing.lg,
    gap: spacing.sm,
  },
  routeChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  routeChipText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  fleetRow: {
    paddingBottom: spacing.lg,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  stepNum: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 16,
    width: 32,
  },
  stepTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  empty: {
    color: colors.muted,
  },
  });
}
