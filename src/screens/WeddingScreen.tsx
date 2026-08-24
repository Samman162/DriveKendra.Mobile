import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { Crown, Heart, Sparkles } from 'lucide-react-native';

import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FaqList } from '../components/ui/FaqList';
import { Screen } from '../components/ui/Screen';
import { SectionHeader } from '../components/ui/SectionHeader';
import { WEDDING_FAQS } from '../content/faqs';
import {
  DECOR_PACKAGES,
  WEDDING_DURATIONS,
  WEDDING_TIERS,
  weddingEstimate,
  type WeddingDuration,
} from '../content/wedding';
import { formatNprAmount, navigateToBook } from '../navigation/booking';
import type { RootStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeProvider';
import { useThemedStyles } from '../theme/useThemedStyles';
import { radius, spacing } from '../theme/spacing';
import { hapticFeedback } from '../utils/haptics';

export function WeddingScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [tierId, setTierId] = useState('gold');
  const [duration, setDuration] = useState<WeddingDuration>('full_day');
  const [decorId, setDecorId] = useState('rose_wrap');

  const tier = WEDDING_TIERS.find((item) => item.id === tierId) ?? WEDDING_TIERS[2];
  const decor = DECOR_PACKAGES.find((item) => item.id === decorId) ?? DECOR_PACKAGES[2];
  const total = useMemo(() => weddingEstimate(tier, duration, decor), [tier, duration, decor]);

  return (
    <Screen>
      <SectionHeader
        tag="WEDDING & VIP"
        title="Luxury Wedding Cars"
        subtitle="Decorated ceremonial vehicles, suited chauffeurs & bridal convoy management."
      />

      {/* Vehicle Tier Selection */}
      <Text style={styles.sectionHeading}>1. Choose Vehicle Fleet Tier</Text>
      <View style={styles.tierList}>
        {WEDDING_TIERS.map((item) => {
          const isSelected = item.id === tierId;
          return (
            <Pressable
              key={item.id}
              onPress={() => {
                hapticFeedback.selection();
                setTierId(item.id);
              }}
            >
              <Card style={[styles.tierCard, isSelected && styles.tierCardActive]}>
                <View style={styles.tierHeader}>
                  <View style={styles.tierNameRow}>
                    <Crown size={16} color={isSelected ? colors.accent : colors.muted} />
                    <Text style={styles.tierTitle}>{item.name}</Text>
                  </View>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
                <Text style={styles.tierCopy}>{item.highlight}</Text>
                <Text style={styles.tierPrice}>{item.priceLabel}</Text>
              </Card>
            </Pressable>
          );
        })}
      </View>

      {/* Duration Selection */}
      <Text style={styles.sectionHeading}>2. Service Duration</Text>
      <View style={styles.durationChips}>
        {WEDDING_DURATIONS.map((item) => {
          const isSelected = item.id === duration;
          return (
            <Pressable
              key={item.id}
              onPress={() => {
                hapticFeedback.selection();
                setDuration(item.id);
              }}
              style={[styles.durationChip, isSelected && styles.durationChipActive]}
            >
              <Text style={[styles.durationText, isSelected && styles.durationTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Decoration Package Selection */}
      <Text style={styles.sectionHeading}>3. Fresh Floral Decoration</Text>
      <View style={styles.decorList}>
        {DECOR_PACKAGES.map((item) => {
          const isSelected = item.id === decorId;
          return (
            <Pressable
              key={item.id}
              onPress={() => {
                hapticFeedback.selection();
                setDecorId(item.id);
              }}
            >
              <Card style={[styles.decorCard, isSelected && styles.decorCardActive]}>
                <View style={styles.decorHeader}>
                  <Text style={styles.decorTitle}>{item.name}</Text>
                  <Text style={styles.decorPrice}>{item.priceLabel}</Text>
                </View>
                <Text style={styles.decorCopy}>{item.description}</Text>
              </Card>
            </Pressable>
          );
        })}
      </View>

      {/* Total Wedding Package Card */}
      <Card style={styles.quoteCard}>
        <View style={styles.quoteHeader}>
          <View>
            <Text style={styles.quoteLabel}>Estimated Package</Text>
            <Text style={styles.quoteTierName}>{tier.name} • {decor.name}</Text>
          </View>
          <Text style={styles.quoteTotal}>{formatNprAmount(total)}</Text>
        </View>

        <Button
          label="Reserve Wedding Package"
          onPress={() => {
            hapticFeedback.light();
            navigateToBook(navigation, {
              vehicleTypeId: tier.vehicleTypeId,
              pickupLocation: 'Kathmandu wedding venue',
              dropoffLocation: 'Kathmandu banquet / reception',
              tripType: duration === 'multi_day' ? 'Round Trip' : 'One Way',
              additionalDetails: `Wedding ${tier.name}, ${duration.replace('_', ' ')}, floral decor: ${
                decor.name
              }. Estimated: ${formatNprAmount(total)}.`,
            });
          }}
          variant="primary"
        />
      </Card>

      {/* FAQ */}
      <View style={{ marginTop: spacing.md, paddingBottom: 40 }}>
        <SectionHeader tag="FAQ" title="Wedding Questions" subtitle="Ceremony timings & convoy coordination" />
        <FaqList items={WEDDING_FAQS} />
      </View>
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    sectionHeading: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
      marginBottom: spacing.sm,
      marginTop: spacing.sm,
    },
    tierList: {
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    tierCard: {
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    tierCardActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    tierHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    tierNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    tierTitle: {
      color: colors.text,
      fontWeight: '800',
      fontSize: 15,
    },
    badgeText: {
      color: colors.accent,
      fontWeight: '800',
      fontSize: 11,
    },
    tierCopy: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
      marginTop: 2,
    },
    tierPrice: {
      color: colors.text,
      fontWeight: '800',
      fontSize: 14,
      marginTop: spacing.xs,
    },
    durationChips: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    durationChip: {
      flex: 1,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    durationChipActive: {
      backgroundColor: colors.navy,
      borderColor: colors.navy,
    },
    durationText: {
      color: colors.muted,
      fontWeight: '700',
      fontSize: 12,
      textAlign: 'center',
    },
    durationTextActive: {
      color: colors.onNavy,
    },
    decorList: {
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    decorCard: {
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    decorCardActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    decorHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    decorTitle: {
      color: colors.text,
      fontWeight: '800',
      fontSize: 14,
    },
    decorPrice: {
      color: colors.accent,
      fontWeight: '800',
      fontSize: 13,
    },
    decorCopy: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
    },
    quoteCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1.5,
      borderColor: colors.accent,
      padding: spacing.lg,
      marginBottom: spacing.md,
      gap: spacing.md,
    },
    quoteHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    quoteLabel: {
      fontSize: 11,
      color: colors.subtle,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    quoteTierName: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.text,
      marginTop: 2,
    },
    quoteTotal: {
      fontSize: 22,
      fontWeight: '900',
      color: colors.accent,
    },
  });
}
