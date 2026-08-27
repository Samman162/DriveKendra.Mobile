import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileText,
  MapPin,
  MessageCircle,
  Mountain,
  Phone,
  Plus,
  RotateCcw,
  ShieldCheck,
  Star,
  User,
  Wifi,
  WifiOff,
} from 'lucide-react-native';

import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmergencyTripCard } from '../components/ui/EmergencyTripCard';
import { Screen } from '../components/ui/Screen';
import { SectionHeader } from '../components/ui/SectionHeader';
import { CONTACT_INFO } from '../constants/contact';
import { useAuth } from '../context/AuthContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import type { BookParams, RootTabParamList } from '../navigation/types';
import { BookingScreen } from './BookingScreen';
import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeProvider';
import { useThemedStyles } from '../theme/useThemedStyles';
import { radius, spacing } from '../theme/spacing';
import { hapticFeedback } from '../utils/haptics';
import {
  formatToOfflineVoucher,
  getActiveOfflineVoucher,
  saveOfflineVouchers,
  type OfflineVoucher,
} from '../utils/offlineVoucherStorage';
import { generateAndShareVoucher, type TripVoucherPdfData } from '../utils/pdfGenerator';
import { getUserBookings } from '../api/bookings';
import { EmergencySosModal } from '../components/ui/EmergencySosModal';
import type { BookingRecordDto } from '../types/api';

export interface TripRecord {
  id: string;
  bookingRef: string;
  pickup: string;
  dropoff: string;
  date: string;
  time: string;
  tripType: 'One Way' | 'Round Trip';
  vehicleName: string;
  vehiclePlate: string;
  driverName: string;
  driverPhone: string;
  driverRating: number;
  fare: string;
  status: 'confirmed' | 'completed' | 'cancelled';
}

const INITIAL_TRIPS: TripRecord[] = [
  {
    id: 'trip_101',
    bookingRef: 'DK-2026-8492',
    pickup: 'Hotel Shanker, Lazimpat, Kathmandu',
    dropoff: 'Lakeside Center, Pokhara (Muktinath Highway)',
    date: 'Tomorrow, 19 Aug 2026',
    time: '7:00 AM',
    tripType: 'One Way',
    vehicleName: 'Mahindra Scorpio 4x4 (AC)',
    vehiclePlate: 'Ba 2 Cha 8492',
    driverName: 'Ram Bahadur Tamang',
    driverPhone: '+9779851363783',
    driverRating: 4.9,
    fare: 'NPR 12,000',
    status: 'confirmed',
  },
  {
    id: 'trip_102',
    bookingRef: 'DK-2026-7210',
    pickup: 'Tribhuvan International Airport (TIA)',
    dropoff: 'Thamel City Center',
    date: '12 Aug 2026',
    time: '2:30 PM',
    tripType: 'One Way',
    vehicleName: 'Toyota Corolla Sedan',
    vehiclePlate: 'Ba 1 Cha 4102',
    driverName: 'Bikram Thapa',
    driverPhone: '+9779851363783',
    driverRating: 4.8,
    fare: 'NPR 1,500',
    status: 'completed',
  },
  {
    id: 'trip_103',
    bookingRef: 'DK-2026-6190',
    pickup: 'Boudhanath Stupa Gate',
    dropoff: 'Manakamana Cable Car Station',
    date: '28 Jul 2026',
    time: '6:00 AM',
    tripType: 'Round Trip',
    vehicleName: 'Toyota HiAce (14-Seater)',
    vehiclePlate: 'Ba 3 Cha 9912',
    driverName: 'Prem Gurung',
    driverPhone: '+9779851363783',
    driverRating: 5.0,
    fare: 'NPR 9,500',
    status: 'completed',
  },
];

