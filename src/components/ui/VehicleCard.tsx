import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { FleetVehicle } from '../../content/vehicles';
import type { ThemeColors } from '../../theme/colors';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { radius, spacing } from '../../theme/spacing';
import { Button } from './Button';
import { Card } from './Card';

export function VehicleCard({
  vehicle,
  onBook,
}: {
  vehicle: FleetVehicle;
  onBook: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <Card padded={false} style={styles.card}>
      <View>
        <Image source={{ uri: vehicle.image }} style={styles.image} />
        <View style={styles.tag}>
          <Text style={styles.tagText}>{vehicle.tag}</Text>
        </View>
        <View style={styles.rating}>
          <Text style={styles.ratingText}>★ {vehicle.rating.toFixed(1)}</Text>
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.name}>{vehicle.name}</Text>
        <View style={styles.specs}>
          <Text style={styles.spec}>{vehicle.seats} seats</Text>
          <Text style={styles.spec}>{vehicle.luggage} bags</Text>
          <Text style={styles.spec}>{vehicle.fuel}</Text>
        </View>
        <View style={styles.features}>
          {vehicle.features.slice(0, 3).map((feature) => (
            <View key={feature} style={styles.chip}>
              <Text style={styles.chipText}>{feature}</Text>
            </View>
          ))}
        </View>
        <View style={styles.footer}>
          <View>
            <Text style={styles.priceLabel}>Starts at</Text>
            <Text style={styles.price}>
              {vehicle.pricePerDay}
              <Text style={styles.per}> /day</Text>
            </Text>
          </View>
          <View style={styles.cta}>
            <Button label="Book" onPress={onBook} />
          </View>
        </View>
      </View>
    </Card>
  );
}

export function VehicleStripCard({
  vehicle,
  onPress,
}: {
  vehicle: FleetVehicle;
  onPress: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable onPress={onPress} style={styles.stripWrap}>
      <Card padded={false} style={styles.strip}>
        <Image source={{ uri: vehicle.image }} style={styles.stripImage} />
        <View style={styles.stripBody}>
          <Text style={styles.stripTag}>{vehicle.tag}</Text>
          <Text style={styles.stripName} numberOfLines={2}>
            {vehicle.name}
          </Text>
          <Text style={styles.stripPrice}>{vehicle.pricePerDay}</Text>
        </View>
      </Card>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
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
    backgroundColor: 'rgba(15,23,42,0.82)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  ratingText: {
    color: colors.highlight,
    fontWeight: '800',
    fontSize: 12,
  },
  body: {
    padding: spacing.lg,
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  specs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  spec: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chip: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  chipText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  priceLabel: {
    color: colors.subtle,
    fontSize: 12,
    fontWeight: '600',
  },
  price: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  per: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
  },
  cta: {
    minWidth: 110,
  },
  stripWrap: {
    width: 220,
    marginRight: spacing.md,
  },
  strip: {
    overflow: 'hidden',
  },
  stripImage: {
    width: '100%',
    height: 110,
    backgroundColor: colors.navySoft,
  },
  stripBody: {
    padding: spacing.md,
  },
  stripTag: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
  },
  stripName: {
    color: colors.text,
    fontWeight: '800',
    marginTop: 4,
    minHeight: 40,
  },
  stripPrice: {
    color: colors.text,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  });
}
