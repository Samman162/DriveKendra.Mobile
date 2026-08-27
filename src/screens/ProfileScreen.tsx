import React from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Calendar,
  Car,
  ChevronRight,
  Compass,
  Fingerprint,
  Headphones,
  KeyRound,
  LogOut,
  Moon,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
} from 'lucide-react-native';

import { BrandLogo } from '../components/ui/BrandLogo';
import { Button } from '../components/ui/Button';
import { Screen } from '../components/ui/Screen';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { useBiometrics } from '../hooks/useBiometrics';
import type { RootStackParamList, RootTabParamList } from '../navigation/types';
import { radius, spacing } from '../theme/spacing';
import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeProvider';
import { useThemedStyles } from '../theme/useThemedStyles';
import { hapticFeedback } from '../utils/haptics';

type ProfileNav = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNav>();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { user, isAuthenticated, signOut, biometricEnabled, setBiometricEnabled } = useAuth();
  const { isAvailable, typeLabel, authenticate } = useBiometrics();

  const handleToggleBiometrics = async (value: boolean) => {
    if (value) {
      const ok = await authenticate(`Confirm ${typeLabel} to enable biometric unlock`);
      if (ok) {
        hapticFeedback.success();
        await setBiometricEnabled(true);
      } else {
        hapticFeedback.error();
      }
    } else {
      hapticFeedback.selection();
      await setBiometricEnabled(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of Drive Kendra?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  if (!isAuthenticated || !user) {
    return (
      <Screen>
        <View style={styles.guestContainer}>
          <BrandLogo size="lg" variant="card" style={{ marginBottom: spacing.md }} />
          <Text style={styles.guestTitle}>Welcome to Drive Kendra</Text>
          <Text style={styles.guestSubtitle}>
            Sign in or create an account to manage your car bookings, access discounted rates, and track your Himalayan tours.
          </Text>

          <View style={styles.guestActions}>
            <Button
              label="Sign In to Account"
              onPress={() => navigation.navigate('Auth', { initialMode: 'signin' })}
              variant="primary"
            />
            <View style={{ height: spacing.sm }} />
            <Button
              label="Create New Account"
              onPress={() => navigation.navigate('Auth', { initialMode: 'signup' })}
              variant="secondary"
            />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      {/* Profile Header Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.name ? user.name.slice(0, 2).toUpperCase() : 'DK'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{user.name}</Text>
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={12} color={colors.success} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.userPhone}>{user.phone}</Text>
          </View>
        </View>
      </View>

      {/* Quick Stats Grid */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Trips Completed</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>4.9★</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>VIP</Text>
          <Text style={styles.statLabel}>Tier</Text>
        </View>
      </View>

      {/* Menu Options */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Account & Activity</Text>

        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
          onPress={() => navigation.navigate('MyBookings')}
        >
          <View style={[styles.menuIconWrap, { backgroundColor: colors.accentSoft }]}>
            <Calendar size={18} color={colors.accent} />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuLabel}>My Reservations & Trips</Text>
            <Text style={styles.menuSub}>View upcoming rides, driver details & tax invoices</Text>
          </View>
          <ChevronRight size={18} color={colors.subtle} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
          onPress={() => navigation.navigate('BookingModal')}
        >
          <View style={styles.menuIconWrap}>
            <Car size={18} color={colors.accent} />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuLabel}>Book a Vehicle</Text>
            <Text style={styles.menuSub}>Instant rental & chauffeur reservations</Text>
          </View>
          <ChevronRight size={18} color={colors.subtle} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
          onPress={() => navigation.navigate('Tours')}
        >
          <View style={styles.menuIconWrap}>
            <Sparkles size={18} color={colors.accent} />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuLabel}>Himalayan Tour Packages</Text>
            <Text style={styles.menuSub}>Muktinath, Manakamana, Kalinchowk</Text>
          </View>
          <ChevronRight size={18} color={colors.subtle} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
          onPress={() => navigation.navigate('Contact')}
        >
          <View style={styles.menuIconWrap}>
            <Headphones size={18} color={colors.accent} />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuLabel}>24/7 Driver Support</Text>
            <Text style={styles.menuSub}>Direct phone & WhatsApp hotline</Text>
          </View>
          <ChevronRight size={18} color={colors.subtle} />
        </Pressable>
      </View>

      {/* Security & Preferences Section */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Security & Preferences</Text>

        {isAvailable ? (
          <View style={styles.menuItem}>
            <View style={styles.menuIconWrap}>
              <Fingerprint size={18} color={colors.accent} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuLabel}>{typeLabel} Unlock</Text>
              <Text style={styles.menuSub}>Require biometric verification on app resume</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleToggleBiometrics}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.onAccent}
            />
          </View>
        ) : null}

        <View style={styles.menuItem}>
          <View style={styles.menuIconWrap}>
            <KeyRound size={18} color={colors.success} />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuLabel}>Hardware Encryption</Text>
            <Text style={styles.menuSub}>Protected with iOS Keychain / Android KeyStore</Text>
          </View>
          <ShieldCheck size={18} color={colors.success} />
        </View>

        <View style={styles.menuItem}>
          <View style={styles.menuIconWrap}>
            <Moon size={18} color={colors.accent} />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuLabel}>App Appearance</Text>
            <Text style={styles.menuSub}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
          </View>
          <ThemeToggle variant="onSurface" />
        </View>

        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
          onPress={() => navigation.navigate('Onboarding')}
        >
          <View style={styles.menuIconWrap}>
            <Compass size={18} color={colors.accent} />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuLabel}>App Walkthrough & Intro</Text>
            <Text style={styles.menuSub}>Review features, tour packages & logistics services</Text>
          </View>
          <ChevronRight size={18} color={colors.subtle} />
        </Pressable>
      </View>

      {/* Logout Action */}
      <View style={styles.logoutWrap}>
        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [styles.logoutBtn, pressed && styles.menuItemPressed]}
        >
          <LogOut size={18} color={colors.error} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Sign Out of Drive Kendra</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    guestContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.md,
    },
    guestAvatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    guestTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.text,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    guestSubtitle: {
      fontSize: 14,
      color: colors.muted,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: spacing.xl,
    },
    guestActions: {
      width: '100%',
    },
    profileCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.md,
    },
    avatarRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.navy,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    avatarText: {
      color: colors.onNavy,
      fontSize: 20,
      fontWeight: '900',
    },
    userInfo: {
      flex: 1,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    userName: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      backgroundColor: colors.successSoft,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.pill,
    },
    verifiedText: {
      fontSize: 10,
      color: colors.success,
      fontWeight: '700',
    },
    userEmail: {
      fontSize: 13,
      color: colors.muted,
      marginTop: 2,
    },
    userPhone: {
      fontSize: 12,
      color: colors.subtle,
      marginTop: 2,
    },
    statsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    statBox: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.text,
    },
    statLabel: {
      fontSize: 11,
      color: colors.muted,
      fontWeight: '600',
      marginTop: 2,
    },
    menuSection: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
      paddingHorizontal: 4,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: 4,
      borderRadius: radius.sm,
    },
    menuItemPressed: {
      backgroundColor: colors.elevated,
    },
    menuIconWrap: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: colors.elevated,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    menuContent: {
      flex: 1,
    },
    menuLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    menuSub: {
      fontSize: 11,
      color: colors.muted,
      marginTop: 1,
    },
    logoutWrap: {
      marginTop: spacing.sm,
      marginBottom: spacing.xxl,
    },
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.errorSoft,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.error,
    },
    logoutText: {
      color: colors.error,
      fontWeight: '800',
      fontSize: 14,
    },
  });
}
