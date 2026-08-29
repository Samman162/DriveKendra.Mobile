import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
  Info,
  MapPin,
  Minus,
  Navigation as NavigationIcon,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
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
import { normalizeNepalPhone } from '../utils/phone';

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
    driverName: string;
    driverPhone: string;
    driverRating: number;
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
  const { colors, isDark } = useTheme();
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
    if (selectedTripMode === 'Return' && !form.return_date) {
      next.return_date = 'Return date is required for return trips.';
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
      const dateStr = toLocalDateOnly(form.pickup_date) ?? '';
      const fullPickupDate = form.pickup_time ? `${dateStr} ${form.pickup_time}` : dateStr;
      const numericUserId = isAuthenticated && user?.id && !isNaN(Number(user.id)) ? Number(user.id) : undefined;
      const passengerName = (user?.name || form.full_name || 'Passenger').trim();
      const passengerPhone = normalizeNepalPhone(user?.phone || form.phone_number || '9841234567');
      const passengerEmail = emptyToNull(user?.email || form.email);

      const combinedDetails = [
        budget.trim() ? `[Target Budget: ${budget.trim()}]` : null,
        form.additional_details?.trim() || null,
      ]
        .filter(Boolean)
        .join(' | ');

      await submitBooking({
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
      const newBookingRecord = {
        id: `trip_${Date.now()}`,
        bookingRef: `DK-2026-${randomRefNum}`,
        pickup: form.pickup_location.trim(),
        dropoff: form.dropoff_location.trim(),
        date: dateStr || 'Tomorrow',
        time: form.pickup_time || '7:00 AM',
        tripType: form.trip_type as 'One Way' | 'Return' | 'Round Trip',
        vehicleName: `${vehicleName} (AC)`,
        vehiclePlate: `Ba ${Math.floor(1 + Math.random() * 5)} Cha ${randomRefNum}`,
        driverName: 'Suman Shrestha (Kathmandu Dispatch)',
        driverPhone: CONTACT_INFO.phoneRaw,
        driverRating: 4.9,
        fare: budget.trim() ? budget.trim() : 'NPR 12,000',
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

  const selectedVehicleObj = VEHICLE_TYPES.find((v) => v.id === form.vehicle_type_id);
  const selectedVehicleLabel = selectedVehicleObj ? selectedVehicleObj.name : 'Preferred Vehicle Type';

  return (
    <Screen scroll={false} padded={false}>
      {/* MINIMAL TOP NAV BAR */}
      <View style={styles.topNavRow}>
        <Pressable
          onPress={handleDismiss}
          style={styles.backArrowBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowLeft size={20} color={colors.text} />
        </Pressable>
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

        {/* MAIN SLEEK FORM CARD (CENTERED) */}
        <View style={styles.mainFormCard}>
          {/* TRIP TYPE RADIO PILLS */}
          <View style={styles.tripRadioRow}>
            {(['One Way', 'Return'] as const).map((modeOption) => {
              const isSelected = selectedTripMode === modeOption;
              return (
                <Pressable
                  key={modeOption}
                  onPress={() => handleTripModeChange(modeOption)}
                  style={styles.radioOption}
                >
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                  <Text style={[styles.radioLabel, isSelected && styles.radioLabelActive]}>
                    {modeOption}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* PICKUP & DESTINATION CONNECTED TRACK */}
          <View style={styles.routeContainer}>
            {/* Left Track Graphic */}
            <View style={styles.routeTrackCol}>
              <View style={styles.pickupCircleRing} />
              <View style={styles.dottedLine}>
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
              </View>
              <MapPin size={18} color="#EF4444" style={styles.destPinIcon} />
            </View>

            {/* Right Input Fields */}
            <View style={styles.routeInputsCol}>
              {/* Pickup Row */}
              <Pressable
                onPress={() => openLocationPicker('pickup')}
                style={styles.formRowInput}
                accessibilityRole="button"
                accessibilityLabel="Select Pickup Location"
              >
                <Text style={styles.fieldSubLabel}>Pickup Location</Text>
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

              <View style={styles.rowDivider} />

              {/* Destination Row */}
              <Pressable
                onPress={() => openLocationPicker('dropoff')}
                style={styles.formRowInput}
                accessibilityRole="button"
                accessibilityLabel="Select Destination Location"
              >
                <Text style={styles.fieldSubLabel}>Destination Location</Text>
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
            <Pressable onPress={swapLocations} style={styles.swapBtn} accessibilityLabel="Swap Route">
              <ArrowUpDown size={14} color={colors.accent} />
            </Pressable>
          </View>

          <View style={styles.rowDivider} />

          {/* PICKUP DATE & TIME ROW */}
          <Pressable
            onPress={() => {
              hapticFeedback.selection();
              setDateModalMode('pickup');
              setDateTimeModalVisible(true);
            }}
            style={styles.linearFormRow}
            accessibilityRole="button"
            accessibilityLabel="Select Pickup Date and Time"
          >
            <Calendar size={18} color={colors.muted} style={styles.rowLeftIcon} />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.linearRowValue,
                  !form.pickup_date && styles.fieldPlaceholder,
                ]}
                numberOfLines={1}
              >
                {form.pickup_date
                  ? `${toLocalDateOnly(form.pickup_date)}${form.pickup_time ? ' • ' + form.pickup_time : ''}`
                  : 'Select Pickup Date'}
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
                style={styles.linearFormRow}
                accessibilityRole="button"
                accessibilityLabel="Select Return Date"
              >
                <Calendar size={18} color={colors.accent} style={styles.rowLeftIcon} />
                <View style={{ flex: 1 }}>
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
            <Users size={18} color={colors.muted} style={styles.rowLeftIcon} />
            <Text style={styles.linearRowValue}>
              {form.passenger_count} {form.passenger_count === 1 ? 'Passenger' : 'Passengers'}
            </Text>
            <View style={styles.inlineStepper}>
              <Pressable
                onPress={() => {
                  hapticFeedback.light();
                  if (form.passenger_count > 1) {
                    update('passenger_count', form.passenger_count - 1);
                  }
                }}
                style={styles.stepperBtn}
              >
                <Minus size={14} color={colors.text} />
              </Pressable>
              <Text style={styles.stepperNum}>{form.passenger_count}</Text>
              <Pressable
                onPress={() => {
                  hapticFeedback.light();
                  if (form.passenger_count < 35) {
                    update('passenger_count', form.passenger_count + 1);
                  }
                }}
                style={styles.stepperBtn}
              >
                <Plus size={14} color={colors.text} />
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
            style={styles.linearFormRow}
            accessibilityRole="button"
            accessibilityLabel="Preferred Vehicle Type"
          >
            <Car size={18} color={colors.muted} style={styles.rowLeftIcon} />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.linearRowValue,
                  !selectedVehicleObj && styles.fieldPlaceholder,
                ]}
                numberOfLines={1}
              >
                {selectedVehicleLabel}
              </Text>
            </View>
            <ChevronRight size={16} color={colors.subtle} />
          </Pressable>
          {errors.vehicle_type_id ? (
            <Text style={styles.rowErrorText}>{errors.vehicle_type_id}</Text>
          ) : null}

          <View style={styles.rowDivider} />

          {/* ADDITIONAL DETAILS (OPTIONAL) ROW */}
          <View style={styles.linearFormRow}>
            <FileText size={18} color={colors.muted} style={styles.rowLeftIcon} />
            <TextInput
              value={form.additional_details}
              onChangeText={(val) => update('additional_details', val)}
              placeholder="Additional Details (Optional)"
              placeholderTextColor={colors.subtle}
              style={styles.inlineTextInput}
              maxLength={LIMITS.additionalDetails}
            />
          </View>

          <View style={styles.rowDivider} />

          {/* YOUR BUDGET (OPTIONAL) ROW */}
          <Pressable
            onPress={() => {
              hapticFeedback.selection();
              setTempBudget(budget);
              setBudgetModalVisible(true);
            }}
            style={styles.linearFormRow}
            accessibilityRole="button"
            accessibilityLabel="Enter Your Budget"
          >
            <CreditCard size={18} color={colors.muted} style={styles.rowLeftIcon} />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.linearRowValue,
                  !budget && styles.fieldPlaceholder,
                ]}
                numberOfLines={1}
              >
                {budget ? `Your Budget: ${budget}` : 'Your Budget (Optional)'}
              </Text>
            </View>
            <ChevronRight size={16} color={colors.subtle} />
          </Pressable>

          {/* GET OFFER / SUBMIT BUTTON */}
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
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.getOfferBtnText}>Submit Booking</Text>
              )}
            </Pressable>
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
                    {isSelected && <Check size={14} color="#FFFFFF" />}
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
            Includes dedicated driver, fuel, highway tolls & passenger insurance.
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
        message="Thank you! Our Kathmandu 24/7 dispatch desk will call or WhatsApp you within 15 minutes to confirm driver and vehicle details."
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
      paddingBottom: spacing.xs,
    },
    backArrowBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
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
      paddingHorizontal: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
    tripRadioRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: spacing.xl,
      paddingBottom: spacing.sm + 4,
      marginBottom: 4,
    },
    radioOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    radioCircle: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: colors.subtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioCircleActive: {
      borderColor: colors.accent,
    },
    radioDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.accent,
    },
    radioLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.muted,
    },
    radioLabelActive: {
      color: colors.text,
      fontWeight: '700',
    },
    routeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.xs,
    },
    routeTrackCol: {
      width: 24,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    pickupCircleRing: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 3,
      borderColor: '#3B82F6',
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
      marginTop: 2,
    },
    routeInputsCol: {
      flex: 1,
      paddingLeft: spacing.xs,
    },
    formRowInput: {
      paddingVertical: 6,
    },
    fieldSubLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.subtle,
      marginBottom: 1,
    },
    fieldMainValue: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    fieldPlaceholder: {
      color: colors.subtle,
      fontWeight: '500',
    },
    swapBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.elevated,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: spacing.xs,
    },
    rowDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.xs + 2,
    },
    linearFormRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    rowLeftIcon: {
      marginRight: 12,
    },
    linearRowValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    inlineStepper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.elevated,
      borderRadius: radius.pill,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderWidth: 1,
      borderColor: colors.border,
    },
    stepperBtn: {
      padding: 3,
    },
    stepperNum: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.text,
    },
    inlineTextInput: {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
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
      marginTop: spacing.lg,
      alignItems: 'center',
    },
    getOfferBtn: {
      backgroundColor: colors.accent,
      borderRadius: radius.pill,
      paddingVertical: 14,
      paddingHorizontal: 48,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 180,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 6,
    },
    getOfferBtnPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    },
    getOfferBtnText: {
      fontSize: 16,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    errorAlert: {
      backgroundColor: colors.errorSoft,
      padding: spacing.sm,
      borderRadius: radius.md,
      marginBottom: spacing.md,
    },
    errorAlertText: {
      fontSize: 13,
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
      color: '#FFFFFF',
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
      color: '#FFFFFF',
    },
    dialogDoneBtn: {
      backgroundColor: colors.accent,
      borderRadius: radius.pill,
      paddingVertical: 14,
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
      color: '#FFFFFF',
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
      height: 52,
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
      color: '#FFFFFF',
    },
  });
}
