import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Fuel, Luggage, Star, Users } from 'lucide-react-native';

import type { FleetVehicle } from '../../content/vehicles';
import type { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { radius, spacing } from '../../theme/spacing';
import { hapticFeedback } from '../../utils/haptics';
import { Button } from './Button';
import { Card } from './Card';
import { RemoteImage } from './RemoteImage';

export const VehicleCard = memo(function VehicleCard({
  vehicle,
  onBook,
}: {
  vehicle: FleetVehicle;
  onBook: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Card padded={false} style={styles.card}>
      <View style={styles.imageContainer}>
        <RemoteImage uri={vehicle.image} fallback={vehicle.name} style={styles.image} />
        <View style={styles.tag}>
          <Text style={styles.tagText}>{vehicle.tag}</Text>
        </View>
        <View style={styles.rating}>
          <Star size={12} color={colors.highlight} fill={colors.highlight} style={{ marginRight: 3 }} />
          <Text style={styles.ratingText}>{vehicle.rating.toFixed(1)}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{vehicle.name}</Text>
        </View>

        {/* Spec Chips Row */}
        <View style={styles.specsRow}>
          <View style={styles.specChip}>
            <Users size={13} color={colors.accent} />
            <Text style={styles.specText}>{vehicle.seats} Seats</Text>
          </View>
          <View style={styles.specChip}>
            <Luggage size={13} color={colors.accent} />
            <Text style={styles.specText}>{vehicle.luggage} Bags</Text>
          </View>
          <View style={styles.specChip}>
            <Fuel size={13} color={colors.accent} />
            <Text style={styles.specText}>{vehicle.fuel}</Text>
          </View>
        </View>

        {/* Highlight Features */}
        <View style={styles.features}>
          {vehicle.features.slice(0, 3).map((feature) => (
            <View key={feature} style={styles.featurePill}>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Bottom Price & CTA */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.priceLabel}>Daily Chauffeur Rate</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{vehicle.pricePerDay}</Text>
              <Text style={styles.per}>/day</Text>
            </View>
          </View>
          <View style={styles.cta}>
            <Button
              label="Instant Book"
              onPress={() => {
                hapticFeedback.light();
                onBook();
              }}
              size="sm"
            />
          </View>
        </View>
      </View>
    </Card>
  );
});

export const VehicleStripCard = memo(function VehicleStripCard({
  vehicle,
  onPress,
}: {
  vehicle: FleetVehicle;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const handlePress = () => {
    hapticFeedback.selection();
    onPress();
  };

  return (
    <Pressable onPress={handlePress} style={styles.stripWrap}>
      <Card padded={false} style={styles.strip}>
        <View style={styles.stripImageWrap}>
          <RemoteImage uri={vehicle.image} fallback={vehicle.name} style={styles.stripImage} />
          <View style={styles.stripTag}>
            <Text style={styles.stripTagText}>{vehicle.tag}</Text>
          </View>
        </View>
        <View style={styles.stripBody}>
          <Text style={styles.stripName} numberOfLines={1}>
            {vehicle.name}
          </Text>
          <View style={styles.stripSpecRow}>
            <Text style={styles.stripSeats}>{vehicle.seats} Seats</Text>
            <Text style={styles.stripDot}>•</Text>
            <Text style={styles.stripRating}>★ {vehicle.rating.toFixed(1)}</Text>
          </View>
          <Text style={styles.stripPrice}>{vehicle.pricePerDay}<Text style={styles.stripPer}>/day</Text></Text>
        </View>
      </Card>
    </Pressable>
  );
});

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      marginBottom: spacing.md,
      overflow: 'hidden',
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    imageContainer: {
      position: 'relative',
    },
    image: {
      width: '100%',
      height: 175,
      backgroundColor: colors.navySoft,
    },
    tag: {
      position: 'absolute',
      left: spacing.md,
      bottom: spacing.md,
      backgroundColor: colors.accent,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 4,
    },
    tagText: {
      color: colors.onAccent,
      fontSize: 11,
      fontWeight: '800',
    },
    rating: {
      position: 'absolute',
      right: spacing.md,
      top: spacing.md,
      backgroundColor: 'rgba(15,23,42,0.85)',
      borderRadius: radius.pill,
      paddingHorizontal: 8,
      paddingVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
    },
    ratingText: {
      color: colors.onNavy,
      fontWeight: '800',
      fontSize: 12,
    },
    body: {
      padding: spacing.md,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    name: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
    },
    specsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    specChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.elevated,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    specText: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: '600',
    },
    features: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: spacing.sm,
    },
    featurePill: {
      backgroundColor: colors.accentSoft,
      borderRadius: radius.pill,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    featureText: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: '700',
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    priceLabel: {
      color: colors.subtle,
      fontSize: 11,
      fontWeight: '600',
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    price: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '900',
    },
    per: {
      fontSize: 12,
      color: colors.muted,
      fontWeight: '600',
      marginLeft: 2,
    },
    cta: {
      minWidth: 120,
    },
    stripWrap: {
      width: 220,
      marginRight: spacing.md,
    },
    strip: {
      overflow: 'hidden',
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    stripImageWrap: {
      position: 'relative',
    },
    stripImage: {
      width: '100%',
      height: 110,
      backgroundColor: colors.navySoft,
    },
    stripTag: {
      position: 'absolute',
      left: spacing.sm,
      top: spacing.sm,
      backgroundColor: colors.accent,
      borderRadius: radius.pill,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    stripTagText: {
      color: colors.onAccent,
      fontSize: 10,
      fontWeight: '800',
    },
    stripBody: {
      padding: spacing.sm + 2,
    },
    stripName: {
      color: colors.text,
      fontWeight: '800',
      fontSize: 14,
    },
    stripSpecRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    stripSeats: {
      fontSize: 12,
      color: colors.muted,
      fontWeight: '600',
    },
    stripDot: {
      color: colors.subtle,
    },
    stripRating: {
      fontSize: 12,
      color: colors.accent,
      fontWeight: '700',
    },
    stripPrice: {
      color: colors.text,
      fontWeight: '800',
      fontSize: 15,
      marginTop: spacing.xs,
    },
    stripPer: {
      fontSize: 11,
      color: colors.muted,
      fontWeight: '500',
    },
  });
}
