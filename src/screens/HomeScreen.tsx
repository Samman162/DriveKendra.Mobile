import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import {
  Car,
  ChevronRight,
  User as UserIcon,
} from 'lucide-react-native';

import { Screen } from '../components/ui/Screen';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList, RootTabParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeProvider';
import { useThemedStyles } from '../theme/useThemedStyles';
import { radius, spacing } from '../theme/spacing';
import { hapticFeedback } from '../utils/haptics';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { user, isAuthenticated } = useAuth();

  const displayName = isAuthenticated && user?.name ? user.name : 'Guest';

  return (
    <Screen padded={false}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Top Bar with Profile Icon and Mode Toggle on Top Right */}
      <View style={styles.topBar}>
        <View style={styles.topBarActions}>
          <Pressable
            onPress={() => {
              hapticFeedback.light();
              if (isAuthenticated) {
                navigation.navigate('Profile');
              } else {
                navigation.navigate('Auth', { initialMode: 'signin' });
              }
            }}
            style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="User Profile"
          >
            {isAuthenticated && user?.name ? (
              <View style={styles.userInitialBadge}>
                <Text style={styles.userInitialText}>{user.name.slice(0, 1).toUpperCase()}</Text>
              </View>
            ) : (
              <View style={styles.guestIconBadge}>
                <UserIcon size={18} color={colors.text} />
              </View>
            )}
          </Pressable>

          <ThemeToggle variant="onSurface" />
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.contentContainer}>
        {/* Welcome Greeting */}
        <View style={styles.greetingWrap}>
          <Text style={styles.greetingLabel}>Welcome back,</Text>
          <Text style={styles.greetingName} numberOfLines={2}>
            {displayName}
          </Text>
        </View>

        {/* Services Selection Section */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionLabel}>CHOOSE A SERVICE</Text>

          <Pressable
            onPress={() => {
              hapticFeedback.medium();
              navigation.navigate('Booking');
            }}
            style={({ pressed }) => [styles.serviceButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Rent a Vehicle"
          >
            <View style={styles.serviceIconContainer}>
              <Car size={26} color={colors.onAccent} />
            </View>
            <View style={styles.serviceTextContainer}>
              <Text style={styles.serviceTitle}>Rent a Vehicle</Text>
              <Text style={styles.serviceSubtitle}>
                Book Scorpio 4x4, HiAce van, sedan or bus for self-drive or rental charter
              </Text>
            </View>
            <View style={styles.serviceArrowCircle}>
              <ChevronRight size={20} color={colors.accent} />
            </View>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    topBarActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    avatarButton: {
      padding: 2,
    },
    userInitialBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    userInitialText: {
      color: colors.onAccent,
      fontSize: 16,
      fontWeight: '800',
    },
    guestIconBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    contentContainer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },
    greetingWrap: {
      marginBottom: spacing.xl,
    },
    greetingLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.muted,
      letterSpacing: 0.2,
      marginBottom: 4,
    },
    greetingName: {
      fontSize: 30,
      fontWeight: '900',
      color: colors.text,
      letterSpacing: -0.5,
    },
    servicesSection: {
      marginTop: spacing.md,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.subtle,
      letterSpacing: 1.2,
      marginBottom: spacing.md,
    },
    serviceButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    serviceIconContainer: {
      width: 52,
      height: 52,
      borderRadius: radius.md,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    serviceTextContainer: {
      flex: 1,
    },
    serviceTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 4,
    },
    serviceSubtitle: {
      fontSize: 12,
      color: colors.muted,
      lineHeight: 17,
    },
    serviceArrowCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: spacing.sm,
    },
    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
  });
}
