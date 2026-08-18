import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import { Card } from '../components/ui/Card';
import { RemoteImage } from '../components/ui/RemoteImage';
import { FaqList } from '../components/ui/FaqList';
import { QuoteCard } from '../components/ui/QuoteCard';
import { Screen } from '../components/ui/Screen';
import { SectionHeader } from '../components/ui/SectionHeader';
import {
  KALINCHOWK_EV_VAN,
  KALINCHOWK_FAQS,
  KALINCHOWK_SCORPIO,
  MANAKAMANA_FAQS,
  MANAKAMANA_OPTIONS,
  MUKTINATH_EV_VAN,
  MUKTINATH_FAQS,
  MUKTINATH_SCORPIO,
  type ManakamanaOption,
} from '../content/tourDetails';
import { TOUR_PACKAGES } from '../content/tours';
import { formatNprAmount, navigateToBook } from '../navigation/booking';
import type { RootTabParamList, ToursStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { useThemedStyles } from '../theme/useThemedStyles';
import { radius, spacing } from '../theme/spacing';

type ManakamanaMode = 'same_day' | 'overnight' | 'direct_temple';

function manakamanaPrice(option: ManakamanaOption, mode: ManakamanaMode): number | null {
  if (mode === 'same_day') return option.sameDay;
  if (mode === 'overnight') return option.overnight;
  return option.directTemple ?? null;
}

export function TourDetailScreen() {
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const route = useRoute<RouteProp<ToursStackParamList, 'TourDetail'>>();
  const tour = TOUR_PACKAGES.find((item) => item.detailId === route.params.tourId);

  const [mode, setMode] = useState<ManakamanaMode>('same_day');
  const [optionId, setOptionId] = useState('scorpio');
  const [vehicle, setVehicle] = useState<'scorpio' | 'ev_van'>('scorpio');
  const [pax, setPax] = useState(8);

  const option = MANAKAMANA_OPTIONS.find((item) => item.id === optionId) ?? MANAKAMANA_OPTIONS[2];
  const paxRates = vehicle === 'scorpio'
    ? route.params.tourId === 'kalinchowk'
      ? KALINCHOWK_SCORPIO
      : MUKTINATH_SCORPIO
    : route.params.tourId === 'kalinchowk'
      ? KALINCHOWK_EV_VAN
      : MUKTINATH_EV_VAN;

  const selectedPax = paxRates.find((item) => item.pax === pax) ?? paxRates[0];

  const quote = useMemo(() => {
    if (route.params.tourId === 'manakamana') {
      const price = manakamanaPrice(option, mode);
      return price ? { amount: price, note: `${option.name} · ${mode.replace('_', ' ')}` } : null;
    }
    return {
      amount: selectedPax.perPersonRate * selectedPax.pax,
      note: `${selectedPax.pax} pax · ${formatNprAmount(selectedPax.perPersonRate)} per person`,
    };
  }, [mode, option, route.params.tourId, selectedPax]);

  if (!tour) {
    return (
      <Screen>
        <Text style={styles.missing}>Tour not found.</Text>
      </Screen>
    );
  }

  const faqs =
    route.params.tourId === 'manakamana'
      ? MANAKAMANA_FAQS
      : route.params.tourId === 'muktinath'
        ? MUKTINATH_FAQS
        : KALINCHOWK_FAQS;

  return (
    <Screen padded={false}>
      <RemoteImage uri={tour.image} fallback={tour.title} style={styles.hero} />
      <View style={styles.body}>
        <Text style={styles.badge}>{tour.badge}</Text>
        <Text style={styles.title}>{tour.title}</Text>
        <Text style={styles.route}>{tour.route}</Text>
        <Text style={styles.copy}>{tour.subtitle}</Text>

        {route.params.tourId === 'manakamana' ? (
          <>
            <SectionHeader tag="ESTIMATE" title="Choose trip style" />
            <View style={styles.chips}>
              {(['same_day', 'overnight', 'direct_temple'] as const).map((item) => (
                <Pressable key={item} onPress={() => setMode(item)} style={[styles.chip, mode === item && styles.chipActive]}>
                  <Text style={[styles.chipText, mode === item && styles.chipTextActive]}>
                    {item === 'same_day' ? 'Same day' : item === 'overnight' ? 'Overnight' : 'Direct temple'}
                  </Text>
                </Pressable>
              ))}
            </View>
            {MANAKAMANA_OPTIONS.map((item) => {
              const price = manakamanaPrice(item, mode);
              if (price == null) return null;
              const active = item.id === optionId;
              return (
                <Pressable key={item.id} onPress={() => setOptionId(item.id)}>
                  <Card style={[styles.option, active && styles.optionActive]}>
                    <Text style={styles.optionTitle}>{item.name}</Text>
                    <Text style={styles.optionMeta}>{item.capacity}</Text>
                    <Text style={styles.optionPrice}>{formatNprAmount(price)}</Text>
                  </Card>
                </Pressable>
              );
            })}
          </>
        ) : (
          <>
            <SectionHeader
              tag="PER PERSON"
              title={tour.duration}
            />
            <View style={styles.chips}>
              {(['scorpio', 'ev_van'] as const).map((item) => (
                <Pressable
                  key={item}
                  onPress={() => {
                    setVehicle(item);
                    setPax(item === 'scorpio' ? 8 : 12);
                  }}
                  style={[styles.chip, vehicle === item && styles.chipActive]}
                >
                  <Text style={[styles.chipText, vehicle === item && styles.chipTextActive]}>
                    {item === 'scorpio' ? 'Scorpio 4x4' : 'EV Van'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.chips}>
              {paxRates.map((item) => (
                <Pressable key={item.pax} onPress={() => setPax(item.pax)} style={[styles.chip, pax === item.pax && styles.chipActive]}>
                  <Text style={[styles.chipText, pax === item.pax && styles.chipTextActive]}>
                    {item.pax} pax · {formatNprAmount(item.perPersonRate)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {quote ? (
          <QuoteCard
            label={quote.note}
            amount={formatNprAmount(quote.amount)}
            note="Dispatch confirms the final itinerary by phone or WhatsApp."
            onBook={() =>
              navigateToBook(navigation, {
                vehicleTypeId:
                  route.params.tourId === 'manakamana'
                    ? option.vehicleTypeId
                    : vehicle === 'ev_van'
                      ? 3
                      : 2,
                pickupLocation: tour.pickupLocation,
                dropoffLocation: tour.dropoffLocation,
                tripType: 'Round Trip',
                passengerCount: route.params.tourId === 'manakamana' ? undefined : selectedPax.pax,
                additionalDetails: `${tour.title}. ${quote.note}. Package ${formatNprAmount(quote.amount)}.`,
              })
            }
          />
        ) : null}

        <SectionHeader tag="FAQ" title="Package questions" />
        <FaqList items={faqs} />
      </View>
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  hero: {
    width: '100%',
    height: 220,
    backgroundColor: colors.navy,
  },
  body: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  badge: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 12,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 6,
  },
  route: {
    color: colors.muted,
    marginTop: 4,
    fontWeight: '700',
  },
  copy: {
    color: colors.muted,
    marginTop: spacing.md,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  chipText: {
    color: colors.muted,
    fontWeight: '700',
    fontSize: 13,
  },
  chipTextActive: {
    color: colors.onNavy,
  },
  option: {
    marginBottom: spacing.md,
  },
  optionActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  optionTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  optionMeta: {
    color: colors.muted,
    marginTop: 4,
  },
  optionPrice: {
    color: colors.text,
    fontWeight: '800',
    marginTop: 8,
  },
  missing: {
    color: colors.muted,
  },
  });
}
