import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowRight,
  Car,
  CheckCircle2,
  ChevronRight,
  Crown,
  Heart,
  MapPin,
  MapPinned,
  PhoneCall,
  Plane,
  Shield,
  Sparkles,
} from 'lucide-react-native';

import { BrandLogo } from '../components/ui/BrandLogo';
import { Card } from '../components/ui/Card';
import { Screen } from '../components/ui/Screen';
import { SectionHeader } from '../components/ui/SectionHeader';
import type { RootStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeProvider';
import { useThemedStyles } from '../theme/useThemedStyles';
import { radius, spacing } from '../theme/spacing';
import { hapticFeedback } from '../utils/haptics';

const SERVICES = [
  {
    key: 'Fleet' as const,
    title: 'Vehicle Fleet & Specifications',
    subtitle: 'Mahindra Scorpio 4x4, Toyota HiAce, luxury sedans & tourist buses.',
    icon: Car,
    badge: '32 Vehicles',
    color: '#D97706',
    bgColor: 'rgba(217, 119, 6, 0.12)',
  },
  {
    key: 'Rates' as const,
    title: 'Official Nepal Rate Chart',
    subtitle: 'Transparent fixed fares for Kathmandu, Pokhara, Chitwan & hill routes.',
    icon: MapPinned,
    badge: 'Standard Rates',
    color: '#059669',
    bgColor: 'rgba(5, 150, 105, 0.12)',
  },
  {
    key: 'Airport' as const,
    title: 'Airport TIA Transfers',
    subtitle: '24/7 Tribhuvan International Airport flight tracking & nameboard meet & greet.',
    icon: Plane,
    badge: '24/7 Service',
    color: '#0284C7',
    bgColor: 'rgba(2, 132, 199, 0.12)',
  },
  {
    key: 'Wedding' as const,
    title: 'Wedding & VIP Luxury Cars',
    subtitle: 'Decorated luxury vehicles, suited chauffeurs, and ceremonial convoy management.',
    icon: Heart,
    badge: 'VIP Chauffeur',
    color: '#DB2777',
    bgColor: 'rgba(219, 39, 119, 0.12)',
  },
];

export function ExploreScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Screen>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.badgeTag}>PREMIER TRANSPORT</Text>
          <Text style={styles.pageTitle}>Explore Services</Text>
          <Text style={styles.pageSubtitle}>
            Full range of transport solutions across Kathmandu and all 7 provinces of Nepal.
          </Text>
        </View>
      </View>

      {/* Featured Services Cards */}
      <View style={styles.servicesList}>
        {SERVICES.map((item) => {
          const Icon = item.icon;
          return (
            <Pressable
              key={item.key}
              onPress={() => {
                hapticFeedback.light();
                navigation.navigate(item.key);
              }}
              style={({ pressed }) => [styles.serviceTile, pressed && styles.pressed]}
            >
              <View style={[styles.iconWrap, { backgroundColor: item.bgColor }]}>
                <Icon color={item.color} size={24} />
              </View>
              <View style={styles.tileContent}>
                <View style={styles.titleBadgeRow}>
                  <Text style={styles.tileTitle}>{item.title}</Text>
                </View>
                <Text style={styles.tileSub}>{item.subtitle}</Text>
                <View style={styles.badgePill}>
                  <Text style={[styles.badgeText, { color: item.color }]}>{item.badge}</Text>
                </View>
              </View>
              <ChevronRight size={18} color={colors.subtle} style={styles.arrow} />
            </Pressable>
          );
        })}
      </View>

      {/* Trust & Guarantee Banner */}
      <View style={styles.guaranteeCard}>
        <View style={styles.guaranteeHeader}>
          <BrandLogo size="xs" variant="card" style={{ marginRight: spacing.xs }} />
          <Text style={styles.guaranteeTitle}>The Drive Kendra Promise</Text>
        </View>
        <View style={styles.guaranteeItem}>
          <CheckCircle2 size={15} color={colors.success} />
          <Text style={styles.guaranteeText}>All drivers are certified mountain hill driving experts</Text>
        </View>
        <View style={styles.guaranteeItem}>
          <CheckCircle2 size={15} color={colors.success} />
          <Text style={styles.guaranteeText}>100% transparent pricing — zero hidden surcharges</Text>
        </View>
        <View style={styles.guaranteeItem}>
          <CheckCircle2 size={15} color={colors.success} />
          <Text style={styles.guaranteeText}>Complete vehicle sanitization & periodic safety audits</Text>
        </View>
      </View>
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    },
    headerCopy: {
      flex: 1,
    },
    badgeTag: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
      marginBottom: 2,
    },
    pageTitle: {
      fontSize: 24,
      fontWeight: '900',
      color: colors.text,
    },
    pageSubtitle: {
      fontSize: 13,
      color: colors.muted,
      marginTop: 2,
      lineHeight: 18,
    },
    servicesList: {
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    serviceTile: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconWrap: {
      width: 52,
      height: 52,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    tileContent: {
      flex: 1,
    },
    titleBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    tileTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.text,
    },
    tileSub: {
      fontSize: 12,
      color: colors.muted,
      lineHeight: 16,
      marginTop: 2,
    },
    badgePill: {
      alignSelf: 'flex-start',
      backgroundColor: colors.elevated,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: radius.sm,
      marginTop: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '700',
    },
    arrow: {
      marginLeft: spacing.xs,
    },
    guaranteeCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
    },
    guaranteeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: spacing.xs,
    },
    guaranteeTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.text,
    },
    guaranteeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    guaranteeText: {
      fontSize: 12,
      color: colors.muted,
      fontWeight: '600',
      flex: 1,
    },
    pressed: {
      opacity: 0.8,
      transform: [{ scale: 0.99 }],
    },
  });
}
