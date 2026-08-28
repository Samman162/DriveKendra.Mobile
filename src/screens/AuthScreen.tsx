import React, { useState } from 'react';
import {
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
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone as PhoneIcon,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react-native';

import { MapPinBrandBadge, TopAmbientBlobs } from '../components/ui/MapPinBrandBadge';
import { SignupHeroIllustration } from '../components/ui/SignupHeroIllustration';
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
import { hapticFeedback } from '../utils/haptics';
import { isValidNepalPhone } from '../utils/phone';
import { NEPAL_PHONE_ERROR } from '../constants/validation';

export type AuthMode = 'signin' | 'signup' | 'forgot';

type AuthRouteParams = {
  Auth?: {
    initialMode?: AuthMode;
    redirectTo?: string;
  };
};

interface AuthScreenProps {
  navigation?: any;
  route?: RouteProp<AuthRouteParams, 'Auth'>;
}

export function AuthScreen({
  navigation: propNavigation,
  route: propRoute,
}: AuthScreenProps = {}) {
  const hookNav = useNavigation();
  const hookRoute = useRoute<RouteProp<AuthRouteParams, 'Auth'>>();
  const navigation = propNavigation || hookNav;
  const route = propRoute || hookRoute;
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { signIn, signUp, sendPasswordResetCode, resetPassword } = useAuth();

  // Screen State
  const initialMode = route?.params?.initialMode || 'signin';
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1); // 1: Phone/Email, 2: OTP, 3: New Password

  // Form Fields
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      newErrors.identifier = 'Please enter your phone number or email.';
    }
    if (!password) {
      newErrors.password = 'Please enter your password.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      hapticFeedback.light();
      return;
    }

    setSubmitting(true);
    try {
      await signIn({ identifier, password });
      hapticFeedback.success();
      if (navigation.canGoBack?.()) {
        navigation.goBack();
      }
    } catch (err) {
      hapticFeedback.light();
      setErrors({ form: extractErrorMessage(err, 'Failed to sign in. Please check your credentials.') });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async () => {
    clearErrors();
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Please enter your full name.';
    if (!phone.trim()) newErrors.phone = 'Please enter your mobile phone number.';
    else if (!isValidNepalPhone(phone)) newErrors.phone = NEPAL_PHONE_ERROR;
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!password || password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
    if (!agreeTerms) newErrors.terms = 'Please accept terms & conditions to continue.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      hapticFeedback.light();
      return;
    }

    setSubmitting(true);
    try {
      const userEmail = email.trim() || `${phone.replace(/[^0-9]/g, '')}@drivekendra.com`;
      await signUp({ name, email: userEmail, phone, password });
      hapticFeedback.success();
      if (navigation.canGoBack?.()) {
        navigation.goBack();
      }
    } catch (err) {
      hapticFeedback.light();
      setErrors({ form: extractErrorMessage(err, 'Failed to create account. Please try again.') });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendResetCode = async () => {
    clearErrors();
    if (!identifier.trim()) {
      setErrors({ identifier: 'Please enter your registered phone or email.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await sendPasswordResetCode(identifier);
      setInfoMessage(res.message);
      if (res.code) {
        setOtpCode(res.code);
      }
      setForgotStep(2);
      hapticFeedback.success();
    } catch (err) {
      hapticFeedback.light();
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
    hapticFeedback.selection();
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
      hapticFeedback.success();
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
      hapticFeedback.light();
      setErrors({ form: extractErrorMessage(err, 'Failed to reset password. Please try again.') });
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemoFill = (demoEmail: string, demoPass: string) => {
    setIdentifier(demoEmail);
    setPassword(demoPass);
    clearErrors();
    hapticFeedback.light();
  };

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Top-Left Ambient Organic Blobs */}
        <TopAmbientBlobs />

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Top Bar with Back Button */}
          <View style={styles.topBar}>
            {navigation.canGoBack?.() && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                onPress={() => navigation.goBack()}
                style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
                hitSlop={12}
                testID="auth-back-btn"
              >
                <ArrowLeft size={24} color={colors.text} />
              </Pressable>
            )}
          </View>

          {/* ================= HERO SECTION ================= */}
          <View style={styles.heroSection}>
            {mode === 'signin' && (
              <>
                <MapPinBrandBadge size={92} style={{ marginBottom: spacing.sm }} />
                <Text style={styles.brandHeadline}>
                  <Text style={styles.brandOrange}>Travel </Text>
                  <Text style={styles.brandNavy}>Kendra</Text>
                </Text>
                <Text style={styles.welcomeHeading}>Welcome Back!</Text>
                <Text style={styles.welcomeSub}>
                  Welcome to Travel Kendra! Please sign in to continue.
                </Text>
              </>
            )}

            {mode === 'signup' && (
              <>
                <SignupHeroIllustration
                  width={220}
                  height={165}
                  style={{ marginBottom: spacing.xs }}
                />
                <Text style={styles.brandHeadline}>
                  <Text style={styles.brandOrange}>Travel </Text>
                  <Text style={styles.brandNavy}>Kendra</Text>
                </Text>
              </>
            )}

            {mode === 'forgot' && (
              <>
                <MapPinBrandBadge size={80} style={{ marginBottom: spacing.sm }} />
                <Text style={styles.brandHeadline}>
                  <Text style={styles.brandOrange}>Travel </Text>
                  <Text style={styles.brandNavy}>Kendra</Text>
                </Text>
                <Text style={styles.welcomeHeading}>Reset Password</Text>
                <Text style={styles.welcomeSub}>
                  We will help you recover access to your account securely.
                </Text>
              </>
            )}
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* General Form Error Alert */}
            {errors.form && (
              <View style={styles.errorAlert} testID="auth-error-alert">
                <Text style={styles.errorAlertText}>{errors.form}</Text>
              </View>
            )}

            {infoMessage && (
              <View style={styles.infoAlert}>
                <CheckCircle2 size={16} color={colors.success} style={{ marginRight: 6 }} />
                <Text style={styles.infoAlertText}>{infoMessage}</Text>
              </View>
            )}

            {/* ================= MODE: SIGN IN (LOGIN) ================= */}
            {mode === 'signin' && (
              <View>
                {/* Phone Field */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Phone</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      errors.identifier ? styles.inputErrorBorder : null,
                    ]}
                  >
                    <Text style={styles.phonePrefix}>(+977) | </Text>
                    <TextInput
                      value={identifier}
                      onChangeText={(text) => {
                        setIdentifier(text);
                        if (errors.identifier) clearErrors();
                      }}
                      placeholder="Enter Phone Number"
                      placeholderTextColor={colors.subtle}
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                      style={styles.textInputField}
                      testID="auth-phone-input"
                    />
                  </View>
                  {errors.identifier ? (
                    <Text style={styles.fieldError}>{errors.identifier}</Text>
                  ) : null}
                </View>

                {/* Password Field */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      errors.password ? styles.inputErrorBorder : null,
                    ]}
                  >
                    <Lock size={18} color={colors.subtle} style={{ marginRight: 10 }} />
                    <TextInput
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (errors.password) clearErrors();
                      }}
                      placeholder="Enter Your password"
                      placeholderTextColor={colors.subtle}
                      secureTextEntry={!showPassword}
                      style={styles.textInputField}
                      onSubmitEditing={handleSignIn}
                      testID="auth-password-input"
                    />
                    <Pressable
                      onPress={() => setShowPassword(!showPassword)}
                      hitSlop={10}
                      style={({ pressed }) => [styles.eyeBtn, pressed && styles.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                      testID="auth-toggle-password-btn"
                    >
                      {showPassword ? (
                        <EyeOff size={18} color={colors.subtle} />
                      ) : (
                        <Eye size={18} color={colors.subtle} />
                      )}
                    </Pressable>
                  </View>
                  {errors.password ? (
                    <Text style={styles.fieldError}>{errors.password}</Text>
                  ) : null}
                </View>

                {/* Solid Orange Login Button */}
                <Button
                  label={submitting ? 'Logging In...' : 'Login'}
                  onPress={handleSignIn}
                  loading={submitting}
                  variant="primary"
                  style={styles.primaryActionBtn}
                  textStyle={styles.primaryActionBtnText}
                  testID="auth-login-btn"
                />

                {/* Switch to Sign Up */}
                <View style={styles.switchRow}>
                  <Text style={styles.switchBaseText}>Don't Have an account ? </Text>
                  <Pressable
                    onPress={() => {
                      setMode('signup');
                      clearErrors();
                    }}
                    hitSlop={8}
                    testID="auth-goto-signup-btn"
                  >
                    <Text style={styles.switchBoldText}>Sign Up</Text>
                  </Pressable>
                </View>

                {/* OR Divider */}
                <View style={styles.orDividerRow}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>OR</Text>
                  <View style={styles.orLine} />
                </View>

                {/* Forgot Password Link */}
                <View style={styles.forgotRow}>
                  <Pressable
                    onPress={() => {
                      setMode('forgot');
                      setForgotStep(1);
                      clearErrors();
                    }}
                    hitSlop={8}
                    testID="auth-goto-forgot-btn"
                  >
                    <Text style={styles.forgotLink}>
                      Forgot Your <Text style={styles.switchBoldText}>Password ?</Text>
                    </Text>
                  </Pressable>
                </View>

                {/* Quick Demo Fill & Social Login */}
                <SocialAuthButtons
                  onQuickDemoFill={handleQuickDemoFill}
                  onGooglePress={() => {
                    setIdentifier('9851363783');
                    setPassword('password123');
                    Alert.alert('Google Sign In', 'Connected via Google account.');
                  }}
                  onApplePress={() => {
                    setIdentifier('9841234567');
                    setPassword('password123');
                    Alert.alert('Apple Sign In', 'Connected via Apple ID.');
                  }}
                />
              </View>
            )}

            {/* ================= MODE: SIGN UP (REGISTER) ================= */}
            {mode === 'signup' && (
              <View>
                {/* Full Name */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Full Name</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      styles.inputContainerActive,
                      errors.name ? styles.inputErrorBorder : null,
                    ]}
                  >
                    <UserIcon size={18} color={colors.subtle} style={{ marginRight: 10 }} />
                    <TextInput
                      value={name}
                      onChangeText={(text) => {
                        setName(text);
                        if (errors.name) clearErrors();
                      }}
                      placeholder="Full Name"
                      placeholderTextColor={colors.subtle}
                      autoCapitalize="words"
                      style={styles.textInputField}
                      testID="auth-signup-name-input"
                    />
                  </View>
                  {errors.name ? <Text style={styles.fieldError}>{errors.name}</Text> : null}
                </View>

                {/* Phone Number (Added per user request) */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Phone</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      errors.phone ? styles.inputErrorBorder : null,
                    ]}
                  >
                    <Text style={styles.phonePrefix}>(+977) | </Text>
                    <TextInput
                      value={phone}
                      onChangeText={(text) => {
                        setPhone(text);
                        if (errors.phone) clearErrors();
                      }}
                      placeholder="Enter Phone Number"
                      placeholderTextColor={colors.subtle}
                      keyboardType="phone-pad"
                      style={styles.textInputField}
                      testID="auth-signup-phone-input"
                    />
                  </View>
                  {errors.phone ? <Text style={styles.fieldError}>{errors.phone}</Text> : null}
                </View>

                {/* Password */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      errors.password ? styles.inputErrorBorder : null,
                    ]}
                  >
                    <Lock size={18} color={colors.subtle} style={{ marginRight: 10 }} />
                    <TextInput
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (errors.password) clearErrors();
                      }}
                      placeholder="Password"
                      placeholderTextColor={colors.subtle}
                      secureTextEntry={!showPassword}
                      style={styles.textInputField}
                      testID="auth-signup-password-input"
                    />
                    <Pressable
                      onPress={() => setShowPassword(!showPassword)}
                      hitSlop={10}
                      style={({ pressed }) => [styles.eyeBtn, pressed && styles.pressed]}
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
                  {errors.password ? (
                    <Text style={styles.fieldError}>{errors.password}</Text>
                  ) : null}
                </View>

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

                {/* Confirm Password */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Confirm Password</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      errors.confirmPassword ? styles.inputErrorBorder : null,
                    ]}
                  >
                    <Lock size={18} color={colors.subtle} style={{ marginRight: 10 }} />
                    <TextInput
                      value={confirmPassword}
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                        if (errors.confirmPassword) clearErrors();
                      }}
                      placeholder="Confirm Password"
                      placeholderTextColor={colors.subtle}
                      secureTextEntry={!showConfirmPassword}
                      style={styles.textInputField}
                      testID="auth-signup-confirm-password-input"
                    />
                    <Pressable
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      hitSlop={10}
                      style={({ pressed }) => [styles.eyeBtn, pressed && styles.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} color={colors.subtle} />
                      ) : (
                        <Eye size={18} color={colors.subtle} />
                      )}
                    </Pressable>
                  </View>
                  {errors.confirmPassword ? (
                    <Text style={styles.fieldError}>{errors.confirmPassword}</Text>
                  ) : null}
                </View>

                {/* Terms Checkbox */}
                <Pressable
                  onPress={() => setAgreeTerms(!agreeTerms)}
                  style={styles.termsBoxRow}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: agreeTerms }}
                  testID="auth-terms-checkbox"
                >
                  <View style={[styles.squareCheckbox, agreeTerms && styles.squareCheckboxChecked]}>
                    {agreeTerms && <CheckCircle2 size={15} color={colors.accent} />}
                  </View>
                  <Text style={styles.termsAgreementText}>
                    By ticking, you are confirming that you have read, understood and agree to our{' '}
                    <Text style={styles.termsUnderlineText}>terms & conditions</Text>
                  </Text>
                </Pressable>
                {errors.terms && <Text style={styles.fieldError}>{errors.terms}</Text>}

                {/* Register Button */}
                <Button
                  label={submitting ? 'Registering...' : 'Register'}
                  onPress={handleSignUp}
                  loading={submitting}
                  variant="primary"
                  style={styles.primaryActionBtn}
                  textStyle={styles.primaryActionBtnText}
                  testID="auth-register-btn"
                />

                {/* Switch to Sign In */}
                <View style={styles.switchRow}>
                  <Text style={styles.switchBaseText}>Already have an account ? </Text>
                  <Pressable
                    onPress={() => {
                      setMode('signin');
                      clearErrors();
                    }}
                    hitSlop={8}
                    testID="auth-goto-signin-btn"
                  >
                    <Text style={styles.switchBoldText}>Login</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* ================= MODE: FORGOT PASSWORD ================= */}
            {mode === 'forgot' && (
              <View>
                {/* Step Indicators */}
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

                {forgotStep === 1 && (
                  <View>
                    <Text style={styles.stepTitle}>Find Your Account</Text>
                    <Text style={styles.stepDesc}>
                      Enter your mobile number or email address and we'll send a 6-digit recovery code.
                    </Text>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Phone or Email</Text>
                      <View
                        style={[
                          styles.inputContainer,
                          errors.identifier ? styles.inputErrorBorder : null,
                        ]}
                      >
                        <Text style={styles.phonePrefix}>(+977) | </Text>
                        <TextInput
                          value={identifier}
                          onChangeText={setIdentifier}
                          placeholder="Enter Phone Number"
                          placeholderTextColor={colors.subtle}
                          keyboardType="phone-pad"
                          style={styles.textInputField}
                        />
                      </View>
                      {errors.identifier ? (
                        <Text style={styles.fieldError}>{errors.identifier}</Text>
                      ) : null}
                    </View>

                    <Button
                      label={submitting ? 'Sending Code...' : 'Send Recovery Code'}
                      onPress={handleSendResetCode}
                      loading={submitting}
                      variant="primary"
                      style={styles.primaryActionBtn}
                      textStyle={styles.primaryActionBtnText}
                    />
                  </View>
                )}

                {forgotStep === 2 && (
                  <View>
                    <Text style={styles.stepTitle}>Enter Verification Code</Text>
                    <Text style={styles.stepDesc}>
                      We sent a 6-digit code to {identifier}. Enter it below to verify.
                    </Text>

                    <OtpInput
                      value={otpCode}
                      onChange={setOtpCode}
                      length={6}
                      error={Boolean(errors.otp)}
                    />

                    <Button
                      label="Verify Code"
                      onPress={handleVerifyOtp}
                      variant="primary"
                      style={[styles.primaryActionBtn, { marginTop: spacing.lg }]}
                      textStyle={styles.primaryActionBtnText}
                    />

                    <Pressable
                      onPress={handleSendResetCode}
                      style={styles.resendBtn}
                      hitSlop={8}
                    >
                      <Text style={styles.resendText}>Didn't receive code? Resend</Text>
                    </Pressable>
                  </View>
                )}

                {forgotStep === 3 && (
                  <View>
                    <Text style={styles.stepTitle}>Set New Password</Text>
                    <Text style={styles.stepDesc}>
                      Create a strong, new password for your Drive Kendra account.
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
                      placeholder="Re-enter new password"
                      error={errors.confirmPassword}
                    />

                    <Button
                      label={submitting ? 'Updating Password...' : 'Save New Password'}
                      onPress={handleResetPassword}
                      loading={submitting}
                      variant="primary"
                      style={[styles.primaryActionBtn, { marginTop: spacing.md }]}
                      textStyle={styles.primaryActionBtnText}
                    />
                  </View>
                )}

                {/* Back to Sign In Link */}
                <View style={[styles.switchRow, { marginTop: spacing.xl }]}>
                  <Pressable
                    onPress={() => {
                      setMode('signin');
                      setForgotStep(1);
                      clearErrors();
                    }}
                    hitSlop={8}
                  >
                    <Text style={styles.switchBoldText}>← Back to Login</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xxl,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingVertical: spacing.sm,
      zIndex: 10,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroSection: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.xs,
      marginBottom: spacing.md,
      zIndex: 5,
    },
    brandHeadline: {
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: -0.4,
      marginBottom: spacing.xs,
    },
    brandOrange: {
      color: theme.accent,
    },
    brandNavy: {
      color: theme.text,
    },
    welcomeHeading: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.text,
      marginTop: spacing.xs,
      marginBottom: 4,
      alignSelf: 'flex-start',
    },
    welcomeSub: {
      fontSize: 13,
      lineHeight: 19,
      color: theme.subtle,
      alignSelf: 'flex-start',
      marginBottom: spacing.sm,
    },
    formContainer: {
      zIndex: 10,
    },
    fieldGroup: {
      marginBottom: spacing.md,
    },
    fieldLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 6,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderWidth: 1.5,
      borderColor: theme.border,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      height: 50,
    },
    inputContainerActive: {
      borderColor: theme.accent,
    },
    phonePrefix: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.subtle,
    },
    textInputField: {
      flex: 1,
      fontSize: 15,
      color: theme.text,
      paddingVertical: 0,
    },
    eyeBtn: {
      padding: 4,
    },
    inputErrorBorder: {
      borderColor: theme.error,
    },
    fieldError: {
      fontSize: 12,
      color: theme.error,
      marginTop: 4,
      fontWeight: '500',
    },
    primaryActionBtn: {
      backgroundColor: theme.accent,
      height: 52,
      borderRadius: 12,
      marginTop: spacing.sm,
      shadowColor: theme.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 5,
    },
    primaryActionBtnText: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.onAccent,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.lg,
    },
    switchBaseText: {
      fontSize: 14,
      color: theme.subtle,
    },
    switchBoldText: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.text,
    },
    orDividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: spacing.lg,
      paddingHorizontal: spacing.md,
    },
    orLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.border,
    },
    orText: {
      marginHorizontal: spacing.md,
      fontSize: 12,
      fontWeight: '800',
      color: theme.accent,
      letterSpacing: 1,
    },
    forgotRow: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    forgotLink: {
      fontSize: 14,
      color: theme.subtle,
    },
    errorAlert: {
      backgroundColor: theme.errorSoft,
      borderLeftWidth: 4,
      borderLeftColor: theme.error,
      padding: spacing.md,
      borderRadius: radius.md,
      marginBottom: spacing.md,
    },
    errorAlertText: {
      fontSize: 13,
      color: theme.error,
      fontWeight: '600',
    },
    infoAlert: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.successSoft,
      borderLeftWidth: 4,
      borderLeftColor: theme.success,
      padding: spacing.md,
      borderRadius: radius.md,
      marginBottom: spacing.md,
    },
    infoAlertText: {
      fontSize: 13,
      color: theme.success,
      fontWeight: '600',
      flex: 1,
    },
    termsBoxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: spacing.sm,
    },
    squareCheckbox: {
      width: 22,
      height: 22,
      borderRadius: 5,
      borderWidth: 1.8,
      borderColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
      backgroundColor: theme.surface,
    },
    squareCheckboxChecked: {
      borderColor: theme.accent,
    },
    termsAgreementText: {
      flex: 1,
      fontSize: 12,
      color: theme.subtle,
      lineHeight: 17,
    },
    termsUnderlineText: {
      color: theme.text,
      textDecorationLine: 'underline',
      fontWeight: '600',
    },
    strengthWrap: {
      marginBottom: spacing.md,
    },
    strengthTrack: {
      height: 4,
      backgroundColor: theme.border,
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
      backgroundColor: theme.surface,
      borderWidth: 1.5,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepDotActive: {
      backgroundColor: theme.accent,
      borderColor: theme.accent,
    },
    stepNum: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.onAccent,
    },
    stepLine: {
      width: 40,
      height: 2,
      backgroundColor: theme.border,
      marginHorizontal: 4,
    },
    stepLineActive: {
      backgroundColor: theme.accent,
    },
    stepTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 4,
    },
    stepDesc: {
      fontSize: 13,
      color: theme.subtle,
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
      color: theme.accent,
    },
    pressed: {
      opacity: 0.65,
    },
  });
