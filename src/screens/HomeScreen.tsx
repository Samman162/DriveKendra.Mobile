import React, { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import {
  ArrowRight,
  ArrowUpDown,
  Car,
  ChevronRight,
  Clock,
  Compass,
  MapPin,
  MessageCircle,
  Mountain,
  Navigation as NavigationIcon,
  PhoneCall,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  User as UserIcon,
  Users,
} from 'lucide-react-native';

import { BrandLogo } from '../components/ui/BrandLogo';
import { EmergencySosModal } from '../components/ui/EmergencySosModal';
import { LocationPickerModal } from '../components/ui/LocationPickerModal';
import { Screen } from '../components/ui/Screen';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { CONTACT_INFO } from '../constants/contact';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList, RootTabParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeProvider';
import { useThemedStyles } from '../theme/useThemedStyles';
import { radius, spacing } from '../theme/spacing';
import type { TripType } from '../types/api';
import { hapticFeedback } from '../utils/haptics';
import {
  getActiveOfflineVoucher,
  type OfflineVoucher,
} from '../utils/offlineVoucherStorage';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface VehicleCategory {
  id: number;
  name: string;
  categoryName: string;
  tag: string;
  capacity: string;
  bestFor: string;
}

const VEHICLE_CATEGORIES: VehicleCategory[] = [
  {
    id: 2,
    name: 'Scorpio 4x4',
    categoryName: 'Jeep / 4WD',
    tag: 'Mountain Ready',
    capacity: '7 Seats',
    bestFor: 'Muktinath & Off-road',
  },
  {
    id: 1,
    name: 'Sedan / Car',
    categoryName: 'City & Highway',
    tag: 'AC Comfort',
    capacity: '4 Seats',
    bestFor: 'City & Airport Drops',
  },
  {
    id: 3,
    name: 'HiAce Van',
    categoryName: 'High-Roof AC',
    tag: 'Group Travel',
    capacity: '14 Seats',
    bestFor: 'Pokhara & Chitwan Tours',
  },
  {
    id: 4,
    name: 'Tourist Bus',
    categoryName: 'Deluxe Coaster',
    tag: 'Charter Coach',
    capacity: '35 Seats',
    bestFor: 'Expeditions & Large Groups',
  },
];

interface FeaturedRoute {
  id: string;
  title: string;
  duration: string;
  pickup: string;
  dropoff: string;
  vehicleTypeId: number;
  vehicleName: string;
}

const FEATURED_ROUTES: FeaturedRoute[] = [
  {
    id: 'ktm_pkr',
    title: 'Kathmandu ⇄ Pokhara',
    duration: '200 km • ~6 hrs',
    pickup: 'Kathmandu Valley, Nepal',
    dropoff: 'Pokhara, Nepal',
    vehicleTypeId: 1,
    vehicleName: 'Sedan / Scorpio',
  },
  {
    id: 'pkr_muk',
    title: 'Pokhara ⇄ Muktinath & Jomsom',
    duration: '175 km • ~8 hrs (4WD)',
    pickup: 'Pokhara, Nepal',
    dropoff: 'Muktinath, Nepal',
    vehicleTypeId: 2,
    vehicleName: 'Scorpio 4x4',
  },
  {
    id: 'ktm_cht',
    title: 'Kathmandu ⇄ Chitwan Safari',
    duration: '175 km • ~5 hrs',
    pickup: 'Kathmandu Valley, Nepal',
    dropoff: 'Chitwan (Sauraha), Nepal',
    vehicleTypeId: 1,
    vehicleName: 'Sedan / HiAce',
  },
  {
    id: 'ktm_nag',
    title: 'Kathmandu ⇄ Nagarkot Sunrise',
    duration: '32 km • ~1.5 hrs',
    pickup: 'Kathmandu Valley, Nepal',
    dropoff: 'Nagarkot, Nepal',
    vehicleTypeId: 1,
    vehicleName: 'Sedan / Scorpio',
  },
];

const DESTINATION_SUGGESTIONS = [
  'Pokhara',
  'Chitwan',
  'Nagarkot',
  'Muktinath',
  'Airport (TIA)',
];

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { user, isAuthenticated } = useAuth();

  // Search form states
  const [tripType, setTripType] = useState<TripType>('One Way');
  const [pickupLocation, setPickupLocation] = useState('Kathmandu Valley, Nepal');
  const [dropoffLocation, setDropoffLocation] = useState('');

  // Location picker modal
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [locationPickerMode, setLocationPickerMode] = useState<'pickup' | 'dropoff'>('dropoff');

  // Emergency SOS modal
  const [sosModalVisible, setSosModalVisible] = useState(false);

  // Active offline reservation
  const [activeVoucher, setActiveVoucher] = useState<OfflineVoucher | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      getActiveOfflineVoucher()
        .then((voucher) => {
          if (isMounted) setActiveVoucher(voucher);
        })
        .catch(() => {
          if (isMounted) setActiveVoucher(null);
        });
      return () => {
        isMounted = false;
      };
    }, [])
  );

  const displayName = isAuthenticated && user?.name ? user.name.split(' ')[0] : 'Traveler';

  const handleSwapLocations = () => {
    hapticFeedback.light();
    if (!dropoffLocation) return;
    const temp = pickupLocation;
    setPickupLocation(dropoffLocation);
    setDropoffLocation(temp);
  };

  const handleSearch = () => {
    hapticFeedback.medium();
    navigation.navigate('Booking', {
      pickupLocation,
      dropoffLocation: dropoffLocation || undefined,
      tripType,
    });
  };

  const handleSelectVehicle = (vehicleId: number) => {
    hapticFeedback.medium();
    navigation.navigate('Booking', {
      vehicleTypeId: vehicleId,
      pickupLocation,
      dropoffLocation: dropoffLocation || undefined,
      tripType,
    });
  };

  const handleSelectRoute = (route: FeaturedRoute) => {
    hapticFeedback.medium();
    navigation.navigate('Booking', {
      vehicleTypeId: route.vehicleTypeId,
      pickupLocation: route.pickup,
      dropoffLocation: route.dropoff,
      tripType: 'One Way',
    });
  };

  const handleDialHotline = () => {
    hapticFeedback.medium();
    Linking.openURL(CONTACT_INFO.telLink);
  };

  const handleWhatsApp = () => {
    hapticFeedback.medium();
    Linking.openURL(CONTACT_INFO.whatsappLink);
  };

  return (
    <Screen padded={false} scroll={true}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Clean, Streamlined Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <BrandLogo size="xs" variant="badge" />
          <View style={styles.brandTitleWrap}>
            <Text style={styles.brandTitle}>Drive Kendra</Text>
            <Text style={styles.brandSubtitle}>Nepal Vehicle Rental</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Quick SOS Badge */}
          <Pressable
            onPress={() => {
              hapticFeedback.heavy();
              setSosModalVisible(true);
            }}
            style={({ pressed }) => [styles.sosPill, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Emergency SOS"
          >
            <ShieldAlert size={14} color={colors.error} />
            <Text style={styles.sosPillText}>SOS</Text>
          </Pressable>

          {/* Theme Toggle */}
          <ThemeToggle variant="onSurface" />

          {/* Profile / Sign-in */}
          <Pressable
            onPress={() => {
              hapticFeedback.light();
              if (isAuthenticated) {
                navigation.navigate('Profile');
              } else {
                navigation.navigate('Auth', { initialMode: 'signin' });
              }
            }}
            style={({ pressed }) => [styles.profileBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={isAuthenticated ? 'User Profile' : 'Sign In'}
          >
            {isAuthenticated && user?.name ? (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarLetter}>{user.name.charAt(0).toUpperCase()}</Text>
              </View>
            ) : (
              <View style={styles.guestCircle}>
                <UserIcon size={16} color={colors.text} />
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Main Container */}
      <View style={styles.container}>
        {/* Elegant Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>Namaste, {displayName} 👋</Text>
          <Text style={styles.subgreetingText}>
            Where would you like to travel in Nepal?
          </Text>
        </View>

        {/* Active Trip Banner (Only if upcoming reservation exists) */}
        {activeVoucher && (
          <Pressable
            onPress={() => {
              hapticFeedback.light();
              navigation.navigate('MyBookings', { bookingId: activeVoucher.bookingRef });
            }}
            style={({ pressed }) => [styles.activeTripCard, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Active reservation: ${activeVoucher.pickup} to ${activeVoucher.dropoff}`}
          >
            <View style={styles.activeTripLeft}>
              <View style={styles.activeStatusDot} />
              <View style={styles.activeTripInfo}>
                <Text style={styles.activeTripTag}>UPCOMING RESERVATION</Text>
                <Text style={styles.activeTripRoute} numberOfLines={1}>
                  {activeVoucher.pickup.split(',')[0]} ➔ {activeVoucher.dropoff.split(',')[0]}
                </Text>
                <Text style={styles.activeTripMeta}>
                  {activeVoucher.vehicleName} • {activeVoucher.date}
                </Text>
              </View>
            </View>
            <View style={styles.activeTripVoucherBtn}>
              <QrCode size={15} color={colors.accent} />
              <Text style={styles.activeTripVoucherBtnText}>Voucher</Text>
            </View>
          </Pressable>
        )}

        {/* Primary Booking Card */}
        <View style={styles.bookingCard}>
          {/* Header & Trip Mode Pills */}
          <View style={styles.bookingCardHeader}>
            <View style={styles.bookingTitleRow}>
              <Compass size={17} color={colors.accent} />
              <Text style={styles.bookingCardTitle}>Plan Your Trip</Text>
            </View>

            <View style={styles.tripTypeToggle}>
              <Pressable
                onPress={() => {
                  hapticFeedback.selection();
                  setTripType('One Way');
                }}
                style={[
                  styles.tripTypePill,
                  tripType === 'One Way' && styles.tripTypePillActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel="One Way Trip"
              >
                <Text
                  style={[
                    styles.tripTypePillText,
                    tripType === 'One Way' && styles.tripTypePillTextActive,
                  ]}
                >
                  One Way
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  hapticFeedback.selection();
                  setTripType('Round Trip');
                }}
                style={[
                  styles.tripTypePill,
                  tripType === 'Round Trip' && styles.tripTypePillActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Round Trip"
              >
                <Text
                  style={[
                    styles.tripTypePillText,
                    tripType === 'Round Trip' && styles.tripTypePillTextActive,
                  ]}
                >
                  Round Trip
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Location Fields */}
          <View style={styles.locationFieldsWrap}>
            {/* Pickup */}
            <Pressable
              onPress={() => {
                hapticFeedback.light();
                setLocationPickerMode('pickup');
                setLocationPickerVisible(true);
              }}
              style={({ pressed }) => [styles.locationRow, pressed && styles.locationRowPressed]}
              accessibilityRole="button"
              accessibilityLabel={`Pickup location: ${pickupLocation}`}
            >
              <View style={styles.locationDotPickup}>
                <MapPin size={15} color={colors.accent} />
              </View>
              <View style={styles.locationTextWrap}>
                <Text style={styles.locationFieldLabel}>PICKUP LOCATION</Text>
                <Text style={styles.locationValueText} numberOfLines={1}>
                  {pickupLocation}
                </Text>
              </View>
              <Text style={styles.editActionText}>Change</Text>
            </Pressable>

            {/* Subtle Divider with Swap Button */}
            <View style={styles.locationDivider}>
              <View style={styles.dividerLine} />
              <Pressable
                onPress={handleSwapLocations}
                style={({ pressed }) => [styles.swapPill, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Swap pickup and destination"
              >
                <ArrowUpDown size={13} color={colors.subtle} />
              </Pressable>
              <View style={styles.dividerLine} />
            </View>

            {/* Destination */}
            <Pressable
              onPress={() => {
                hapticFeedback.light();
                setLocationPickerMode('dropoff');
                setLocationPickerVisible(true);
              }}
              style={({ pressed }) => [styles.locationRow, pressed && styles.locationRowPressed]}
              accessibilityRole="button"
              accessibilityLabel={
                dropoffLocation
                  ? `Destination: ${dropoffLocation}`
                  : 'Select destination'
              }
            >
              <View style={styles.locationDotDropoff}>
                <NavigationIcon size={14} color={colors.onAccent} />
              </View>
              <View style={styles.locationTextWrap}>
                <Text style={styles.locationFieldLabel}>DESTINATION</Text>
                <Text
                  style={[
                    styles.locationValueText,
                    !dropoffLocation && styles.placeholderText,
                  ]}
                  numberOfLines={1}
                >
                  {dropoffLocation || 'Where to? (e.g. Pokhara, Chitwan)'}
                </Text>
              </View>
              <Text style={styles.editActionText}>
                {dropoffLocation ? 'Change' : 'Select'}
              </Text>
            </Pressable>
          </View>

          {/* Quick Destination Suggestions */}
          <View style={styles.suggestionsRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsScroll}
            >
              {DESTINATION_SUGGESTIONS.map((dest) => {
                const isSelected = dropoffLocation.includes(dest);
                return (
                  <Pressable
                    key={dest}
                    onPress={() => {
                      hapticFeedback.selection();
                      setDropoffLocation(dest + ', Nepal');
                    }}
                    style={({ pressed }) => [
                      styles.suggestionChip,
                      isSelected && styles.suggestionChipActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.suggestionChipText,
                        isSelected && styles.suggestionChipTextActive,
                      ]}
                    >
                      {dest}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Search Button */}
          <Pressable
            onPress={handleSearch}
            style={({ pressed }) => [styles.searchBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Find Vehicles & Fares"
          >
            <Car size={18} color={colors.onAccent} />
            <Text style={styles.searchBtnText}>Find Vehicles & Fares</Text>
            <ArrowRight size={17} color={colors.onAccent} />
          </Pressable>
        </View>

        {/* Fleet Selection Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select Vehicle</Text>
            <Pressable
              onPress={() => {
                hapticFeedback.light();
                navigation.navigate('Booking');
              }}
              style={({ pressed }) => [styles.seeAllBtn, pressed && styles.pressed]}
            >
              <Text style={styles.seeAllText}>All Fleet</Text>
              <ChevronRight size={14} color={colors.accent} />
            </Pressable>
          </View>

          <View style={styles.fleetGrid}>
            {VEHICLE_CATEGORIES.map((vehicle) => (
              <Pressable
                key={vehicle.id}
                onPress={() => handleSelectVehicle(vehicle.id)}
                style={({ pressed }) => [styles.vehicleCard, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Book ${vehicle.name}`}
              >
                <View style={styles.vehicleCardHeader}>
                  <View style={styles.vehicleTagPill}>
                    <Text style={styles.vehicleTagText}>{vehicle.tag}</Text>
                  </View>
                  <View style={styles.capacityBadge}>
                    <Users size={11} color={colors.subtle} />
                    <Text style={styles.capacityText}>{vehicle.capacity}</Text>
                  </View>
                </View>

                <View style={styles.vehicleCardBody}>
                  <Text style={styles.vehicleName}>{vehicle.name}</Text>
                  <Text style={styles.vehicleCategoryName}>{vehicle.categoryName}</Text>
                  <Text style={styles.vehicleBestFor} numberOfLines={1}>
                    {vehicle.bestFor}
                  </Text>
                </View>

                <View style={styles.vehicleCardFooter}>
                  <Text style={styles.bookVehicleText}>Book</Text>
                  <ChevronRight size={14} color={colors.accent} />
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Featured Himalayan Routes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Routes</Text>
            <Text style={styles.sectionSubtitle}>1-tap booking</Text>
          </View>

          <View style={styles.routesList}>
            {FEATURED_ROUTES.map((route) => (
              <Pressable
                key={route.id}
                onPress={() => handleSelectRoute(route)}
                style={({ pressed }) => [styles.routeCard, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Book expedition: ${route.title}`}
              >
                <View style={styles.routeCardLeft}>
                  <View style={styles.routeIconWrap}>
                    <Mountain size={18} color={colors.accent} />
                  </View>
                  <View style={styles.routeInfo}>
                    <Text style={styles.routeTitle}>{route.title}</Text>
                    <View style={styles.routeMetaRow}>
                      <Clock size={11} color={colors.subtle} />
                      <Text style={styles.routeDurationText}>{route.duration}</Text>
                      <Text style={styles.routeBullet}>•</Text>
                      <Text style={styles.routeVehicleName}>{route.vehicleName}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.routeActionPill}>
                  <Text style={styles.routeActionText}>Book</Text>
                  <ChevronRight size={13} color={colors.onAccent} />
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 24/7 Roadside Assistance Card */}
        <View style={styles.supportCard}>
          <View style={styles.supportCardHeader}>
            <View style={styles.supportIconWrap}>
              <ShieldCheck size={20} color={colors.success} />
            </View>
            <View style={styles.supportTextWrap}>
              <Text style={styles.supportTitle}>24/7 Roadside Assistance</Text>
              <Text style={styles.supportSubtitle}>
                Chauffeured fleet with live highway emergency dispatch across Nepal.
              </Text>
            </View>
          </View>

          <View style={styles.supportActionsRow}>
            <Pressable
              onPress={handleDialHotline}
              style={({ pressed }) => [styles.supportCallBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Call Hotline"
            >
              <PhoneCall size={14} color={colors.onAccent} />
              <Text style={styles.supportCallText}>Call Hotline</Text>
            </Pressable>

            <Pressable
              onPress={handleWhatsApp}
              style={({ pressed }) => [styles.supportWaBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="WhatsApp Support"
            >
              <MessageCircle size={14} color={colors.success} />
              <Text style={styles.supportWaText}>WhatsApp</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                hapticFeedback.heavy();
                setSosModalVisible(true);
              }}
              style={({ pressed }) => [styles.supportSosBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Emergency SOS Modal"
            >
              <ShieldAlert size={14} color={colors.error} />
              <Text style={styles.supportSosText}>SOS Desk</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Location Picker Modal */}
      <LocationPickerModal
        visible={locationPickerVisible}
        mode={locationPickerMode}
        currentValue={locationPickerMode === 'pickup' ? pickupLocation : dropoffLocation}
        onSelect={(locationName) => {
          if (locationPickerMode === 'pickup') {
            setPickupLocation(locationName);
          } else {
            setDropoffLocation(locationName);
          }
          setLocationPickerVisible(false);
        }}
        onClose={() => setLocationPickerVisible(false)}
      />

      {/* Emergency SOS Modal */}
      <EmergencySosModal
        visible={sosModalVisible}
        onClose={() => setSosModalVisible(false)}
        bookingRef={activeVoucher?.bookingRef}
      />
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xs,
      paddingBottom: spacing.sm,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    brandTitleWrap: {
      justifyContent: 'center',
    },
    brandTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.2,
    },
    brandSubtitle: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.muted,
      letterSpacing: 0.1,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    sosPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
      borderRadius: radius.pill,
      backgroundColor: colors.errorSoft,
      borderWidth: 1,
      borderColor: colors.error,
    },
    sosPillText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.error,
    },
    profileBtn: {
      padding: 2,
    },
    avatarCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarLetter: {
      color: colors.onAccent,
      fontSize: 14,
      fontWeight: '800',
    },
    guestCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    container: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.xxl * 1.5,
    },
    greetingSection: {
      marginBottom: spacing.md,
    },
    greetingText: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.4,
      marginBottom: 3,
    },
    subgreetingText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.muted,
    },
    activeTripCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.accent,
      marginBottom: spacing.md,
    },
    activeTripLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    activeStatusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.success,
    },
    activeTripInfo: {
      flex: 1,
    },
    activeTripTag: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.accent,
      letterSpacing: 0.6,
      marginBottom: 2,
    },
    activeTripRoute: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.text,
    },
    activeTripMeta: {
      fontSize: 11,
      color: colors.muted,
      marginTop: 2,
    },
    activeTripVoucherBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.accentSoft,
    },
    activeTripVoucherBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.accent,
    },
    bookingCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 3,
      marginBottom: spacing.xl,
    },
    bookingCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    bookingTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    bookingCardTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.text,
    },
    tripTypeToggle: {
      flexDirection: 'row',
      backgroundColor: colors.elevated,
      borderRadius: radius.pill,
      padding: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tripTypePill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
    tripTypePillActive: {
      backgroundColor: colors.accent,
    },
    tripTypePillText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.subtle,
    },
    tripTypePillTextActive: {
      color: colors.onAccent,
      fontWeight: '700',
    },
    locationFieldsWrap: {
      gap: spacing.xs,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.elevated,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    locationRowPressed: {
      borderColor: colors.accent,
    },
    locationDotPickup: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    locationDotDropoff: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.navy,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    locationTextWrap: {
      flex: 1,
    },
    locationFieldLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.subtle,
      letterSpacing: 0.5,
      marginBottom: 1,
    },
    locationValueText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    placeholderText: {
      color: colors.muted,
      fontWeight: '500',
    },
    editActionText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.accent,
      marginLeft: spacing.xs,
    },
    locationDivider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: -3,
      zIndex: 2,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    swapPill: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: spacing.sm,
    },
    suggestionsRow: {
      marginTop: spacing.sm,
    },
    suggestionsScroll: {
      flexDirection: 'row',
      gap: 6,
    },
    suggestionChip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radius.pill,
      backgroundColor: colors.elevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    suggestionChipActive: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
    },
    suggestionChipText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.text,
    },
    suggestionChipTextActive: {
      color: colors.accent,
      fontWeight: '800',
    },
    searchBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.accent,
      paddingVertical: 12,
      borderRadius: radius.md,
      marginTop: spacing.md,
    },
    searchBtnText: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.onAccent,
    },
    section: {
      marginBottom: spacing.xl,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
    },
    sectionSubtitle: {
      fontSize: 11,
      color: colors.muted,
      fontWeight: '600',
    },
    seeAllBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    seeAllText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.accent,
    },
    fleetGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    vehicleCard: {
      width: '48.5%',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'space-between',
    },
    vehicleCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    vehicleTagPill: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.pill,
      backgroundColor: colors.accentSoft,
    },
    vehicleTagText: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.accent,
    },
    capacityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    capacityText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.subtle,
    },
    vehicleCardBody: {
      marginBottom: spacing.xs,
    },
    vehicleName: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 1,
    },
    vehicleCategoryName: {
      fontSize: 11,
      color: colors.subtle,
      fontWeight: '600',
      marginBottom: 3,
    },
    vehicleBestFor: {
      fontSize: 10,
      color: colors.muted,
    },
    vehicleCardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 2,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 6,
      marginTop: 4,
    },
    bookVehicleText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accent,
    },
    routesList: {
      gap: spacing.xs,
    },
    routeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      padding: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    routeCardLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    routeIconWrap: {
      width: 34,
      height: 34,
      borderRadius: radius.sm,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    routeInfo: {
      flex: 1,
    },
    routeTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 2,
    },
    routeMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    routeDurationText: {
      fontSize: 10,
      color: colors.muted,
    },
    routeBullet: {
      fontSize: 10,
      color: colors.subtle,
    },
    routeVehicleName: {
      fontSize: 10,
      color: colors.subtle,
      fontWeight: '600',
    },
    routeActionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      backgroundColor: colors.accent,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: radius.pill,
      marginLeft: spacing.xs,
    },
    routeActionText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.onAccent,
    },
    supportCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    supportCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    supportIconWrap: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: colors.successSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    supportTextWrap: {
      flex: 1,
    },
    supportTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 2,
    },
    supportSubtitle: {
      fontSize: 11,
      color: colors.muted,
      lineHeight: 15,
    },
    supportActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    supportCallBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: colors.accent,
      paddingVertical: 8,
      borderRadius: radius.md,
    },
    supportCallText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.onAccent,
    },
    supportWaBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.success,
      paddingVertical: 8,
      borderRadius: radius.md,
    },
    supportWaText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.success,
    },
    supportSosBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.error,
      paddingHorizontal: spacing.sm,
      paddingVertical: 8,
      borderRadius: radius.md,
    },
    supportSosText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.error,
    },
    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
  });
}
