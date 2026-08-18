import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ThemeColors } from '../../theme/colors';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { spacing } from '../../theme/spacing';
import type { PublicReviewDto } from '../../types/api';
import { relativeTime } from '../../utils/dates';
import { Card } from './Card';

export const ReviewCard = memo(function ReviewCard({ review }: { review: PublicReviewDto }) {
  const styles = useThemedStyles(createStyles);
  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.name}>{review.customer_name}</Text>
        <Text style={styles.stars}>{'★'.repeat(Math.max(1, Math.min(5, review.rating)))}</Text>
      </View>
      {review.trip_title ? <Text style={styles.trip}>{review.trip_title}</Text> : null}
      {review.created_at ? <Text style={styles.when}>{relativeTime(review.created_at)}</Text> : null}
      <Text style={styles.comment}>{review.comment}</Text>
    </Card>
  );
});

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      marginBottom: spacing.md,
    },
    top: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    name: {
      color: colors.text,
      fontWeight: '800',
      flex: 1,
    },
    stars: {
      color: colors.highlight,
      fontWeight: '800',
    },
    trip: {
      color: colors.accent,
      marginTop: 4,
      fontSize: 12,
      fontWeight: '700',
    },
    when: {
      color: colors.subtle,
      marginTop: 2,
      fontSize: 12,
    },
    comment: {
      color: colors.muted,
      marginTop: spacing.sm,
      lineHeight: 21,
    },
  });
}
