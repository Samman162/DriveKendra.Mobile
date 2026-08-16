import { StyleSheet, Text, View } from 'react-native';

import type { ThemeColors } from '../../theme/colors';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { spacing } from '../../theme/spacing';
import { Button } from './Button';
import { Card } from './Card';

export function QuoteCard({
  label,
  amount,
  note,
  onBook,
}: {
  label: string;
  amount: string;
  note?: string;
  onBook: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <Card style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.amount}>{amount}</Text>
      {note ? <Text style={styles.note}>{note}</Text> : null}
      <View style={styles.cta}>
        <Button label="Book this trip" onPress={onBook} />
      </View>
    </Card>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.navy,
      borderColor: colors.navySoft,
    },
    label: {
      color: '#CBD5E1',
      fontSize: 13,
      fontWeight: '700',
    },
    amount: {
      color: colors.highlight,
      fontSize: 28,
      fontWeight: '800',
      marginTop: 4,
    },
    note: {
      color: '#94A3B8',
      marginTop: spacing.xs,
      lineHeight: 20,
    },
    cta: {
      marginTop: spacing.lg,
    },
  });
}
