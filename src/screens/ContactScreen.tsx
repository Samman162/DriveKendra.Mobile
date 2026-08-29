import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import {
  Clock,
  MessageCircle,
  Phone,
} from 'lucide-react-native';

import { BrandLogo } from '../components/ui/BrandLogo';
import { Card } from '../components/ui/Card';
import { Screen } from '../components/ui/Screen';
import { CONTACT_INFO } from '../constants/contact';
import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeProvider';
import { useThemedStyles } from '../theme/useThemedStyles';
import { radius, spacing } from '../theme/spacing';
import { hapticFeedback } from '../utils/haptics';

export function ContactScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Screen>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.badgeTag}>24/7 SUPPORT DESK</Text>
          <Text style={styles.pageTitle}>Contact & Help Center</Text>
          <Text style={styles.pageSubtitle}>
            Direct dispatch line, WhatsApp support & roadside assistance across Nepal.
          </Text>
        </View>
      </View>

      {/* Quick Dialing Channels */}
      <View style={styles.channelsGrid}>
        <Pressable
          onPress={() => {
            hapticFeedback.light();
            Linking.openURL(CONTACT_INFO.telLink);
          }}
          style={({ pressed }) => [styles.channelCard, pressed && styles.pressed]}
        >
          <View style={[styles.channelIconWrap, { backgroundColor: colors.accentSoft }]}>
            <Phone size={22} color={colors.accent} />
          </View>
          <Text style={styles.channelTitle}>Phone Hotline</Text>
          <Text style={styles.channelValue}>{CONTACT_INFO.phoneDisplay}</Text>
          <Text style={styles.channelStatus}>Instant Call ➔</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            hapticFeedback.light();
            Linking.openURL(CONTACT_INFO.whatsappLink);
          }}
          style={({ pressed }) => [styles.channelCard, pressed && styles.pressed]}
        >
          <View style={[styles.channelIconWrap, { backgroundColor: 'rgba(37, 211, 102, 0.15)' }]}>
            <MessageCircle size={22} color="#25D366" />
          </View>
          <Text style={styles.channelTitle}>WhatsApp 24/7</Text>
          <Text style={styles.channelValue}>{CONTACT_INFO.whatsappNumber}</Text>
          <Text style={[styles.channelStatus, { color: '#25D366' }]}>Live Chat ➔</Text>
        </Pressable>
      </View>

      {/* Office & Operations Location */}
      <Card style={styles.officeCard}>
        <View style={styles.officeHeader}>
          <BrandLogo size="sm" variant="card" style={{ marginRight: spacing.sm }} />
          <View style={styles.officeTextWrap}>
            <Text style={styles.officeTitle}>Drive Kendra Main Hub</Text>
            <Text style={styles.officeSubtitle}>{CONTACT_INFO.address}, {CONTACT_INFO.cityCountry}</Text>
          </View>
        </View>
        <View style={styles.officeHoursRow}>
          <Clock size={15} color={colors.muted} />
          <Text style={styles.officeHoursText}>Dispatch Desk: 24 Hours / 7 Days a Week</Text>
        </View>
      </Card>
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    headerCopy: {
      flex: 1,
    },
    badgeTag: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
      marginBottom: 2,
    },
    pageTitle: {
      fontSize: 24,
      fontWeight: '900',
      color: colors.text,
    },
    pageSubtitle: {
      fontSize: 13,
      color: colors.muted,
      marginTop: 2,
      lineHeight: 18,
    },
    channelsGrid: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    channelCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    channelIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    channelTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.text,
    },
    channelValue: {
      fontSize: 11,
      color: colors.muted,
      marginTop: 2,
    },
    channelStatus: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accent,
      marginTop: 6,
    },
    officeCard: {
      marginBottom: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
    },
    officeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    officeTextWrap: {
      flex: 1,
    },
    officeTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.text,
    },
    officeSubtitle: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
    },
    officeHoursRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.elevated,
      padding: spacing.sm,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    officeHoursText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    pressed: {
      opacity: 0.8,
      transform: [{ scale: 0.98 }],
    },
  });
}
