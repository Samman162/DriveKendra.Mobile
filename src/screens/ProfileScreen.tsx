import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Camera,
  Check,
  ChevronRight,
  Compass,
  Headphones,
  LogOut,
  Mail,
  Phone,
  User as UserIcon,
} from 'lucide-react-native';

import { updateUserProfile } from '../api/users';
import { Button } from '../components/ui/Button';
import { ManAvatarIllustration } from '../components/ui/ManAvatarIllustration';
import { Screen } from '../components/ui/Screen';
import { ThemeModeSelector } from '../components/ui/ThemeModeSelector';
import { useAuth } from '../context/AuthContext';
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
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { user, isAuthenticated, signOut, updateUser } = useAuth();

  // Profile Form States
  const [name, setName] = useState<string>(user?.name || '');
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatarUrl || null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isNameFocused, setIsNameFocused] = useState<boolean>(false);
  const [isEmailFocused, setIsEmailFocused] = useState<boolean>(false);

  // Sync state when user context updates
  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.phone) setPhone(user.phone);
    if (user?.email !== undefined) setEmail(user.email || '');
    if (user?.avatarUrl) setAvatarUri(user.avatarUrl);
  }, [user]);

  // Determine if profile fields or avatar have changed
  const initialName = user?.name || '';
  const initialEmail = user?.email || '';
  const initialAvatar = user?.avatarUrl || null;
  const isDirty =
    name.trim() !== initialName.trim() ||
    email.trim() !== initialEmail.trim() ||
    avatarUri !== initialAvatar;

  const handlePickImage = async () => {
    hapticFeedback.selection();
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Photo Library Access',
          'Drive Kendra needs permission to access your photo gallery to select a profile picture.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]?.uri) {
        const selectedUri = result.assets[0].uri;
        // Update local state only; save only when Save button is pressed
        setAvatarUri(selectedUri);
        hapticFeedback.selection();
      }
    } catch (e) {
      console.warn('[ImagePicker] Error picking image from gallery:', e);
      Alert.alert('Error', 'Unable to open gallery. Please try again.');
      hapticFeedback.error();
    }
  };

  const handleSaveProfile = async () => {
    Keyboard.dismiss();
    const trimmed = name.trim();
    if (!trimmed) {
      hapticFeedback.error();
      Alert.alert('Invalid Name', 'Full name cannot be left empty.');
      return;
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      hapticFeedback.error();
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    try {
      await updateUser({
        name: trimmed,
        phone,
        email: trimmedEmail || undefined,
        avatarUrl: avatarUri || undefined,
      });

      if (user?.id) {
        void updateUserProfile({
          userId: user.id,
          fullName: trimmed,
          email: trimmedEmail || undefined,
          avatarUrl: avatarUri || undefined,
          phone,
        });
      }

      hapticFeedback.success();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch {
      hapticFeedback.error();
      Alert.alert('Error', 'Could not save profile changes. Please try again.');
    }
  };

  const handleSignOut = () => {
    hapticFeedback.error();
    const executeSignOut = async () => {
      await signOut();
    };

    if (Platform.OS === 'web') {
      void executeSignOut();
      return;
    }

    Alert.alert('Sign Out', 'Are you sure you want to sign out of Drive Kendra?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: executeSignOut,
      },
    ]);
  };

  // ----------------------------------------------------
  // GUEST STATE
  // ----------------------------------------------------
  if (!isAuthenticated || !user) {
    return (
      <Screen padded={false}>
        {/* Top Branded Hero */}
        <View style={styles.heroBanner}>
          <View style={styles.topBar}>
            <View style={{ width: 64 }} />
            <Text style={styles.headerTitle}>Profile</Text>
            <View style={{ width: 64 }} />
          </View>

          <View style={styles.guestHeroAvatar}>
            <ManAvatarIllustration size={80} />
          </View>
        </View>

        <View style={styles.guestBody}>
          <View style={styles.guestContentCard}>
            <Text style={styles.guestTitle}>Join Drive Kendra</Text>
            <Text style={styles.guestSubtitle}>
              Sign in to manage your Himalayan car bookings, access offline vouchers, and unlock
              exclusive member expedition rates.
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

          {/* Theme Appearance Setting for Guest */}
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>App Appearance</Text>
            <Text style={styles.sectionSubtitle}>
              Switch between Light, Dark, or System mode.
            </Text>
            <ThemeModeSelector style={{ marginTop: spacing.sm }} />
          </View>

          {/* Walkthrough link */}
          <View style={styles.menuSection}>
            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
              onPress={() => navigation.navigate('Onboarding')}
            >
              <View style={styles.menuIconWrap}>
                <Compass size={18} color={colors.accent} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>App Walkthrough & Intro</Text>
                <Text style={styles.menuSub}>Explore features, vehicle fleets & tour packages</Text>
              </View>
              <ChevronRight size={18} color={colors.subtle} />
            </Pressable>
          </View>

        </View>
      </Screen>
    );
  }

  // ----------------------------------------------------
  // AUTHENTICATED PROFILE
  // ----------------------------------------------------
  return (
    <Screen padded={false}>
      {/* Curved Sunset Hero Header */}
      <View style={styles.heroBanner}>
        <View style={styles.topBar}>
          {/* Left spacer to keep title centered */}
          <View style={{ width: 64 }} />

          {/* Center: Title */}
          <Text style={styles.headerTitle}>My Profile</Text>

          {/* Right: Save Action - Only shown when edited or just saved */}
          {isDirty || isSaved ? (
            <Pressable
              onPress={handleSaveProfile}
              style={({ pressed }) => [
                styles.saveBtn,
                isSaved && styles.saveBtnSaved,
                pressed && { opacity: 0.8 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Save profile changes"
            >
              {isSaved ? (
                <View style={styles.saveInnerRow}>
                  <Check size={14} color={colors.onAccent} strokeWidth={3} />
                  <Text style={styles.saveBtnText}>Saved</Text>
                </View>
              ) : (
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </Pressable>
          ) : (
            <View style={{ width: 64 }} />
          )}
        </View>

        {/* Floating Avatar Section */}
        <View style={styles.avatarSection}>
          <Pressable
            onPress={handlePickImage}
            accessibilityRole="button"
            accessibilityLabel="Open gallery to change profile picture"
            style={({ pressed }) => [styles.avatarTouchable, pressed && { opacity: 0.85 }]}
          >
            <View style={styles.avatarCircle}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <ManAvatarIllustration size={100} />
              )}
            </View>

            {/* Camera Overlay Badge */}
            <View style={styles.cameraBadge}>
              <Camera size={16} color={colors.navy} strokeWidth={2.5} />
            </View>
          </Pressable>
        </View>
      </View>

      {/* Main Profile Body */}
      <View style={styles.bodyContainer}>
        {/* Profile Information Card */}
        <View style={styles.infoCard}>
          {/* Full Name Field */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <View style={[styles.inputRow, isNameFocused && styles.inputRowFocused]}>
              <UserIcon size={18} color={isNameFocused ? colors.accent : colors.subtle} />
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                placeholder="Enter full name"
                placeholderTextColor={colors.muted}
                onFocus={() => setIsNameFocused(true)}
                onBlur={() => setIsNameFocused(false)}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSaveProfile}
              />
            </View>
          </View>

          <View style={styles.fieldDivider} />

          {/* Phone Number Field */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <View style={styles.staticFieldRow}>
              <View style={styles.fieldIconPrefix}>
                <Phone size={18} color={colors.subtle} />
              </View>
              <Text style={styles.staticFieldValue}>{phone}</Text>
            </View>
          </View>

          <View style={styles.fieldDivider} />

          {/* Email Address Field (Add / Edit Email) */}
          <View style={styles.fieldBlock}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              {!user?.email && !email.trim() && (
                <Text style={styles.optionalBadge}>Optional • Add for receipts</Text>
              )}
            </View>
            <View style={[styles.inputRow, isEmailFocused && styles.inputRowFocused]}>
              <Mail size={18} color={isEmailFocused ? colors.accent : colors.subtle} />
              <TextInput
                style={styles.nameInput}
                value={email}
                onChangeText={setEmail}
                placeholder="Add your email address"
                placeholderTextColor={colors.muted}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSaveProfile}
              />
            </View>
          </View>
        </View>

        {/* App Appearance & Mode Setting */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>App Appearance & Mode</Text>
          <Text style={styles.sectionSubtitle}>
            Select your preferred display theme or sync with your device settings.
          </Text>
          <ThemeModeSelector style={{ marginTop: spacing.sm }} />
        </View>

        {/* Support Section */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Support & Help</Text>
          <Text style={styles.sectionSubtitle}>
            Reach our Nepal dispatch team for bookings, routes, and emergency assistance.
          </Text>

          <Pressable
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            onPress={() => {
              hapticFeedback.selection();
              navigation.navigate('Contact');
            }}
            accessibilityRole="button"
            accessibilityLabel="Contact 24/7 Roadside Hotline and Support"
          >
            <View style={[styles.menuIconWrap, { backgroundColor: colors.accentSoft }]}>
              <Headphones size={18} color={colors.accent} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuLabel}>24/7 Roadside & Trip Support</Text>
              <Text style={styles.menuSub}>Direct phone, WhatsApp & customer helpline in Nepal</Text>
            </View>
            <ChevronRight size={18} color={colors.subtle} />
          </Pressable>
        </View>

        {/* Sign Out Button */}
        <View style={styles.logoutWrap}>
          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Sign Out of Drive Kendra"
          >
            <LogOut size={18} color={colors.error} style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>Sign Out of Drive Kendra</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    // Hero Top Banner
    heroBanner: {
      backgroundColor: colors.accent,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xl + 12,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 6,
    },
    topBar: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.onAccent,
      textAlign: 'center',
    },
    saveBtn: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.navy,
      minWidth: 64,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 3,
    },
    saveBtnSaved: {
      backgroundColor: colors.success,
    },
    saveInnerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    saveBtnText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.onNavy,
    },

    // Avatar
    avatarSection: {
      alignItems: 'center',
      marginTop: spacing.xs,
    },
    avatarTouchable: {
      position: 'relative',
      marginBottom: spacing.xs,
    },
    avatarCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 4,
      borderColor: colors.surface,
      backgroundColor: colors.border,
      overflow: 'hidden',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 8,
    },
    avatarImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    cameraBadge: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.accent,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 4,
    },

    // Body
    bodyContainer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxl + 20,
    },

    // Information Card
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.md,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    fieldBlock: {
      paddingVertical: spacing.xs,
    },
    fieldLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    optionalBadge: {
      fontSize: 11,
      color: colors.highlight,
      fontWeight: '600',
    },
    fieldLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.elevated,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      borderWidth: 1.5,
      borderColor: colors.border,
      gap: spacing.sm,
    },
    inputRowFocused: {
      borderColor: colors.accent,
      backgroundColor: colors.surface,
    },
    nameInput: {
      flex: 1,
      fontSize: 15,
      fontWeight: '800',
      color: colors.text,
      padding: 0,
    },
    fieldDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.sm,
    },
    staticFieldRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.elevated,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
    },
    fieldIconPrefix: {
      width: 20,
      alignItems: 'center',
    },
    staticFieldValue: {
      flex: 1,
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },

    // Menu Sections
    menuSection: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.md,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '900',
      color: colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 2,
      paddingHorizontal: 2,
    },
    sectionSubtitle: {
      fontSize: 11,
      color: colors.subtle,
      marginBottom: spacing.xs,
      paddingHorizontal: 2,
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

    // Logout
    logoutWrap: {
      marginTop: spacing.xs,
      marginBottom: spacing.lg,
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
    logoutBtnPressed: {
      opacity: 0.8,
    },
    logoutText: {
      color: colors.error,
      fontWeight: '900',
      fontSize: 14,
    },

    // Guest Styles
    guestHeroAvatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#E2E8F0',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.xs,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      overflow: 'hidden',
    },
    guestBody: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxl + 20,
    },
    guestContentCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    guestTitle: {
      fontSize: 22,
      fontWeight: '900',
      color: colors.text,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    guestSubtitle: {
      fontSize: 13,
      color: colors.muted,
      textAlign: 'center',
      lineHeight: 19,
      marginBottom: spacing.lg,
    },
    guestActions: {
      width: '100%',
    },
  });
}
