import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Fuel,
  Info,
  MapPin,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react-native';

import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FaqList } from '../components/ui/FaqList';
import { RemoteImage } from '../components/ui/RemoteImage';
import { Screen } from '../components/ui/Screen';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Stepper } from '../components/ui/Stepper';
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
import { useTheme } from '../theme/ThemeProvider';
import { useThemedStyles } from '../theme/useThemedStyles';
import { radius, spacing } from '../theme/spacing';
import { hapticFeedback } from '../utils/haptics';

type ManakamanaMode = 'same_day' | 'overnight' | 'direct_temple';

function manakamanaPrice(option: ManakamanaOption, mode: ManakamanaMode): number | null {
  if (mode === 'same_day') return option.sameDay;
  if (mode === 'overnight') return option.overnight;
  return option.directTemple ?? null;
}

export function TourDetailScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const route = useRoute<RouteProp<ToursStackParamList, 'TourDetail'>>();
  const tour = TOUR_PACKAGES.find((item) => item.detailId === route.params.tourId);

  const [mode, setMode] = useState<ManakamanaMode>('same_day');
  const [optionId, setOptionId] = useState('scorpio');
  const [vehicle, setVehicle] = useState<'scorpio' | 'ev_van'>('scorpio');
  const [pax, setPax] = useState(8);

  const option = MANAKAMANA_OPTIONS.find((item) => item.id === optionId) ?? MANAKAMANA_OPTIONS[2];
  const paxRates =
    vehicle === 'scorpio'
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
      return price ? { amount: price, note: `${option.name} • ${mode.replace('_', ' ')}` } : null;
    }
    return {
      amount: selectedPax.perPersonRate * selectedPax.pax,
      note: `${selectedPax.pax} passengers • ${formatNprAmount(selectedPax.perPersonRate)} per person`,
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Image with Overlay Badges */}
        <View style={styles.heroWrap}>
          <RemoteImage uri={tour.image} fallback={tour.title} style={styles.hero} />
          <View style={styles.heroBadge}>
            <Sparkles size={12} color={colors.onAccent} style={{ marginRight: 4 }} />
            <Text style={styles.heroBadgeText}>{tour.badge}</Text>
          </View>
          <View style={styles.heroDuration}>
            <Clock size={12} color={colors.onNavy} style={{ marginRight: 4 }} />
            <Text style={styles.heroDurationText}>{tour.duration}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.routeRow}>
            <MapPin size={14} color={colors.accent} />
            <Text style={styles.routeText}>{tour.route}</Text>
          </View>

          <Text style={styles.title}>{tour.title}</Text>
          <Text style={styles.subtitle}>{tour.subtitle}</Text>

          {/* Quick Specs Chips */}
          <View style={styles.specsRow}>
            <View style={styles.specChip}>
              <Fuel size={13} color={colors.accent} />
              <Text style={styles.specText}>Fuel & Tolls Included</Text>
            </View>
            <View style={styles.specChip}>
              <Shield size={13} color={colors.accent} />
              <Text style={styles.specText}>Licensed Hill Driver</Text>
            </View>
          </View>

          {/* Manakamana Mode Options */}
          {route.params.tourId === 'manakamana' && (
            <Card style={styles.configCard}>
              <Text style={styles.sectionHeading}>Trip Duration</Text>
              <View style={styles.buttonGroup}>
                <Pressable
                  onPress={() => {
                    hapticFeedback.selection();
                    setMode('same_day');
                  }}
                  style={[styles.groupBtn, mode === 'same_day' && styles.groupBtnActive]}
                >
                  <Text style={[styles.groupBtnText, mode === 'same_day' && styles.groupBtnTextActive]}>
                    Same Day Return
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    hapticFeedback.selection();
                    setMode('overnight');
                  }}
                  style={[styles.groupBtn, mode === 'overnight' && styles.groupBtnActive]}
                >
                  <Text style={[styles.groupBtnText, mode === 'overnight' && styles.groupBtnTextActive]}>
                    Overnight Stay
                  </Text>
                </Pressable>
              </View>

              <Text style={[styles.sectionHeading, { marginTop: spacing.md }]}>Vehicle Type</Text>
              <View style={styles.vehiclePills}>
                {MANAKAMANA_OPTIONS.map((opt) => {
                  const isSelected = optionId === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => {
                        hapticFeedback.selection();
                        setOptionId(opt.id);
                      }}
                      style={[styles.vehiclePill, isSelected && styles.vehiclePillActive]}
                    >
                      <Text style={[styles.vehiclePillText, isSelected && styles.vehiclePillTextActive]}>
                        {opt.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          )}

          {/* Muktinath / Kalinchowk Vehicle & Group Config */}
          {route.params.tourId !== 'manakamana' && (
            <Card style={styles.configCard}>
              <Text style={styles.sectionHeading}>Choose Vehicle</Text>
              <View style={styles.buttonGroup}>
                <Pressable
                  onPress={() => {
                    hapticFeedback.selection();
                    setVehicle('scorpio');
                  }}
                  style={[styles.groupBtn, vehicle === 'scorpio' && styles.groupBtnActive]}
                >
                  <Text style={[styles.groupBtnText, vehicle === 'scorpio' && styles.groupBtnTextActive]}>
                    4x4 Scorpio SUV
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    hapticFeedback.selection();
                    setVehicle('ev_van');
                  }}
                  style={[styles.groupBtn, vehicle === 'ev_van' && styles.groupBtnActive]}
                >
                  <Text style={[styles.groupBtnText, vehicle === 'ev_van' && styles.groupBtnTextActive]}>
                    HiAce / EV Van
                  </Text>
                </Pressable>
              </View>

              <View style={{ marginTop: spacing.md }}>
                <Stepper
                  label="Number of Travelers"
                  value={pax}
                  min={1}
                  max={vehicle === 'scorpio' ? 8 : 14}
                  onChange={(val) => {
                    hapticFeedback.selection();
                    setPax(val);
                  }}
                />
              </View>
            </Card>
          )}

          {/* What's Included Card */}
          <Card style={styles.inclusionsCard}>
            <Text style={styles.sectionHeading}>Package Inclusions</Text>
            <View style={styles.inclusionItem}>
              <CheckCircle2 size={16} color={colors.success} />
              <Text style={styles.inclusionText}>Chauffeur-driven 4WD / Van with hill driving expert</Text>
            </View>
            <View style={styles.inclusionItem}>
              <CheckCircle2 size={16} color={colors.success} />
              <Text style={styles.inclusionText}>All fuel, highway tolls, parking fees, and driver allowances</Text>
            </View>
            <View style={styles.inclusionItem}>
              <CheckCircle2 size={16} color={colors.success} />
              <Text style={styles.inclusionText}>Door-to-door hotel / airport pickup & drop in Kathmandu</Text>
            </View>
          </Card>

          {/* Price Quote Summary & Action */}
          {quote && (
            <Card style={styles.quoteCard}>
              <View style={styles.quoteRow}>
                <View>
                  <Text style={styles.quoteLabel}>Total Package Price</Text>
                  <Text style={styles.quoteAmount}>{formatNprAmount(quote.amount)}</Text>
                  <Text style={styles.quoteNote}>{quote.note}</Text>
                </View>
                <Button
                  label="Book Tour"
                  onPress={() => {
                    navigateToBook(navigation, {
                      tripType: 'Round Trip',
                      additionalDetails: `Tour Package: ${tour.title} (${quote.note})`,
                    });
                  }}
                  variant="primary"
                />
              </View>
            </Card>
          )}

          {/* FAQ Accordion */}
          <View style={{ marginTop: spacing.lg, paddingBottom: 40 }}>
            <SectionHeader tag="FAQ" title="Tour Guidelines" subtitle="Important notes regarding weather & altitude" />
            <FaqList items={faqs} />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    scrollContent: {
      paddingBottom: 40,
    },
    heroWrap: {
      position: 'relative',
    },
    hero: {
      width: '100%',
      height: 230,
      backgroundColor: colors.navySoft,
    },
    heroBadge: {
      position: 'absolute',
      left: spacing.md,
      top: spacing.md,
      backgroundColor: colors.accent,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
    },
    heroBadgeText: {
      color: colors.onAccent,
      fontSize: 11,
      fontWeight: '800',
    },
    heroDuration: {
      position: 'absolute',
      right: spacing.md,
      bottom: spacing.md,
      backgroundColor: 'rgba(15,23,42,0.85)',
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
    },
    heroDurationText: {
      color: colors.onNavy,
      fontSize: 11,
      fontWeight: '700',
    },
    body: {
      padding: spacing.lg,
    },
    routeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 4,
    },
    routeText: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: '700',
    },
    title: {
      fontSize: 24,
      fontWeight: '900',
      color: colors.text,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 14,
      color: colors.muted,
      lineHeight: 20,
    },
    specsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginVertical: spacing.md,
    },
    specChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
    },
    specText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    configCard: {
      marginBottom: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionHeading: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    buttonGroup: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    groupBtn: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      paddingVertical: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    groupBtnActive: {
      backgroundColor: colors.navy,
      borderColor: colors.navy,
    },
    groupBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    groupBtnTextActive: {
      color: colors.onNavy,
    },
    vehiclePills: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    vehiclePill: {
      backgroundColor: colors.surface,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    vehiclePillActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    vehiclePillText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
    },
    vehiclePillTextActive: {
      color: colors.onAccent,
    },
    inclusionsCard: {
      marginBottom: spacing.md,
      gap: spacing.sm,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inclusionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    inclusionText: {
      fontSize: 13,
      color: colors.muted,
      fontWeight: '600',
      flex: 1,
    },
    quoteCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1.5,
      borderColor: colors.accent,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    quoteRow: {
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
    quoteAmount: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.accent,
    },
    quoteNote: {
      fontSize: 11,
      color: colors.muted,
      marginTop: 2,
    },
    missing: {
      color: colors.muted,
      fontSize: 16,
      textAlign: 'center',
      padding: spacing.xl,
    },
  });
}
