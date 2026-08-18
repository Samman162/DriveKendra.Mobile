import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { CheckCircle2, ChevronRight, Sparkles, Tag, X } from 'lucide-react-native';

import type { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { radius, spacing } from '../../theme/spacing';
import { hapticFeedback } from '../../utils/haptics';

type PromoCodeSheetProps = {
  onApplyPromo: (code: string, discountAmount: number) => void;
  appliedCode?: string | null;
  onRemovePromo?: () => void;
};

const VALID_PROMOS = [
  { code: 'WELCOME500', discount: 500, label: 'NPR 500 Off', desc: 'New rider welcome discount across all fleet' },
  { code: 'FESTIVE10', discount: 1200, label: 'NPR 1,200 Off', desc: 'Festive mountain expedition special discount' },
  { code: 'DRIVEKENDRA', discount: 1000, label: 'NPR 1,000 Off', desc: 'VIP chauffeur and luxury vehicle rate' },
];

export function PromoCodeSheet({ onApplyPromo, appliedCode, onRemovePromo }: PromoCodeSheetProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');

  const snapPoints = useMemo(() => ['50%', '75%'], []);

  const handleOpen = useCallback(() => {
    hapticFeedback.light();
    bottomSheetModalRef.current?.present();
  }, []);

  const handleApply = (codeToApply: string) => {
    const clean = codeToApply.trim().toUpperCase();
    if (!clean) {
      setError('Please enter a coupon code.');
      return;
    }
    const matched = VALID_PROMOS.find((p) => p.code === clean);
    if (matched) {
      hapticFeedback.success();
      setError('');
      onApplyPromo(matched.code, matched.discount);
      setInputCode('');
      bottomSheetModalRef.current?.dismiss();
    } else {
      hapticFeedback.error();
      setError('Invalid coupon code. Try WELCOME500 or FESTIVE10.');
    }
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
        pressBehavior="close"
      />
    ),
    [],
  );

  if (appliedCode) {
    const activePromo = VALID_PROMOS.find((p) => p.code === appliedCode);
    return (
      <View style={styles.appliedContainer}>
        <View style={styles.appliedLeft}>
          <CheckCircle2 size={16} color={colors.success} />
          <View>
            <Text style={styles.appliedText}>
              Promo <Text style={{ fontWeight: '800' }}>{appliedCode}</Text> applied!
            </Text>
            {activePromo ? (
              <Text style={styles.appliedSubtext}>{activePromo.desc}</Text>
            ) : null}
          </View>
        </View>
        <Pressable onPress={onRemovePromo} style={styles.removeBtn}>
          <X size={14} color={colors.error} />
          <Text style={styles.removeText}>Remove</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Trigger Button */}
      <Pressable onPress={handleOpen} style={({ pressed }) => [styles.triggerBtn, pressed && styles.triggerPressed]}>
        <View style={styles.triggerLeft}>
          <Tag size={16} color={colors.accent} />
          <Text style={styles.triggerTitle}>Have a Coupon / Promo Code?</Text>
        </View>
        <ChevronRight size={16} color={colors.accent} />
      </Pressable>

      {/* Gesture Bottom Sheet Modal */}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
        }}
        handleIndicatorStyle={{ backgroundColor: colors.border, width: 40 }}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.sheetHeading}>Apply Promo Code</Text>

          {/* Manual Input */}
          <View style={styles.inputRow}>
            <Tag size={16} color={colors.accent} style={{ marginLeft: spacing.sm }} />
            <TextInput
              value={inputCode}
              onChangeText={(val) => {
                setInputCode(val);
                setError('');
              }}
              placeholder="Enter promo code (e.g. WELCOME500)"
              placeholderTextColor={colors.subtle}
              autoCapitalize="characters"
              style={styles.input}
            />
            <Pressable onPress={() => handleApply(inputCode)} style={styles.applyBtn}>
              <Text style={styles.applyBtnText}>Apply</Text>
            </Pressable>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Available Offers Catalog */}
          <Text style={styles.availableOffersTitle}>Available Offers</Text>
          <View style={styles.offersList}>
            {VALID_PROMOS.map((promo) => (
              <Pressable
                key={promo.code}
                onPress={() => handleApply(promo.code)}
                style={({ pressed }) => [styles.offerCard, pressed && styles.offerCardPressed]}
              >
                <View style={styles.offerInfo}>
                  <View style={styles.codeRow}>
                    <Sparkles size={12} color={colors.accent} />
                    <Text style={styles.codeBadge}>{promo.code}</Text>
                    <Text style={styles.discountLabel}>{promo.label}</Text>
                  </View>
                  <Text style={styles.offerDesc}>{promo.desc}</Text>
                </View>
                <Text style={styles.quickApplyText}>Apply</Text>
              </Pressable>
            ))}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      marginBottom: spacing.md,
    },
    triggerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md - 2,
    },
    triggerPressed: {
      opacity: 0.85,
    },
    triggerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    triggerTitle: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '700',
    },
    sheetContent: {
      padding: spacing.lg,
      paddingBottom: spacing.xl,
    },
    sheetHeading: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
      marginBottom: spacing.md,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.elevated,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 4,
    },
    input: {
      flex: 1,
      paddingHorizontal: spacing.sm,
      color: colors.text,
      fontSize: 13,
      fontWeight: '700',
    },
    applyBtn: {
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.md,
      paddingVertical: 9,
      borderRadius: radius.sm,
    },
    applyBtnText: {
      color: colors.onAccent,
      fontWeight: '800',
      fontSize: 12,
    },
    errorText: {
      color: colors.error,
      fontSize: 12,
      marginTop: 4,
      marginLeft: 4,
    },
    availableOffersTitle: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    offersList: {
      gap: spacing.sm,
    },
    offerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.elevated,
    },
    offerCardPressed: {
      opacity: 0.8,
    },
    offerInfo: {
      flex: 1,
      marginRight: spacing.sm,
    },
    codeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 3,
    },
    codeBadge: {
      color: colors.accent,
      fontWeight: '900',
      fontSize: 13,
    },
    discountLabel: {
      color: colors.success,
      fontWeight: '700',
      fontSize: 12,
    },
    offerDesc: {
      color: colors.subtle,
      fontSize: 12,
    },
    quickApplyText: {
      color: colors.accent,
      fontWeight: '800',
      fontSize: 13,
    },
    appliedContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.successSoft,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.success,
      marginBottom: spacing.md,
    },
    appliedLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    appliedText: {
      fontSize: 13,
      color: colors.success,
      fontWeight: '700',
    },
    appliedSubtext: {
      fontSize: 11,
      color: colors.muted,
      marginTop: 2,
    },
    removeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      padding: 4,
    },
    removeText: {
      color: colors.error,
      fontSize: 12,
      fontWeight: '700',
    },
  });
}
