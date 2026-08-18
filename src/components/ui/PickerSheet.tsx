import React, { useCallback, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Check, ChevronDown } from 'lucide-react-native';

import type { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { radius, spacing } from '../../theme/spacing';
import { hapticFeedback } from '../../utils/haptics';

export type PickerOption = {
  id: number;
  name: string;
  subtitle?: string;
};

type PickerSheetProps = {
  label: string;
  value: number | null;
  options: readonly PickerOption[];
  onChange: (id: number) => void;
  error?: string;
  placeholder?: string;
};

export function PickerSheet({
  label,
  value,
  options,
  onChange,
  error,
  placeholder = 'Select an option',
}: PickerSheetProps) {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const snapPoints = useMemo(() => ['45%', '65%'], []);

  const selectedOption = options.find((opt) => opt.id === value);

  const handleOpen = useCallback(() => {
    hapticFeedback.light();
    bottomSheetModalRef.current?.present();
  }, []);

  const handleSelect = useCallback(
    (id: number) => {
      hapticFeedback.selection();
      onChange(id);
      bottomSheetModalRef.current?.dismiss();
    },
    [onChange],
  );

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

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>

      {/* Trigger Button */}
      <Pressable
        onPress={handleOpen}
        style={({ pressed }) => [
          styles.trigger,
          error ? styles.triggerError : null,
          pressed ? styles.triggerPressed : null,
        ]}
      >
        <View style={styles.triggerContent}>
          <Text style={[styles.triggerText, !selectedOption && styles.placeholderText]}>
            {selectedOption ? selectedOption.name : placeholder}
          </Text>
          {selectedOption?.subtitle ? (
            <Text style={styles.triggerSubtitle}>{selectedOption.subtitle}</Text>
          ) : null}
        </View>
        <ChevronDown size={18} color={colors.subtle} />
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

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
        <BottomSheetView style={styles.sheetContainer}>
          <Text style={styles.sheetTitle}>{label}</Text>
          <View style={styles.optionsList}>
            {options.map((option) => {
              const active = option.id === value;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => handleSelect(option.id)}
                  style={({ pressed }) => [
                    styles.optionItem,
                    active && styles.optionItemActive,
                    pressed && styles.optionItemPressed,
                  ]}
                >
                  <View style={styles.optionInfo}>
                    <Text style={[styles.optionName, active && styles.optionNameActive]}>
                      {option.name}
                    </Text>
                    {option.subtitle ? (
                      <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                    ) : null}
                  </View>
                  {active ? (
                    <View style={styles.checkBadge}>
                      <Check size={14} color={colors.onAccent} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      marginBottom: spacing.md,
    },
    label: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: '600',
      marginBottom: spacing.xs + 2,
    },
    trigger: {
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
    triggerError: {
      borderColor: colors.error,
    },
    triggerContent: {
      flex: 1,
      marginRight: spacing.sm,
    },
    triggerText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    placeholderText: {
      color: colors.subtle,
      fontWeight: '500',
    },
    triggerSubtitle: {
      color: colors.subtle,
      fontSize: 12,
      marginTop: 2,
    },
    error: {
      color: colors.error,
      fontSize: 12,
      marginTop: spacing.xs,
    },
    sheetContainer: {
      padding: spacing.lg,
      paddingBottom: spacing.xl,
    },
    sheetTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
      marginBottom: spacing.md,
    },
    optionsList: {
      gap: spacing.sm,
    },
    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.elevated,
    },
    optionItemActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    optionItemPressed: {
      opacity: 0.8,
    },
    optionInfo: {
      flex: 1,
      marginRight: spacing.sm,
    },
    optionName: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
    },
    optionNameActive: {
      color: colors.accent,
      fontWeight: '800',
    },
    optionSubtitle: {
      color: colors.muted,
      fontSize: 12,
      marginTop: 2,
    },
    checkBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
