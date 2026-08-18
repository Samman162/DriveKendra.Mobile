import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TourPackage } from '../../content/tours';
import type { ThemeColors } from '../../theme/colors';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { radius, spacing } from '../../theme/spacing';
import { Card } from './Card';
import { RemoteImage } from './RemoteImage';

export function TourCard({
  tour,
  onPress,
}: {
  tour: TourPackage;
  onPress: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable onPress={onPress}>
      <Card padded={false} style={styles.card}>
        <View>
          <RemoteImage uri={tour.image} fallback={tour.title} style={styles.image} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{tour.badge}</Text>
          </View>
          <View style={styles.duration}>
            <Text style={styles.durationText}>{tour.duration}</Text>
          </View>
        </View>
        <View style={styles.body}>
          <Text style={styles.route}>{tour.route}</Text>
          <Text style={styles.title}>{tour.title}</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {tour.subtitle}
          </Text>
          <View style={styles.footer}>
            <View>
              <Text style={styles.priceLabel}>Package starting</Text>
              <Text style={styles.price}>{tour.price}</Text>
            </View>
            <Text style={styles.cta}>View details →</Text>
          </View>
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
    height: 168,
    backgroundColor: colors.navySoft,
  },
  badge: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  badgeText: {
    color: colors.onAccent,
    fontSize: 11,
    fontWeight: '800',
  },
  duration: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: 'rgba(15,23,42,0.82)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  durationText: {
    color: colors.onNavy,
    fontSize: 11,
    fontWeight: '700',
  },
  body: {
    padding: spacing.lg,
  },
  route: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  subtitle: {
    color: colors.muted,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.md,
  },
  priceLabel: {
    color: colors.subtle,
    fontSize: 12,
  },
  price: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  cta: {
    color: colors.accent,
    fontWeight: '800',
  },
  });
}
