import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';

import { submitBooking } from '../api/bookings';
import { HoneypotField } from '../components/honeypot/HoneypotField';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { DateField } from '../components/ui/DateField';
import { PickerSheet } from '../components/ui/PickerSheet';
import { Screen } from '../components/ui/Screen';
import { SectionHeader } from '../components/ui/SectionHeader';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Stepper } from '../components/ui/Stepper';
import { SuccessModal } from '../components/ui/SuccessModal';
import { TextField } from '../components/ui/TextField';
import { CONTACT_INFO } from '../constants/contact';
import { LIMITS, NEPAL_PHONE_ERROR } from '../constants/validation';
import { VEHICLE_TYPES } from '../constants/vehicles';
import type { BookParams, RootTabParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { useThemedStyles } from '../theme/useThemedStyles';
import { spacing } from '../theme/spacing';
import type { TripType } from '../types/api';
import { isSameOrAfterDay, startOfToday, toLocalDateOnly } from '../utils/dates';
import { emptyToNull, extractErrorMessage } from '../utils/errors';
import { isValidNepalPhone, normalizeNepalPhone } from '../utils/phone';

type BookingErrors = Partial<Record<string, string>>;

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
  vehicle_type_id: null as number | null,
  additional_details: '',
};

export function BookingScreen() {
  const styles = useThemedStyles(createStyles);
  const route = useRoute<RouteProp<RootTabParamList, 'Book'>>();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<BookingErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);

  const minReturn = useMemo(() => form.pickup_date ?? startOfToday(), [form.pickup_date]);

  useEffect(() => {
    const params = (route.params ?? {}) as BookParams;
    if (!params.intentId) {
      return;
    }

    setForm((current) => ({
      ...current,
      vehicle_type_id: params.vehicleTypeId ?? null,
      pickup_location: params.pickupLocation ?? '',
      dropoff_location: params.dropoffLocation ?? '',
      trip_type: params.tripType ?? 'One Way',
      additional_details: params.additionalDetails ?? '',
      passenger_count: params.passengerCount ?? 1,
      return_date: params.tripType === 'Round Trip' ? current.return_date : null,
    }));
  }, [route.params?.intentId]);

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: BookingErrors = {};
    if (!form.full_name.trim()) next.full_name = 'This field is required.';
    if (!form.phone_number.trim()) next.phone_number = 'This field is required.';
    else if (!isValidNepalPhone(form.phone_number)) next.phone_number = NEPAL_PHONE_ERROR;
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Please enter a valid email address.';
    }
    if (!form.vehicle_type_id) next.vehicle_type_id = 'Select a vehicle type.';
    if (!form.pickup_location.trim()) next.pickup_location = 'This field is required.';
    if (!form.dropoff_location.trim()) next.dropoff_location = 'This field is required.';
    if (!form.pickup_date) next.pickup_date = 'Pickup date is required.';
    if (form.trip_type === 'Round Trip' && !form.return_date) {
      next.return_date = 'Return date is required for a round trip.';
    }
    if (form.pickup_date && form.return_date && !isSameOrAfterDay(form.return_date, form.pickup_date)) {
      next.return_date = 'Return date must be on or after the pickup date.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async () => {
    setFormError('');
    if (!validate() || !form.pickup_date || !form.vehicle_type_id) {
      return;
    }

    setSubmitting(true);
    try {
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
      setForm(emptyForm);
      setErrors({});
      setSuccessVisible(true);
    } catch (error) {
      setFormError(extractErrorMessage(error, 'Failed to submit booking. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <SectionHeader
            tag="ONLINE RESERVATION"
            title="Book your vehicle & driver"
            subtitle={`${CONTACT_INFO.tagline}. Dispatch confirms by phone or WhatsApp.`}
          />
        </View>
        <ThemeToggle variant="onSurface" />
      </View>

      <HoneypotField />

      <Card style={styles.block}>
        <Text style={styles.blockTitle}>Your details</Text>
        <TextField
          label="Full name *"
          value={form.full_name}
          onChangeText={(value) => update('full_name', value)}
          error={errors.full_name}
          maxLength={LIMITS.bookingName}
          autoCapitalize="words"
        />
        <TextField
          label="Nepal phone number *"
          value={form.phone_number}
          onChangeText={(value) => update('phone_number', value)}
          error={errors.phone_number}
          keyboardType="phone-pad"
          maxLength={LIMITS.phone}
        />
        <TextField
          label="Email"
          value={form.email}
          onChangeText={(value) => update('email', value)}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          maxLength={LIMITS.bookingEmail}
        />
      </Card>

      <Card style={styles.block}>
        <Text style={styles.blockTitle}>Trip details</Text>
        <TextField
          label="Pickup location *"
          value={form.pickup_location}
          onChangeText={(value) => update('pickup_location', value)}
          error={errors.pickup_location}
          maxLength={LIMITS.location}
        />
        <TextField
          label="Dropoff location *"
          value={form.dropoff_location}
          onChangeText={(value) => update('dropoff_location', value)}
          error={errors.dropoff_location}
          maxLength={LIMITS.location}
        />
        <DateField
          label="Pickup date *"
          value={form.pickup_date}
          onChange={(value) => update('pickup_date', value)}
          error={errors.pickup_date}
        />
        <SegmentedControl
          label="Trip type *"
          value={form.trip_type}
          options={[
            { label: 'One Way', value: 'One Way' },
            { label: 'Round Trip', value: 'Round Trip' },
          ]}
          onChange={(value) => {
            setForm((current) => ({
              ...current,
              trip_type: value,
              return_date: value === 'One Way' ? null : current.return_date,
            }));
            setErrors((current) => ({ ...current, trip_type: undefined, return_date: undefined }));
          }}
        />
        {form.trip_type === 'Round Trip' ? (
          <DateField
            label="Return date *"
            value={form.return_date}
            onChange={(value) => update('return_date', value)}
            error={errors.return_date}
            minimumDate={minReturn}
          />
        ) : null}
        <Stepper
          label="Passengers *"
          value={form.passenger_count}
          min={LIMITS.passengersMin}
          max={LIMITS.passengersMax}
          onChange={(value) => update('passenger_count', value)}
        />
      </Card>

      <Card style={styles.block}>
        <Text style={styles.blockTitle}>Vehicle</Text>
        <PickerSheet
          label="Vehicle type *"
          value={form.vehicle_type_id}
          options={VEHICLE_TYPES}
          onChange={(id) => update('vehicle_type_id', id)}
          error={errors.vehicle_type_id}
        />
        <TextField
          label="Additional details"
          value={form.additional_details}
          onChangeText={(value) => update('additional_details', value)}
          multiline
          maxLength={LIMITS.additionalDetails}
        />
      </Card>

      {formError ? <Text style={styles.formError}>{formError}</Text> : null}

      <View style={styles.submit}>
        <Button label="Submit booking" onPress={onSubmit} loading={submitting} />
      </View>

      <SuccessModal
        visible={successVisible}
        title="Booking submitted"
        message="Booking submitted successfully. Our dispatch desk will contact you shortly."
        onClose={() => setSuccessVisible(false)}
      />
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    headerCopy: {
      flex: 1,
    },
    block: {
      marginBottom: spacing.lg,
    },
    blockTitle: {
      color: colors.text,
      fontWeight: '800',
      fontSize: 16,
      marginBottom: spacing.md,
    },
    formError: {
      color: colors.error,
      marginBottom: spacing.md,
    },
    submit: {
      marginTop: spacing.sm,
    },
  });
}
