import { useState } from 'react';
import * as Linking from 'expo-linking';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { submitReview } from '../api/reviews';
import { HoneypotField } from '../components/honeypot/HoneypotField';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FaqList } from '../components/ui/FaqList';
import { Screen } from '../components/ui/Screen';
import { SectionHeader } from '../components/ui/SectionHeader';
import { SuccessModal } from '../components/ui/SuccessModal';
import { TextField } from '../components/ui/TextField';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { CONTACT_INFO } from '../constants/contact';
import { LIMITS } from '../constants/validation';
import { HOME_FAQS } from '../content/faqs';
import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeProvider';
import { useThemedStyles } from '../theme/useThemedStyles';
import { radius, spacing } from '../theme/spacing';
import { extractErrorMessage } from '../utils/errors';

export function ContactScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [name, setName] = useState('');
  const [trip, setTrip] = useState('');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const onSubmit = async () => {
    setError('');
    if (!name.trim() || !comment.trim()) {
      setError('Please add your name and review.');
      return;
    }
    setSubmitting(true);
    try {
      await submitReview({
        customer_name: name.trim(),
        comment: comment.trim(),
        rating,
        trip_title: trip.trim() || null,
        website_hp: '',
      });
      setName('');
      setTrip('');
      setComment('');
      setRating(5);
      setSuccess(true);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not submit review.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <SectionHeader tag="DISPATCH DESK" title={CONTACT_INFO.brandName} subtitle={CONTACT_INFO.tagline} />
        </View>
        <ThemeToggle variant="onSurface" />
      </View>

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
        icon={<Mail color={colors.navy} size={20} />}
        label="Email"
        value={CONTACT_INFO.email}
        onPress={() => Linking.openURL(CONTACT_INFO.mailtoLink)}
      />
      <ContactRow
        icon={<MapPin color={colors.muted} size={20} />}
        label="Office"
        value={`${CONTACT_INFO.address}\n${CONTACT_INFO.cityCountry}`}
      />

      <SectionHeader tag="FAQ" title="Common questions" />
      <FaqList items={HOME_FAQS} />

      <SectionHeader tag="WRITE A REVIEW" title="Share your trip" subtitle="Reviews appear after our team approves them." />
      <HoneypotField />
      <TextField
        label="Your name *"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        maxLength={LIMITS.reviewName}
      />
      <Text style={styles.label}>Rating *</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((value) => (
          <Pressable key={value} onPress={() => setRating(value)} style={[styles.star, rating >= value && styles.starOn]}>
            <Text style={[styles.starText, rating >= value && styles.starTextOn]}>{value}★</Text>
          </Pressable>
        ))}
      </View>
      <TextField
        label="Trip title"
        value={trip}
        onChangeText={setTrip}
        placeholder="Manakamana, TIA pickup…"
        maxLength={LIMITS.reviewTrip}
      />
      <TextField
        label="Your review *"
        value={comment}
        onChangeText={setComment}
        multiline
        maxLength={LIMITS.reviewComment}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button label="Submit review" onPress={onSubmit} loading={submitting} />

      <SuccessModal
        visible={success}
        title="Thank you"
        message="Your review was submitted and will appear after approval."
        onClose={() => setSuccess(false)}
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
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={styles.rowWrap}>
      <Card style={styles.row}>
        <View style={styles.icon}>{icon}</View>
        <View style={styles.body}>
          <Text style={styles.rowLabel}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      </Card>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    headerCopy: {
      flex: 1,
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
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.elevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      flex: 1,
    },
    rowLabel: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: '700',
    },
    value: {
      color: colors.text,
      fontSize: 16,
      marginTop: 2,
      lineHeight: 22,
      fontWeight: '700',
    },
    label: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: '600',
      marginBottom: spacing.sm,
    },
    stars: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    star: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
    },
    starOn: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
    },
    starText: {
      color: colors.subtle,
      fontWeight: '800',
    },
    starTextOn: {
      color: colors.accent,
    },
    error: {
      color: colors.error,
      marginBottom: spacing.md,
    },
  });
}
