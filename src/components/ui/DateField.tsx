import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
} from 'lucide-react-native';

import type { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { radius, spacing } from '../../theme/spacing';
import { formatDisplayDate, startOfDay, startOfToday } from '../../utils/dates';
import { hapticFeedback } from '../../utils/haptics';

export type DateFieldProps = {
  label: string;
  value: Date | null;
  onChange: (value: Date) => void;
  error?: string;
  minimumDate?: Date;
};

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function DateField({
  label,
  value,
  onChange,
  error,
  minimumDate = startOfToday(),
}: DateFieldProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [modalOpen, setModalOpen] = useState(false);

  // Quick preset dates
  const today = useMemo(() => startOfToday(), []);
  const tomorrow = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
  }, [today]);
  const dayAfter = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 2);
    return d;
  }, [today]);
  const in3Days = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 3);
    return d;
  }, [today]);

  const quickPresets = useMemo(() => {
    return [
      { label: 'Today', date: today },
      { label: 'Tomorrow', date: tomorrow },
      { label: '+2 Days', date: dayAfter },
      { label: '+3 Days', date: in3Days },
    ].filter((p) => startOfDay(p.date).getTime() >= startOfDay(minimumDate).getTime());
  }, [today, tomorrow, dayAfter, in3Days, minimumDate]);

  // Calendar View Month/Year State
  const [viewYear, setViewYear] = useState(() => (value ? value.getFullYear() : today.getFullYear()));
  const [viewMonth, setViewMonth] = useState(() => (value ? value.getMonth() : today.getMonth()));

  const handleOpen = () => {
    hapticFeedback.selection();
    if (value) {
      setViewYear(value.getFullYear());
      setViewMonth(value.getMonth());
    } else {
      setViewYear(today.getFullYear());
      setViewMonth(today.getMonth());
    }
    setModalOpen(true);
  };

  const handleSelectDate = (date: Date) => {
    hapticFeedback.success();
    onChange(date);
    setModalOpen(false);
  };

  const handlePrevMonth = () => {
    hapticFeedback.selection();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    hapticFeedback.selection();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Build calendar matrix for current view month
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const days: { dayNumber: number; date: Date; disabled: boolean; isCurrentMonth: boolean }[] = [];

    // Empty slots for previous month
    for (let i = 0; i < firstDayIndex; i++) {
      const prevDate = new Date(viewYear, viewMonth, -firstDayIndex + i + 1);
      days.push({
        dayNumber: prevDate.getDate(),
        date: prevDate,
        disabled: true,
        isCurrentMonth: false,
      });
    }

    // Days in current month
    const minTime = startOfDay(minimumDate).getTime();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      const disabled = startOfDay(date).getTime() < minTime;
      days.push({
        dayNumber: d,
        date,
        disabled,
        isCurrentMonth: true,
      });
    }

    return days;
  }, [viewYear, viewMonth, minimumDate]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      {/* Touchable Input Trigger */}
      <Pressable
        onPress={handleOpen}
        style={({ pressed }) => [
          styles.inputBox,
          !!error && styles.inputBoxError,
          pressed && styles.inputBoxPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? formatDisplayDate(value) : 'Select date'}`}
      >
        <CalendarIcon size={18} color={value ? colors.accent : colors.subtle} style={styles.inputIcon} />
        <Text style={value ? styles.valueText : styles.placeholderText}>
          {value ? formatDisplayDate(value) : 'Select date'}
        </Text>
      </Pressable>

      {/* Quick 1-Tap Date Presets */}
      <View style={styles.presetsRow}>
        {quickPresets.map((preset) => {
          const isSelected =
            value &&
            startOfDay(value).getTime() === startOfDay(preset.date).getTime();

          return (
            <Pressable
              key={preset.label}
              onPress={() => {
                hapticFeedback.selection();
                onChange(preset.date);
              }}
              style={[styles.presetChip, isSelected && styles.presetChipActive]}
              accessibilityRole="button"
              accessibilityLabel={`Select ${preset.label}`}
            >
              <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                {preset.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Full Interactive Calendar Modal */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setModalOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Close calendar"
          />

          <View style={styles.calendarCard}>
            {/* Header with Title & Close */}
            <View style={styles.calendarTopBar}>
              <View style={styles.calendarTitleWrap}>
                <CalendarIcon size={18} color={colors.accent} />
                <Text style={styles.calendarTitle}>{label.replace('*', '').trim()}</Text>
              </View>

              <Pressable
                onPress={() => setModalOpen(false)}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close calendar"
              >
                <X size={18} color={colors.muted} />
              </Pressable>
            </View>

            {/* Month / Year Navigator */}
            <View style={styles.monthNavRow}>
              <Pressable
                onPress={handlePrevMonth}
                style={styles.navArrowBtn}
                accessibilityRole="button"
                accessibilityLabel="Previous month"
              >
                <ChevronLeft size={20} color={colors.text} />
              </Pressable>

              <Text style={styles.monthTitle}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </Text>

              <Pressable
                onPress={handleNextMonth}
                style={styles.navArrowBtn}
                accessibilityRole="button"
                accessibilityLabel="Next month"
              >
                <ChevronRight size={20} color={colors.text} />
              </Pressable>
            </View>

            {/* Day of Week Headers */}
            <View style={styles.weekdaysRow}>
              {WEEKDAYS.map((wd) => (
                <Text key={wd} style={styles.weekdayText}>
                  {wd}
                </Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.daysGrid}>
              {calendarDays.map((item, idx) => {
                if (!item.isCurrentMonth) {
                  return <View key={idx} style={styles.emptyDaySlot} />;
                }

                const isSelected =
                  value &&
                  startOfDay(value).getTime() === startOfDay(item.date).getTime();

                const isToday =
                  startOfDay(item.date).getTime() === startOfDay(today).getTime();

                return (
                  <Pressable
                    key={idx}
                    onPress={() => !item.disabled && handleSelectDate(item.date)}
                    disabled={item.disabled}
                    style={[
                      styles.daySlot,
                      isSelected && styles.daySlotSelected,
                      isToday && !isSelected && styles.daySlotToday,
                      item.disabled && styles.daySlotDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumberText,
                        isSelected && styles.dayNumberTextSelected,
                        isToday && !isSelected && styles.dayNumberTextToday,
                        item.disabled && styles.dayNumberTextDisabled,
                      ]}
                    >
                      {item.dayNumber}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Quick Action Footer */}
            <View style={styles.calendarFooter}>
              <Pressable
                onPress={() => handleSelectDate(today)}
                style={styles.footerActionBtn}
              >
                <Text style={styles.footerActionText}>Today</Text>
              </Pressable>

              <Pressable
                onPress={() => handleSelectDate(tomorrow)}
                style={[styles.footerActionBtn, styles.footerActionBtnPrimary]}
              >
                <Text style={styles.footerActionTextPrimary}>Tomorrow</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginBottom: spacing.sm,
    },
    label: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: '700',
      marginBottom: spacing.xs,
    },
    inputBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      minHeight: 48,
      paddingHorizontal: spacing.md,
    },
    inputBoxError: {
      borderColor: colors.error,
    },
    inputBoxPressed: {
      backgroundColor: colors.elevated,
    },
    inputIcon: {
      marginRight: spacing.sm,
    },
    valueText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
    },
    placeholderText: {
      color: colors.subtle,
      fontSize: 15,
      fontWeight: '400',
    },
    presetsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 6,
    },
    presetChip: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.sm,
      backgroundColor: colors.elevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    presetChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    presetChipText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.text,
    },
    presetChipTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    errorText: {
      color: colors.error,
      fontSize: 12,
      fontWeight: '600',
      marginTop: 4,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.md,
    },
    calendarCard: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 16,
    },
    calendarTopBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    calendarTitleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    calendarTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
    },
    closeBtn: {
      padding: 4,
    },
    monthNavRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
      paddingHorizontal: spacing.xs,
    },
    navArrowBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.elevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    weekdaysRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 6,
    },
    weekdayText: {
      width: 38,
      textAlign: 'center',
      fontSize: 12,
      fontWeight: '700',
      color: colors.muted,
    },
    daysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-around',
    },
    emptyDaySlot: {
      width: 38,
      height: 38,
      marginVertical: 2,
    },
    daySlot: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 2,
    },
    daySlotSelected: {
      backgroundColor: colors.accent,
    },
    daySlotToday: {
      borderWidth: 1.5,
      borderColor: colors.accent,
    },
    daySlotDisabled: {
      opacity: 0.25,
    },
    dayNumberText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    dayNumberTextSelected: {
      color: '#FFFFFF',
      fontWeight: '800',
    },
    dayNumberTextToday: {
      color: colors.accent,
      fontWeight: '800',
    },
    dayNumberTextDisabled: {
      color: colors.muted,
    },
    calendarFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.sm,
      marginTop: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    footerActionBtn: {
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: radius.sm,
      backgroundColor: colors.elevated,
    },
    footerActionBtnPrimary: {
      backgroundColor: colors.accent,
    },
    footerActionText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    footerActionTextPrimary: {
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
