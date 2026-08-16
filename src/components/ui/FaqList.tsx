import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { FaqItem } from '../../content/tourDetails';
import type { ThemeColors } from '../../theme/colors';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { spacing } from '../../theme/spacing';
import { Card } from './Card';

export function FaqList({ items }: { items: FaqItem[] }) {
  const styles = useThemedStyles(createStyles);
  const [open, setOpen] = useState(0);

  return (
    <View>
      {items.map((item, index) => {
        const expanded = open === index;
        return (
          <Pressable key={item.question} onPress={() => setOpen(expanded ? -1 : index)}>
            <Card style={styles.card}>
              <Text style={styles.question}>{item.question}</Text>
              {expanded ? <Text style={styles.answer}>{item.answer}</Text> : null}
            </Card>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      marginBottom: spacing.md,
    },
    question: {
      color: colors.text,
      fontWeight: '800',
      fontSize: 15,
    },
    answer: {
      color: colors.muted,
      marginTop: spacing.sm,
      lineHeight: 21,
    },
  });
}
