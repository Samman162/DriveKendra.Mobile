import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
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
  AlertTriangle,
  Calendar,
  Car,
  Clock,
  Download,
  FileText,
  MapPin,
  MessageCircle,
  Mountain,
  Phone,
  RotateCcw,
  Star,
  User,
  WifiOff,
} from 'lucide-react-native';

import { getUserBookings } from '../api/bookings';
import { EmergencySosModal } from '../components/ui/EmergencySosModal';
import { EmergencyTripCard } from '../components/ui/EmergencyTripCard';
import { Screen } from '../components/ui/Screen';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { CONTACT_INFO } from '../constants/contact';
import { useAuth } from '../context/AuthContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import type { RootStackParamList, RootTabParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeProvider';
import { useThemedStyles } from '../theme/useThemedStyles';
import { radius, spacing } from '../theme/spacing';
import type { BookingRecordDto } from '../types/api';
import { hapticFeedback } from '../utils/haptics';
import {
  clearOfflineVouchers,
  formatToOfflineVoucher,
  getActiveOfflineVoucher,
  getOfflineVouchers,
  saveOfflineVouchers,
  type OfflineVoucher,
} from '../utils/offlineVoucherStorage';
import { generateAndShareVoucher, type TripVoucherPdfData } from '../utils/pdfGenerator';

