import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  ArrowUpDown,
  Calendar,
  Car,
  Check,
  ChevronRight,
  CreditCard,
  FileText,
  MapPin,
  Minus,
  Phone,
  Plus,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react-native';

import { submitBooking } from '../api/bookings';
import { HoneypotField } from '../components/honeypot/HoneypotField';
import { DateField } from '../components/ui/DateField';
import { LocationPickerModal } from '../components/ui/LocationPickerModal';
import { Screen } from '../components/ui/Screen';
import { SlideDrawerModal } from '../components/ui/SlideDrawerModal';
import { SuccessModal } from '../components/ui/SuccessModal';
import { TimePickerField } from '../components/ui/TimePickerField';
import { CONTACT_INFO } from '../constants/contact';
import { LIMITS } from '../constants/validation';
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
import { normalizeNepalPhone, normalizePhone } from '../utils/phone';
import { getOfflineVouchers, saveOfflineVouchers } from '../utils/offlineVoucherStorage';

const VEHICLE_META: Record<number, { subtitle: string; capacity: string; tag: string }> = {
  1: { subtitle: 'Swift, Dzire, Etios (AC & Sedan Comfort)', capacity: '👥 4 Seats • 🧳 2 Bags', tag: 'City & Highway' },
  2: { subtitle: 'Mahindra Scorpio (High Clearance 4WD)', capacity: '👥 7 Seats • 🏔️ 4x4 Off-road', tag: 'Himalayan Ready' },
  3: { subtitle: 'Toyota HiAce (Spacious High-Roof Cabin)', capacity: '👥 14 Seats • ❄️ Full AC', tag: 'Groups & Family' },
  4: { subtitle: 'Tourist Coaster / Deluxe Bus (Luxury Coach)', capacity: '👥 35 Seats • 🚌 Reclining', tag: 'Large Expeditions' },
};

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
    tripType: 'One Way' | 'Return' | 'Round Trip';
    vehicleName: string;
    vehiclePlate: string;
    fare: string;
    status: 'confirmed';
  }) => void;
  isModal?: boolean;
  initialParams?: BookParams;
}

