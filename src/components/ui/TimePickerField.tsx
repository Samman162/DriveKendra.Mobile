import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Clock, Sun, Sunset, Moon, Edit3 } from 'lucide-react-native';

import type { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { radius, spacing } from '../../theme/spacing';
import { hapticFeedback } from '../../utils/haptics';

interface TimePickerFieldProps {
  label?: string;
  value: string;
  onChange: (time: string) => void;
  error?: string;
}

const PRESET_TIMES = [
  { time: '06:00 AM', period: 'morning', label: '06:00 AM (Early Mountain Start)' },
  { time: '07:00 AM', period: 'morning', label: '07:00 AM (Recommended Highway)' },
  { time: '08:30 AM', period: 'morning', label: '08:30 AM (City / Airport)' },
  { time: '10:00 AM', period: 'morning', label: '10:00 AM' },
  { time: '12:00 PM', period: 'afternoon', label: '12:00 PM (Noon)' },
  { time: '02:00 PM', period: 'afternoon', label: '02:00 PM' },
  { time: '04:30 PM', period: 'afternoon', label: '04:30 PM (Scenic Sunset)' },
  { time: '06:30 PM', period: 'evening', label: '06:30 PM (Evening Transfer)' },
  { time: '08:30 PM', period: 'evening', label: '08:30 PM (Late Flight / Night)' },
];

export function TimePickerField({
  label = 'Pickup Time *',
  value,
  onChange,
  error,
}: TimePickerFieldProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [customMode, setCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState(value || '');

  const handleSelectPreset = (timeStr: string) => {
    hapticFeedback.selection();
    setCustomMode(false);
    onChange(timeStr);
  };

  const handleCustomSubmit = (text: string) => {
    setCustomInput(text);
    onChange(text);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <View style={styles.labelLeft}>
          <Clock size={15} color={colors.accent} />
          <Text style={styles.label}>{label}</Text>
        </View>
        {value ? (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>{value}</Text>
          </View>
        ) : null}
      </View>

      {/* Preset Time Slot Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {PRESET_TIMES.map((item) => {
          const isSelected = value === item.time && !customMode;
          return (
            <Pressable
              key={item.time}
              onPress={() => handleSelectPreset(item.time)}
              style={[styles.chip, isSelected && styles.chipActive]}
            >
              {item.period === 'morning' && (
                <Sun size={12} color={isSelected ? colors.onAccent : colors.accent} />
              )}
              {item.period === 'afternoon' && (
                <Sunset size={12} color={isSelected ? colors.onAccent : '#EA580C'} />
              )}
              {item.period === 'evening' && (
                <Moon size={12} color={isSelected ? colors.onAccent : '#8B5CF6'} />
              )}
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                {item.time}
              </Text>
            </Pressable>
          );
        })}

        {/* Custom Time Option */}
        <Pressable
          onPress={() => {
            hapticFeedback.selection();
            setCustomMode(!customMode);
          }}
          style={[styles.chip, customMode && styles.chipActive]}
        >
          <Edit3 size={12} color={customMode ? colors.onAccent : colors.subtle} />
          <Text style={[styles.chipText, customMode && styles.chipTextActive]}>
            Custom Time
          </Text>
        </Pressable>
      </ScrollView>

      {/* Custom Time Text Input */}
      {customMode && (
        <View style={styles.customInputWrap}>
          <TextInput
            value={customInput}
            onChangeText={handleCustomSubmit}
            placeholder="e.g. 05:45 AM or 11:15 PM"
            placeholderTextColor={colors.subtle}
            style={styles.customInput}
            autoFocus
          />
        </View>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      gap: 6,
      marginBottom: spacing.xs,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    labelLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    label: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    selectedBadge: {
      backgroundColor: colors.accentSoft,
      paddingHorizontal: spacing.xs + 2,
      paddingVertical: 2,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    selectedBadgeText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accent,
    },
    chipsRow: {
      gap: spacing.xs,
      paddingVertical: 4,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.pill,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    chipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    chipText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
    },
    chipTextActive: {
      color: colors.onAccent,
    },
    customInputWrap: {
      marginTop: 4,
    },
    customInput: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.accent,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    errorText: {
      fontSize: 12,
      color: colors.error,
      fontWeight: '600',
      marginTop: 2,
    },
  });
}
