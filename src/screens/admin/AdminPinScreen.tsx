import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Delete, KeyRound, Lock, ShieldAlert, Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAdminAuth } from '../../context/AdminAuthContext';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import type { ThemeColors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { hapticFeedback } from '../../utils/haptics';

interface AdminPinScreenProps {
  challengeToken?: string;
  onSuccess?: () => void;
  onBack?: () => void;
  onMaxAttemptsExceeded?: () => void;
}

const KEYPAD_ROWS = [
  [
    { digit: '1', letters: '' },
    { digit: '2', letters: 'ABC' },
    { digit: '3', letters: 'DEF' },
  ],
  [
    { digit: '4', letters: 'GHI' },
    { digit: '5', letters: 'JKL' },
    { digit: '6', letters: 'MNO' },
  ],
  [
    { digit: '7', letters: 'PQRS' },
    { digit: '8', letters: 'TUV' },
    { digit: '9', letters: 'WXYZ' },
  ],
];

export function AdminPinScreen({ onSuccess, onBack, onMaxAttemptsExceeded }: AdminPinScreenProps) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { verifyPin, isLoading, logout } = useAdminAuth();
  const authCtx = useContext(AuthContext);

  const [pin, setPin] = useState<string>('');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const MAX_PIN_ATTEMPTS = 3;

  // Shake animation for incorrect PIN
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  // Auto-submit when 4th digit is entered
  useEffect(() => {
    if (pin.length === 4 && !isVerifying) {
      handleVerify(pin);
    }
  }, [pin]);

  const handleVerify = async (pinCode: string) => {
    setIsVerifying(true);
    setErrorText(null);

    try {
      await verifyPin(pinCode);
      hapticFeedback.success();
      setFailedAttempts(0);
      if (onSuccess) {
        onSuccess();
      } else {
        const state = navigation.getState ? navigation.getState() : null;
        if (state?.routeNames?.includes('AdminDashboard')) {
          navigation.replace('AdminDashboard');
        }
      }
    } catch (err: unknown) {
      hapticFeedback.error();
      triggerShake();
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      setPin(''); // Reset PIN on error

      if (nextAttempts >= MAX_PIN_ATTEMPTS) {
        setErrorText('Maximum PIN attempts exceeded. Returning to login screen...');
        try {
          await logout();
        } catch {
          // safely continue
        }
        if (authCtx?.signOut) {
          try {
            await authCtx.signOut();
          } catch {
            // safely continue
          }
        }
        Alert.alert(
          'Authentication Locked',
          'Incorrect Security PIN entered 3 times. Returning to the login screen.',
          [
            {
              text: 'OK',
              onPress: () => {
                if (onMaxAttemptsExceeded) {
                  onMaxAttemptsExceeded();
                } else if (onBack) {
                  onBack();
                } else if (navigation.canGoBack()) {
                  navigation.goBack();
                }
              },
            },
          ],
          { cancelable: false },
        );

        if (onMaxAttemptsExceeded) {
          onMaxAttemptsExceeded();
        } else if (onBack) {
          onBack();
        } else if (navigation.canGoBack()) {
          navigation.goBack();
        }
      } else {
        const remaining = MAX_PIN_ATTEMPTS - nextAttempts;
        const attemptsMsg = remaining === 1 ? '1 attempt remaining' : `${remaining} attempts remaining`;
        setErrorText(`Incorrect Security PIN. ${attemptsMsg}.`);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyPress = (val: string) => {
    if (isVerifying || isLoading) return;
    if (pin.length < 4) {
      hapticFeedback.selection();
      setErrorText(null);
      setPin((prev) => prev + val);
    }
  };

  const handleDelete = () => {
    if (isVerifying || isLoading) return;
    if (pin.length > 0) {
      hapticFeedback.light();
      setErrorText(null);
      setPin((prev) => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (isVerifying || isLoading) return;
    hapticFeedback.light();
    setErrorText(null);
    setPin('');
  };

  const handleQuickFillPin = () => {
    if (isVerifying || isLoading) return;
    hapticFeedback.selection();
    setErrorText(null);
    setPin('6767');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <View style={styles.secureHeaderPill}>
          <Lock size={12} color={colors.accent} style={{ marginRight: 4 }} />
          <Text style={styles.secureHeaderPillText}>2FA HARDWARE GATE</Text>
        </View>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.iconCircle}>
          <KeyRound size={32} color={colors.accent} />
        </View>
        <Text style={styles.title}>Security PIN</Text>
        <Text style={styles.subtitle}>
          Enter the 4-digit Master Security PIN for operator authorization.
        </Text>

        {/* Quick-fill Demo PIN Pill */}
        <Pressable
          onPress={handleQuickFillPin}
          style={({ pressed }) => [styles.demoPinPill, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Auto-fill Demo PIN 6767"
        >
          <Sparkles size={13} color={colors.accent} style={{ marginRight: 5 }} />
          <Text style={styles.demoPinPillText}>
            Quick-fill Master PIN: <Text style={styles.demoPinPillCode}>6767</Text>
          </Text>
        </Pressable>
      </View>

      {/* 4-Digit Indicator Circles */}
      <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
        {[0, 1, 2, 3].map((index) => {
          const isFilled = pin.length > index;
          return (
            <View
              key={index}
              style={[
                styles.dot,
                isFilled && styles.dotFilled,
                errorText && styles.dotError,
              ]}
            >
              {isFilled && <View style={styles.innerDot} />}
            </View>
          );
        })}
      </Animated.View>

      {/* Error Feedback or Verification Spinner */}
      <View style={styles.statusArea}>
        {isVerifying || isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.verifyingText}>Verifying PIN with Security Context...</Text>
          </View>
        ) : errorText ? (
          <View style={styles.errorRow}>
            <ShieldAlert size={14} color={colors.error} style={{ marginRight: 4 }} />
            <Text style={styles.errorText}>{errorText}</Text>
          </View>
        ) : (
          <Text style={styles.helperText}>Default Security PIN: <Text style={styles.codeBold}>6767</Text></Text>
        )}
      </View>

      {/* Numeric Keypad Grid */}
      <View style={styles.keypad}>
        {KEYPAD_ROWS.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((item) => (
              <Pressable
                key={item.digit}
                onPress={() => handleKeyPress(item.digit)}
                style={({ pressed }) => [styles.keyBtn, pressed && styles.keyBtnPressed]}
                accessibilityRole="button"
                accessibilityLabel={`Digit ${item.digit}`}
              >
                <Text style={styles.keyDigit}>{item.digit}</Text>
                {item.letters ? (
                  <Text style={styles.keySubLetters}>{item.letters}</Text>
                ) : (
                  <View style={styles.keySubPlaceholder} />
                )}
              </Pressable>
            ))}
          </View>
        ))}

        {/* Bottom Row: Clear, 0, Backspace */}
        <View style={styles.keypadRow}>
          <Pressable
            onPress={handleClear}
            style={({ pressed }) => [styles.keyBtn, styles.actionKeyBtn, pressed && styles.keyBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Clear PIN input"
          >
            <Text style={styles.actionKeyText}>CLEAR</Text>
          </Pressable>

          <Pressable
            onPress={() => handleKeyPress('0')}
            style={({ pressed }) => [styles.keyBtn, pressed && styles.keyBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Digit 0"
          >
            <Text style={styles.keyDigit}>0</Text>
            <Text style={styles.keySubLetters}>+</Text>
          </Pressable>

          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [styles.keyBtn, styles.actionKeyBtn, pressed && styles.keyBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Delete last digit"
          >
            <Delete size={22} color={colors.text} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'space-between',
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    pressed: {
      opacity: 0.7,
    },
    secureHeaderPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.accentSoft,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    secureHeaderPillText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.accent,
      letterSpacing: 0.6,
    },
    heroSection: {
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
    },
    iconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
      borderWidth: 2,
      borderColor: colors.accent,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 3,
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
      lineHeight: 18,
    },
    demoPinPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.pill,
      marginTop: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    demoPinPillText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.subtle,
    },
    demoPinPillCode: {
      fontWeight: '800',
      color: colors.accent,
    },
    dotsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: spacing.md,
      gap: spacing.lg,
    },
    dot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dotFilled: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    dotError: {
      borderColor: colors.error,
      backgroundColor: colors.errorSoft,
    },
    innerDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.accent,
    },
    statusArea: {
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    verifyingText: {
      fontSize: 13,
      color: colors.accent,
      fontWeight: '600',
    },
    errorRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    errorText: {
      fontSize: 13,
      color: colors.error,
      fontWeight: '700',
    },
    helperText: {
      fontSize: 12,
      color: colors.subtle,
    },
    codeBold: {
      fontWeight: '800',
      color: colors.accent,
    },
    keypad: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xl,
      gap: spacing.sm,
    },
    keypadRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    keyBtn: {
      flex: 1,
      height: 64,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
      paddingVertical: 4,
    },
    keyBtnPressed: {
      backgroundColor: colors.elevated,
      transform: [{ scale: 0.96 }],
    },
    keyDigit: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      lineHeight: 26,
    },
    keySubLetters: {
      fontSize: 9,
      fontWeight: '700',
      color: colors.subtle,
      letterSpacing: 1.2,
      marginTop: 1,
    },
    keySubPlaceholder: {
      height: 12,
    },
    actionKeyBtn: {
      backgroundColor: colors.elevated,
    },
    actionKeyText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.subtle,
      letterSpacing: 0.5,
    },
  });
}
