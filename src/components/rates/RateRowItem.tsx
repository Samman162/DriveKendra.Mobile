import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, Bus, Car, ChevronRight, Gauge, MapPin, Sparkles } from 'lucide-react-native';

import { radius, spacing } from '../../theme/spacing';
import type { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { formatNpr, type RateColumn, type RateItem } from '../../content/rates';
import { hapticFeedback } from '../../utils/haptics';

export interface FlatRateItem extends RateItem {
  id: string;
  categoryId: string;
  categoryTitle: string;
  categoryNumber: number;
}

export interface RateRowItemProps {
  item: FlatRateItem;
  onSelectVehicleFare: (item: FlatRateItem, vehicleTypeId: 1 | 2 | 3 | 4, label: string, fare: string) => void;
}

const VEHICLE_PREVIEWS: Array<{
  columnKey: RateColumn;
  vehicleTypeId: 1 | 2 | 3 | 4;
  label: string;
  seats: string;
  badge?: string;
}> = [
  { columnKey: 'car', vehicleTypeId: 1, label: 'Sedan', seats: '1-3 Pax' },
  { columnKey: 'hiaceJeep', vehicleTypeId: 2, label: 'Scorpio 4x4', seats: '4-6 Pax', badge: 'Hills Ready' },
  { columnKey: 'van', vehicleTypeId: 3, label: 'HiAce Van', seats: '7-14 Pax' },
  { columnKey: 'coaster', vehicleTypeId: 4, label: 'Coaster', seats: '15-25 Pax' },
];

export const RateRowItem = memo(
  function RateRowItem({ item, onSelectVehicleFare }: RateRowItemProps) {
    const { colors } = useTheme();
    const styles = useThemedStyles(createStyles);

    const isHimalayan =
      item.trip.toLowerCase().includes('muktinath') ||
      item.trip.toLowerCase().includes('jomsom') ||
      item.trip.toLowerCase().includes('kalinchowk') ||
      item.trip.toLowerCase().includes('langtang') ||
      item.trip.toLowerCase().includes('everest');

    return (
      <View style={styles.cardContainer}>
        {/* Route Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.titleColumn}>
            <View style={styles.destinationRow}>
              <MapPin size={15} color={colors.accent} style={{ marginTop: 1 }} />
              <Text style={styles.destinationText} numberOfLines={2}>
                {item.trip}
              </Text>
            </View>
            <View style={styles.categoryBadgeRow}>
              <Text style={styles.categoryTag}>{item.categoryTitle}</Text>
              {isHimalayan && (
                <View style={styles.himalayanPill}>
                  <Sparkles size={10} color="#D97706" />
                  <Text style={styles.himalayanPillText}>4WD Recommended</Text>
                </View>
              )}
            </View>
          </View>

          {item.km && item.km !== '-' && (
            <View style={styles.kmBadge}>
              <Gauge size={12} color={colors.accent} />
              <Text style={styles.kmText}>{item.km} KM</Text>
            </View>
          )}
        </View>

        {/* Multi-Vehicle Price Comparison Grid */}
        <View style={styles.vehicleGrid}>
          {VEHICLE_PREVIEWS.map((v) => {
            const rawFare = item[v.columnKey];
            const fareFormatted = formatNpr(rawFare);

            return (
              <Pressable
                key={v.columnKey}
                style={({ pressed }) => [
                  styles.vehiclePill,
                  v.vehicleTypeId === 2 && isHimalayan && styles.vehiclePillHighlighted,
                  pressed && styles.vehiclePillPressed,
                ]}
                onPress={() => {
                  hapticFeedback.light();
                  onSelectVehicleFare(item, v.vehicleTypeId, v.label, fareFormatted);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Book ${v.label} for ${item.trip} at ${fareFormatted}`}
              >
                <View style={styles.pillTopRow}>
                  <Text style={styles.vehicleTypeLabel}>{v.label}</Text>
                  <Text style={styles.paxLabel}>{v.seats}</Text>
                </View>
                <Text style={styles.fareValue} numberOfLines={1}>
                  {fareFormatted}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Quick Booking Row */}
        <Pressable
          style={styles.quickBookBar}
          onPress={() => {
            hapticFeedback.selection();
            onSelectVehicleFare(
              item,
              isHimalayan ? 2 : 1,
              isHimalayan ? 'Scorpio 4x4' : 'Sedan',
              formatNpr(isHimalayan ? item.hiaceJeep : item.car),
            );
          }}
          accessibilityRole="button"
          accessibilityLabel={`Instant reservation for ${item.trip}`}
        >
          <Text style={styles.quickBookText}>Instant Chauffeur Reservation</Text>
          <View style={styles.quickBookRight}>
            <Text style={styles.quickBookSub}>Kathmandu ➔ Destination</Text>
            <ChevronRight size={14} color={colors.accent} />
          </View>
        </Pressable>
      </View>
    );
  },
  (prev, next) =>
    prev.item.id === next.item.id &&
    prev.item.trip === next.item.trip &&
    prev.item.car === next.item.car &&
    prev.item.hiaceJeep === next.item.hiaceJeep &&
    prev.item.van === next.item.van &&
    prev.item.coaster === next.item.coaster,
);

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    cardContainer: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.sm,
    },
    titleColumn: {
      flex: 1,
      marginRight: spacing.xs,
    },
    destinationRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
    },
    destinationText: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.text,
      flex: 1,
      lineHeight: 20,
    },
    categoryBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
      flexWrap: 'wrap',
    },
    categoryTag: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.subtle,
      backgroundColor: colors.elevated,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.sm,
    },
    himalayanPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colors.accentSoft,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.sm,
    },
    himalayanPillText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#D97706',
    },
    kmBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.accentSoft,
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    kmText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accent,
    },
    vehicleGrid: {
      flexDirection: 'row',
      gap: 6,
      marginVertical: spacing.xs,
    },
    vehiclePill: {
      flex: 1,
      backgroundColor: colors.elevated,
      borderRadius: radius.md,
      paddingVertical: 7,
      paddingHorizontal: 6,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    vehiclePillHighlighted: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    vehiclePillPressed: {
      opacity: 0.7,
      borderColor: colors.accent,
    },
    pillTopRow: {
      alignItems: 'center',
      marginBottom: 2,
    },
    vehicleTypeLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.muted,
      textTransform: 'uppercase',
    },
    paxLabel: {
      fontSize: 8,
      color: colors.subtle,
      fontWeight: '600',
    },
    fareValue: {
      fontSize: 12,
      fontWeight: '900',
      color: colors.text,
      marginTop: 2,
    },
    quickBookBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.xs,
      paddingTop: spacing.xs + 2,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    quickBookText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.accent,
    },
    quickBookRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    quickBookSub: {
      fontSize: 10,
      color: colors.subtle,
      fontWeight: '600',
    },
  });
}
