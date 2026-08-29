import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { CheckCircle2, Phone, ShieldAlert, ShieldCheck } from 'lucide-react-native';

import { Button } from './Button';
import { SlideDrawerModal } from './SlideDrawerModal';
import { TextField } from './TextField';
import { radius, spacing } from '../../theme/spacing';
import type { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { hapticFeedback } from '../../utils/haptics';

type Props = {
  visible: boolean;
  onClose: () => void;
  currentPhone: string;
  onSuccess: (newPhone: string) => void;
};

export function PhoneUpdateModal({ visible, onClose, currentPhone, onSuccess }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [newPhone, setNewPhone] = useState('');
  const [reason, setReason] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const validateNepalPhone = (phone: string): boolean => {
    const cleaned = phone.replace(/[\s\-()]/g, '');
    const mobileRegex = /^(\+?977)?[9][78]\d{8}$/;
    const landlineRegex = /^(\+?977)?[0-9]\d{7,8}$/;
    return mobileRegex.test(cleaned) || landlineRegex.test(cleaned);
  };

  const handleSubmit = async () => {
    if (honeypot.trim()) {
      // Honeypot triggered
      onClose();
      return;
    }

    const trimmed = newPhone.trim();
    if (!trimmed) {
      setErrorMessage('Please enter your new phone number.');
      hapticFeedback.error();
      return;
    }

    if (!validateNepalPhone(trimmed)) {
      setErrorMessage('Please enter a valid Nepal phone number (e.g. 9819923926 or +9779819923926).');
      hapticFeedback.error();
      return;
    }

    if (trimmed === currentPhone.replace(/\s+/g, '')) {
      setErrorMessage('New phone number must be different from current number.');
      hapticFeedback.error();
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    hapticFeedback.selection();

    try {
      // Simulate verification/SMS request dispatch
      await new Promise((resolve) => setTimeout(resolve, 800));

      const formatted = trimmed.startsWith('+977')
        ? trimmed
        : trimmed.startsWith('977')
        ? `+${trimmed}`
        : `+977 ${trimmed}`;

      hapticFeedback.success();
      Alert.alert(
        'Update Request Submitted',
        `An SMS verification code has been dispatched to ${formatted}. Your profile contact will be updated upon verification.`,
        [
          {
            text: 'Understood',
            onPress: () => {
              onSuccess(formatted);
              onClose();
              setNewPhone('');
              setReason('');
            },
          },
        ],
      );
    } catch {
      setErrorMessage('Failed to submit phone update request. Please try again.');
      hapticFeedback.error();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SlideDrawerModal visible={visible} onClose={onClose} title="Update Phone Number">
      <View style={styles.container}>
        {/* Security Advisory Card */}
        <View style={styles.advisoryCard}>
          <ShieldAlert size={20} color={colors.accent} style={styles.advisoryIcon} />
          <View style={styles.advisoryContent}>
            <Text style={styles.advisoryTitle}>Nepal Telecom Verified Contact</Text>
            <Text style={styles.advisoryText}>
              Phone numbers are tied to your vehicle dispatch, Himalayan SOS emergency beacons, and offline trip vouchers.
            </Text>
          </View>
        </View>

        {/* Current Phone Box */}
        <View style={styles.currentPhoneBox}>
          <Text style={styles.fieldLabel}>Current Registered Number</Text>
          <View style={styles.currentPhoneRow}>
            <Phone size={16} color={colors.subtle} />
            <Text style={styles.currentPhoneValue}>{currentPhone || 'Not set'}</Text>
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={12} color={colors.success} />
              <Text style={styles.verifiedText}>Active</Text>
            </View>
          </View>
        </View>

        {/* New Phone Input */}
        <View style={styles.inputSection}>
          <TextField
            label="New Phone Number"
            placeholder="e.g. 9819923926"
            value={newPhone}
            onChangeText={(text) => {
              setNewPhone(text);
              if (errorMessage) setErrorMessage('');
            }}
            keyboardType="phone-pad"
            autoCapitalize="none"
            error={errorMessage}
          />
        </View>

        {/* Reason for Update */}
        <View style={styles.inputSection}>
          <TextField
            label="Reason for Update (Optional)"
            placeholder="e.g. Changed SIM card or new travel line"
            value={reason}
            onChangeText={setReason}
            autoCapitalize="sentences"
          />
        </View>

        {/* Honeypot hidden input for security */}
        <View style={styles.honeypot}>
          <TextInput
            value={honeypot}
            onChangeText={setHoneypot}
            tabIndex={-1}
            autoComplete="off"
          />
        </View>

        {/* Action Button */}
        <View style={styles.btnRow}>
          <Button
            label={isSubmitting ? 'Submitting Request...' : 'Request Phone Update'}
            onPress={handleSubmit}
            variant="primary"
            disabled={isSubmitting}
            icon={<CheckCircle2 size={18} color={colors.onAccent} />}
          />
        </View>
      </View>
    </SlideDrawerModal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      paddingTop: spacing.xs,
    },
    advisoryCard: {
      flexDirection: 'row',
      backgroundColor: colors.accentSoft,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      alignItems: 'flex-start',
    },
    advisoryIcon: {
      marginRight: spacing.sm,
      marginTop: 2,
    },
    advisoryContent: {
      flex: 1,
    },
    advisoryTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 2,
    },
    advisoryText: {
      fontSize: 12,
      color: colors.muted,
      lineHeight: 16,
    },
    currentPhoneBox: {
      backgroundColor: colors.elevated,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.md,
    },
    fieldLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.xs,
    },
    currentPhoneRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    currentPhoneValue: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.text,
      flex: 1,
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colors.successSoft,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: radius.pill,
    },
    verifiedText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.success,
    },
    inputSection: {
      marginBottom: spacing.sm,
    },
    honeypot: {
      position: 'absolute',
      opacity: 0,
      height: 0,
      width: 0,
    },
    btnRow: {
      marginTop: spacing.md,
      marginBottom: spacing.xs,
    },
  });
}
