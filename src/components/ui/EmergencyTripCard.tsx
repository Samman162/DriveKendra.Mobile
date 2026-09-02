import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import {
  AlertTriangle,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Copy,
  MapPin,
  Mountain,
  Phone,
  QrCode,
  Send,
  ShieldAlert,
  ShieldCheck,
  User,
  WifiOff,
  X,
} from 'lucide-react-native';

import { radius, spacing } from '../../theme/spacing';
import type { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { hapticFeedback } from '../../utils/haptics';
import type { OfflineVoucher } from '../../utils/offlineVoucherStorage';
import { VoucherQrCode } from './VoucherQrCode';

export interface EmergencyTripCardProps {
  voucher: OfflineVoucher;
  isOffline?: boolean;
  onRefresh?: () => void;
}

const EMERGENCY_DISPATCH_PHONE = '+9779851363783';
const TOURIST_POLICE_PHONE = '1144';

export function EmergencyTripCard({
  voucher,
  isOffline = true,
}: EmergencyTripCardProps) {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [isLocating, setIsLocating] = useState(false);
  const [isQrModalVisible, setIsQrModalVisible] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  /**
   * One-tap direct call to 24/7 Mountain Emergency Dispatch
   */
  const handleEmergencyCall = async (phone: string = EMERGENCY_DISPATCH_PHONE) => {
    hapticFeedback.medium();
    const cleanNumber = phone.replace(/[\s-]/g, '');
    const url = `tel:${cleanNumber}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Phone Call', `Please dial ${phone} manually on your device.`);
      }
    } catch {
      Alert.alert('Phone Call', `Please dial ${phone} manually on your device.`);
    }
  };

  /**
   * One-tap Emergency SOS SMS with real-time GPS coordinates
   */
  const handleEmergencySms = async () => {
    hapticFeedback.heavy();
    setIsLocating(true);

    let gpsText = 'GPS: Location unavailable';
    let mapsLink = '';

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const lat = location.coords.latitude.toFixed(5);
        const lon = location.coords.longitude.toFixed(5);
        const alt = location.coords.altitude
          ? ` (Alt: ${Math.round(location.coords.altitude)}m)`
          : '';

        gpsText = `GPS: Lat ${lat}, Lon ${lon}${alt}`;
        mapsLink = `\nMap: https://maps.google.com/?q=${lat},${lon}`;
      }
    } catch (err) {
      console.warn('[EmergencySOS] GPS coordinates retrieval error:', err);
    } finally {
      setIsLocating(false);
    }

    const message = `🚨 EMERGENCY SOS - DRIVE KENDRA MOUNTAIN RESCUE
Booking: ${voucher.bookingRef}
Route: ${voucher.pickup} ➔ ${voucher.dropoff}
Vehicle: ${voucher.vehicleName} (${voucher.vehiclePlate})
${gpsText}${mapsLink}
Status: Emergency assistance/mechanical support required.`;

    const separator = Platform.OS === 'ios' ? '&body=' : '?body=';
    const smsUrl = `sms:${EMERGENCY_DISPATCH_PHONE}${separator}${encodeURIComponent(message)}`;

    try {
      await Linking.openURL(smsUrl);
    } catch {
      Alert.alert(
        'Emergency SOS',
        `Could not open SMS app directly. Please send your Booking Ref (${voucher.bookingRef}) and coordinates to ${EMERGENCY_DISPATCH_PHONE}.`,
      );
    }
  };

  const handleCopyBookingRef = () => {
    hapticFeedback.selection();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.container}>
      {/* 1. Mountain Emergency Banner */}
      <View style={styles.bannerHeader}>
        <View style={styles.bannerLeft}>
          <View style={styles.pulseIconContainer}>
            {isOffline ? (
              <WifiOff size={16} color="#DC2626" />
            ) : (
              <Mountain size={16} color="#D97706" />
            )}
          </View>
          <View>
            <Text style={styles.bannerTitle}>
              {isOffline ? 'Offline Mountain Mode Active' : 'Himalayan Travel Safety Mode'}
            </Text>
            <Text style={styles.bannerSubtitle}>
              {isOffline
                ? 'Cached for remote highway & mountain routes'
                : '100% accessible in cellular dead zones'}
            </Text>
          </View>
        </View>
        <View style={styles.badgeOffline}>
          <Text style={styles.badgeOfflineText}>
            {isOffline ? 'OFFLINE' : 'SAVED'}
          </Text>
        </View>
      </View>

      {/* 2. Main Voucher Summary Card */}
      <View style={styles.voucherBody}>
        {/* Booking Reference Bar */}
        <View style={styles.bookingRefRow}>
          <View>
            <Text style={styles.labelMuted}>OFFLINE BOOKING VOUCHER</Text>
            <Text style={styles.bookingRefText}>{voucher.bookingRef}</Text>
          </View>
          <View style={styles.qrTriggerRow}>
            <Pressable
              style={styles.qrButton}
              onPress={() => {
                hapticFeedback.light();
                setIsQrModalVisible(true);
              }}
              accessibilityLabel="View offline verification QR code"
            >
              <QrCode size={18} color={colors.accent} />
              <Text style={styles.qrButtonText}>Show QR</Text>
            </Pressable>

            <Pressable
              style={styles.copyButton}
              onPress={handleCopyBookingRef}
              accessibilityLabel="Copy booking reference"
            >
              {copied ? (
                <CheckCircle2 size={16} color={colors.success} />
              ) : (
                <Copy size={16} color={colors.subtle} />
              )}
            </Pressable>
          </View>
        </View>

        {/* Route Line */}
        <View style={styles.routeContainer}>
          <View style={styles.routeIconCol}>
            <View style={styles.routeDotGreen} />
            <View style={styles.routeDottedLine} />
            <View style={styles.routeDotAmber} />
          </View>
          <View style={styles.routeTextCol}>
            <View style={styles.routeItem}>
              <Text style={styles.routeLabel}>PICKUP</Text>
              <Text style={styles.routeValue} numberOfLines={1}>
                {voucher.pickup}
              </Text>
            </View>
            <View style={[styles.routeItem, { marginTop: spacing.sm }]}>
              <Text style={styles.routeLabel}>DESTINATION</Text>
              <Text style={styles.routeValue} numberOfLines={1}>
                {voucher.dropoff}
              </Text>
            </View>
          </View>
        </View>

        {/* High Altitude Route Badge if applicable */}
        {voucher.altitudeNote && (
          <View style={styles.altitudePill}>
            <Mountain size={13} color="#D97706" />
            <Text style={styles.altitudeText}>{voucher.altitudeNote}</Text>
          </View>
        )}

        {/* Fleet & Dispatch Metadata */}
        <View style={styles.metaGrid}>
          <View style={styles.metaBox}>
            <View style={styles.metaIconLabel}>
              <Car size={13} color={colors.subtle} />
              <Text style={styles.metaLabel}>Vehicle / 4WD</Text>
            </View>
            <Text style={styles.metaValue} numberOfLines={1}>
              {voucher.vehicleName}
            </Text>
            <View style={styles.platePill}>
              <Text style={styles.plateText}>{voucher.vehiclePlate}</Text>
            </View>
          </View>

          <View style={styles.metaBox}>
            <View style={styles.metaIconLabel}>
              <Phone size={13} color={colors.subtle} />
              <Text style={styles.metaLabel}>24/7 Hotline</Text>
            </View>
            <Text style={styles.metaValue} numberOfLines={1}>
              Drive Kendra Dispatch
            </Text>
            <Pressable
              style={styles.hotlineCallPill}
              onPress={() => handleEmergencyCall(voucher.emergencyHotline || '+9779851363783')}
            >
              <Phone size={11} color="#059669" />
              <Text style={styles.hotlineCallText}>{voucher.emergencyHotline || '+977 985-1363783'}</Text>
            </Pressable>
          </View>
        </View>

        {/* Expandable Checkpoint Inspection Info */}
        <Pressable
          style={styles.expandToggle}
          onPress={() => {
            hapticFeedback.selection();
            setIsDetailsExpanded(!isDetailsExpanded);
          }}
        >
          <Text style={styles.expandToggleText}>
            {isDetailsExpanded ? 'Hide Permit & Checkpoint Details' : 'View Permit & Checkpoint Details'}
          </Text>
          {isDetailsExpanded ? (
            <ChevronUp size={16} color={colors.subtle} />
          ) : (
            <ChevronDown size={16} color={colors.subtle} />
          )}
        </Pressable>

        {isDetailsExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Scheduled Date:</Text>
              <Text style={styles.detailVal}>{voucher.date} at {voucher.time}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Digital Voucher Code:</Text>
              <Text style={styles.detailVal}>{voucher.verificationCode}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Agreed Total Fare:</Text>
              <Text style={styles.detailVal}>{voucher.fare}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Nepal Tourist Police:</Text>
              <Pressable onPress={() => handleEmergencyCall(TOURIST_POLICE_PHONE)}>
                <Text style={[styles.detailVal, { color: colors.accent, fontWeight: '700' }]}>
                  {TOURIST_POLICE_PHONE} (Toll-Free)
                </Text>
              </Pressable>
            </View>
            <Text style={styles.checkpointNotice}>
              ✓ Official Drive Kendra digital travel pass accepted at ACAP, Shivapuri, and highway checkpoints.
            </Text>
          </View>
        )}

        {/* 3. High-Priority Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Direct Emergency Call Button */}
          <Pressable
            style={styles.emergencyCallButton}
            onPress={() => handleEmergencyCall(EMERGENCY_DISPATCH_PHONE)}
            accessibilityRole="button"
            accessibilityLabel="Call 24/7 Mountain Emergency Dispatch"
          >
            <Phone size={18} color="#FFFFFF" />
            <Text style={styles.emergencyCallText}>Emergency Call Dispatch</Text>
          </Pressable>

          {/* Direct SMS SOS with GPS Button */}
          <Pressable
            style={[styles.emergencySmsButton, isLocating && styles.buttonDisabled]}
            onPress={handleEmergencySms}
            disabled={isLocating}
            accessibilityRole="button"
            accessibilityLabel="Send Emergency SMS with GPS coordinates"
          >
            {isLocating ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <ShieldAlert size={18} color="#DC2626" />
            )}
            <Text style={styles.emergencySmsText}>
              {isLocating ? 'Acquiring GPS...' : 'SMS SOS with GPS'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 4. Fullscreen Offline QR Voucher Modal for Police / Park Checkpoints */}
      <Modal
        visible={isQrModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsQrModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <ShieldCheck size={20} color={colors.accent} />
                <Text style={styles.modalTitle}>Offline Travel Voucher</Text>
              </View>
              <Pressable
                onPress={() => setIsQrModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.qrContainer}>
              <VoucherQrCode
                value={JSON.stringify({
                  ref: voucher.bookingRef,
                  code: voucher.verificationCode,
                  plate: voucher.vehiclePlate,
                  route: `${voucher.pickup} -> ${voucher.dropoff}`,
                })}
                size={180}
                color="#0F172A"
                backgroundColor="#FFFFFF"
              />
              <Text style={styles.qrVerifyCode}>{voucher.verificationCode}</Text>
              <Text style={styles.qrHelpText}>
                Show this digital QR voucher at highway police posts, ACAP, and national park checkpoints. No cellular connection needed.
              </Text>
            </View>

            <View style={styles.modalTripDetails}>
              <Text style={styles.modalTripRoute}>
                {voucher.pickup} ➔ {voucher.dropoff}
              </Text>
              <Text style={styles.modalTripMeta}>
                {voucher.vehicleName} • {voucher.vehiclePlate}
              </Text>
            </View>

            <Pressable
              style={styles.modalDoneButton}
              onPress={() => setIsQrModalVisible(false)}
            >
              <Text style={styles.modalDoneButtonText}>Close Voucher</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1.5,
      borderColor: colors.accent,
      marginHorizontal: spacing.md,
      marginVertical: spacing.sm,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
      elevation: 6,
      overflow: 'hidden',
    },
    bannerHeader: {
      backgroundColor: colors.accentSoft,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    bannerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    pulseIconContainer: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bannerTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.text,
    },
    bannerSubtitle: {
      fontSize: 10,
      color: colors.subtle,
      fontWeight: '500',
    },
    badgeOffline: {
      backgroundColor: '#DC2626',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    badgeOfflineText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    voucherBody: {
      padding: spacing.md,
    },
    bookingRefRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    labelMuted: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.subtle,
      letterSpacing: 0.8,
    },
    bookingRefText: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.text,
    },
    qrTriggerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    qrButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.accentSoft,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    qrButtonText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.accent,
    },
    copyButton: {
      padding: 6,
      backgroundColor: colors.elevated,
      borderRadius: radius.md,
    },
    routeContainer: {
      flexDirection: 'row',
      backgroundColor: colors.elevated,
      padding: spacing.sm,
      borderRadius: radius.md,
      marginBottom: spacing.sm,
    },
    routeIconCol: {
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 4,
      width: 16,
      marginRight: spacing.sm,
    },
    routeDotGreen: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.success,
    },
    routeDottedLine: {
      width: 1.5,
      flex: 1,
      backgroundColor: colors.border,
      marginVertical: 2,
    },
    routeDotAmber: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.accent,
    },
    routeTextCol: {
      flex: 1,
    },
    routeItem: {
      justifyContent: 'center',
    },
    routeLabel: {
      fontSize: 9,
      fontWeight: '700',
      color: colors.subtle,
    },
    routeValue: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    altitudePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.accentSoft,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
      alignSelf: 'flex-start',
      marginBottom: spacing.sm,
    },
    altitudeText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.accent,
    },
    metaGrid: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    metaBox: {
      flex: 1,
      backgroundColor: colors.elevated,
      padding: spacing.sm,
      borderRadius: radius.md,
    },
    metaIconLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 2,
    },
    metaLabel: {
      fontSize: 10,
      color: colors.subtle,
      fontWeight: '600',
    },
    metaValue: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 4,
    },
    hotlineCallPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.successSoft,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.sm,
      alignSelf: 'flex-start',
    },
    hotlineCallText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#059669',
    },
    platePill: {
      backgroundColor: colors.surface,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.sm,
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: colors.border,
    },
    plateText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: 0.5,
    },
    expandToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: 4,
    },
    expandToggleText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.subtle,
    },
    expandedContent: {
      backgroundColor: colors.elevated,
      padding: spacing.sm,
      borderRadius: radius.md,
      marginVertical: spacing.xs,
      gap: 4,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    detailKey: {
      fontSize: 11,
      color: colors.subtle,
    },
    detailVal: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.text,
    },
    checkpointNotice: {
      fontSize: 10,
      color: colors.success,
      fontWeight: '600',
      marginTop: 4,
      fontStyle: 'italic',
    },
    actionsContainer: {
      marginTop: spacing.sm,
      gap: spacing.xs,
    },
    emergencyCallButton: {
      backgroundColor: '#DC2626',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: radius.md,
      gap: spacing.xs,
      shadowColor: '#DC2626',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    emergencyCallText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    emergencySmsButton: {
      backgroundColor: colors.errorSoft,
      borderWidth: 1,
      borderColor: '#DC2626',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 11,
      borderRadius: radius.md,
      gap: spacing.xs,
    },
    emergencySmsText: {
      color: '#DC2626',
      fontSize: 13,
      fontWeight: '700',
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    modalCard: {
      backgroundColor: colors.surface,
      width: '100%',
      maxWidth: 340,
      borderRadius: radius.xl,
      padding: spacing.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalHeader: {
      flexDirection: 'row',
      width: '100%',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    modalHeaderTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
    },
    modalCloseBtn: {
      padding: 4,
    },
    qrContainer: {
      backgroundColor: '#FFFFFF',
      padding: spacing.md,
      borderRadius: radius.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      marginBottom: spacing.md,
      width: '100%',
    },
    qrVerifyCode: {
      fontSize: 12,
      fontWeight: '800',
      color: '#0F172A',
      marginTop: spacing.xs,
      letterSpacing: 1,
    },
    qrHelpText: {
      fontSize: 10,
      color: '#64748B',
      textAlign: 'center',
      marginTop: 4,
      paddingHorizontal: spacing.xs,
    },
    modalTripDetails: {
      width: '100%',
      backgroundColor: colors.elevated,
      padding: spacing.sm,
      borderRadius: radius.md,
      marginBottom: spacing.md,
      alignItems: 'center',
    },
    modalTripRoute: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
    },
    modalTripMeta: {
      fontSize: 11,
      color: colors.subtle,
      fontWeight: '600',
      marginTop: 2,
    },
    modalDoneButton: {
      backgroundColor: colors.navySoft,
      width: '100%',
      paddingVertical: 12,
      borderRadius: radius.md,
      alignItems: 'center',
    },
    modalDoneButtonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
  });
}
