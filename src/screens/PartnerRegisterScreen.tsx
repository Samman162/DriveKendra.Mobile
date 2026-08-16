import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { submitOwnerRequest } from '../api/owners';
import { HoneypotField } from '../components/honeypot/HoneypotField';
import { Button } from '../components/ui/Button';
import { PickerSheet } from '../components/ui/PickerSheet';
import { Screen } from '../components/ui/Screen';
import { Stepper } from '../components/ui/Stepper';
import { SuccessModal } from '../components/ui/SuccessModal';
import { TextField } from '../components/ui/TextField';
import { UploadCard, type UploadState } from '../components/ui/UploadCard';
import { LIMITS, NEPAL_PHONE_ERROR } from '../constants/validation';
import { VEHICLE_TYPES } from '../constants/vehicles';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { emptyToNull, extractErrorMessage } from '../utils/errors';
import { isValidNepalPhone } from '../utils/phone';

type PartnerErrors = Partial<Record<string, string>>;

const emptyUpload = (): UploadState => ({ uploading: false, progress: 0 });

const emptyForm = {
  full_name: '',
  phone_number: '',
  whatsapp_number: '',
  email: '',
  citizenship_or_id_no: '',
  vehicle_type_id: null as number | null,
  make_model: '',
  license_plate: '',
  seating_capacity: 4,
  manufacture_year: '',
  color: '',
};

