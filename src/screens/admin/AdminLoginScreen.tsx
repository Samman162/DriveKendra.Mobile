import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Eye, EyeOff, Lock, Phone, ShieldCheck, Sparkles, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAdminAuth } from '../../context/AdminAuthContext';
import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import type { ThemeColors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { hapticFeedback } from '../../utils/haptics';

interface AdminLoginScreenProps {
  onChallengeSuccess?: (challengeToken: string) => void;
  onCancel?: () => void;
}

export function AdminLoginScreen({ onChallengeSuccess, onCancel }: AdminLoginScreenProps) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { login, isLoading } = useAdminAuth();

  const [phone, setPhone] = useState<string>('9800000000');
  const [password, setPassword] = useState<string>('admin@123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [phoneFocused, setPhoneFocused] = useState<boolean>(false);
  const [passwordFocused, setPasswordFocused] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleProceed = async () => {
    setErrorMessage(null);
    if (!phone.trim()) {
      hapticFeedback.error();
      setErrorMessage('Please enter admin phone number.');
      return;
    }
    if (!password.trim()) {
      hapticFeedback.error();
      setErrorMessage('Please enter admin password.');
      return;
    }

    hapticFeedback.selection();
    try {
      const result = await login(phone, password);
      hapticFeedback.success();
      if (onChallengeSuccess) {
        onChallengeSuccess(result.challengeToken);
      } else {
        navigation.navigate('AdminPin', { challengeToken: result.challengeToken });
      }
    } catch (err: unknown) {
      hapticFeedback.error();
      const msg = err instanceof Error ? err.message : 'Authentication failed. Please verify credentials.';
      setErrorMessage(msg);
      Alert.alert('Authentication Failed', msg);
    }
  };

  const handleAutofillDemo = () => {
    hapticFeedback.selection();
    setPhone('9800000000');
    setPassword('admin@123');
    setErrorMessage(null);
  };

  const handleClose = () => {
    hapticFeedback.light();
    if (onCancel) {
      onCancel();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <Pressable
            onPress={handleClose}
            style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Close Admin Login"
          >
            <X size={20} color={colors.text} />
          </Pressable>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusBadgeText}>SECURITY GATE</Text>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <ShieldCheck size={38} color={colors.accent} strokeWidth={2.2} />
          </View>
          <Text style={styles.title}>Admin Portal</Text>
          <Text style={styles.subtitle}>
            Drive Kendra Operations & Fleet Dispatch Control. Two-Factor Authentication required.
          </Text>
        </View>

        {/* Interactive Quick-Fill Demo Banner */}
        <Pressable
          onPress={handleAutofillDemo}
          style={({ pressed }) => [styles.demoBanner, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Auto-fill Demo Credentials"
        >
          <View style={styles.demoBannerLeft}>
            <Sparkles size={16} color={colors.accent} style={{ marginRight: 6 }} />
            <Text style={styles.demoBannerTitle}>Demo Operator Profile</Text>
          </View>
          <View style={styles.demoChipsRow}>
            <View style={styles.demoChip}>
              <Text style={styles.demoChipLabel}>Phone:</Text>
              <Text style={styles.demoChipValue}>9800000000</Text>
            </View>
            <View style={styles.demoChip}>
              <Text style={styles.demoChipLabel}>Pass:</Text>
              <Text style={styles.demoChipValue}>admin</Text>
            </View>
          </View>
        </Pressable>

        {/* Form Card */}
        <View style={styles.card}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>1</Text>
            </View>
            <Text style={styles.stepTitle}>Primary Operator Verification</Text>
          </View>

          {/* Phone Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Admin Phone Number</Text>
            <View
              style={[
                styles.inputWrapper,
                phoneFocused && styles.inputWrapperFocused,
              ]}
            >
              <Phone
                size={18}
                color={phoneFocused ? colors.accent : colors.subtle}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                value={phone}
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
                onChangeText={(val) => {
                  setPhone(val);
                  setErrorMessage(null);
                }}
                placeholder="9800000000"
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Admin phone number input"
              />
            </View>
          </View>

          {/* Password Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Security Password</Text>
            <View
              style={[
                styles.inputWrapper,
                passwordFocused && styles.inputWrapperFocused,
              ]}
            >
              <Lock
                size={18}
                color={passwordFocused ? colors.accent : colors.subtle}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                value={password}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                onChangeText={(val) => {
                  setPassword(val);
                  setErrorMessage(null);
                }}
                placeholder="Enter admin password"
                placeholderTextColor={colors.muted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Admin password input"
              />
              <Pressable
                onPress={() => {
                  hapticFeedback.light();
                  setShowPassword((prev) => !prev);
                }}
                style={styles.eyeBtn}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff size={18} color={colors.subtle} />
                ) : (
                  <Eye size={18} color={colors.subtle} />
                )}
              </Pressable>
            </View>
          </View>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Proceed Button */}
          <Pressable
            onPress={handleProceed}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.submitBtn,
              pressed && styles.submitBtnPressed,
              isLoading && styles.submitBtnDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Proceed to 2FA PIN screen"
          >
            {isLoading ? (
              <ActivityIndicator color={colors.onAccent} size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Verify Credentials & Enter PIN</Text>
            )}
          </Pressable>
        </View>

        {/* Security Footer Notice */}
        <View style={styles.footerNote}>
          <Text style={styles.footerText}>
            Protected by PostgreSQL Row-Level Security (RLS) & hardware-backed encrypted storage.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
    },
    closeBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    pressed: {
      opacity: 0.7,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.accentSoft,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.accent,
      marginRight: spacing.xs + 2,
    },
    statusBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.accent,
      letterSpacing: 0.8,
    },
    heroSection: {
      alignItems: 'center',
      marginTop: spacing.md,
      marginBottom: spacing.xl,
    },
    iconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
      borderWidth: 2,
      borderColor: colors.accent,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 4,
    },
    title: {
      ...typography.title,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    subtitle: {
      ...typography.caption,
      color: colors.subtle,
      textAlign: 'center',
      paddingHorizontal: spacing.md,
      lineHeight: 18,
    },
    demoBanner: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.accentSoft,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 2,
    },
    demoBannerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    demoBannerTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.accent,
      letterSpacing: 0.3,
    },
    demoChipsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    demoChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.elevated,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
    },
    demoChipLabel: {
      fontSize: 11,
      color: colors.subtle,
      fontWeight: '600',
    },
    demoChipValue: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.text,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.xl,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    stepHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.lg,
      gap: spacing.sm,
    },
    stepBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepBadgeText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.onAccent,
    },
    stepTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.accent,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    inputGroup: {
      marginBottom: spacing.lg,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.xs,
      letterSpacing: 0.3,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.elevated,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
    },
    inputWrapperFocused: {
      borderColor: colors.accent,
      backgroundColor: colors.surface,
    },
    inputIcon: {
      marginRight: spacing.sm,
    },
    textInput: {
      flex: 1,
      height: 48,
      fontSize: 15,
      fontWeight: '500',
      color: colors.text,
    },
    eyeBtn: {
      padding: spacing.xs,
    },
    errorBox: {
      backgroundColor: colors.errorSoft,
      padding: spacing.md,
      borderRadius: radius.sm,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.error,
    },
    errorText: {
      fontSize: 13,
      color: colors.error,
      fontWeight: '600',
    },
    submitBtn: {
      backgroundColor: colors.accent,
      height: 50,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.xs,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 3,
    },
    submitBtnPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.99 }],
    },
    submitBtnDisabled: {
      opacity: 0.6,
    },
    submitBtnText: {
      color: colors.onAccent,
      fontSize: 15,
      fontWeight: '700',
    },
    footerNote: {
      marginTop: spacing.xl,
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
    },
    footerText: {
      fontSize: 11,
      color: colors.subtle,
      textAlign: 'center',
      lineHeight: 16,
    },
  });
}
