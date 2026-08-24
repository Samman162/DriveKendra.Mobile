import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowRight,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  Info,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react-native';

import { submitBooking } from '../api/bookings';
import { HoneypotField } from '../components/honeypot/HoneypotField';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { DateField } from '../components/ui/DateField';
import { PickerSheet } from '../components/ui/PickerSheet';
import { Screen } from '../components/ui/Screen';
import { SectionHeader } from '../components/ui/SectionHeader';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Stepper } from '../components/ui/Stepper';
import { SuccessModal } from '../components/ui/SuccessModal';
import { TextField } from '../components/ui/TextField';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { MapRoutePreview } from '../components/ui/MapRoutePreview';
import { PromoCodeSheet } from '../components/ui/PromoCodeSheet';
import { CONTACT_INFO } from '../constants/contact';
import { LIMITS, NEPAL_PHONE_ERROR } from '../constants/validation';
import { VEHICLE_TYPES } from '../constants/vehicles';
import { useAuth } from '../context/AuthContext';
import type { BookParams, RootStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeProvider';
import { useThemedStyles } from '../theme/useThemedStyles';
import { radius, spacing } from '../theme/spacing';
import type { TripType } from '../types/api';
import { isSameOrAfterDay, startOfToday, toLocalDateOnly } from '../utils/dates';
import { emptyToNull, extractErrorMessage } from '../utils/errors';
import { hapticFeedback } from '../utils/haptics';
import { isValidNepalPhone, normalizeNepalPhone } from '../utils/phone';

type BookingErrors = Partial<Record<string, string>>;

export interface BookingScreenProps {
  onClose?: () => void;
  onSuccess?: (newTrip: {
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
    status: 'confirmed';
  }) => void;
  isModal?: boolean;
  initialParams?: BookParams;
}

const QUICK_LOCATIONS = [
  'TIA Airport',
  'Pokhara Lakeside',
  'Manakamana Cable Car',
  'Chitwan Sauraha',
  'Nagarkot Viewpoint',
  'Bhaktapur Durbar Sq',
];

const emptyForm = {
  full_name: '',
  phone_number: '',
  email: '',
  pickup_location: '',
  dropoff_location: '',
  pickup_date: null as Date | null,
  return_date: null as Date | null,
  passenger_count: 1,
  trip_type: 'One Way' as TripType,
  vehicle_type_id: 1 as number | null,
  additional_details: '',
};

export function BookingScreen({
  onClose,
  onSuccess,
  isModal,
  initialParams,
}: BookingScreenProps = {}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  let routeParams: BookParams | undefined;
  try {
    const route = useRoute<RouteProp<RootStackParamList, 'BookingModal'>>();
    routeParams = route.params;
  } catch {
    routeParams = undefined;
  }

  const { user, isAuthenticated } = useAuth();

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<BookingErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [discount, setDiscount] = useState<number>(0);

  // Autofill user details if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setForm((prev) => ({
        ...prev,
        full_name: prev.full_name || user.name || '',
        email: prev.email || user.email || '',
        phone_number: prev.phone_number || user.phone || '',
      }));
    }
  }, [isAuthenticated, user]);

  const minReturn = useMemo(() => form.pickup_date ?? startOfToday(), [form.pickup_date]);

  useEffect(() => {
    const params = initialParams ?? routeParams;
    if (!params) return;
    if (!params.intentId && !params.pickupLocation && !params.vehicleTypeId) {
      return;
    }

    setForm((current) => ({
      ...current,
      vehicle_type_id: params.vehicleTypeId ?? current.vehicle_type_id ?? 1,
      pickup_location: params.pickupLocation ?? current.pickup_location,
      dropoff_location: params.dropoffLocation ?? current.dropoff_location,
      trip_type: params.tripType ?? current.trip_type,
      additional_details: params.additionalDetails ?? current.additional_details,
      passenger_count: params.passengerCount ?? current.passenger_count,
      return_date: params.tripType === 'Round Trip' ? current.return_date : null,
    }));
  }, [initialParams, routeParams]);

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: BookingErrors = {};
    if (!form.full_name.trim()) next.full_name = 'Full name is required.';
    if (!form.phone_number.trim()) next.phone_number = 'Phone number is required.';
    else if (!isValidNepalPhone(form.phone_number)) next.phone_number = NEPAL_PHONE_ERROR;
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Please enter a valid email address.';
    }
    if (!form.vehicle_type_id) next.vehicle_type_id = 'Select a vehicle type.';
    if (!form.pickup_location.trim()) next.pickup_location = 'Pickup location is required.';
    if (!form.dropoff_location.trim()) next.dropoff_location = 'Destination is required.';
    if (!form.pickup_date) next.pickup_date = 'Pickup date is required.';
    if (form.trip_type === 'Round Trip' && !form.return_date) {
      next.return_date = 'Return date is required for round trips.';
    }
    if (form.pickup_date && form.return_date && !isSameOrAfterDay(form.return_date, form.pickup_date)) {
      next.return_date = 'Return date must be after pickup date.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleDismiss = () => {
    hapticFeedback.light();
    if (onClose) {
      onClose();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const onSubmit = async () => {
    setFormError('');
    if (!validate() || !form.pickup_date || !form.vehicle_type_id) {
      hapticFeedback.error();
      return;
    }

    setSubmitting(true);
    try {
      const selectedVehicle = VEHICLE_TYPES.find((v) => v.id === form.vehicle_type_id);
      const vehicleName = selectedVehicle ? selectedVehicle.name : 'Scorpio 4WD';

      await submitBooking({
        full_name: form.full_name.trim(),
        phone_number: normalizeNepalPhone(form.phone_number),
        email: emptyToNull(form.email),
        pickup_location: form.pickup_location.trim(),
        dropoff_location: form.dropoff_location.trim(),
        pickup_date: toLocalDateOnly(form.pickup_date) ?? '',
        return_date: form.trip_type === 'Round Trip' ? toLocalDateOnly(form.return_date) : null,
        passenger_count: form.passenger_count,
        trip_type: form.trip_type,
        vehicle_type_id: form.vehicle_type_id,
        additional_details: emptyToNull(form.additional_details),
        website_hp: '',
      });

      const randomRefNum = Math.floor(1000 + Math.random() * 9000);
      const newBookingRecord = {
        id: `trip_${Date.now()}`,
        bookingRef: `DK-2026-${randomRefNum}`,
        pickup: form.pickup_location.trim(),
        dropoff: form.dropoff_location.trim(),
        date: toLocalDateOnly(form.pickup_date) ?? 'Tomorrow',
        time: '7:00 AM',
        tripType: form.trip_type as 'One Way' | 'Round Trip',
        vehicleName: `${vehicleName} (AC)`,
        vehiclePlate: `Ba ${Math.floor(1 + Math.random() * 5)} Cha ${randomRefNum}`,
        driverName: 'Suman Shrestha (Kathmandu Dispatch)',
        driverPhone: '+9779851363783',
        driverRating: 4.9,
        fare: discount > 0 ? `NPR ${(12000 - discount).toLocaleString('en-IN')}` : 'NPR 12,000',
        status: 'confirmed' as const,
      };

      hapticFeedback.success();
      setForm(emptyForm);
      setErrors({});
      setSuccessVisible(true);

      if (onSuccess) {
        onSuccess(newBookingRecord);
      }
    } catch (error) {
      hapticFeedback.error();
      setFormError(extractErrorMessage(error, 'Failed to submit booking. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessVisible(false);
    handleDismiss();
  };

  return (
    <Screen>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.badgeTag}>ONLINE RESERVATION</Text>
          <Text style={styles.pageTitle}>Book Vehicle & Driver</Text>
          <Text style={styles.pageSubtitle}>
            Instant booking with verified mountain drivers & upfront rates.
          </Text>
        </View>

        <View style={styles.headerRightActions}>
          <ThemeToggle variant="onSurface" />
          {(isModal || onClose || navigation.canGoBack()) && (
            <Pressable
              onPress={handleDismiss}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close Booking Form Dialog"
            >
              <X size={20} color={colors.text} />
            </Pressable>
          )}
        </View>
      </View>

      <HoneypotField />

      {formError ? (
        <View style={styles.errorAlert}>
          <Text style={styles.errorAlertText}>{formError}</Text>
        </View>
      ) : null}

      {/* STEP 1: ROUTE & TRIP TYPE */}
      <Card style={styles.block}>
        <View style={styles.blockHeader}>
          <View style={styles.stepNumBadge}>
            <Text style={styles.stepNumText}>1</Text>
          </View>
          <Text style={styles.blockTitle}>Route & Trip Type</Text>
        </View>

        <SegmentedControl<TripType>
          label="Trip Type"
          value={form.trip_type}
          onChange={(value) => {
            hapticFeedback.selection();
            update('trip_type', value);
          }}
          options={[
            { label: 'One Way', value: 'One Way' },
            { label: 'Round Trip', value: 'Round Trip' },
          ]}
        />

        <TextField
          label="Pickup Location *"
          value={form.pickup_location}
          onChangeText={(value) => update('pickup_location', value)}
          placeholder="e.g. Kathmandu (Hotel, Airport, Home)"
          error={errors.pickup_location}
          maxLength={LIMITS.location}
        />

        <TextField
          label="Drop-off Destination *"
          value={form.dropoff_location}
          onChangeText={(value) => update('dropoff_location', value)}
          placeholder="e.g. Pokhara, Chitwan, Manakamana"
          error={errors.dropoff_location}
          maxLength={LIMITS.location}
        />

        {/* Quick Destination Chips */}
        <View style={styles.quickChipsWrap}>
          <Text style={styles.quickLabel}>Popular quick picks:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickChipsRow}>
            {QUICK_LOCATIONS.map((loc) => (
              <Pressable
                key={loc}
                onPress={() => {
                  hapticFeedback.selection();
                  update('dropoff_location', loc);
                }}
                style={styles.quickChip}
              >
                <Text style={styles.quickChipText}>{loc}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.dateRow}>
          <View style={styles.dateCol}>
            <DateField
              label="Pickup Date *"
              value={form.pickup_date}
              onChange={(value) => update('pickup_date', value)}
              error={errors.pickup_date}
            />
          </View>
          {form.trip_type === 'Round Trip' && (
            <View style={styles.dateCol}>
              <DateField
                label="Return Date *"
                value={form.return_date}
                onChange={(value) => update('return_date', value)}
                minimumDate={minReturn}
                error={errors.return_date}
              />
            </View>
          )}
        </View>

        {/* Route Preview Simulation */}
        <View style={{ marginTop: spacing.md }}>
          <MapRoutePreview
            pickup={form.pickup_location || 'Kathmandu Pickup'}
            dropoff={form.dropoff_location || 'Destination'}
          />
        </View>
      </Card>

      {/* STEP 2: VEHICLE & PASSENGERS */}
      <Card style={styles.block}>
        <View style={styles.blockHeader}>
          <View style={styles.stepNumBadge}>
            <Text style={styles.stepNumText}>2</Text>
          </View>
          <Text style={styles.blockTitle}>Vehicle & Passengers</Text>
        </View>

        <PickerSheet
          label="Select Vehicle Type *"
          value={form.vehicle_type_id}
          onChange={(value) => {
            hapticFeedback.selection();
            update('vehicle_type_id', value);
          }}
          options={VEHICLE_TYPES}
          error={errors.vehicle_type_id}
        />

        <Stepper
          label="Number of Passengers"
          value={form.passenger_count}
          min={1}
          max={35}
          onChange={(value) => {
            hapticFeedback.selection();
            update('passenger_count', value);
          }}
        />

        <TextField
          label="Special Requests / Flight No. (Optional)"
          value={form.additional_details}
          onChangeText={(value) => update('additional_details', value)}
          placeholder="e.g. Flight QR 650, child seat needed, luggage space"
          multiline
          maxLength={LIMITS.additionalDetails}
        />
      </Card>

      {/* STEP 3: PASSENGER CONTACT DETAILS */}
      <Card style={styles.block}>
        <View style={styles.blockHeader}>
          <View style={styles.stepNumBadge}>
            <Text style={styles.stepNumText}>3</Text>
          </View>
          <Text style={styles.blockTitle}>Passenger Contact</Text>
        </View>

        <TextField
          label="Full Name *"
          value={form.full_name}
          onChangeText={(value) => update('full_name', value)}
          placeholder="e.g. Aarav Sharma"
          error={errors.full_name}
          maxLength={LIMITS.bookingName}
          autoCapitalize="words"
        />

        <TextField
          label="Nepal Mobile Phone *"
          value={form.phone_number}
          onChangeText={(value) => update('phone_number', value)}
          placeholder="e.g. 9851363783 or +977 9841..."
          error={errors.phone_number}
          keyboardType="phone-pad"
          maxLength={LIMITS.phone}
        />

        <TextField
          label="Email Address"
          value={form.email}
          onChangeText={(value) => update('email', value)}
          placeholder="e.g. aarav@example.com"
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          maxLength={LIMITS.bookingEmail}
        />
      </Card>

      {/* PROMO CODE & DISCOUNT SECTION */}
      <PromoCodeSheet
        appliedCode={promoCode}
        onApplyPromo={(code, disc) => {
          setPromoCode(code);
          setDiscount(disc);
        }}
        onRemovePromo={() => {
          setPromoCode(null);
          setDiscount(0);
        }}
      />

      {/* INCLUDED PERKS BADGE */}
      <View style={styles.perksCard}>
        <View style={styles.perkRow}>
          <ShieldCheck size={16} color={colors.success} />
          <Text style={styles.perkText}>Dedicated chauffeur & fuel included</Text>
        </View>
        <View style={styles.perkRow}>
          <Clock size={16} color={colors.success} />
          <Text style={styles.perkText}>24/7 Dispatch confirmation via call/WhatsApp</Text>
        </View>
        <View style={styles.perkRow}>
          <Sparkles size={16} color={colors.success} />
          <Text style={styles.perkText}>Free cancellation up to 24h before pickup</Text>
        </View>
      </View>

      {/* CONFIRM BUTTON */}
      <View style={styles.submitSection}>
        <Button
          label={submitting ? 'Confirming Reservation...' : 'Submit Booking Request'}
          onPress={onSubmit}
          loading={submitting}
          variant="primary"
        />
      </View>

      <SuccessModal
        visible={successVisible}
        title="Booking Request Received!"
        message="Thank you! Our Kathmandu 24/7 dispatch desk will call or WhatsApp you within 15 minutes to confirm driver and vehicle details."
        onClose={handleSuccessClose}
      />
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    headerCopy: {
      flex: 1,
    },
    headerRightActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      marginLeft: 4,
    },
    badgeTag: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
      marginBottom: 2,
    },
    pageTitle: {
      fontSize: 22,
      fontWeight: '900',
      color: colors.text,
    },
    pageSubtitle: {
      fontSize: 13,
      color: colors.muted,
      marginTop: 2,
      lineHeight: 18,
    },
    errorAlert: {
      backgroundColor: colors.errorSoft,
      padding: spacing.md,
      borderRadius: radius.md,
      marginBottom: spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: colors.error,
    },
    errorAlertText: {
      color: colors.error,
      fontSize: 13,
      fontWeight: '600',
    },
    block: {
      marginBottom: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    blockHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    stepNumBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepNumText: {
      color: colors.onAccent,
      fontSize: 12,
      fontWeight: '800',
    },
    blockTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
    },
    quickChipsWrap: {
      marginBottom: spacing.md,
      marginTop: -spacing.xs,
    },
    quickLabel: {
      fontSize: 11,
      color: colors.subtle,
      fontWeight: '600',
      marginBottom: 4,
    },
    quickChipsRow: {
      gap: spacing.xs,
    },
    quickChip: {
      backgroundColor: colors.elevated,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
    },
    quickChipText: {
      fontSize: 11,
      color: colors.muted,
      fontWeight: '600',
    },
    dateRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    dateCol: {
      flex: 1,
    },
    perksCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.xs + 2,
      marginBottom: spacing.md,
    },
    perkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    perkText: {
      fontSize: 12,
      color: colors.muted,
      fontWeight: '600',
    },
    submitSection: {
      marginBottom: spacing.xl,
    },
  });
}
