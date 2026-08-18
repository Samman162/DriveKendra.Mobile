import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import {
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
import { navigateToBook } from '../navigation/booking';
import type { RootTabParamList } from '../navigation/types';
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

const MOCK_TRIPS: TripRecord[] = [
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
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const { user } = useAuth();
  const { isOffline } = useNetworkStatus();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [mountainModeManual, setMountainModeManual] = useState<boolean>(false);
  const [cachedVoucher, setCachedVoucher] = useState<OfflineVoucher | null>(null);
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);

  // Auto-cache trips to local storage for offline / mountain road access
  useEffect(() => {
    saveOfflineVouchers(MOCK_TRIPS);
    getActiveOfflineVoucher().then((voucher) => {
      if (voucher) {
        setCachedVoucher(voucher);
      } else {
        setCachedVoucher(formatToOfflineVoucher(MOCK_TRIPS[0]));
      }
    });
  }, []);

  const shouldShowEmergencyVoucher = isOffline || mountainModeManual;

  const filteredTrips = MOCK_TRIPS.filter((t) => {
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

  const handleDownloadInvoice = (trip: TripRecord) => {
    handleDownloadVoucher(trip);
  };

  return (
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
            Upcoming ({MOCK_TRIPS.filter((t) => t.status === 'confirmed').length})
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
            Past Trips ({MOCK_TRIPS.filter((t) => t.status === 'completed').length})
          </Text>
        </Pressable>
      </View>

      {/* Trips List */}
      {filteredTrips.map((trip) => (
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
                    navigateToBook(navigation, {
                      pickupLocation: trip.pickup,
                      dropoffLocation: trip.dropoff,
                    });
                  }}
                  style={styles.rebookBtn}
                >
                  <RotateCcw size={14} color={colors.onAccent} />
                  <Text style={styles.rebookBtnText}>Book Again</Text>
                </Pressable>
              </View>
            )}
          </View>
        </Card>
      ))}
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
      gap: spacing.sm,
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
  });
}