export interface TripRecord {
  id: string;
  bookingRef: string;
  pickup: string;
  dropoff: string;
  date: string;
  time: string;
  tripType: 'One Way' | 'Return' | 'Round Trip';
  passengerCount?: number;
  vehicleName: string;
  vehiclePlate: string;
  driverName?: string;
  driverPhone?: string;
  fare: string;
  finalFare?: string;
  additionalDetails?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'MyBookings'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function MyTripsScreen() {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { isOffline } = useNetworkStatus();

  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [mountainModeManual, setMountainModeManual] = useState<boolean>(false);
  const [cachedVoucher, setCachedVoucher] = useState<OfflineVoucher | null>(null);
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
  const [sosModalVisible, setSosModalVisible] = useState<boolean>(false);
  const [sosTrip, setSosTrip] = useState<TripRecord | null>(null);

  // Helper to map offline vouchers to TripRecord
  const mapOfflineVouchersToTrips = (cached: OfflineVoucher[]): TripRecord[] => {
    return cached.map((cv) => {
      const isConfirmed = cv.status === 'confirmed' || cv.status === 'completed';
      return {
        id: cv.id,
        bookingRef: cv.bookingRef,
        pickup: cv.pickup,
        dropoff: cv.dropoff,
        date: cv.date,
        time: cv.time,
        tripType: (cv.tripType === 'Return' || cv.tripType === 'Round Trip' ? cv.tripType : 'One Way') as TripRecord['tripType'],
        passengerCount: cv.passengerCount,
        vehicleName: isConfirmed ? cv.vehicleName : '',
        vehiclePlate: isConfirmed ? cv.vehiclePlate : '',
        driverName: isConfirmed ? cv.driverName : undefined,
        driverPhone: isConfirmed ? cv.driverPhone : undefined,
        fare: cv.finalFare || cv.fare,
        finalFare: cv.finalFare,
        additionalDetails: cv.additionalDetails,
        status: (cv.status === 'completed' || cv.status === 'cancelled' || cv.status === 'confirmed' ? cv.status : 'pending') as TripRecord['status'],
      };
    });
  };

  // Fetch live bookings from PostgreSQL backend when user is authenticated, or fall back to local vouchers
  const fetchLiveBookings = useCallback(async (isMounted = true) => {
    if (!user?.id && !user?.phone) {
      const cached = await getOfflineVouchers();
      if (isMounted) {
        if (cached && cached.length > 0) {
          setTrips(mapOfflineVouchersToTrips(cached));
        } else {
          setTrips([]);
        }
        setIsLoadingTrips(false);
      }
      return;
    }

    if (isMounted) setIsLoadingTrips(true);
    try {
      const live = await getUserBookings({ userId: user?.id, phoneNumber: user?.phone });
      if (!isMounted) return;

      if (live && live.length > 0) {
        const formatted: TripRecord[] = live.map((b: BookingRecordDto) => {
          const rawStatus = b.status.toLowerCase();
          const status: TripRecord['status'] =
            rawStatus === 'completed'
              ? 'completed'
              : rawStatus === 'cancelled'
                ? 'cancelled'
                : rawStatus === 'confirmed'
                  ? 'confirmed'
                  : 'pending';

          const isConfirmed = status === 'confirmed' || status === 'completed';

          return {
            id: `trip_${b.bookingId}`,
            bookingRef: b.bookingRef,
            pickup: b.pickupLocation,
            dropoff: b.dropoffLocation,
            date: new Date(b.pickupDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
            time: b.pickupTime || new Date(b.pickupDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            tripType: b.tripType,
            passengerCount: b.passengerCount,
            vehicleName: isConfirmed ? (b.assignedVehicleModel || b.vehicleTypeName || 'Assigned Fleet') : '',
            vehiclePlate: isConfirmed ? (b.assignedVehiclePlate || 'Assigned') : '',
            driverName: isConfirmed ? (b.assignedDriverName || undefined) : undefined,
            driverPhone: isConfirmed ? (b.assignedDriverPhone || undefined) : undefined,
            fare: b.finalFare || b.estimatedFare || 'Awaiting Quote',
            finalFare: b.finalFare || undefined,
            additionalDetails: b.additionalDetails || undefined,
            status,
          };
        });
        setTrips(formatted);
      } else {
        // Preserve local offline vouchers if live server database has no active trips for this user
        const cached = await getOfflineVouchers();
        if (cached && cached.length > 0) {
          setTrips(mapOfflineVouchersToTrips(cached));
        } else {
          setTrips([]);
        }
      }
    } catch (e) {
      console.warn('[MyTrips] Offline or failed to sync live bookings:', e);
      if (!isMounted) return;
      const cached = await getOfflineVouchers();
      if (cached && cached.length > 0) {
        setTrips(mapOfflineVouchersToTrips(cached));
      } else {
        setTrips([]);
      }
    } finally {
      if (isMounted) setIsLoadingTrips(false);
    }
  }, [user]);

  // Refresh bookings on screen focus
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      fetchLiveBookings(isMounted);
      return () => {
        isMounted = false;
      };
    }, [fetchLiveBookings])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    hapticFeedback.light();
    await fetchLiveBookings(true);
    setRefreshing(false);
  }, [fetchLiveBookings]);

  // Auto-cache trips to local storage for offline / mountain road access
  useEffect(() => {
    if (trips.length > 0) {
      saveOfflineVouchers(trips);
      getActiveOfflineVoucher().then((voucher) => {
        if (voucher) {
          setCachedVoucher(voucher);
        } else {
          setCachedVoucher(formatToOfflineVoucher(trips[0]));
        }
      });
    } else {
      setCachedVoucher(null);
    }
  }, [trips]);

  const shouldShowEmergencyVoucher = isOffline || mountainModeManual;

  const upcomingTrips = trips.filter((t) => t.status === 'confirmed' || t.status === 'pending');
  const pastTrips = trips.filter((t) => t.status === 'completed' || t.status === 'cancelled');
  const filteredTrips = tab === 'upcoming' ? upcomingTrips : pastTrips;

  const handleDownloadVoucher = async (trip: TripRecord) => {
    hapticFeedback.medium();
    setGeneratingPdfId(trip.id);

    try {
      const pdfData: TripVoucherPdfData = {
        bookingRef: trip.bookingRef,
        customerName: user?.name || 'Valued Drive Kendra Passenger',
        customerPhone: user?.phone || '+977 9851363783',
        customerEmail: user?.email,
        pickup: trip.pickup,
        dropoff: trip.dropoff,
        date: trip.date,
        time: trip.time,
        tripType: trip.tripType,
        vehicleName: trip.vehicleName,
        vehiclePlate: trip.vehiclePlate,
        fare: trip.fare,
        status: trip.status,
      };

      await generateAndShareVoucher(pdfData);
      hapticFeedback.success();
    } catch (error) {
      console.error('[MyTrips] Voucher PDF generation error:', error);
      Alert.alert(
        'Voucher Download',
        'Could not generate the PDF voucher on this device. Please ensure storage permissions are enabled and try again.',
      );
    } finally {
      setGeneratingPdfId(null);
    }
  };

  const handleRebook = (trip: TripRecord) => {
    hapticFeedback.medium();
    navigation.navigate('Booking', {
      pickupLocation: trip.pickup,
      dropoffLocation: trip.dropoff,
    });
  };

  return (
    <Screen padded={false}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Top Bar matching Home & Book Ride Screens */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Text style={styles.categoryLabel}>MY RESERVATIONS</Text>
          <Text style={styles.screenTitle}>My Trips</Text>
        </View>
        <ThemeToggle variant="onSurface" />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.accent]}
            tintColor={colors.accent}
          />
        }
      >
        <Text style={styles.screenSubtitle}>
          Track vehicle assignments, access offline vouchers, and view past expedition receipts.
        </Text>

        {/* Mountain Emergency Mode Bar */}
        <View style={[styles.mountainBar, shouldShowEmergencyVoucher && styles.mountainBarActive]}>
          <View style={styles.mountainBarLeft}>
            <View style={[styles.mountainIconCircle, shouldShowEmergencyVoucher && styles.mountainIconCircleActive]}>
              {isOffline ? (
                <WifiOff size={16} color={colors.error} />
              ) : (
                <Mountain size={16} color={shouldShowEmergencyVoucher ? colors.accent : colors.subtle} />
              )}
            </View>
            <View style={styles.mountainTextCol}>
              <View style={styles.mountainTitleRow}>
                <Text style={styles.mountainBarTitle}>
                  {isOffline ? 'Offline Mountain Mode' : 'Mountain Emergency Mode'}
                </Text>
                {shouldShowEmergencyVoucher && (
                  <View style={styles.liveBadge}>
                    <Text style={styles.liveBadgeText}>ACTIVE</Text>
                  </View>
                )}
              </View>
              <Text style={styles.mountainBarSub}>
                {isOffline
                  ? 'Cellular lost. Offline SOS & Voucher available.'
                  : 'Instant SOS for Muktinath, Jomsom & remote 4x4 passes.'}
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.mountainTogglePill,
              shouldShowEmergencyVoucher && styles.mountainTogglePillActive,
              pressed && styles.pressed,
            ]}
            onPress={() => {
              hapticFeedback.selection();
              setMountainModeManual(!mountainModeManual);
            }}
            accessibilityRole="button"
            accessibilityLabel="Toggle Mountain Emergency Mode"
          >
            <Text
              style={[
                styles.mountainToggleText,
                shouldShowEmergencyVoucher && styles.mountainToggleTextActive,
              ]}
            >
              {shouldShowEmergencyVoucher ? 'SOS Active' : 'Enable SOS'}
            </Text>
          </Pressable>
        </View>

        {/* Prominent Offline Mountain Emergency Mode Card (When Active) */}
        {shouldShowEmergencyVoucher && cachedVoucher && (
          <View style={styles.emergencyCardContainer}>
            <EmergencyTripCard voucher={cachedVoucher} isOffline={isOffline} />
          </View>
        )}

        {/* Segmented Tab Switcher (Matching Book Ride pill tabs) */}
        <View style={styles.segmentedTabContainer}>
          <Pressable
            onPress={() => {
              hapticFeedback.selection();
              setTab('upcoming');
            }}
            style={[styles.segmentBtn, tab === 'upcoming' && styles.segmentBtnActive]}
            accessibilityRole="button"
            accessibilityLabel={`Upcoming Trips (${upcomingTrips.length})`}
          >
            <Text style={[styles.segmentBtnText, tab === 'upcoming' && styles.segmentBtnTextActive]}>
              Upcoming
            </Text>
            <View
              style={[
                styles.countBadge,
                tab === 'upcoming' ? styles.countBadgeActive : styles.countBadgeInactive,
              ]}
            >
              <Text
                style={[
                  styles.countBadgeText,
                  tab === 'upcoming' && styles.countBadgeTextActive,
                ]}
              >
                {upcomingTrips.length}
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => {
              hapticFeedback.selection();
              setTab('past');
            }}
            style={[styles.segmentBtn, tab === 'past' && styles.segmentBtnActive]}
            accessibilityRole="button"
            accessibilityLabel={`Past Trips (${pastTrips.length})`}
          >
            <Text style={[styles.segmentBtnText, tab === 'past' && styles.segmentBtnTextActive]}>
              Past Trips
            </Text>
            <View
              style={[
                styles.countBadge,
                tab === 'past' ? styles.countBadgeActive : styles.countBadgeInactive,
              ]}
            >
              <Text
                style={[
                  styles.countBadgeText,
                  tab === 'past' && styles.countBadgeTextActive,
                ]}
              >
                {pastTrips.length}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Trips List */}
        {isLoadingTrips ? (
          <View style={{ paddingVertical: spacing.xxl, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={{ marginTop: spacing.md, color: colors.subtle, fontSize: 13, fontWeight: '600' }}>
              Loading your reservations...
            </Text>
          </View>
        ) : filteredTrips.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <View style={styles.emptyIconCircle}>
              <Car size={32} color={colors.accent} />
            </View>
            <Text style={styles.emptyTitle}>
              {tab === 'upcoming' ? 'No Upcoming Reservations' : 'No Past Journeys Yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {tab === 'upcoming'
                ? 'Ready for your next Himalayan tour or airport transfer? Book a comfortable 4x4 or sedan.'
                : 'Your completed journey receipts and tax invoices will appear here once finished.'}
            </Text>
            {tab === 'upcoming' && (
              <Pressable
                onPress={() => {
                  hapticFeedback.medium();
                  navigation.navigate('Booking', undefined);
                }}
                style={({ pressed }) => [styles.emptyBookBtn, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Book a Ride Now"
              >
                <Car size={18} color={colors.onAccent} />
                <Text style={styles.emptyBookBtnText}>Book a Ride Now</Text>
              </Pressable>
            )}
          </View>
        ) : (
          filteredTrips.map((trip) => (
            <View key={trip.id} style={styles.tripCard}>
              {/* Card Header: Reference & Status Pill */}
              <View style={styles.cardHeaderRow}>
                <View style={styles.refPill}>
                  <Text style={styles.refText}>REF: {trip.bookingRef}</Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    trip.status === 'confirmed'
                      ? styles.statusPillConfirmed
                      : trip.status === 'pending'
                      ? styles.statusPillPending
                      : trip.status === 'completed'
                      ? styles.statusPillCompleted
                      : styles.statusPillCancelled,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      trip.status === 'confirmed'
                        ? styles.statusPillTextConfirmed
                        : trip.status === 'pending'
                        ? styles.statusPillTextPending
                        : trip.status === 'completed'
                        ? styles.statusPillTextCompleted
                        : styles.statusPillTextCancelled,
                    ]}
                  >
                    {trip.status === 'confirmed'
                      ? '🟢 Confirmed'
                      : trip.status === 'pending'
                      ? '⏳ Awaiting Dispatch'
                      : trip.status === 'completed'
                      ? '✓ Completed'
                      : '✕ Cancelled'}
                  </Text>
                </View>
              </View>

              {/* Connected Route Visual Track (Matching Book Ride Screen) */}
              <View style={styles.routeSection}>
                <View style={styles.routeTrackCol}>
                  <View style={styles.pickupCircleRing} />
                  <View style={styles.dottedLine}>
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                  </View>
                  <MapPin size={16} color={colors.error} style={styles.destPinIcon} />
                </View>

                <View style={styles.routeDetailsCol}>
                  {/* Pickup Destination */}
                  <View style={styles.locationBlock}>
                    <Text style={styles.locationLabel}>PICKUP</Text>
                    <Text style={styles.locationValue} numberOfLines={2}>
                      {trip.pickup}
                    </Text>
                  </View>

                  <View style={styles.locationDivider} />

                  {/* Dropoff Destination */}
                  <View style={styles.locationBlock}>
                    <Text style={styles.locationLabel}>DESTINATION</Text>
                    <Text style={styles.locationValue} numberOfLines={2}>
                      {trip.dropoff}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Metadata Divider */}
              <View style={styles.cardDivider} />

              {/* Trip Schedule & Fare Meta */}
              <View style={styles.metaRow}>
                <View style={styles.metaLeft}>
                  <View style={styles.scheduleItem}>
                    <Calendar size={14} color={colors.accent} />
                    <Text style={styles.scheduleText}>{trip.date}</Text>
                  </View>
                  <View style={styles.scheduleItem}>
                    <Clock size={14} color={colors.muted} />
                    <Text style={styles.scheduleText}>{trip.time}</Text>
                  </View>
                  <View style={styles.tripTypeTag}>
                    <Text style={styles.tripTypeTagText}>{trip.tripType}</Text>
                  </View>
                </View>

                <View style={styles.metaRight}>
                  <Text style={styles.fareLabelText}>
                    {trip.status === 'confirmed' ? 'Agreed Fare' : 'Est. Budget'}
                  </Text>
                  <Text style={styles.fareAmount}>{trip.fare}</Text>
                </View>
              </View>

              {/* Assigned Vehicle Container (Only if Confirmed or Completed, with vehicle details) */}
              {trip.status !== 'pending' && Boolean(trip.vehicleName || trip.vehiclePlate) && (
                <View style={styles.vehicleCard}>
                  <View style={styles.vehicleAvatar}>
                    <Car size={20} color={colors.onAccent} />
                  </View>

                  <View style={styles.vehicleInfoCol}>
                    <View style={styles.vehicleTitleRow}>
                      <Text style={styles.vehicleCardName} numberOfLines={1}>
                        {trip.vehicleName || 'Fleet Vehicle'}
                      </Text>
                    </View>

                    <View style={styles.vehicleRow}>
                      {trip.vehiclePlate ? (
                        <View style={styles.plateTag}>
                          <Text style={styles.plateText}>{trip.vehiclePlate}</Text>
                        </View>
                      ) : null}
                      <Text style={styles.vehicleStatusSubtext}>
                        {trip.status === 'confirmed'
                          ? 'Assigned & Inspected Fleet'
                          : 'Standard Fleet'}
                      </Text>
                    </View>
                  </View>

                  {/* Quick Call Dispatch Icon */}
                  {trip.status === 'confirmed' && (
                    <Pressable
                      onPress={() => {
                        hapticFeedback.light();
                        Linking.openURL(`tel:${CONTACT_INFO.phoneRaw}`);
                      }}
                      style={({ pressed }) => [styles.phoneBtn, pressed && styles.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel="Call 24/7 Dispatch Desk"
                    >
                      <Phone size={15} color={colors.onAccent} />
                    </Pressable>
                  )}
                </View>
              )}

              {/* Assigned Driver Card (Only when Confirmed and driver assigned) */}
              {trip.status === 'confirmed' && trip.driverName && (
                <View style={styles.driverCard}>
                  <View style={styles.driverAvatar}>
                    <User size={18} color={colors.onAccent} />
                  </View>
                  <View style={styles.driverInfoCol}>
                    <Text style={styles.driverTitleLabel}>ASSIGNED DRIVER</Text>
                    <Text style={styles.driverFullName}>{trip.driverName}</Text>
                    <Text style={styles.driverPhoneText}>{trip.driverPhone || 'Verified Himalayan Driver'}</Text>
                  </View>
                  {trip.driverPhone && (
                    <View style={styles.driverActionsRow}>
                      <Pressable
                        onPress={() => Linking.openURL(`tel:${trip.driverPhone}`)}
                        style={({ pressed }) => [styles.driverContactBtn, pressed && styles.pressed]}
                        accessibilityRole="button"
                        accessibilityLabel={`Call driver ${trip.driverName}`}
                      >
                        <Phone size={14} color={colors.onAccent} />
                      </Pressable>
                      <Pressable
                        onPress={() => Linking.openURL(`https://wa.me/${trip.driverPhone?.replace(/\D/g, '')}`)}
                        style={({ pressed }) => [styles.driverWaBtn, pressed && styles.pressed]}
                        accessibilityRole="button"
                        accessibilityLabel={`WhatsApp driver ${trip.driverName}`}
                      >
                        <MessageCircle size={14} color={colors.white} />
                      </Pressable>
                    </View>
                  )}
                </View>
              )}

              {/* Pending Banner if trip is Pending (No driver or vehicle details shown) */}
              {trip.status === 'pending' && (
                <View style={styles.pendingBanner}>
                  <Clock size={16} color={colors.accent} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.pendingBannerTitle}>Awaiting Operator Dispatch</Text>
                    <Text style={styles.pendingBannerDesc}>
                      Our Kathmandu dispatch desk is reviewing your reservation. Certified driver information, vehicle plate, and confirmed fare will be displayed here once operator confirms.
                    </Text>
                    <View style={styles.pendingAwaitingTag}>
                      <Text style={styles.pendingAwaitingTagText}>Driver & Vehicle: Pending Assignment</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Customer Notes / Special Instructions if present */}
              {trip.additionalDetails && (
                <View style={styles.userNotesBox}>
                  <Text style={styles.userNotesLabel}>YOUR TRIP NOTES & INSTRUCTIONS</Text>
                  <Text style={styles.userNotesText}>{trip.additionalDetails}</Text>
                </View>
              )}

              {/* Action Buttons Bar */}
              <View style={styles.actionsRow}>
                {trip.status === 'confirmed' ? (
                  <>
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionBtnSecondary,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => handleDownloadVoucher(trip)}
                      disabled={generatingPdfId === trip.id}
                      accessibilityRole="button"
                      accessibilityLabel="Download Trip Voucher PDF"
                    >
                      {generatingPdfId === trip.id ? (
                        <ActivityIndicator size="small" color={colors.accent} />
                      ) : (
                        <Download size={14} color={colors.accent} />
                      )}
                      <Text style={styles.actionBtnSecondaryText}>
                        {generatingPdfId === trip.id ? 'Generating...' : 'Voucher PDF'}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.actionBtnWhatsApp,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => {
                        hapticFeedback.light();
                        Linking.openURL(CONTACT_INFO.whatsappLink);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Chat on WhatsApp Dispatch"
                    >
                      <MessageCircle size={14} color={colors.white} />
                      <Text style={styles.actionBtnWhatsAppText}>WhatsApp</Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.actionBtnSos,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => {
                        hapticFeedback.medium();
                        setSosTrip(trip);
                        setSosModalVisible(true);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Emergency SOS"
                    >
                      <AlertTriangle size={13} color={colors.white} />
                      <Text style={styles.actionBtnSosText}>SOS</Text>
                    </Pressable>
                  </>
                ) : trip.status === 'pending' ? (
                  <>
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionBtnSecondary,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => {
                        hapticFeedback.light();
                        Linking.openURL(`tel:${CONTACT_INFO.phoneRaw}`);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Call 24/7 Dispatch Desk"
                    >
                      <Phone size={14} color={colors.accent} />
                      <Text style={styles.actionBtnSecondaryText}>Call Dispatch</Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.actionBtnWhatsApp,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => {
                        hapticFeedback.light();
                        Linking.openURL(CONTACT_INFO.whatsappLink);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Chat on WhatsApp Dispatch"
                    >
                      <MessageCircle size={14} color={colors.white} />
                      <Text style={styles.actionBtnWhatsAppText}>WhatsApp</Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Pressable
                      onPress={() => handleDownloadVoucher(trip)}
                      disabled={generatingPdfId === trip.id}
                      style={({ pressed }) => [
                        styles.actionBtnSecondary,
                        pressed && styles.pressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Download Official Tax Receipt PDF"
                    >
                      {generatingPdfId === trip.id ? (
                        <ActivityIndicator size="small" color={colors.accent} />
                      ) : (
                        <FileText size={14} color={colors.accent} />
                      )}
                      <Text style={styles.actionBtnSecondaryText}>
                        {generatingPdfId === trip.id ? 'Generating...' : 'Tax Receipt (PDF)'}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleRebook(trip)}
                      style={({ pressed }) => [
                        styles.actionBtnPrimary,
                        pressed && styles.pressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Rebook this route"
                    >
                      <RotateCcw size={14} color={colors.onAccent} />
                      <Text style={styles.actionBtnPrimaryText}>Book Again</Text>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Emergency SOS Modal */}
      <EmergencySosModal
        visible={sosModalVisible}
        onClose={() => {
          setSosModalVisible(false);
          setSosTrip(null);
        }}
        bookingRef={sosTrip?.bookingRef}
      />
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
    },
    topBarLeft: {
      flex: 1,
    },
    categoryLabel: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.subtle,
      letterSpacing: 1.2,
      marginBottom: 2,
    },
    screenTitle: {
      fontSize: 30,
      fontWeight: '900',
      color: colors.text,
      letterSpacing: -0.5,
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xl,
    },
    screenSubtitle: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.muted,
      lineHeight: 18,
      marginBottom: spacing.md,
    },

    // Mountain Emergency Bar
    mountainBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    mountainBarActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    mountainBarLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
      marginRight: spacing.xs,
    },
    mountainIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.elevated,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    mountainIconCircleActive: {
      backgroundColor: colors.surface,
      borderColor: colors.accent,
    },
    mountainTextCol: {
      flex: 1,
    },
    mountainTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    mountainBarTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.text,
    },
    liveBadge: {
      backgroundColor: colors.error,
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: radius.pill,
    },
    liveBadgeText: {
      fontSize: 9,
      fontWeight: '900',
      color: colors.white,
      letterSpacing: 0.5,
    },
    mountainBarSub: {
      fontSize: 11,
      color: colors.muted,
      marginTop: 2,
      lineHeight: 15,
    },
    mountainTogglePill: {
      backgroundColor: colors.elevated,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
    },
    mountainTogglePillActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    mountainToggleText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.subtle,
    },
    mountainToggleTextActive: {
      color: colors.onAccent,
    },
    emergencyCardContainer: {
      marginBottom: spacing.md,
    },

    // Segmented Tab Switcher (Pill style matching Book Ride form radios)
    segmentedTabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: radius.pill,
      padding: 4,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    segmentBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: radius.pill,
      gap: 6,
    },
    segmentBtnActive: {
      backgroundColor: colors.accent,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 3,
    },
    segmentBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.muted,
    },
    segmentBtnTextActive: {
      color: colors.onAccent,
      fontWeight: '800',
    },
    countBadge: {
      paddingHorizontal: 7,
      paddingVertical: 1,
      borderRadius: radius.pill,
    },
    countBadgeActive: {
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    countBadgeInactive: {
      backgroundColor: colors.elevated,
    },
    countBadgeText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.muted,
    },
    countBadgeTextActive: {
      color: colors.onAccent,
    },

    // Trip Card Container
    tripCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md + 2,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 3,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    refPill: {
      backgroundColor: colors.elevated,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    refText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.subtle,
      letterSpacing: 0.5,
    },
    statusPill: {
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
    statusPillConfirmed: {
      backgroundColor: colors.successSoft,
    },
    statusPillPending: {
      backgroundColor: colors.accentSoft,
    },
    statusPillCompleted: {
      backgroundColor: colors.accentSoft,
    },
    statusPillCancelled: {
      backgroundColor: colors.errorSoft,
    },
    statusPillText: {
      fontSize: 11,
      fontWeight: '800',
    },
    statusPillTextConfirmed: {
      color: colors.success,
    },
    statusPillTextPending: {
      color: colors.accent,
    },
    statusPillTextCompleted: {
      color: colors.accent,
    },
    statusPillTextCancelled: {
      color: colors.error,
    },

    // Connected Route Track Visual
    routeSection: {
      flexDirection: 'row',
      alignItems: 'stretch',
      backgroundColor: colors.elevated,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.sm,
    },
    routeTrackCol: {
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 2,
      marginRight: spacing.sm + 2,
      width: 18,
    },
    pickupCircleRing: {
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 3,
      borderColor: colors.accent,
      backgroundColor: colors.surface,
    },
    dottedLine: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'space-evenly',
      marginVertical: 3,
    },
    dot: {
      width: 2.5,
      height: 2.5,
      borderRadius: 1.25,
      backgroundColor: colors.subtle,
    },
    destPinIcon: {
      marginTop: 1,
    },
    routeDetailsCol: {
      flex: 1,
      justifyContent: 'space-between',
    },
    locationBlock: {
      justifyContent: 'center',
    },
    locationLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.subtle,
      letterSpacing: 0.8,
      marginBottom: 2,
    },
    locationValue: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      lineHeight: 17,
    },
    locationDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 6,
    },

    // Card Divider
    cardDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.xs + 2,
    },

    // Meta Row (Schedule & Fare)
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: spacing.xs,
    },
    metaLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flexWrap: 'wrap',
    },
    scheduleItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    scheduleText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    tripTypeTag: {
      backgroundColor: colors.elevated,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tripTypeTagText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.muted,
    },
    metaRight: {},
    fareLabelText: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.subtle,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      textAlign: 'right',
      marginBottom: 2,
    },
    fareAmount: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.text,
      textAlign: 'right',
    },

    // Vehicle Box
    vehicleCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.elevated,
      borderRadius: radius.md,
      padding: spacing.sm + 2,
      borderWidth: 1,
      borderColor: colors.border,
      marginVertical: spacing.sm,
      gap: spacing.sm,
    },
    vehicleAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    vehicleInfoCol: {
      flex: 1,
    },
    vehicleTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 2,
    },
    vehicleCardName: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.text,
      flexShrink: 1,
    },
    vehicleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    vehicleStatusSubtext: {
      fontSize: 11,
      color: colors.muted,
      fontWeight: '500',
    },
    plateTag: {
      backgroundColor: colors.surface,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    plateText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.text,
    },
    phoneBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 2,
    },

    // Action Buttons Bar
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
      marginTop: spacing.xs,
    },
    actionBtnPrimary: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.accent,
      paddingVertical: 10,
      borderRadius: radius.pill,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    actionBtnPrimaryText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.onAccent,
    },
    actionBtnSecondary: {
      flex: 1.2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.accentSoft,
      paddingVertical: 10,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    actionBtnSecondaryText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.accent,
    },
    actionBtnWhatsApp: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.whatsapp,
      paddingVertical: 10,
      borderRadius: radius.pill,
      shadowColor: colors.whatsapp,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    actionBtnWhatsAppText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.white,
    },
    actionBtnSos: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: colors.error,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: radius.pill,
      shadowColor: colors.error,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    actionBtnSosText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.onAccent,
    },
    pendingBanner: {
      flexDirection: 'row',
      backgroundColor: colors.accentSoft,
      borderRadius: radius.md,
      padding: spacing.sm + 2,
      marginTop: spacing.sm,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    pendingBannerTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.accent,
      marginBottom: 2,
    },
    pendingBannerDesc: {
      fontSize: 11,
      color: colors.text,
      lineHeight: 15,
    },
    pendingAwaitingTag: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.xs + 4,
      paddingVertical: 3,
      borderRadius: radius.pill,
      marginTop: spacing.xs + 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pendingAwaitingTagText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.accent,
      letterSpacing: 0.3,
    },
    userNotesBox: {
      backgroundColor: colors.elevated,
      borderRadius: radius.sm,
      padding: spacing.sm,
      marginTop: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    userNotesLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.subtle,
      letterSpacing: 0.8,
      marginBottom: 2,
      textTransform: 'uppercase',
    },
    userNotesText: {
      fontSize: 12,
      color: colors.text,
      fontStyle: 'italic',
    },
    driverCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.elevated,
      borderRadius: radius.md,
      padding: spacing.sm + 2,
      marginTop: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    driverAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    driverInfoCol: {
      flex: 1,
    },
    driverTitleLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.subtle,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginBottom: 1,
    },
    driverFullName: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.text,
    },
    driverPhoneText: {
      fontSize: 11,
      color: colors.subtle,
      marginTop: 1,
    },
    driverActionsRow: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    driverContactBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    driverWaBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.whatsapp,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Empty State Card
    emptyStateCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      marginVertical: spacing.md,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    emptyIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: '900',
      color: colors.text,
      marginBottom: 6,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.muted,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: spacing.lg,
      maxWidth: 280,
    },
    emptyBookBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.accent,
      paddingVertical: 12,
      paddingHorizontal: 28,
      borderRadius: radius.pill,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 3,
    },
    emptyBookBtnText: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.onAccent,
    },
    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
  });
}
