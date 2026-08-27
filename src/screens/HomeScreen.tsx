import React, { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import {
  AlertTriangle,
  ArrowRight,
  ArrowRightLeft,
  Bell,
  Car,
  Compass,
  Crown,
  Heart,
  HelpCircle,
  MapPin,
  MessageCircle,
  PhoneCall,
  Plane,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  User as UserIcon,
} from 'lucide-react-native';

import { getApprovedReviews } from '../api/reviews';
import { getPublicStats } from '../api/stats';
import { getUserNotifications, markNotificationAsRead } from '../api/notifications';
import { BrandLogo } from '../components/ui/BrandLogo';
import { Button } from '../components/ui/Button';
import { EmergencySosModal } from '../components/ui/EmergencySosModal';
import { FaqList } from '../components/ui/FaqList';
import { HighwayStatusCard } from '../components/ui/HighwayStatusCard';
import { MapRoutePreview } from '../components/ui/MapRoutePreview';
import { NotificationModal } from '../components/ui/NotificationModal';
import { ReviewCard } from '../components/ui/ReviewCard';
import { Screen } from '../components/ui/Screen';
import { SectionHeader } from '../components/ui/SectionHeader';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { TourCard } from '../components/ui/TourCard';
import { VehicleCard, VehicleStripCard } from '../components/ui/VehicleCard';
import { CONTACT_INFO } from '../constants/contact';
import { HOME_FAQS } from '../content/faqs';
import { TOUR_PACKAGES } from '../content/tours';
import { FLEET_VEHICLES } from '../content/vehicles';
import { useAuth } from '../context/AuthContext';
import { navigateToBook } from '../navigation/booking';
import type { RootStackParamList, RootTabParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeProvider';
import { useThemedStyles } from '../theme/useThemedStyles';
import { radius, spacing } from '../theme/spacing';
import type { InAppNotificationDto, PublicReviewDto, PublicStatsDto } from '../types/api';
import { extractErrorMessage } from '../utils/errors';
import { hapticFeedback } from '../utils/haptics';

const emptyStats: PublicStatsDto = {
  fleet_count: 32,
  completed_trips: 1850,
  cities_covered: 18,
  review_count: 420,
  average_rating: 4.9,
};

const CATEGORIES = [
  { id: 'all', label: 'All Fleet', icon: '🚙' },
  { id: 'suv', label: '4x4 SUV', icon: '⛰️' },
  { id: 'van', label: 'HiAce Vans', icon: '🚐' },
  { id: 'sedan', label: 'Sedans', icon: '🚗' },
  { id: 'bus', label: 'Tourist Bus', icon: '🚌' },
];

const POPULAR_ROUTES = [
  { from: 'Kathmandu', to: 'Pokhara', fare: 'NPR 12,000', type: 'Scorpio / HiAce' },
  { from: 'Kathmandu', to: 'TIA Airport', fare: 'NPR 1,500', type: 'Sedan / SUV' },
  { from: 'Kathmandu', to: 'Manakamana', fare: 'NPR 9,500', type: '4x4 Scorpio' },
  { from: 'Kathmandu', to: 'Chitwan', fare: 'NPR 13,500', type: 'HiAce / SUV' },
  { from: 'Kathmandu', to: 'Nagarkot', fare: 'NPR 4,500', type: 'Private Sedan' },
];

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { user, isAuthenticated } = useAuth();

  const [stats, setStats] = useState<PublicStatsDto>(emptyStats);
  const [reviews, setReviews] = useState<PublicReviewDto[]>([]);
  const [notifications, setNotifications] = useState<InAppNotificationDto[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);

  // Interactive Quick Widget States
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [pickupInput, setPickupInput] = useState('Kathmandu (Hotel / Airport)');
  const [dropInput, setDropInput] = useState('Pokhara Lakeside');
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [nextStats, nextReviews] = await Promise.all([getPublicStats(), getApprovedReviews()]);
      setStats({
        fleet_count: Number(nextStats.fleet_count) || emptyStats.fleet_count,
        completed_trips: Number(nextStats.completed_trips) || emptyStats.completed_trips,
        cities_covered: Number(nextStats.cities_covered) || emptyStats.cities_covered,
        review_count: Number(nextStats.review_count) || emptyStats.review_count,
        average_rating: Number(nextStats.average_rating) || emptyStats.average_rating,
      });
      setReviews(nextReviews.slice(0, 4));

      if (user?.id) {
        const notifs = await getUserNotifications(user.id);
        setNotifications(notifs);
      }
      setError('');
    } catch (err) {
      setError('');
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const swapLocations = () => {
    hapticFeedback.selection();
    const temp = pickupInput;
    setPickupInput(dropInput);
    setDropInput(temp);
  };

  const filteredVehicles = FLEET_VEHICLES.filter((v) => {
    const matchesSearch =
      !searchQuery ||
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.tag.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'suv') return v.tag.includes('SUV') || v.tag.includes('4x4') || v.name.includes('Scorpio');
    if (selectedCategory === 'van') return v.tag.includes('Van') || v.name.includes('HiAce');
    if (selectedCategory === 'sedan') return v.tag.includes('Sedan') || v.tag.includes('Car');
    if (selectedCategory === 'bus') return v.tag.includes('Bus');
    return true;
  });

  return (
    <Screen
      padded={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.accent} colors={[colors.accent]} />
      }
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Modern Native App Bar */}
      <View style={styles.appBar}>
        <View style={styles.brandRow}>
          <BrandLogo size="xs" variant="card" style={{ marginRight: spacing.xs }} />
          <View style={styles.locationWrap}>
            <Text style={styles.greetingText}>
              {isAuthenticated && user ? `Namaste, ${user.name.split(' ')[0]} 👋` : 'Namaste, Traveler 👋'}
            </Text>
            <View style={styles.locationPill}>
              <MapPin size={13} color={colors.accent} />
              <Text style={styles.locationText}>Kathmandu, Nepal</Text>
            </View>
          </View>
        </View>

        <View style={styles.appBarActions}>
          <Pressable
            onPress={() => {
              hapticFeedback.medium();
              setSosOpen(true);
            }}
            style={({ pressed }) => [styles.sosHeaderBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Emergency SOS Hotline"
          >
            <AlertTriangle size={15} color="#FFFFFF" />
            <Text style={styles.sosHeaderBtnText}>SOS</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              hapticFeedback.light();
              setNotificationsOpen(true);
            }}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="View Notifications"
          >
            {notifications.some((n) => !n.isRead) && <View style={styles.notifBadgeDot} />}
            <Bell size={18} color={colors.text} />
          </Pressable>

          <Pressable
            onPress={() => {
              hapticFeedback.light();
              if (isAuthenticated) {
                navigation.navigate('Profile');
              } else {
                navigation.navigate('Auth', { initialMode: 'signin' });
              }
            }}
            style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]}
          >
            {isAuthenticated && user ? (
              <View style={styles.userInitialBadge}>
                <Text style={styles.userInitialText}>{user.name.slice(0, 1).toUpperCase()}</Text>
              </View>
            ) : (
              <View style={styles.guestIconBadge}>
                <UserIcon size={16} color={colors.text} />
              </View>
            )}
          </Pressable>

          <ThemeToggle variant="onSurface" />
        </View>
      </View>

      {/* Upcoming Active Trip Alert Banner */}
      <View style={styles.upcomingBannerWrap}>
        <Pressable
          onPress={() => {
            hapticFeedback.light();
            navigation.navigate('MyBookings');
          }}
          style={({ pressed }) => [styles.upcomingBanner, pressed && styles.pressed]}
        >
          <View style={styles.upcomingLeft}>
            <View style={styles.upcomingIcon}>
              <Car size={16} color={colors.onAccent} />
            </View>
            <View style={styles.upcomingTextWrap}>
              <Text style={styles.upcomingTag}>UPCOMING RIDE • TOMORROW 7:00 AM</Text>
              <Text style={styles.upcomingRoute}>Kathmandu ➔ Pokhara (Scorpio 4WD)</Text>
            </View>
          </View>
          <View style={styles.driverAssignedBadge}>
            <Text style={styles.driverAssignedText}>Driver Assigned ➔</Text>
          </View>
        </Pressable>
      </View>

      {/* Native Interactive Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color={colors.muted} style={{ marginRight: spacing.xs }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search Scorpio 4x4, HiAce, Muktinath..."
            placeholderTextColor={colors.subtle}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Native App Services Grid (4 Main Shortcuts) */}
      <View style={styles.servicesGrid}>
        <Pressable
          onPress={() => {
            hapticFeedback.light();
            navigation.navigate('Fleet');
          }}
          style={({ pressed }) => [styles.serviceCard, pressed && styles.pressed]}
        >
          <View style={[styles.serviceIconCircle, { backgroundColor: colors.accentSoft }]}>
            <Car size={22} color={colors.accent} />
          </View>
          <Text style={styles.serviceTitle}>Car Rental</Text>
          <Text style={styles.serviceSub}>Self-drive & driver</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            hapticFeedback.light();
            navigation.navigate('Airport');
          }}
          style={({ pressed }) => [styles.serviceCard, pressed && styles.pressed]}
        >
          <View style={[styles.serviceIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
            <Plane size={22} color="#0284C7" />
          </View>
          <Text style={styles.serviceTitle}>Airport TIA</Text>
          <Text style={styles.serviceSub}>24/7 fixed rates</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            hapticFeedback.light();
            navigation.navigate('Tours');
          }}
          style={({ pressed }) => [styles.serviceCard, pressed && styles.pressed]}
        >
          <View style={[styles.serviceIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <Sparkles size={22} color="#059669" />
          </View>
          <Text style={styles.serviceTitle}>Himalayan Tours</Text>
          <Text style={styles.serviceSub}>Muktinath & more</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            hapticFeedback.light();
            navigation.navigate('Wedding');
          }}
          style={({ pressed }) => [styles.serviceCard, pressed && styles.pressed]}
        >
          <View style={[styles.serviceIconCircle, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
            <Crown size={22} color="#DB2777" />
          </View>
          <Text style={styles.serviceTitle}>Wedding & VIP</Text>
          <Text style={styles.serviceSub}>Decorated cars</Text>
        </Pressable>
      </View>

      {/* Quick Ride Booking & Fare Estimator Card */}
      <View style={styles.sectionContainer}>
        <View style={styles.bookingCard}>
          <View style={styles.bookingHeader}>
            <View style={styles.bookingTitleWrap}>
              <Car size={16} color={colors.accent} />
              <Text style={styles.bookingTitle}>Quick Trip Reservation</Text>
            </View>
            <View style={styles.badgeInstant}>
              <Text style={styles.badgeInstantText}>INSTANT CONFIRM</Text>
            </View>
          </View>

          {/* Pickup & Destination Inputs with Swap */}
          <View style={styles.routeInputBox}>
            <View style={styles.routeInputs}>
              <View style={styles.inputItem}>
                <View style={[styles.dot, { backgroundColor: colors.accent }]} />
                <View style={styles.inputTextWrap}>
                  <Text style={styles.inputLabel}>Pickup Location</Text>
                  <Text style={styles.inputValue}>{pickupInput}</Text>
                </View>
              </View>

              <View style={styles.inputDivider} />

              <View style={styles.inputItem}>
                <View style={[styles.dot, { backgroundColor: colors.success }]} />
                <View style={styles.inputTextWrap}>
                  <Text style={styles.inputLabel}>Drop-off Destination</Text>
                  <Text style={styles.inputValue}>{dropInput}</Text>
                </View>
              </View>
            </View>

            <Pressable onPress={swapLocations} style={styles.swapBtn}>
              <ArrowRightLeft size={16} color={colors.text} />
            </Pressable>
          </View>

          {/* Route Visualizer Simulation */}
          <MapRoutePreview pickup={pickupInput} dropoff={dropInput} />

          <Button
            label="Reserve Vehicle for this Route"
            onPress={() => {
              navigateToBook(navigation, {
                pickupLocation: pickupInput,
                dropoffLocation: dropInput,
              });
            }}
            variant="primary"
          />
        </View>
      </View>

      {/* Popular Nepal Routes Horizontal Chips */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Trending Nepal Routes</Text>
          <Pressable onPress={() => navigation.navigate('Rates')}>
            <Text style={styles.seeAllText}>View all rates →</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularRow}>
          {POPULAR_ROUTES.map((route, idx) => (
            <Pressable
              key={idx}
              onPress={() => {
                hapticFeedback.light();
                navigateToBook(navigation, {
                  pickupLocation: route.from,
                  dropoffLocation: route.to,
                });
              }}
              style={({ pressed }) => [styles.routeCard, pressed && styles.pressed]}
            >
              <View style={styles.routeCardTop}>
                <Text style={styles.routeCardFrom}>{route.from}</Text>
                <ArrowRight size={14} color={colors.accent} style={{ marginHorizontal: 4 }} />
                <Text style={styles.routeCardTo}>{route.to}</Text>
              </View>
              <Text style={styles.routeCardVehicle}>{route.type}</Text>
              <Text style={styles.routeCardFare}>{route.fare}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Category Pills Selector */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Explore Fleet by Category</Text>
          <Pressable onPress={() => navigation.navigate('Fleet')}>
            <Text style={styles.seeAllText}>Full Fleet ({FLEET_VEHICLES.length}) →</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => {
                  hapticFeedback.selection();
                  setSelectedCategory(cat.id);
                }}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
              >
                <Text style={styles.catEmoji}>{cat.icon}</Text>
                <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Filtered Vehicles Showcase */}
      <View style={styles.vehiclesShowcase}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalFleet}>
          {filteredVehicles.map((vehicle) => (
            <VehicleStripCard
              key={vehicle.id}
              vehicle={vehicle}
              onPress={() => {
                navigateToBook(navigation, { vehicleTypeId: vehicle.id });
              }}
            />
          ))}
        </ScrollView>
      </View>

      {/* Himalayan Tour Packages Section */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Himalayan Tour Packages</Text>
          <Pressable onPress={() => navigation.navigate('Tours')}>
            <Text style={styles.seeAllText}>All Tours →</Text>
          </Pressable>
        </View>

        {TOUR_PACKAGES.slice(0, 2).map((tour) => (
          <TourCard
            key={tour.id}
            tour={tour}
            onPress={() => {
              navigation.navigate('TourDetail', {
                tourId: tour.id as 'manakamana' | 'muktinath' | 'kalinchowk',
              });
            }}
          />
        ))}
      </View>

      {/* 24/7 Helpline & Dispatch Quick Actions */}
      <View style={styles.sectionContainer}>
        <View style={styles.helplineBanner}>
          <View style={styles.helplineLeft}>
            <View style={styles.helplineIcon}>
              <PhoneCall size={20} color={colors.onAccent} />
            </View>
            <View style={styles.helplineTextWrap}>
              <Text style={styles.helplineTitle}>24/7 Driver Dispatch Helpline</Text>
              <Text style={styles.helplineSub}>Direct phone & WhatsApp assistance</Text>
            </View>
          </View>
          <View style={styles.helplineButtons}>
            <Pressable
              onPress={() => Linking.openURL(CONTACT_INFO.telLink)}
              style={styles.callActionButton}
            >
              <Text style={styles.callActionText}>Call</Text>
            </Pressable>
            <Pressable
              onPress={() => Linking.openURL(CONTACT_INFO.whatsappLink)}
              style={styles.whatsappActionButton}
            >
              <MessageCircle size={15} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Live Mountain Highway Transit Advisory */}
      <View style={styles.sectionContainer}>
        <HighwayStatusCard />
      </View>

      {/* Verified Reviews Section */}
      {reviews.length > 0 && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Customer Experiences</Text>
            <View style={styles.starRatingBadge}>
              <Star size={12} color={colors.highlight} fill={colors.highlight} />
              <Text style={styles.starRatingText}>{stats.average_rating} / 5.0</Text>
            </View>
          </View>

          {reviews.map((r, i) => (
            <ReviewCard key={i} review={r} />
          ))}
        </View>
      )}

      {/* FAQ Section */}
      <View style={[styles.sectionContainer, { paddingBottom: 40 }]}>
        <SectionHeader tag="FAQ" title="Frequently Asked Questions" subtitle="Important details before you ride" />
        <FaqList items={HOME_FAQS} />
      </View>

      {/* In-App Notifications Modal */}
      <NotificationModal
        visible={notificationsOpen}
        notifications={notifications}
        onClose={() => setNotificationsOpen(false)}
        onMarkAsRead={async (id) => {
          await markNotificationAsRead(id);
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
          );
        }}
        onMarkAllAsRead={async () => {
          for (const n of notifications.filter((x) => !x.isRead)) {
            await markNotificationAsRead(n.id);
          }
          setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        }}
      />

      {/* 24/7 Roadside Emergency SOS Modal */}
      <EmergencySosModal
        visible={sosOpen}
        onClose={() => setSosOpen(false)}
      />
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    appBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: spacing.sm,
    },
    locationWrap: {
      flex: 1,
    },
    greetingText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.muted,
      marginBottom: 2,
    },
    locationPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    locationText: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
    },
    appBarActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    sosHeaderBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#DC2626',
      paddingHorizontal: spacing.xs + 2,
      paddingVertical: 7,
      borderRadius: radius.pill,
      gap: 3,
    },
    sosHeaderBtnText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    iconBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    notifBadgeDot: {
      position: 'absolute',
      top: 8,
      right: 9,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.error,
      zIndex: 2,
    },
    upcomingBannerWrap: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.sm,
      marginTop: 2,
    },
    upcomingBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.navy,
      borderRadius: radius.md,
      padding: spacing.sm + 2,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    upcomingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    upcomingIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    upcomingTextWrap: {
      flex: 1,
    },
    upcomingTag: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.highlight,
      letterSpacing: 0.5,
    },
    upcomingRoute: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.onNavy,
      marginTop: 1,
    },
    driverAssignedBadge: {
      backgroundColor: colors.successSoft,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.sm,
    },
    driverAssignedText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.success,
    },
    avatarButton: {
      padding: 2,
    },
    userInitialBadge: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    userInitialText: {
      color: colors.onAccent,
      fontSize: 16,
      fontWeight: '800',
    },
    guestIconBadge: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchSection: {
      paddingHorizontal: spacing.lg,
      marginTop: spacing.xs,
      marginBottom: spacing.md,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      height: 48,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },
    servicesGrid: {
      flexDirection: 'row',
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    serviceCard: {
      flex: 1,
      backgroundColor: colors.surface,
      paddingVertical: spacing.md,
      paddingHorizontal: 6,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    serviceIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    serviceTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
    },
    serviceSub: {
      fontSize: 10,
      color: colors.muted,
      textAlign: 'center',
      marginTop: 2,
    },
    sectionContainer: {
      paddingHorizontal: spacing.lg,
      marginTop: spacing.md,
    },
    bookingCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    bookingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    bookingTitleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    bookingTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.text,
    },
    badgeInstant: {
      backgroundColor: colors.successSoft,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.sm,
    },
    badgeInstantText: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.success,
      letterSpacing: 0.5,
    },
    routeInputBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.elevated,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.sm,
      marginBottom: spacing.md,
    },
    routeInputs: {
      flex: 1,
    },
    inputItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: spacing.sm,
    },
    inputTextWrap: {
      flex: 1,
    },
    inputLabel: {
      fontSize: 10,
      color: colors.subtle,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    inputValue: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    inputDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 4,
      marginLeft: 16,
    },
    swapBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: spacing.xs,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    sectionHeading: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
    },
    seeAllText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.accent,
    },
    popularRow: {
      gap: spacing.sm,
      paddingRight: spacing.lg,
      paddingBottom: 4,
    },
    routeCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 170,
    },
    routeCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    routeCardFrom: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    routeCardTo: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    routeCardVehicle: {
      fontSize: 11,
      color: colors.muted,
      marginBottom: 6,
    },
    routeCardFare: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.accent,
    },
    categoriesRow: {
      gap: spacing.xs,
      paddingRight: spacing.lg,
      paddingBottom: spacing.xs,
    },
    categoryPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.surface,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryPillActive: {
      backgroundColor: colors.navy,
      borderColor: colors.navy,
    },
    catEmoji: {
      fontSize: 13,
    },
    categoryText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    categoryTextActive: {
      color: colors.onNavy,
    },
    vehiclesShowcase: {
      marginTop: spacing.sm,
      paddingLeft: spacing.lg,
    },
    horizontalFleet: {
      paddingRight: spacing.lg,
    },
    helplineBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.navy,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginVertical: spacing.xs,
    },
    helplineLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    helplineIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    helplineTextWrap: {
      flex: 1,
    },
    helplineTitle: {
      color: colors.onNavy,
      fontSize: 14,
      fontWeight: '800',
    },
    helplineSub: {
      color: colors.tabInactive,
      fontSize: 11,
      marginTop: 2,
    },
    helplineButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    callActionButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: radius.sm,
    },
    callActionText: {
      color: colors.onAccent,
      fontWeight: '800',
      fontSize: 12,
    },
    whatsappActionButton: {
      backgroundColor: '#25D366',
      padding: 8,
      borderRadius: radius.sm,
    },
    starRatingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.surface,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
    },
    starRatingText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
    },
    pressed: {
      opacity: 0.8,
      transform: [{ scale: 0.98 }],
    },
  });
}
