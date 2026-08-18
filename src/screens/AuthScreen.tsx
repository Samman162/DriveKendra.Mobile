import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import {
  ArrowLeft,
  CheckCircle2,
  Car,
  KeyRound,
  Mail,
  Phone,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react-native';

import { Button } from '../components/ui/Button';
import { OtpInput } from '../components/ui/OtpInput';
import { PasswordField } from '../components/ui/PasswordField';
import { Screen } from '../components/ui/Screen';
import { SocialAuthButtons } from '../components/ui/SocialAuthButtons';
import { TextField } from '../components/ui/TextField';
import { useAuth } from '../context/AuthContext';
import { radius, spacing } from '../theme/spacing';
import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeProvider';
import { useThemedStyles } from '../theme/useThemedStyles';
import { extractErrorMessage } from '../utils/errors';

export type AuthMode = 'signin' | 'signup' | 'forgot';

type AuthRouteParams = {
  Auth?: {
    initialMode?: AuthMode;
    redirectTo?: string;
  };
};

export function AuthScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AuthRouteParams, 'Auth'>>();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { signIn, signUp, sendPasswordResetCode, resetPassword } = useAuth();

  // Screen State
  const initialMode = route.params?.initialMode || 'signin';
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1); // 1: Email/Phone, 2: OTP, 3: New Password

  // Form Fields
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Status State
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const clearErrors = () => {
    setErrors({});
    setInfoMessage(null);
  };

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return null;
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { label: 'Weak', color: colors.error, width: '25%' };
    if (score <= 2) return { label: 'Fair', color: colors.highlight, width: '50%' };
    if (score === 3) return { label: 'Good', color: colors.accent, width: '75%' };
    return { label: 'Strong', color: colors.success, width: '100%' };
  };

  const strength = getPasswordStrength(password);

  // Handlers
  const handleSignIn = async () => {
    clearErrors();
    const newErrors: Record<string, string> = {};
    if (!identifier.trim()) {
      newErrors.identifier = 'Please enter your email or mobile number.';
    }
    if (!password) {
      newErrors.password = 'Please enter your password.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      await signIn({ identifier, password });
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch (err) {
      setErrors({ form: extractErrorMessage(err, 'Failed to sign in. Please check your credentials.') });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async () => {
    clearErrors();
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Full name is required.';
    if (!email.trim() || !email.includes('@')) newErrors.email = 'Valid email is required.';
    if (!phone.trim()) newErrors.phone = 'Mobile number is required.';
    if (!password || password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
    if (!agreeTerms) newErrors.terms = 'Please accept terms & conditions to continue.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      await signUp({ name, email, phone, password });
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch (err) {
      setErrors({ form: extractErrorMessage(err, 'Failed to create account. Please try again.') });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendResetCode = async () => {
    clearErrors();
    if (!identifier.trim()) {
      setErrors({ identifier: 'Please enter your registered email or phone.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await sendPasswordResetCode(identifier);
      setInfoMessage(res.message);
      if (res.code) {
        setOtpCode(res.code); // Pre-fill mock demo code for smooth testing
      }
      setForgotStep(2);
    } catch (err) {
      setErrors({ form: extractErrorMessage(err, 'Could not send verification code. Please try again.') });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = () => {
    clearErrors();
    if (otpCode.trim().length < 4) {
      setErrors({ otp: 'Please enter a valid verification code.' });
      return;
    }
    setForgotStep(3);
  };

  const handleResetPassword = async () => {
    clearErrors();
    const newErrors: Record<string, string> = {};
    if (!newPassword || newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters.';
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await resetPassword({
        identifier,
        code: otpCode,
        newPassword,
      });
      Alert.alert('Success', res.message, [
        {
          text: 'Login Now',
          onPress: () => {
            setMode('signin');
            setForgotStep(1);
            setPassword(newPassword);
          },
        },
      ]);
    } catch (err) {
      setErrors({ form: extractErrorMessage(err, 'Failed to reset password. Please try again.') });
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemoFill = (demoEmail: string, demoPass: string) => {
    setIdentifier(demoEmail);
    setPassword(demoPass);
    clearErrors();
  };

  return (
    <Screen padded={false}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Bar with Back Button */}
        <View style={styles.headerBar}>
          {navigation.canGoBack() && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            >
              <ArrowLeft size={22} color={colors.text} />
            </Pressable>
          )}
          <View style={styles.brandTag}>
            <Car size={18} color={colors.accent} style={{ marginRight: 6 }} />
            <Text style={styles.brandTitle}>Drive Kendra</Text>
          </View>
        </View>

        {/* Hero Title Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>
            {mode === 'signin'
              ? 'Welcome Back'
              : mode === 'signup'
              ? 'Create an Account'
              : 'Reset Your Password'}
          </Text>
          <Text style={styles.heroSubtitle}>
            {mode === 'signin'
              ? 'Sign in to access your bookings, saved rates, and exclusive perks.'
              : mode === 'signup'
              ? 'Join Drive Kendra for instant car rentals and Himalayan tour packages.'
              : 'We will help you recover access to your account securely.'}
          </Text>
        </View>

        {/* Mode Switcher Tabs (Sign In / Sign Up) */}
        {mode !== 'forgot' && (
          <View style={styles.tabSwitcher}>
            <Pressable
              onPress={() => {
                setMode('signin');
                clearErrors();
              }}
              style={[styles.tabItem, mode === 'signin' && styles.tabItemActive]}
            >
              <Text style={[styles.tabText, mode === 'signin' && styles.tabTextActive]}>
                Sign In
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setMode('signup');
                clearErrors();
              }}
              style={[styles.tabItem, mode === 'signup' && styles.tabItemActive]}
            >
              <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>
                Create Account
              </Text>
            </Pressable>
          </View>
        )}

        {/* Form Container */}
        <View style={styles.formContainer}>
          {/* General Form Error / Notice */}
          {errors.form && (
            <View style={styles.errorAlert}>
              <Text style={styles.errorAlertText}>{errors.form}</Text>
            </View>
          )}

          {infoMessage && (
            <View style={styles.infoAlert}>
              <CheckCircle2 size={16} color={colors.success} style={{ marginRight: 6 }} />
              <Text style={styles.infoAlertText}>{infoMessage}</Text>
            </View>
          )}

          {/* ================= MODE: SIGN IN ================= */}
          {mode === 'signin' && (
            <View>
              <TextField
                label="Email or Mobile Number"
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="e.g. 9851363783 or name@drivekendra.com"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.identifier}
              />

              <PasswordField
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                error={errors.password}
                onSubmitEditing={handleSignIn}
              />

              <View style={styles.forgotRow}>
                <Pressable
                  onPress={() => {
                    setMode('forgot');
                    setForgotStep(1);
                    clearErrors();
                  }}
                >
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </Pressable>
              </View>

              <Button
                label={submitting ? 'Signing In...' : 'Sign In'}
                onPress={handleSignIn}
                loading={submitting}
                variant="primary"
              />

              <SocialAuthButtons
                onQuickDemoFill={handleQuickDemoFill}
                onGooglePress={() => {
                  setIdentifier('aarav@drivekendra.com');
                  setPassword('password123');
                  Alert.alert('Google Sign In', 'Connected via Google account.');
                }}
                onApplePress={() => {
                  setIdentifier('suman@drivekendra.com');
                  setPassword('password123');
                  Alert.alert('Apple Sign In', 'Connected via Apple ID.');
                }}
              />

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Don't have an account?</Text>
                <Pressable
                  onPress={() => {
                    setMode('signup');
                    clearErrors();
                  }}
                >
                  <Text style={styles.footerLink}> Sign Up</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* ================= MODE: SIGN UP ================= */}
          {mode === 'signup' && (
            <View>
              <TextField
                label="Full Name"
                value={name}
                onChangeText={setName}
                placeholder="e.g. Aarav Sharma"
                autoCapitalize="words"
                error={errors.name}
              />

              <TextField
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="e.g. aarav@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
              />

              <TextField
                label="Mobile Phone Number"
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g. +977 9851363783"
                keyboardType="phone-pad"
                error={errors.phone}
              />

              <PasswordField
                label="Create Password"
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                error={errors.password}
              />

              {strength && (
                <View style={styles.strengthWrap}>
                  <View style={styles.strengthTrack}>
                    <View
                      style={[
                        styles.strengthBar,
                        { backgroundColor: strength.color, width: strength.width as any },
                      ]}
                    />
                  </View>
                  <Text style={[styles.strengthLabel, { color: strength.color }]}>
                    Strength: {strength.label}
                  </Text>
                </View>
              )}

              <PasswordField
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter your password"
                error={errors.confirmPassword}
              />

              {/* Terms Checkbox */}
              <Pressable
                onPress={() => setAgreeTerms((prev) => !prev)}
                style={styles.termsRow}
              >
                <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                  {agreeTerms && <ShieldCheck size={14} color={colors.onAccent} />}
                </View>
                <Text style={styles.termsText}>
                  I agree to Drive Kendra's{' '}
                  <Text style={styles.termsHighlight}>Terms of Service</Text> and{' '}
                  <Text style={styles.termsHighlight}>Privacy Policy</Text>.
                </Text>
              </Pressable>
              {errors.terms ? <Text style={styles.fieldError}>{errors.terms}</Text> : null}

              <View style={{ marginTop: spacing.md }}>
                <Button
                  label={submitting ? 'Creating Account...' : 'Create Account'}
                  onPress={handleSignUp}
                  loading={submitting}
                  variant="primary"
                />
              </View>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Already have an account?</Text>
                <Pressable
                  onPress={() => {
                    setMode('signin');
                    clearErrors();
                  }}
                >
                  <Text style={styles.footerLink}> Sign In</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* ================= MODE: FORGOT PASSWORD ================= */}
          {mode === 'forgot' && (
            <View>
              {/* Stepper indicators */}
              <View style={styles.stepsIndicator}>
                <View style={[styles.stepDot, forgotStep >= 1 && styles.stepDotActive]}>
                  <Text style={styles.stepNum}>1</Text>
                </View>
                <View style={[styles.stepLine, forgotStep >= 2 && styles.stepLineActive]} />
                <View style={[styles.stepDot, forgotStep >= 2 && styles.stepDotActive]}>
                  <Text style={styles.stepNum}>2</Text>
                </View>
                <View style={[styles.stepLine, forgotStep >= 3 && styles.stepLineActive]} />
                <View style={[styles.stepDot, forgotStep >= 3 && styles.stepDotActive]}>
                  <Text style={styles.stepNum}>3</Text>
                </View>
              </View>

              {/* Step 1: Identifier */}
              {forgotStep === 1 && (
                <View>
                  <Text style={styles.stepTitle}>Step 1: Account Identifier</Text>
                  <Text style={styles.stepDesc}>
                    Enter your email address or registered mobile number to receive a verification code.
                  </Text>

                  <TextField
                    label="Email or Mobile"
                    value={identifier}
                    onChangeText={setIdentifier}
                    placeholder="e.g. aarav@drivekendra.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={errors.identifier}
                  />

                  <Button
                    label={submitting ? 'Sending Code...' : 'Send Verification Code'}
                    onPress={handleSendResetCode}
                    loading={submitting}
                    variant="primary"
                  />
                </View>
              )}

              {/* Step 2: OTP Verification */}
              {forgotStep === 2 && (
                <View>
                  <Text style={styles.stepTitle}>Step 2: Enter Verification Code</Text>
                  <Text style={styles.stepDesc}>
                    We've sent a 6-digit code to{' '}
                    <Text style={{ fontWeight: '700', color: colors.text }}>{identifier}</Text>.
                  </Text>

                  <OtpInput
                    length={6}
                    value={otpCode}
                    onChange={setOtpCode}
                    error={!!errors.otp}
                  />
                  {errors.otp ? <Text style={styles.fieldError}>{errors.otp}</Text> : null}

                  <View style={{ marginTop: spacing.md }}>
                    <Button
                      label="Verify Code"
                      onPress={handleVerifyOtp}
                      variant="primary"
                    />
                  </View>

                  <Pressable
                    onPress={handleSendResetCode}
                    style={styles.resendBtn}
                  >
                    <Text style={styles.resendText}>Didn't receive code? Tap to Resend</Text>
                  </Pressable>
                </View>
              )}

              {/* Step 3: New Password */}
              {forgotStep === 3 && (
                <View>
                  <Text style={styles.stepTitle}>Step 3: Create New Password</Text>
                  <Text style={styles.stepDesc}>
                    Please enter your new strong password below.
                  </Text>

                  <PasswordField
                    label="New Password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="At least 6 characters"
                    error={errors.newPassword}
                  />

                  <PasswordField
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Re-type new password"
                    error={errors.confirmPassword}
                  />

                  <Button
                    label={submitting ? 'Resetting Password...' : 'Save & Update Password'}
                    onPress={handleResetPassword}
                    loading={submitting}
                    variant="primary"
                  />
                </View>
              )}

              {/* Return to Sign In */}
              <View style={styles.footerRow}>
                <Pressable
                  onPress={() => {
                    setMode('signin');
                    setForgotStep(1);
                    clearErrors();
                  }}
                  style={styles.backToLoginBtn}
                >
                  <ArrowLeft size={16} color={colors.accent} style={{ marginRight: 6 }} />
                  <Text style={styles.footerLink}>Return to Sign In</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: 40,
    },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    brandTag: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: radius.pill,
      backgroundColor: colors.accentSoft,
    },
    brandTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.accent,
      letterSpacing: 0.5,
    },
    heroCard: {
      marginBottom: spacing.lg,
    },
    heroTitle: {
      fontSize: 26,
      fontWeight: '900',
      color: colors.text,
      marginBottom: 6,
    },
    heroSubtitle: {
      fontSize: 14,
      color: colors.muted,
      lineHeight: 20,
    },
    tabSwitcher: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: 4,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabItem: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
    },
    tabItemActive: {
      backgroundColor: colors.navy,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.muted,
    },
    tabTextActive: {
      color: colors.onNavy,
    },
    formContainer: {
      backgroundColor: colors.surface,
      padding: spacing.lg,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
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
    infoAlert: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.successSoft,
      padding: spacing.md,
      borderRadius: radius.md,
      marginBottom: spacing.md,
    },
    infoAlertText: {
      color: colors.success,
      fontSize: 13,
      fontWeight: '600',
      flex: 1,
    },
    forgotRow: {
      alignItems: 'flex-end',
      marginBottom: spacing.md,
      marginTop: -spacing.xs,
    },
    forgotText: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: '700',
    },
    strengthWrap: {
      marginTop: -spacing.xs,
      marginBottom: spacing.md,
    },
    strengthTrack: {
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      overflow: 'hidden',
      marginBottom: 4,
    },
    strengthBar: {
      height: '100%',
      borderRadius: 2,
    },
    strengthLabel: {
      fontSize: 11,
      fontWeight: '700',
    },
    termsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: spacing.xs,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: colors.subtle,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    checkboxChecked: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    termsText: {
      flex: 1,
      fontSize: 12,
      color: colors.muted,
      lineHeight: 16,
    },
    termsHighlight: {
      color: colors.accent,
      fontWeight: '700',
    },
    fieldError: {
      color: colors.error,
      fontSize: 12,
      marginTop: 4,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.lg,
    },
    footerText: {
      fontSize: 14,
      color: colors.muted,
    },
    footerLink: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.accent,
    },
    backToLoginBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xs,
    },
    stepsIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    stepDot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.elevated,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepDotActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    stepNum: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.onAccent,
    },
    stepLine: {
      width: 40,
      height: 2,
      backgroundColor: colors.border,
      marginHorizontal: 4,
    },
    stepLineActive: {
      backgroundColor: colors.accent,
    },
    stepTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 4,
    },
    stepDesc: {
      fontSize: 13,
      color: colors.muted,
      marginBottom: spacing.md,
      lineHeight: 18,
    },
    resendBtn: {
      alignItems: 'center',
      marginTop: spacing.md,
    },
    resendText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.accent,
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
