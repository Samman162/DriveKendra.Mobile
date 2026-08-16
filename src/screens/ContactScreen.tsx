import * as Linking from 'expo-linking';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '../components/ui/Card';
import { Screen } from '../components/ui/Screen';
import { CONTACT_INFO } from '../constants/contact';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

export function ContactScreen() {
  return (
    <Screen>
      <Text style={styles.brand}>{CONTACT_INFO.brandName}</Text>
      <Text style={styles.tagline}>{CONTACT_INFO.tagline}</Text>

      <ContactRow
        icon={<Phone color={colors.accent} size={20} />}
        label="Call dispatch"
        value={CONTACT_INFO.phoneDisplay}
        onPress={() => Linking.openURL(CONTACT_INFO.telLink)}
      />
      <ContactRow
        icon={<MessageCircle color={colors.success} size={20} />}
        label="WhatsApp"
        value={CONTACT_INFO.whatsappNumber}
        onPress={() => Linking.openURL(CONTACT_INFO.whatsappLink)}
      />
      <ContactRow
        icon={<Mail color={colors.highlight} size={20} />}
        label="Email"
        value={CONTACT_INFO.email}
        onPress={() => Linking.openURL(CONTACT_INFO.mailtoLink)}
      />
      <ContactRow
        icon={<MapPin color={colors.muted} size={20} />}
        label="Office"
        value={`${CONTACT_INFO.address}\n${CONTACT_INFO.cityCountry}`}
      />
    </Screen>
  );
}

function ContactRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={styles.rowWrap}>
      <Card style={styles.row}>
        <View style={styles.icon}>{icon}</View>
        <View style={styles.body}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  brand: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  tagline: {
    color: colors.muted,
    marginBottom: spacing.xl,
    marginTop: spacing.xs,
  },
  rowWrap: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  value: {
    color: colors.text,
    fontSize: 16,
    marginTop: 2,
    lineHeight: 22,
  },
});
