import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import { Card } from '../components/ui/Card';
import { FaqList } from '../components/ui/FaqList';
import { QuoteCard } from '../components/ui/QuoteCard';
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
import type { RootTabParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { useThemedStyles } from '../theme/useThemedStyles';
import { radius, spacing } from '../theme/spacing';

export function WeddingScreen() {
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const [tierId, setTierId] = useState('gold');
  const [duration, setDuration] = useState<WeddingDuration>('full_day');
  const [decorId, setDecorId] = useState('rose_wrap');

  const tier = WEDDING_TIERS.find((item) => item.id === tierId) ?? WEDDING_TIERS[2];
  const decor = DECOR_PACKAGES.find((item) => item.id === decorId) ?? DECOR_PACKAGES[2];
  const total = useMemo(() => weddingEstimate(tier, duration, decor), [tier, duration, decor]);

  return (
    <Screen>
      <SectionHeader
        tag="WEDDING FLEET"
        title="Luxury wedding car rental"
        subtitle="Premium cars, suited chauffeurs, and floral decoration for Kathmandu weddings."
      />

      <Text style={styles.label}>Vehicle tier</Text>
      {WEDDING_TIERS.map((item) => {
        const active = item.id === tierId;
        return (
          <Pressable key={item.id} onPress={() => setTierId(item.id)}>
            <Card style={[styles.option, active && styles.optionActive]}>
              <View style={styles.row}>
                <Text style={styles.optionTitle}>{item.name}</Text>
                <Text style={styles.badge}>{item.badge}</Text>
              </View>
              <Text style={styles.optionCopy}>{item.highlight}</Text>
              <Text style={styles.price}>{item.priceLabel}</Text>
            </Card>
          </Pressable>
        );
      })}

      <Text style={styles.label}>Duration</Text>
      <View style={styles.chips}>
        {WEDDING_DURATIONS.map((item) => {
          const active = item.id === duration;
          return (
            <Pressable key={item.id} onPress={() => setDuration(item.id)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Decoration</Text>
      {DECOR_PACKAGES.map((item) => {
        const active = item.id === decorId;
        return (
          <Pressable key={item.id} onPress={() => setDecorId(item.id)}>
            <Card style={[styles.option, active && styles.optionActive]}>
              <View style={styles.row}>
                <Text style={styles.optionTitle}>{item.name}</Text>
                <Text style={styles.price}>{item.priceLabel}</Text>
              </View>
              <Text style={styles.optionCopy}>{item.description}</Text>
            </Card>
          </Pressable>
        );
      })}

      <QuoteCard
        label={`${tier.name} · ${WEDDING_DURATIONS.find((item) => item.id === duration)?.label}`}
        amount={formatNprAmount(total)}
        note={`${decor.name}. VAT may apply on the final bill.`}
        onBook={() =>
          navigateToBook(navigation, {
            vehicleTypeId: tier.vehicleTypeId,
            pickupLocation: 'Kathmandu wedding venue',
            dropoffLocation: 'Kathmandu wedding venue',
            tripType: duration === 'multi_day' ? 'Round Trip' : 'One Way',
            additionalDetails: `Wedding ${tier.name}, ${duration.replace('_', ' ')}, decor: ${decor.name}. Estimate ${formatNprAmount(total)}.`,
          })
        }
      />

      <SectionHeader tag="FAQ" title="Wedding questions" />
      <FaqList items={WEDDING_FAQS} />
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  option: {
    marginBottom: spacing.md,
  },
  optionActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    alignItems: 'center',
  },
  optionTitle: {
    color: colors.text,
    fontWeight: '800',
    flex: 1,
  },
  badge: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 11,
  },
  optionCopy: {
    color: colors.muted,
    marginTop: 6,
    lineHeight: 20,
  },
  price: {
    color: colors.text,
    fontWeight: '800',
    marginTop: 8,
  },
  chips: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  chipText: {
    color: colors.muted,
    fontWeight: '700',
  },
  chipTextActive: {
    color: colors.onNavy,
  },
  });
}
