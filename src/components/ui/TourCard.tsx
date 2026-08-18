import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, Clock, MapPin, Sparkles } from 'lucide-react-native';

import type { TourPackage } from '../../content/tours';
import type { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { radius, spacing } from '../../theme/spacing';
import { hapticFeedback } from '../../utils/haptics';
import { Card } from './Card';
import { RemoteImage } from './RemoteImage';

export const TourCard = memo(function TourCard({
  tour,
  onPress,
}: {
  tour: TourPackage;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const handlePress = () => {
    hapticFeedback.light();
    onPress();
  };

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => pressed && styles.cardPressed}>
      <Card padded={false} style={styles.card}>
        <View style={styles.imageWrap}>
          <RemoteImage uri={tour.image} fallback={tour.title} style={styles.image} />
          <View style={styles.badge}>
            <Sparkles size={11} color={colors.onAccent} style={{ marginRight: 4 }} />
            <Text style={styles.badgeText}>{tour.badge}</Text>
          </View>
          <View style={styles.duration}>
            <Clock size={12} color={colors.onNavy} style={{ marginRight: 4 }} />
            <Text style={styles.durationText}>{tour.duration}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.routeRow}>
            <MapPin size={13} color={colors.accent} />
            <Text style={styles.route}>{tour.route}</Text>
          </View>
          <Text style={styles.title}>{tour.title}</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {tour.subtitle}
          </Text>

          <View style={styles.footer}>
            <View>
              <Text style={styles.priceLabel}>All-inclusive Package</Text>
              <Text style={styles.price}>{tour.price}</Text>
            </View>
            <View style={styles.actionBtn}>
              <Text style={styles.cta}>Explore Tour</Text>
              <ChevronRight size={15} color={colors.accent} />
            </View>
          </View>
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
    cardPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.99 }],
    },
    imageWrap: {
      position: 'relative',
    },
    image: {
      width: '100%',
      height: 170,
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
      flexDirection: 'row',
      alignItems: 'center',
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
      backgroundColor: 'rgba(15,23,42,0.85)',
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
    },
    durationText: {
      color: colors.onNavy,
      fontSize: 11,
      fontWeight: '700',
    },
    body: {
      padding: spacing.md,
    },
    routeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 2,
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
      marginTop: 2,
    },
    subtitle: {
      color: colors.muted,
      marginTop: spacing.xs,
      fontSize: 13,
      lineHeight: 18,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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
    price: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '900',
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.accentSoft,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: radius.pill,
      gap: 2,
    },
    cta: {
      color: colors.accent,
      fontWeight: '800',
      fontSize: 13,
    },
  });
}
