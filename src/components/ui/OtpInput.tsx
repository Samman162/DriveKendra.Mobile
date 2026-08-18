import React, { useRef } from 'react';
import { StyleSheet, TextInput, View, type NativeSyntheticEvent, type TextInputKeyPressEventData } from 'react-native';

import type { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { radius, spacing } from '../../theme/spacing';

type OtpInputProps = {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
  error?: boolean;
};

export function OtpInput({ length = 6, value, onChange, error }: OtpInputProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const digits = value.padEnd(length, ' ').slice(0, length).split('');

  const handleChange = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length > 1) {
      // Handle paste
      const pasted = cleaned.slice(0, length);
      onChange(pasted);
      const nextFocus = Math.min(pasted.length, length - 1);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const currentArray = value.split('');
    currentArray[index] = cleaned;
    const nextVal = currentArray.join('').slice(0, length);
    onChange(nextVal);

    if (cleaned && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index]?.trim() && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length }).map((_, index) => {
        const char = digits[index]?.trim() || '';
        const isFocused = value.length === index || (index === length - 1 && value.length === length);
        return (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            value={char}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            style={[
              styles.box,
              char ? styles.boxFilled : null,
              isFocused ? styles.boxFocused : null,
              error ? styles.boxError : null,
            ]}
          />
        );
      })}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: spacing.md,
      gap: spacing.xs,
    },
    box: {
      width: 44,
      height: 52,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      textAlign: 'center',
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    boxFilled: {
      borderColor: colors.accent,
      backgroundColor: colors.elevated,
    },
    boxFocused: {
      borderColor: colors.highlight,
    },
    boxError: {
      borderColor: colors.error,
    },
  });
}