export function MyTripsScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { user } = useAuth();
  const { isOffline } = useNetworkStatus();

  let routeParams: RootTabParamList['MyBookings'];
  try {
    const route = useRoute<RouteProp<RootTabParamList, 'MyBookings'>>();
    routeParams = route.params;
  } catch {
    routeParams = undefined;
  }

  const [trips, setTrips] = useState<TripRecord[]>(INITIAL_TRIPS);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [mountainModeManual, setMountainModeManual] = useState<boolean>(false);
  const [cachedVoucher, setCachedVoucher] = useState<OfflineVoucher | null>(null);
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
  const [sosModalVisible, setSosModalVisible] = useState<boolean>(false);
  const [sosTrip, setSosTrip] = useState<TripRecord | null>(null);

  // Fetch live bookings from PostgreSQL backend when user is authenticated
  useEffect(() => {
    async function fetchLiveBookings() {
      if (!user?.id && !user?.phone) return;
      try {
        const live = await getUserBookings({ userId: user?.id, phoneNumber: user?.phone });
        if (live && live.length > 0) {
          const formatted: TripRecord[] = live.map((b: BookingRecordDto) => ({
            id: `trip_${b.bookingId}`,
            bookingRef: b.bookingRef,
            pickup: b.pickupLocation,
            dropoff: b.dropoffLocation,
            date: new Date(b.pickupDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
            time: new Date(b.pickupDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            tripType: b.tripType,
            vehicleName: b.vehicleTypeName || 'Mahindra Scorpio 4x4',
            vehiclePlate: b.assignedVehiclePlate || 'Ba 2 Cha (TBD)',
            driverName: b.assignedDriverName || 'Assigning Chauffeur...',
            driverPhone: b.assignedDriverPhone || CONTACT_INFO.phoneRaw,
            driverRating: 4.9,
            fare: 'NPR 12,000',
            status: b.status.toLowerCase() === 'completed' ? 'completed' : b.status.toLowerCase() === 'cancelled' ? 'cancelled' : 'confirmed',
          }));
          setTrips(formatted);
        }
      } catch (e) {
        console.warn('[MyTrips] Offline or failed to sync live bookings:', e);
      }
    }
    fetchLiveBookings();
  }, [user]);

  // Booking Form Modal State
  const [bookingModalVisible, setBookingModalVisible] = useState<boolean>(false);
  const [prefillParams, setPrefillParams] = useState<BookParams | undefined>(undefined);

  // Auto-cache trips to local storage for offline / mountain road access
  useEffect(() => {
    saveOfflineVouchers(trips);
    getActiveOfflineVoucher().then((voucher) => {
      if (voucher) {
        setCachedVoucher(voucher);
      } else if (trips.length > 0) {
        setCachedVoucher(formatToOfflineVoucher(trips[0]));
      }
    });
  }, [trips]);

  // Handle external trigger to open modal with parameters
  useEffect(() => {
    if (routeParams?.openBookingModal) {
      setPrefillParams(routeParams.initialParams);
      setBookingModalVisible(true);
    }
  }, [routeParams]);

  const shouldShowEmergencyVoucher = isOffline || mountainModeManual;

  const filteredTrips = trips.filter((t) => {
    if (tab === 'upcoming') return t.status === 'confirmed';
    return t.status === 'completed';
  });

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
        driverName: trip.driverName,
        driverPhone: trip.driverPhone,
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

  const handleNewBookingCreated = (newTrip: TripRecord) => {
    setTrips((prev) => [newTrip, ...prev]);
    setTab('upcoming');
    setBookingModalVisible(false);
  };

  return (
    <View style={styles.outerContainer}>
      <Screen>
        <SectionHeader
          tag="MY RESERVATIONS"
          title="Trip & Ride History"
          subtitle="Manage upcoming driver pickups, view assigned chauffeurs & download tax receipts."
        />

        {/* Mountain Emergency Mode Quick Action Bar */}
        <View style={styles.mountainBar}>
          <View style={styles.mountainBarLeft}>
            <View style={[styles.mountainIconDot, shouldShowEmergencyVoucher && styles.mountainIconDotActive]}>
              {isOffline ? (
                <WifiOff size={14} color={colors.error} />
              ) : (
                <Mountain size={14} color={shouldShowEmergencyVoucher ? colors.accent : colors.subtle} />
              )}
            </View>
            <View>
              <Text style={styles.mountainBarTitle}>
                {isOffline ? 'Offline Mountain Mode' : 'Mountain Emergency Mode'}
              </Text>
              <Text style={styles.mountainBarSub}>
                {isOffline
                  ? 'Cellular lost. Offline SOS & Voucher active.'
                  : 'Muktinath, Jomsom & remote 4x4 routes.'}
              </Text>
            </View>
          </View>

          <Pressable
            style={[styles.mountainToggleBtn, shouldShowEmergencyVoucher && styles.mountainToggleBtnActive]}
            onPress={() => {
              hapticFeedback.selection();
              setMountainModeManual(!mountainModeManual);
            }}
            accessibilityRole="button"
            accessibilityLabel="Toggle Mountain Emergency Mode"
          >
            <Text style={[styles.mountainToggleText, shouldShowEmergencyVoucher && styles.mountainToggleTextActive]}>
              {shouldShowEmergencyVoucher ? 'Active (SOS)' : 'Enable SOS'}
            </Text>
          </Pressable>
        </View>

        {/* Prominent Offline Mountain Emergency Mode Card */}
        {shouldShowEmergencyVoucher && cachedVoucher && (
          <EmergencyTripCard
            voucher={cachedVoucher}
            isOffline={isOffline}
          />
        )}

        {/* Segmented Tab Switcher */}
        <View style={styles.tabSwitcher}>
          <Pressable
            onPress={() => {
              hapticFeedback.selection();
              setTab('upcoming');
            }}
            style={[styles.tabBtn, tab === 'upcoming' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabBtnText, tab === 'upcoming' && styles.tabBtnTextActive]}>
              Upcoming ({trips.filter((t) => t.status === 'confirmed').length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              hapticFeedback.selection();
              setTab('past');
            }}
            style={[styles.tabBtn, tab === 'past' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabBtnText, tab === 'past' && styles.tabBtnTextActive]}>
              Past Trips ({trips.filter((t) => t.status === 'completed').length})
            </Text>
          </Pressable>
        </View>

        {/* Trips List */}
        {filteredTrips.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Car size={36} color={colors.subtle} style={{ marginBottom: spacing.sm }} />
            <Text style={styles.emptyTitle}>No {tab} trips found</Text>
            <Text style={styles.emptySubtitle}>
              {tab === 'upcoming'
                ? 'Ready for your next Himalayan tour or airport transfer?'
                : 'Your completed journey receipts will appear here.'}
            </Text>
            {tab === 'upcoming' && (
              <View style={{ marginTop: spacing.md, width: '100%' }}>
                <Button
                  label="Book a Vehicle Now"
                  onPress={() => {
                    hapticFeedback.medium();
                    setPrefillParams(undefined);
                    setBookingModalVisible(true);
                  }}
                  variant="primary"
                />
              </View>
            )}
          </Card>
        ) : (
          filteredTrips.map((trip) => (
            <Card key={trip.id} style={styles.tripCard}>
              {/* Card Header Status */}
              <View style={styles.cardHeader}>
                <View style={styles.bookingRefRow}>
                  <Text style={styles.bookingRefText}>REF: {trip.bookingRef}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    trip.status === 'confirmed' ? styles.statusConfirmed : styles.statusCompleted,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      trip.status === 'confirmed' ? styles.statusTextConfirmed : styles.statusTextCompleted,
                    ]}
                  >
                    {trip.status === 'confirmed' ? '🟢 Driver Assigned' : '✓ Completed'}
                  </Text>
                </View>
              </View>

              {/* Route Section */}
              <View style={styles.routeBox}>
                <View style={styles.pointRow}>
                  <View style={[styles.pointDot, { backgroundColor: colors.accent }]} />
                  <Text style={styles.pointText}>{trip.pickup}</Text>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.pointRow}>
                  <View style={[styles.pointDot, { backgroundColor: colors.success }]} />
                  <Text style={styles.pointText}>{trip.dropoff}</Text>
                </View>
              </View>

              {/* Date & Fare Bar */}
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Calendar size={13} color={colors.subtle} />
                  <Text style={styles.detailLabel}>{trip.date} • {trip.time}</Text>
                </View>
                <Text style={styles.fareAmount}>{trip.fare}</Text>
              </View>

              {/* Driver & Vehicle Box */}
              <View style={styles.driverBox}>
                <View style={styles.driverAvatar}>
                  <Text style={styles.driverInitial}>{trip.driverName.slice(0, 1)}</Text>
                </View>
                <View style={styles.driverInfo}>
                  <View style={styles.driverNameRow}>
                    <Text style={styles.driverName}>{trip.driverName}</Text>
                    <View style={styles.ratingChip}>
                      <Star size={10} color={colors.highlight} fill={colors.highlight} />
                      <Text style={styles.ratingVal}>{trip.driverRating}</Text>
                    </View>
                  </View>
                  <Text style={styles.vehicleInfo}>
                    {trip.vehicleName} • <Text style={styles.plate}>{trip.vehiclePlate}</Text>
                  </Text>
                </View>

                {/* Quick Call Driver Button for Upcoming */}
                {trip.status === 'confirmed' && (
                  <Pressable
                    onPress={() => {
                      hapticFeedback.light();
                      Linking.openURL(`tel:${trip.driverPhone}`);
                    }}
                    style={styles.callDriverBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Call Assigned Driver"
                  >
                    <Phone size={16} color={colors.onAccent} />
                  </Pressable>
                )}
              </View>

              {/* Bottom Actions */}
              <View style={styles.cardFooter}>
                {trip.status === 'confirmed' ? (
                  <View style={styles.confirmedActionsRow}>
                    <Pressable
                      style={styles.sosTripBtn}
                      onPress={() => {
                        hapticFeedback.medium();
                        setSosTrip(trip);
                        setSosModalVisible(true);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Emergency SOS"
                    >
                      <AlertTriangle size={13} color="#FFF" />
                      <Text style={styles.sosTripBtnText}>SOS</Text>
                    </Pressable>

                    <Pressable
                      style={styles.pdfDownloadBtn}
                      onPress={() => handleDownloadVoucher(trip)}
                      disabled={generatingPdfId === trip.id}
                      accessibilityRole="button"
                      accessibilityLabel="Download Trip Voucher and Tax Receipt PDF"
                    >
                      {generatingPdfId === trip.id ? (
                        <ActivityIndicator size="small" color={colors.accent} />
                      ) : (
                        <Download size={14} color={colors.accent} />
                      )}
                      <Text style={styles.pdfDownloadBtnText}>
                        {generatingPdfId === trip.id ? 'Generating...' : 'Voucher PDF'}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.whatsappBtn}
                      onPress={() => {
                        hapticFeedback.light();
                        Linking.openURL(CONTACT_INFO.whatsappLink);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Chat with Driver Dispatch on WhatsApp"
                    >
                      <MessageCircle size={14} color={colors.onAccent} />
                      <Text style={styles.whatsappBtnText}>WhatsApp</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.pastActionsRow}>
                    <Pressable
                      onPress={() => handleDownloadVoucher(trip)}
                      disabled={generatingPdfId === trip.id}
                      style={styles.invoiceBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Download Official Tax Receipt PDF"
                    >
                      {generatingPdfId === trip.id ? (
                        <ActivityIndicator size="small" color={colors.accent} />
                      ) : (
                        <FileText size={14} color={colors.accent} />
                      )}
                      <Text style={styles.invoiceBtnText}>
                        {generatingPdfId === trip.id ? 'Generating...' : 'Tax Receipt (PDF)'}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        hapticFeedback.selection();
                        setPrefillParams({
                          pickupLocation: trip.pickup,
                          dropoffLocation: trip.dropoff,
                        });
                        setBookingModalVisible(true);
                      }}
                      style={styles.rebookBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Rebook this route"
                    >
                      <RotateCcw size={14} color={colors.onAccent} />
                      <Text style={styles.rebookBtnText}>Book Again</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </Card>
          ))
        )}

        <View style={{ height: 80 }} />
      </Screen>

      {/* Sticky / Floating "New Booking" CTA Button */}
      <View style={styles.floatingButtonContainer}>
        <Pressable
          style={({ pressed }) => [styles.floatingNewBookingBtn, pressed && styles.floatingBtnPressed]}
          onPress={() => {
            hapticFeedback.medium();
            setPrefillParams(undefined);
            setBookingModalVisible(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Create New Vehicle Booking"
        >
          <Plus size={20} color={colors.onAccent} />
          <Text style={styles.floatingNewBookingText}>New Booking</Text>
        </Pressable>
      </View>

      {/* Emergency SOS Modal */}
      <EmergencySosModal
        visible={sosModalVisible}
        onClose={() => {
          setSosModalVisible(false);
          setSosTrip(null);
        }}
        bookingRef={sosTrip?.bookingRef}
        driverName={sosTrip?.driverName}
        driverPhone={sosTrip?.driverPhone}
      />

      {/* Booking Engine Animated Modal Dialog */}
      <Modal
        visible={bookingModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setBookingModalVisible(false)}
      >
        <BookingScreen
          isModal
          initialParams={prefillParams}
          onClose={() => setBookingModalVisible(false)}
          onSuccess={handleNewBookingCreated}
        />
      </Modal>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    outerContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    mountainBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm + 4,
      paddingVertical: spacing.sm,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    mountainBarLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    mountainIconDot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.elevated,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    mountainIconDotActive: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
    },
    mountainBarTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.text,
    },
    mountainBarSub: {
      fontSize: 10,
      color: colors.subtle,
      fontWeight: '500',
    },
    mountainToggleBtn: {
      backgroundColor: colors.elevated,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    mountainToggleBtnActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    mountainToggleText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.subtle,
    },
    mountainToggleTextActive: {
      color: colors.onAccent,
    },
    tabSwitcher: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: 4,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabBtn: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: radius.sm,
    },
    tabBtnActive: {
      backgroundColor: colors.navy,
    },
    tabBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.muted,
    },
    tabBtnTextActive: {
      color: colors.onNavy,
    },
    tripCard: {
      marginBottom: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    emptyCard: {
      padding: spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginVertical: spacing.md,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 4,
    },
    emptySubtitle: {
      fontSize: 13,
      color: colors.muted,
      textAlign: 'center',
      lineHeight: 18,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    bookingRefRow: {
      backgroundColor: colors.elevated,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    bookingRefText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.subtle,
      letterSpacing: 0.5,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
    statusConfirmed: {
      backgroundColor: colors.successSoft,
    },
    statusCompleted: {
      backgroundColor: colors.accentSoft,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '800',
    },
    statusTextConfirmed: {
      color: colors.success,
    },
    statusTextCompleted: {
      color: colors.accent,
    },
    routeBox: {
      backgroundColor: colors.elevated,
      borderRadius: radius.md,
      padding: spacing.sm + 2,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.sm,
    },
    pointRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    pointDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    pointText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
    },
    routeLine: {
      width: 1.5,
      height: 10,
      backgroundColor: colors.border,
      marginLeft: 3.5,
      marginVertical: 2,
    },
    detailsGrid: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
      paddingHorizontal: 2,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    detailLabel: {
      fontSize: 12,
      color: colors.muted,
      fontWeight: '600',
    },
    fareAmount: {
      fontSize: 15,
      fontWeight: '900',
      color: colors.text,
    },
    driverBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.sm,
      gap: spacing.sm,
    },
    driverAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.navy,
      alignItems: 'center',
      justifyContent: 'center',
    },
    driverInitial: {
      color: colors.onNavy,
      fontSize: 14,
      fontWeight: '800',
    },
    driverInfo: {
      flex: 1,
    },
    driverNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    driverName: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.text,
    },
    ratingChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      backgroundColor: colors.elevated,
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: radius.sm,
    },
    ratingVal: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.text,
    },
    vehicleInfo: {
      fontSize: 11,
      color: colors.muted,
      marginTop: 2,
    },
    plate: {
      fontWeight: '700',
      color: colors.text,
    },
    callDriverBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardFooter: {
      marginTop: 2,
    },
    confirmedActionsRow: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    sosTripBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: '#DC2626',
      paddingHorizontal: spacing.sm,
      paddingVertical: 9,
      borderRadius: radius.sm,
    },
    sosTripBtnText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    pdfDownloadBtn: {
      flex: 1.2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.accentSoft,
      paddingVertical: 9,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    pdfDownloadBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.accent,
    },
    whatsappBtn: {
      flex: 0.8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.navySoft,
      paddingVertical: 9,
      borderRadius: radius.sm,
    },
    whatsappBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    pastActionsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    invoiceBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: colors.accentSoft,
      paddingVertical: 8,
      borderRadius: radius.sm,
    },
    invoiceBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.accent,
    },
    rebookBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: colors.accent,
      paddingVertical: 8,
      borderRadius: radius.sm,
    },
    rebookBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.onAccent,
    },
    floatingButtonContainer: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      zIndex: 99,
      elevation: 8,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
    },
    floatingNewBookingBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.accent,
      paddingHorizontal: 18,
      paddingVertical: 13,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    floatingBtnPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.97 }],
    },
    floatingNewBookingText: {
      color: colors.onAccent,
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
  });
}