const emptyForm = {
  full_name: '',
  phone_number: '',
  email: '',
  pickup_location: '',
  dropoff_location: '',
  pickup_date: null as Date | null,
  pickup_time: '',
  return_date: null as Date | null,
  passenger_count: 1,
  trip_type: 'One Way' as TripType,
  vehicle_type_id: null as number | null,
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

  const [selectedTripMode, setSelectedTripMode] = useState<'One Way' | 'Return'>('One Way');
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<BookingErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);
  const [budget, setBudget] = useState<string>('');
  const [tempBudget, setTempBudget] = useState<string>('');
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);

  // Modals
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationModalMode, setLocationModalMode] = useState<'pickup' | 'dropoff'>('pickup');
  const [dateTimeModalVisible, setDateTimeModalVisible] = useState(false);
  const [dateModalMode, setDateModalMode] = useState<'pickup' | 'return'>('pickup');
  const [vehiclePickerVisible, setVehiclePickerVisible] = useState(false);

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
    if (!params.intentId && !params.pickupLocation && !params.dropoffLocation && !params.vehicleTypeId) {
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

    if (params.tripType === 'Return' || params.tripType === 'Round Trip') {
      setSelectedTripMode('Return');
    }
  }, [initialParams, routeParams]);

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleTripModeChange = (mode: 'One Way' | 'Return') => {
    hapticFeedback.selection();
    setSelectedTripMode(mode);
    if (mode === 'Return') {
      update('trip_type', 'Return');
    } else {
      update('trip_type', 'One Way');
      update('return_date', null);
    }
  };

  const openLocationPicker = (mode: 'pickup' | 'dropoff') => {
    hapticFeedback.selection();
    setLocationModalMode(mode);
    setLocationModalVisible(true);
  };

  const handleLocationSelected = (locationName: string) => {
    if (locationModalMode === 'pickup') {
      update('pickup_location', locationName);
    } else {
      update('dropoff_location', locationName);
    }
  };

  const swapLocations = () => {
    hapticFeedback.selection();
    setForm((current) => ({
      ...current,
      pickup_location: current.dropoff_location,
      dropoff_location: current.pickup_location,
    }));
  };

  const validate = (): boolean => {
    const next: BookingErrors = {};
    if (!form.vehicle_type_id) next.vehicle_type_id = 'Select a vehicle type.';
    if (!form.pickup_location.trim()) next.pickup_location = 'Pickup location is required.';
    if (!form.dropoff_location.trim()) next.dropoff_location = 'Destination is required.';
    if (!form.pickup_date) next.pickup_date = 'Pickup date is required.';
    if (!form.pickup_time.trim()) next.pickup_time = 'Pickup departure time is required.';
    if (selectedTripMode === 'Return') {
      if (!form.return_date) {
        next.return_date = 'Return date is required for return trips.';
      } else if (form.pickup_date && !isSameOrAfterDay(form.return_date, form.pickup_date)) {
        next.return_date = 'Return date must be on or after pickup date.';
      }
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
      const dateStr = toLocalDateOnly(form.pickup_date) ?? '';
      const fullPickupDate = form.pickup_time ? `${dateStr} ${form.pickup_time}` : dateStr;
      const numericUserId = isAuthenticated && user?.id && !isNaN(Number(user.id)) ? Number(user.id) : undefined;
      const passengerName = (user?.name || form.full_name || 'Passenger').trim();
      const passengerPhone = normalizePhone(user?.phone || form.phone_number || '9841234567');
      const passengerEmail = emptyToNull(user?.email || form.email);

      const combinedDetails = [
        budget.trim() ? `[Target Budget: ${budget.trim()}]` : null,
        form.additional_details?.trim() || null,
      ]
        .filter(Boolean)
        .join(' | ');

      const bookingRes = await submitBooking({
        user_id: numericUserId,
        full_name: passengerName,
        phone_number: passengerPhone,
        email: passengerEmail,
        pickup_location: form.pickup_location.trim(),
        dropoff_location: form.dropoff_location.trim(),
        pickup_date: fullPickupDate,
        pickup_time: form.pickup_time?.trim() || null,
        return_date: selectedTripMode === 'Return' ? toLocalDateOnly(form.return_date) : null,
        passenger_count: form.passenger_count,
        trip_type: form.trip_type,
        vehicle_type_id: form.vehicle_type_id,
        estimated_fare: budget.trim() || null,
        additional_details: emptyToNull(combinedDetails),
        website_hp: '',
      });

      const randomRefNum = Math.floor(1000 + Math.random() * 9000);
      const bookingRef = bookingRes?.bookingRef || `DK-2026-${randomRefNum}`;
      const newBookingRecord = {
        id: bookingRes?.bookingId ? `trip_${bookingRes.bookingId}` : `trip_${Date.now()}`,
        bookingRef,
        pickup: form.pickup_location.trim(),
        dropoff: form.dropoff_location.trim(),
        date: dateStr || 'Tomorrow',
        time: form.pickup_time || '7:00 AM',
        tripType: form.trip_type as 'One Way' | 'Return' | 'Round Trip',
        vehicleName: `${vehicleName} (AC)`,
        vehiclePlate: `Ba ${Math.floor(1 + Math.random() * 5)} Cha ${randomRefNum}`,
        fare: budget.trim() ? budget.trim() : 'NPR 12,000',
        status: 'confirmed' as const,
      };

      // Persist to offline vouchers immediately for mountain emergency & offline access
      try {
        const existingVouchers = await getOfflineVouchers();
        const updatedVouchers = [newBookingRecord, ...existingVouchers.filter((v) => v.bookingRef !== bookingRef)];
        await saveOfflineVouchers(updatedVouchers);
      } catch (cacheErr) {
        console.warn('[BookingScreen] Failed to cache offline voucher:', cacheErr);
      }

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

  const selectedVehicleObj = VEHICLE_TYPES.find((v) => v.id === form.vehicle_type_id);
  const selectedVehicleLabel = selectedVehicleObj ? selectedVehicleObj.name : 'Select Vehicle Category';
  const canGoBack = Boolean(isModal || onClose || navigation.canGoBack());

  return (
    <Screen scroll={false} padded={false}>
      {/* BALANCED TOP HEADER BAR */}
      <View style={styles.topNavRow}>
        <View style={styles.headerLeftCol}>
          {canGoBack ? (
            <Pressable
              onPress={handleDismiss}
              style={styles.backArrowBtn}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <ArrowLeft size={18} color={colors.text} />
            </Pressable>
          ) : (
            <View style={styles.headerBrandingBadge}>
              <Car size={18} color={colors.accent} />
            </View>
          )}
        </View>

        <View style={styles.headerCenterWrap}>
          <Text style={styles.headerTitle}>Reserve a Vehicle</Text>
        </View>

        <View style={styles.headerRightCol}>
          <Pressable
            onPress={() => {
              hapticFeedback.light();
              Alert.alert(
                '24/7 Kathmandu Dispatch',
                `Need immediate assistance or custom route arrangements?\n\nCall our 24/7 operations desk at ${CONTACT_INFO.phoneDisplay}.`,
                [
                  { text: 'Close', style: 'cancel' },
                  {
                    text: 'Call Desk',
                    onPress: () => {
                      Linking.openURL(CONTACT_INFO.telLink).catch(() => { });
                    },
                  },
                ]
              );
            }}
            style={styles.headerHelpBtn}
            accessibilityRole="button"
            accessibilityLabel="24/7 Support Desk"
          >
            <Phone size={12} color={colors.accent} />
            <Text style={styles.headerHelpText}>24/7 Help</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <HoneypotField />

        {formError ? (
          <View style={styles.errorAlert}>
            <Text style={styles.errorAlertText}>{formError}</Text>
          </View>
        ) : null}

        {/* MAIN SLEEK FORM CARD */}
        <View style={styles.mainFormCard}>
          {/* TRIP TYPE SEGMENTED PILL */}
          <View style={styles.tripSegmentRow}>
            {(['One Way', 'Return'] as const).map((modeOption) => {
              const isSelected = selectedTripMode === modeOption;
              return (
                <Pressable
                  key={modeOption}
                  onPress={() => handleTripModeChange(modeOption)}
                  style={[
                    styles.tripSegmentBtn,
                    isSelected && styles.tripSegmentBtnActive,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${modeOption} trip`}
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text
                    style={[
                      styles.tripSegmentBtnText,
                      isSelected && styles.tripSegmentBtnTextActive,
                    ]}
                  >
                    {modeOption}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* PICKUP & DESTINATION CONNECTED TRACK CARD */}
          <View style={styles.routeCard}>
            {/* Left Track Graphic */}
            <View style={styles.routeTrackCol}>
              <View style={styles.pickupCircleRing} />
              <View style={styles.dottedLine}>
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
              </View>
              <MapPin size={16} color={colors.error} style={styles.destPinIcon} />
            </View>

            {/* Right Input Fields */}
            <View style={styles.routeInputsCol}>
              {/* Pickup Row */}
              <Pressable
                onPress={() => openLocationPicker('pickup')}
                style={({ pressed }) => [
                  styles.formRowInput,
                  pressed && styles.rowInputPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Select Pickup Location"
              >
                <Text style={styles.fieldSubLabel}>PICKUP LOCATION</Text>
                <Text
                  style={[
                    styles.fieldMainValue,
                    !form.pickup_location && styles.fieldPlaceholder,
                  ]}
                  numberOfLines={1}
                >
                  {form.pickup_location || 'Select Pickup Location'}
                </Text>
              </Pressable>
              {errors.pickup_location ? (
                <Text style={styles.rowErrorText}>{errors.pickup_location}</Text>
              ) : null}

              <View style={styles.routeDivider} />

              {/* Destination Row */}
              <Pressable
                onPress={() => openLocationPicker('dropoff')}
                style={({ pressed }) => [
                  styles.formRowInput,
                  pressed && styles.rowInputPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Select Destination Location"
              >
                <Text style={styles.fieldSubLabel}>DESTINATION LOCATION</Text>
                <Text
                  style={[
                    styles.fieldMainValue,
                    !form.dropoff_location && styles.fieldPlaceholder,
                  ]}
                  numberOfLines={1}
                >
                  {form.dropoff_location || 'Select Destination Location'}
                </Text>
              </Pressable>
              {errors.dropoff_location ? (
                <Text style={styles.rowErrorText}>{errors.dropoff_location}</Text>
              ) : null}
            </View>

            {/* Swap Button on Right */}
            <Pressable
              onPress={swapLocations}
              style={({ pressed }) => [
                styles.swapBtn,
                pressed && styles.swapBtnPressed,
              ]}
              accessibilityLabel="Swap Route"
              accessibilityRole="button"
            >
              <ArrowUpDown size={14} color={colors.accent} />
            </Pressable>
          </View>

          {/* PICKUP DATE & TIME ROW */}
          <Pressable
            onPress={() => {
              hapticFeedback.selection();
              setDateModalMode('pickup');
              setDateTimeModalVisible(true);
            }}
            style={({ pressed }) => [
              styles.linearFormRow,
              pressed && styles.linearFormRowPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Select Pickup Date and Time"
          >
            <View style={styles.rowIconBadge}>
              <Calendar size={17} color={colors.accent} />
            </View>
            <View style={styles.rowContentWrap}>
              <Text style={styles.rowSubLabel}>PICKUP SCHEDULE</Text>
              <Text
                style={[
                  styles.linearRowValue,
                  !form.pickup_date && styles.fieldPlaceholder,
                ]}
                numberOfLines={1}
              >
                {form.pickup_date
                  ? `${toLocalDateOnly(form.pickup_date)}${form.pickup_time ? ' • ' + form.pickup_time : ''}`
                  : 'Select Pickup Date & Time'}
              </Text>
            </View>
            <ChevronRight size={16} color={colors.subtle} />
          </Pressable>
          {errors.pickup_date ? (
            <Text style={styles.rowErrorText}>{errors.pickup_date}</Text>
          ) : null}

          {/* RETURN DATE ROW (IF RETURN SELECTED) */}
          {selectedTripMode === 'Return' && (
            <>
              <View style={styles.rowDivider} />
              <Pressable
                onPress={() => {
                  hapticFeedback.selection();
                  setDateModalMode('return');
                  setDateTimeModalVisible(true);
                }}
                style={({ pressed }) => [
                  styles.linearFormRow,
                  pressed && styles.linearFormRowPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Select Return Date"
              >
                <View style={[styles.rowIconBadge, styles.rowIconBadgeHighlight]}>
                  <Calendar size={17} color={colors.highlight} />
                </View>
                <View style={styles.rowContentWrap}>
                  <Text style={styles.rowSubLabel}>RETURN SCHEDULE</Text>
                  <Text
                    style={[
                      styles.linearRowValue,
                      !form.return_date && styles.fieldPlaceholder,
                    ]}
                    numberOfLines={1}
                  >
                    {form.return_date ? `Return: ${toLocalDateOnly(form.return_date)}` : 'Select Return Date'}
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.subtle} />
              </Pressable>
              {errors.return_date ? (
                <Text style={styles.rowErrorText}>{errors.return_date}</Text>
              ) : null}
            </>
          )}

          <View style={styles.rowDivider} />

          {/* NUMBER OF PASSENGERS ROW */}
          <View style={styles.linearFormRow}>
            <View style={styles.rowIconBadge}>
              <Users size={17} color={colors.accent} />
            </View>
            <View style={styles.rowContentWrap}>
              <Text style={styles.rowSubLabel}>PASSENGERS</Text>
              <Text style={styles.linearRowValue}>
                {form.passenger_count} {form.passenger_count === 1 ? 'Passenger' : 'Passengers'}
              </Text>
            </View>
            <View style={styles.inlineStepper}>
              <Pressable
                onPress={() => {
                  hapticFeedback.light();
                  if (form.passenger_count > 1) {
                    update('passenger_count', form.passenger_count - 1);
                  }
                }}
                style={({ pressed }) => [
                  styles.stepperBtn,
                  pressed && styles.stepperBtnPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Decrease passenger count"
              >
                <Minus size={13} color={colors.text} />
              </Pressable>
              <Text style={styles.stepperNum}>{form.passenger_count}</Text>
              <Pressable
                onPress={() => {
                  hapticFeedback.light();
                  if (form.passenger_count < 35) {
                    update('passenger_count', form.passenger_count + 1);
                  }
                }}
                style={({ pressed }) => [
                  styles.stepperBtn,
                  pressed && styles.stepperBtnPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Increase passenger count"
              >
                <Plus size={13} color={colors.text} />
              </Pressable>
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* PREFERRED VEHICLE TYPE ROW */}
          <Pressable
            onPress={() => {
              hapticFeedback.selection();
              setVehiclePickerVisible(true);
            }}
            style={({ pressed }) => [
              styles.linearFormRow,
              pressed && styles.linearFormRowPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Preferred Vehicle Type"
          >
            <View style={styles.rowIconBadge}>
              <Car size={17} color={colors.accent} />
            </View>
            <View style={styles.rowContentWrap}>
              <Text style={styles.rowSubLabel}>VEHICLE TYPE</Text>
              <View style={styles.vehicleValueRow}>
                <Text
                  style={[
                    styles.linearRowValue,
                    !selectedVehicleObj && styles.fieldPlaceholder,
                  ]}
                  numberOfLines={1}
                >
                  {selectedVehicleLabel}
                </Text>
                {selectedVehicleObj && VEHICLE_META[selectedVehicleObj.id] ? (
                  <View style={styles.selectedTagBadge}>
                    <Text style={styles.selectedTagText}>
                      {VEHICLE_META[selectedVehicleObj.id].tag}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
            <ChevronRight size={16} color={colors.subtle} />
          </Pressable>
          {errors.vehicle_type_id ? (
            <Text style={styles.rowErrorText}>{errors.vehicle_type_id}</Text>
          ) : null}

          <View style={styles.rowDivider} />

          {/* ADDITIONAL DETAILS (OPTIONAL) ROW */}
          <View style={styles.linearFormRow}>
            <View style={styles.rowIconBadge}>
              <FileText size={17} color={colors.accent} />
            </View>
            <View style={styles.rowContentWrap}>
              <Text style={styles.rowSubLabel}>TRIP NOTES (OPTIONAL)</Text>
              <TextInput
                value={form.additional_details}
                onChangeText={(val) => update('additional_details', val)}
                placeholder="Flight details, luggage, child seat..."
                placeholderTextColor={colors.subtle}
                style={styles.inlineTextInput}
                maxLength={LIMITS.additionalDetails}
              />
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* YOUR BUDGET (OPTIONAL) ROW */}
          <Pressable
            onPress={() => {
              hapticFeedback.selection();
              setTempBudget(budget);
              setBudgetModalVisible(true);
            }}
            style={({ pressed }) => [
              styles.linearFormRow,
              pressed && styles.linearFormRowPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Enter Your Budget"
          >
            <View style={[styles.rowIconBadge, budget ? styles.rowIconBadgeSuccess : undefined]}>
              <CreditCard size={17} color={budget ? colors.success : colors.accent} />
            </View>
            <View style={styles.rowContentWrap}>
              <Text style={styles.rowSubLabel}>TARGET BUDGET (OPTIONAL)</Text>
              <View style={styles.budgetValueRow}>
                <Text
                  style={[
                    styles.linearRowValue,
                    !budget && styles.fieldPlaceholder,
                  ]}
                  numberOfLines={1}
                >
                  {budget ? budget : 'Custom fare offer in NPR'}
                </Text>
                {budget ? (
                  <View style={styles.budgetConfirmedBadge}>
                    <Text style={styles.budgetConfirmedText}>Custom Target</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <ChevronRight size={16} color={colors.subtle} />
          </Pressable>

          {/* GET OFFER / SUBMIT BUTTON & TRUST ROW */}
          <View style={styles.btnWrap}>
            <Pressable
              onPress={onSubmit}
              style={({ pressed }) => [
                styles.getOfferBtn,
                pressed && styles.getOfferBtnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Submit Booking"
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.onAccent} />
              ) : (
                <View style={styles.btnInnerContent}>
                  <Sparkles size={16} color={colors.onAccent} style={styles.btnSparkleIcon} />
                  <Text style={styles.getOfferBtnText}>Submit Booking Request</Text>
                </View>
              )}
            </Pressable>

            {/* Reassuring trust micro-indicator */}
            <View style={styles.trustFooterRow}>
              <ShieldCheck size={13} color={colors.success} />
              <Text style={styles.trustFooterText}>
                No upfront payment required • Free cancellation
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* LOCATION PICKER MODAL */}
      <LocationPickerModal
        visible={locationModalVisible}
        mode={locationModalMode}
        currentValue={locationModalMode === 'pickup' ? form.pickup_location : form.dropoff_location}
        onSelect={handleLocationSelected}
        onClose={() => setLocationModalVisible(false)}
      />

      {/* VEHICLE PICKER DRAWER */}
      <SlideDrawerModal
        visible={vehiclePickerVisible}
        title="Choose Vehicle Category"
        onClose={() => setVehiclePickerVisible(false)}
      >
        <View style={styles.vehicleOptionsList}>
          {VEHICLE_TYPES.map((v) => {
            const isSelected = form.vehicle_type_id === v.id;
            const meta = VEHICLE_META[v.id] || {
              subtitle: 'Comfortable air-conditioned transport',
              capacity: '👥 Passengers & Luggage',
              tag: 'Standard',
            };

            return (
              <Pressable
                key={v.id}
                onPress={() => {
                  hapticFeedback.selection();
                  update('vehicle_type_id', v.id);
                  setVehiclePickerVisible(false);
                }}
                style={[
                  styles.vehicleCardItem,
                  isSelected && styles.vehicleCardItemActive,
                ]}
              >
                <View style={styles.vehicleCardTopRow}>
                  <View style={[styles.vehicleIconBadge, isSelected && styles.vehicleIconBadgeActive]}>
                    <Car size={22} color={isSelected ? colors.onAccent : colors.accent} />
                  </View>

                  <View style={styles.vehicleCardTitleWrap}>
                    <View style={styles.vehicleNameRow}>
                      <Text style={[styles.vehicleCardTitle, isSelected && styles.vehicleCardTitleActive]}>
                        {v.name}
                      </Text>
                      <View style={[styles.vehicleTagPill, isSelected && styles.vehicleTagPillActive]}>
                        <Text style={[styles.vehicleTagText, isSelected && styles.vehicleTagTextActive]}>
                          {meta.tag}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.vehicleCardSubtitle} numberOfLines={1}>
                      {meta.subtitle}
                    </Text>
                  </View>

                  <View style={[styles.vehicleRadioCircle, isSelected && styles.vehicleRadioCircleActive]}>
                    {isSelected && <Check size={14} color={colors.onAccent} />}
                  </View>
                </View>

                <View style={styles.vehicleCardBottomRow}>
                  <Text style={styles.vehicleCapacityText}>{meta.capacity}</Text>
                  <Text style={styles.vehicleRateHint}>Fixed Rates</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </SlideDrawerModal>

      {/* DATE & TIME SELECTION DRAWER */}
      <SlideDrawerModal
        visible={dateTimeModalVisible}
        title={dateModalMode === 'pickup' ? 'Select Pickup Schedule' : 'Select Return Schedule'}
        onClose={() => setDateTimeModalVisible(false)}
      >
        {dateModalMode === 'pickup' ? (
          <>
            {/* Quick Day Chips */}
            <View style={styles.quickDayChipsRow}>
              {[
                { label: 'Today', days: 0 },
                { label: 'Tomorrow', days: 1 },
                { label: '+2 Days', days: 2 },
                { label: '+3 Days', days: 3 },
              ].map((chip) => {
                const targetDate = new Date(Date.now() + chip.days * 86400000);
                const isCurrent =
                  form.pickup_date &&
                  toLocalDateOnly(form.pickup_date) === toLocalDateOnly(targetDate);

                return (
                  <Pressable
                    key={chip.label}
                    onPress={() => {
                      hapticFeedback.selection();
                      update('pickup_date', targetDate);
                    }}
                    style={[
                      styles.quickDayChip,
                      isCurrent && styles.quickDayChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.quickDayChipText,
                        isCurrent && styles.quickDayChipTextActive,
                      ]}
                    >
                      {chip.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <DateField
              label="Pickup Date *"
              value={form.pickup_date}
              onChange={(value) => update('pickup_date', value)}
              error={errors.pickup_date}
            />

            <TimePickerField
              label="Pickup Time *"
              value={form.pickup_time}
              onChange={(val) => update('pickup_time', val)}
              error={errors.pickup_time}
            />
          </>
        ) : (
          <>
            {/* Quick Return Offset Chips */}
            <View style={styles.quickDayChipsRow}>
              {[
                { label: 'Same Day', days: 0 },
                { label: '+1 Day', days: 1 },
                { label: '+2 Days', days: 2 },
                { label: '+5 Days', days: 5 },
              ].map((chip) => {
                const baseDate = form.pickup_date || new Date();
                const targetDate = new Date(baseDate.getTime() + chip.days * 86400000);
                const isCurrent =
                  form.return_date &&
                  toLocalDateOnly(form.return_date) === toLocalDateOnly(targetDate);

                return (
                  <Pressable
                    key={chip.label}
                    onPress={() => {
                      hapticFeedback.selection();
                      update('return_date', targetDate);
                    }}
                    style={[
                      styles.quickDayChip,
                      isCurrent && styles.quickDayChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.quickDayChipText,
                        isCurrent && styles.quickDayChipTextActive,
                      ]}
                    >
                      {chip.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <DateField
              label="Return Date *"
              value={form.return_date}
              onChange={(value) => update('return_date', value)}
              minimumDate={minReturn}
              error={errors.return_date}
            />
          </>
        )}

        <Pressable
          onPress={() => {
            hapticFeedback.selection();
            setDateTimeModalVisible(false);
          }}
          style={styles.dialogDoneBtn}
        >
          <Text style={styles.dialogDoneBtnText}>
            {dateModalMode === 'pickup' ? 'Confirm Pickup Schedule' : 'Confirm Return Schedule'}
          </Text>
        </Pressable>
      </SlideDrawerModal>

      {/* BUDGET ENTRY DRAWER */}
      <SlideDrawerModal
        visible={budgetModalVisible}
        title="Set Your Target Budget"
        onClose={() => setBudgetModalVisible(false)}
      >
        <Text style={styles.budgetDialogSub}>
          Have an expected rate for this trip? Enter your budget in Nepalese Rupees.
        </Text>

        <View style={styles.budgetDisplayCard}>
          <Text style={styles.budgetCurrencyBadge}>NPR</Text>
          <TextInput
            value={tempBudget.replace(/[^0-9]/g, '')}
            onChangeText={(val) => {
              if (!val) {
                setTempBudget('');
              } else {
                const num = parseInt(val, 10);
                setTempBudget(isNaN(num) ? '' : `Rs. ${num.toLocaleString('en-IN')}`);
              }
            }}
            placeholder="e.g. 12,000"
            placeholderTextColor={colors.subtle}
            keyboardType="numeric"
            style={styles.budgetAmountInput}
            autoFocus
          />
        </View>

        {/* Quick Stepper Adjustments */}
        <View style={styles.budgetSteppersRow}>
          {[
            { label: '- 1,000', delta: -1000 },
            { label: '+ 1,000', delta: 1000 },
            { label: '+ 5,000', delta: 5000 },
          ].map((step) => (
            <Pressable
              key={step.label}
              onPress={() => {
                hapticFeedback.selection();
                const rawNum = parseInt(tempBudget.replace(/[^0-9]/g, ''), 10) || 12000;
                const nextVal = Math.max(1000, rawNum + step.delta);
                setTempBudget(`Rs. ${nextVal.toLocaleString('en-IN')}`);
              }}
              style={styles.budgetStepperBtn}
            >
              <Text style={styles.budgetStepperBtnText}>{step.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Informative Guidance */}
        <View style={styles.budgetGuideCard}>
          <ShieldCheck size={16} color={colors.accent} style={{ marginRight: 8 }} />
          <Text style={styles.budgetGuideText}>
            Includes dedicated vehicle rental, fuel, highway tolls & passenger insurance.
          </Text>
        </View>

        <View style={styles.budgetDialogActions}>
          <Pressable
            onPress={() => {
              hapticFeedback.light();
              setBudget('');
              setTempBudget('');
              setBudgetModalVisible(false);
            }}
            style={styles.budgetClearBtn}
          >
            <Text style={styles.budgetClearBtnText}>Clear</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              hapticFeedback.selection();
              const trimmed = tempBudget.trim();
              if (trimmed) {
                setBudget(trimmed.startsWith('Rs.') || trimmed.startsWith('NPR') ? trimmed : `Rs. ${trimmed}`);
              } else {
                setBudget('');
              }
              setBudgetModalVisible(false);
            }}
            style={styles.budgetSaveBtn}
          >
            <Text style={styles.budgetSaveBtnText}>Set Target Budget</Text>
          </Pressable>
        </View>
      </SlideDrawerModal>

      {/* SUCCESS CONFIRMATION MODAL */}
      <SuccessModal
        visible={successVisible}
        title="Booking Request Received!"
        message="Thank you! Our Kathmandu 24/7 dispatch desk will call or WhatsApp you within 15 minutes to confirm vehicle and reservation details."
        onClose={() => {
          setSuccessVisible(false);
          handleDismiss();
        }}
      />
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    topNavRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xs + 2,
    },
    headerLeftCol: {
      width: 44,
      alignItems: 'flex-start',
      justifyContent: 'center',
    },
    backArrowBtn: {
      width: 38,
      height: 38,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    headerBrandingBadge: {
      width: 38,
      height: 38,
      borderRadius: radius.pill,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCenterWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.2,
    },
    headerSubtitle: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.subtle,
      marginTop: 1,
    },
    headerRightCol: {
      width: 68,
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    headerHelpBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.accentSoft,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerHelpText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.accent,
      letterSpacing: 0.2,
    },
    scrollBody: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xl,
    },
    mainFormCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md + 2,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 4,
    },
    tripSegmentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.elevated,
      borderRadius: radius.pill,
      padding: 3,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.sm + 2,
    },
    tripSegmentBtn: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.pill,
    },
    tripSegmentBtnActive: {
      backgroundColor: colors.surface,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 2,
    },
    tripSegmentBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.muted,
    },
    tripSegmentBtnTextActive: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.text,
    },
    routeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.elevated,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.xs + 2,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.xs,
    },
    routeTrackCol: {
      width: 22,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
    },
    pickupCircleRing: {
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 3,
      borderColor: colors.accent,
    },
    dottedLine: {
      height: 24,
      justifyContent: 'space-evenly',
      alignItems: 'center',
    },
    dot: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: colors.subtle,
    },
    destPinIcon: {
      marginTop: 1,
    },
    routeInputsCol: {
      flex: 1,
      paddingLeft: spacing.xs,
    },
    formRowInput: {
      paddingVertical: 5,
      borderRadius: radius.sm,
    },
    rowInputPressed: {
      opacity: 0.7,
    },
    fieldSubLabel: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.6,
      color: colors.subtle,
      marginBottom: 1,
    },
    fieldMainValue: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    fieldPlaceholder: {
      color: colors.subtle,
      fontWeight: '500',
    },
    routeDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 4,
    },
    swapBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: spacing.xs,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 2,
    },
    swapBtnPressed: {
      transform: [{ scale: 0.92 }],
      backgroundColor: colors.accentSoft,
    },
    rowDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.xs + 1,
    },
    linearFormRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
    },
    linearFormRowPressed: {
      opacity: 0.75,
    },
    rowIconBadge: {
      width: 34,
      height: 34,
      borderRadius: radius.md,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    rowIconBadgeHighlight: {
      backgroundColor: colors.accentSoft,
    },
    rowIconBadgeSuccess: {
      backgroundColor: colors.successSoft,
    },
    rowContentWrap: {
      flex: 1,
    },
    rowSubLabel: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5,
      color: colors.subtle,
      marginBottom: 1,
    },
    linearRowValue: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    vehicleValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    selectedTagBadge: {
      backgroundColor: colors.accentSoft,
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectedTagText: {
      fontSize: 9,
      fontWeight: '700',
      color: colors.accent,
    },
    budgetValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    budgetConfirmedBadge: {
      backgroundColor: colors.successSoft,
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
    },
    budgetConfirmedText: {
      fontSize: 9,
      fontWeight: '700',
      color: colors.success,
    },
    inlineStepper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.elevated,
      borderRadius: radius.pill,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderWidth: 1,
      borderColor: colors.border,
    },
    stepperBtn: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    stepperBtnPressed: {
      backgroundColor: colors.accentSoft,
      transform: [{ scale: 0.9 }],
    },
    stepperNum: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.text,
      minWidth: 18,
      textAlign: 'center',
    },
    inlineTextInput: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
      paddingVertical: 0,
    },
    rowErrorText: {
      fontSize: 11,
      color: colors.error,
      fontWeight: '600',
      marginTop: 2,
    },
    btnWrap: {
      marginTop: spacing.md,
      alignItems: 'center',
    },
    getOfferBtn: {
      backgroundColor: colors.accent,
      borderRadius: radius.pill,
      paddingVertical: 13,
      paddingHorizontal: 24,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.28,
      shadowRadius: 8,
      elevation: 4,
    },
    getOfferBtnPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    },
    btnInnerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnSparkleIcon: {
      marginRight: 6,
    },
    getOfferBtnText: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.onAccent,
      letterSpacing: -0.2,
    },
    trustFooterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: spacing.xs + 2,
    },
    trustFooterText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.subtle,
    },
    errorAlert: {
      backgroundColor: colors.errorSoft,
      padding: spacing.sm,
      borderRadius: radius.md,
      marginBottom: spacing.sm,
    },
    errorAlertText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.error,
      textAlign: 'center',
    },
    // Vehicle Drawer Styles
    vehicleOptionsList: {
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    vehicleCardItem: {
      backgroundColor: colors.elevated,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    vehicleCardItemActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    vehicleCardTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    vehicleIconBadge: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: spacing.sm,
    },
    vehicleIconBadgeActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    vehicleCardTitleWrap: {
      flex: 1,
    },
    vehicleNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 2,
    },
    vehicleCardTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.text,
    },
    vehicleCardTitleActive: {
      color: colors.accent,
    },
    vehicleTagPill: {
      backgroundColor: colors.surface,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
    },
    vehicleTagPillActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    vehicleTagText: {
      fontSize: 9,
      fontWeight: '700',
      color: colors.muted,
    },
    vehicleTagTextActive: {
      color: colors.onAccent,
    },
    vehicleCardSubtitle: {
      fontSize: 11,
      color: colors.muted,
    },
    vehicleRadioCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: spacing.xs,
    },
    vehicleRadioCircleActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accent,
    },
    vehicleCardBottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
      paddingTop: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    vehicleCapacityText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    vehicleRateHint: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.accent,
    },

    // Date & Time Drawer Styles
    quickDayChipsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    quickDayChip: {
      flex: 1,
      backgroundColor: colors.elevated,
      borderRadius: radius.pill,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    quickDayChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    quickDayChipText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
    },
    quickDayChipTextActive: {
      color: colors.onAccent,
    },
    dialogDoneBtn: {
      backgroundColor: colors.accent,
      borderRadius: radius.pill,
      paddingVertical: 13,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.md,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    dialogDoneBtnText: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.onAccent,
    },

    // Budget Drawer Styles
    budgetDialogSub: {
      fontSize: 13,
      color: colors.muted,
      marginBottom: spacing.md,
      lineHeight: 18,
    },
    budgetDisplayCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.elevated,
      borderRadius: radius.lg,
      borderWidth: 1.5,
      borderColor: colors.accent,
      paddingHorizontal: spacing.sm,
      height: 50,
      marginBottom: spacing.xs,
    },
    budgetCurrencyBadge: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.accent,
      backgroundColor: colors.accentSoft,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.sm,
      marginRight: spacing.xs,
    },
    budgetAmountInput: {
      flex: 1,
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      paddingVertical: 0,
    },
    budgetSteppersRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    budgetStepperBtn: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.pill,
      paddingVertical: 7,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    budgetStepperBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
    },
    budgetGuideCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.accentSoft,
      borderRadius: radius.md,
      padding: spacing.sm,
      marginBottom: spacing.md,
    },
    budgetGuideText: {
      fontSize: 11,
      color: colors.text,
      fontWeight: '600',
      flex: 1,
      lineHeight: 15,
    },
    budgetDialogActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    budgetClearBtn: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    budgetClearBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.muted,
    },
    budgetSaveBtn: {
      flex: 1,
      backgroundColor: colors.accent,
      paddingVertical: 12,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    budgetSaveBtnText: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.onAccent,
    },
  });
}