export function PartnerRegisterScreen() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<PartnerErrors>({});
  const [citizenship, setCitizenship] = useState<UploadState>(emptyUpload);
  const [bluebook, setBluebook] = useState<UploadState>(emptyUpload);
  const [license, setLicense] = useState<UploadState>(emptyUpload);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validateStep = (currentStep: number): boolean => {
    const next: PartnerErrors = {};
    if (currentStep === 0) {
      if (!form.full_name.trim()) next.full_name = 'This field is required.';
      if (!form.phone_number.trim()) next.phone_number = 'This field is required.';
      else if (!isValidNepalPhone(form.phone_number)) next.phone_number = NEPAL_PHONE_ERROR;
      if (!form.whatsapp_number.trim()) next.whatsapp_number = 'This field is required.';
      else if (!isValidNepalPhone(form.whatsapp_number)) next.whatsapp_number = NEPAL_PHONE_ERROR;
      if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        next.email = 'Please enter a valid email address.';
      }
      if (!form.citizenship_or_id_no.trim()) next.citizenship_or_id_no = 'This field is required.';
    }
    if (currentStep === 1) {
      if (!form.vehicle_type_id) next.vehicle_type_id = 'Select a vehicle category.';
      if (!form.make_model.trim()) next.make_model = 'This field is required.';
      if (!form.license_plate.trim()) next.license_plate = 'This field is required.';
      if (form.manufacture_year.trim()) {
        const year = Number(form.manufacture_year);
        const maxYear = new Date().getFullYear() + 1;
        if (!Number.isInteger(year) || year < 1980 || year > maxYear) {
          next.manufacture_year = 'Enter a valid manufacture year.';
        }
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (validateStep(step)) {
      setStep((current) => Math.min(2, current + 1));
    }
  };

  const onSubmit = async () => {
    setFormError('');
    const personalOk = validateStep(0);
    const vehicleOk = personalOk && validateStep(1);
    if (!personalOk || !vehicleOk || !form.vehicle_type_id) {
      setStep(!personalOk ? 0 : 1);
      return;
    }
    if (citizenship.uploading || bluebook.uploading || license.uploading) {
      setFormError('Please wait for document uploads to finish before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      await submitOwnerRequest({
        full_name: form.full_name.trim(),
        phone_number: form.phone_number.trim(),
        whatsapp_number: form.whatsapp_number.trim(),
        email: emptyToNull(form.email),
        citizenship_or_id_no: form.citizenship_or_id_no.trim(),
        vehicle_type_id: form.vehicle_type_id,
        make_model: form.make_model.trim(),
        license_plate: form.license_plate.trim(),
        seating_capacity: form.seating_capacity,
        manufacture_year: form.manufacture_year.trim() ? Number(form.manufacture_year) : null,
        color: emptyToNull(form.color),
        citizenship_doc_id: citizenship.fileId || null,
        bluebook_doc_id: bluebook.fileId || null,
        license_doc_id: license.fileId || null,
        website_hp: '',
      });
      setForm(emptyForm);
      setCitizenship(emptyUpload());
      setBluebook(emptyUpload());
      setLicense(emptyUpload());
      setStep(0);
      setSuccessVisible(true);
    } catch (error) {
      setFormError(
        extractErrorMessage(error, 'An error occurred while processing your registration request.'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>Join the fleet</Text>
      <Text style={styles.subtitle}>
        Register your vehicle and driver profile for admin review.
      </Text>

      <View style={styles.steps}>
        {['Personal', 'Vehicle', 'Documents'].map((label, index) => (
          <View key={label} style={[styles.step, index === step && styles.stepActive]}>
            <Text style={[styles.stepLabel, index === step && styles.stepLabelActive]}>
              {index + 1}. {label}
            </Text>
          </View>
        ))}
      </View>

      <HoneypotField />

      {step === 0 ? (
        <>
          <TextField
            label="Full name *"
            value={form.full_name}
            onChangeText={(value) => update('full_name', value)}
            error={errors.full_name}
            autoCapitalize="words"
            maxLength={LIMITS.ownerName}
          />
          <TextField
            label="Phone number *"
            value={form.phone_number}
            onChangeText={(value) => update('phone_number', value)}
            onBlur={() => {
              if (!form.whatsapp_number.trim()) {
                update('whatsapp_number', form.phone_number);
              }
            }}
            error={errors.phone_number}
            keyboardType="phone-pad"
          />
          <TextField
            label="WhatsApp number *"
            value={form.whatsapp_number}
            onChangeText={(value) => update('whatsapp_number', value)}
            error={errors.whatsapp_number}
            keyboardType="phone-pad"
          />
          <TextField
            label="Email"
            value={form.email}
            onChangeText={(value) => update('email', value)}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            maxLength={LIMITS.ownerEmail}
          />
          <TextField
            label="Citizenship / ID number *"
            value={form.citizenship_or_id_no}
            onChangeText={(value) => update('citizenship_or_id_no', value)}
            error={errors.citizenship_or_id_no}
            maxLength={LIMITS.citizenshipId}
          />
        </>
      ) : null}

      {step === 1 ? (
        <>
          <PickerSheet
            label="Vehicle category *"
            value={form.vehicle_type_id}
            options={VEHICLE_TYPES}
            onChange={(id) => update('vehicle_type_id', id)}
            error={errors.vehicle_type_id}
          />
          <TextField
            label="Make & model *"
            value={form.make_model}
            onChangeText={(value) => update('make_model', value)}
            error={errors.make_model}
          />
          <TextField
            label="License plate *"
            value={form.license_plate}
            onChangeText={(value) => update('license_plate', value)}
            error={errors.license_plate}
            autoCapitalize="characters"
          />
          <Stepper
            label="Seating capacity *"
            value={form.seating_capacity}
            min={LIMITS.seatingMin}
            max={50}
            onChange={(value) => update('seating_capacity', value)}
          />
          <TextField
            label="Manufacture year"
            value={form.manufacture_year}
            onChangeText={(value) => update('manufacture_year', value.replace(/[^\d]/g, ''))}
            error={errors.manufacture_year}
            keyboardType="number-pad"
            maxLength={4}
          />
          <TextField
            label="Color"
            value={form.color}
            onChangeText={(value) => update('color', value)}
          />
        </>
      ) : null}

      {step === 2 ? (
        <>
          <UploadCard
            title="Citizenship"
            subtitle="JPG, PNG or WEBP up to 50MB"
            state={citizenship}
            onChange={setCitizenship}
          />
          <UploadCard
            title="Bluebook"
            subtitle="Vehicle registration document"
            state={bluebook}
            onChange={setBluebook}
          />
          <UploadCard
            title="Driving license"
            subtitle="Driver license photo"
            state={license}
            onChange={setLicense}
          />
        </>
      ) : null}

      {formError ? <Text style={styles.formError}>{formError}</Text> : null}

      <View style={styles.actions}>
        {step > 0 ? (
          <View style={styles.actionFlex}>
            <Button label="Back" variant="secondary" onPress={() => setStep((current) => current - 1)} />
          </View>
        ) : null}
        <View style={styles.actionFlex}>
          {step < 2 ? (
            <Button label="Continue" onPress={goNext} />
          ) : (
            <Button label="Submit application" onPress={onSubmit} loading={submitting} />
          )}
        </View>
      </View>

      <SuccessModal
        visible={successVisible}
        title="Application received"
        message="Registration submitted successfully. An admin will review your application."
        onClose={() => setSuccessVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.muted,
    marginBottom: spacing.lg,
    fontSize: 14,
  },
  steps: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  step: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  stepActive: {
    borderColor: colors.highlight,
    backgroundColor: colors.elevated,
  },
  stepLabel: {
    color: colors.subtle,
    fontSize: 11,
    fontWeight: '700',
  },
  stepLabelActive: {
    color: colors.highlight,
  },
  formError: {
    color: colors.error,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  actionFlex: {
    flex: 1,
  },
});
