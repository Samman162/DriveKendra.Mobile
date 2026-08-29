import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import {
  Clock,
  Headphones,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  Star,
} from 'lucide-react-native';

import { submitReview } from '../api/reviews';
import { HoneypotField } from '../components/honeypot/HoneypotField';
import { BrandLogo } from '../components/ui/BrandLogo';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FaqList } from '../components/ui/FaqList';
import { Screen } from '../components/ui/Screen';
import { SectionHeader } from '../components/ui/SectionHeader';
import { SuccessModal } from '../components/ui/SuccessModal';
import { TextField } from '../components/ui/TextField';
import { CONTACT_INFO } from '../constants/contact';
import { LIMITS } from '../constants/validation';
import { HOME_FAQS } from '../content/faqs';
import { useAuth } from '../context/AuthContext';
import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeProvider';
import { useThemedStyles } from '../theme/useThemedStyles';
import { radius, spacing } from '../theme/spacing';
import { extractErrorMessage } from '../utils/errors';
import { hapticFeedback } from '../utils/haptics';

export function ContactScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { user, isAuthenticated } = useAuth();

  const [name, setName] = useState(isAuthenticated && user ? user.name : '');
  const [trip, setTrip] = useState('');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const onSubmitReview = async () => {
    setError('');
    if (!name.trim() || !comment.trim()) {
      hapticFeedback.error();
      setError('Please add your name and review comment.');
      return;
    }
    setSubmitting(true);
    try {
      const numericUserId = isAuthenticated && user?.id && !isNaN(Number(user.id)) ? Number(user.id) : undefined;
      await submitReview({
        user_id: numericUserId,
        customer_name: name.trim(),
        comment: comment.trim(),
        rating,
        trip_title: trip.trim() || null,
        website_hp: '',
      });
      hapticFeedback.success();
      setName(isAuthenticated && user ? user.name : '');
      setTrip('');
      setComment('');
      setRating(5);
      setSuccess(true);
    } catch (err) {
      hapticFeedback.error();
      setError(extractErrorMessage(err, 'Could not submit review. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

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

      <HoneypotField />

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

      {/* Leave Customer Review Section */}
      <Card style={styles.reviewCard}>
        <Text style={styles.reviewCardTitle}>Share Your Experience</Text>
        <Text style={styles.reviewCardSubtitle}>Help fellow travelers explore Nepal with confidence.</Text>

        {error ? (
          <View style={styles.errorAlert}>
            <Text style={styles.errorAlertText}>{error}</Text>
          </View>
        ) : null}

        {/* Star Rating Interactive Selector */}
        <View style={styles.ratingSection}>
          <Text style={styles.ratingLabel}>Your Rating</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                onPress={() => {
                  hapticFeedback.selection();
                  setRating(star);
                }}
                style={styles.starBtn}
              >
                <Star
                  size={26}
                  color={star <= rating ? colors.highlight : colors.subtle}
                  fill={star <= rating ? colors.highlight : 'transparent'}
                />
              </Pressable>
            ))}
          </View>
        </View>

        <TextField
          label="Your Name *"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Aarav Sharma"
          maxLength={LIMITS.reviewName}
        />

        <TextField
          label="Trip or Destination (Optional)"
          value={trip}
          onChangeText={setTrip}
          placeholder="e.g. Muktinath 4x4 Pilgrimage"
          maxLength={LIMITS.reviewTrip}
        />

        <TextField
          label="Your Review / Feedback *"
          value={comment}
          onChangeText={setComment}
          placeholder="Tell us about the vehicle condition, hill driver hospitality, and route experience..."
          multiline
          maxLength={LIMITS.reviewComment}
        />

        <Button
          label={submitting ? 'Submitting Review...' : 'Submit Verified Review'}
          onPress={onSubmitReview}
          loading={submitting}
          variant="primary"
        />
      </Card>

      {/* Support FAQ */}
      <View style={{ marginTop: spacing.md, paddingBottom: 40 }}>
        <SectionHeader tag="FAQ" title="Help & Policies" subtitle="Quick answers to common questions" />
        <FaqList items={HOME_FAQS} />
      </View>

      <SuccessModal
        visible={success}
        title="Thank You for Your Review!"
        message="Your feedback has been submitted for verification and will appear on the app shortly."
        onClose={() => setSuccess(false)}
      />
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
    reviewCard: {
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.md,
    },
    reviewCardTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
    },
    reviewCardSubtitle: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
      marginBottom: spacing.md,
    },
    ratingSection: {
      marginBottom: spacing.md,
      alignItems: 'center',
      backgroundColor: colors.elevated,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    ratingLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.muted,
      marginBottom: spacing.xs,
    },
    starsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    starBtn: {
      padding: 4,
    },
    errorAlert: {
      backgroundColor: colors.errorSoft,
      padding: spacing.md,
      borderRadius: radius.md,
      marginBottom: spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: colors.error,
    },
    errorAlertText: {
      color: colors.error,
      fontSize: 13,
      fontWeight: '600',
    },
    pressed: {
      opacity: 0.8,
      transform: [{ scale: 0.98 }],
    },
  });
}
