import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type ReturnKeyTypeOptions } from 'react-native';
import { Eye, EyeOff, Lock } from 'lucide-react-native';

import type { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { radius, spacing } from '../../theme/spacing';

type PasswordFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
};

export function PasswordField({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  placeholder = '••••••••',
  returnKeyType,
  onSubmitEditing,
}: PasswordFieldProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, !!error && styles.inputError]}>
        <Lock size={18} color={colors.subtle} style={styles.leadingIcon} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.subtle}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          style={styles.input}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          onPress={() => setShowPassword((prev) => !prev)}
          hitSlop={10}
          style={styles.eyeButton}
        >
          {showPassword ? (
            <EyeOff size={18} color={colors.subtle} />
          ) : (
            <Eye size={18} color={colors.subtle} />
          )}
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
      marginBottom: spacing.xs,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      minHeight: 48,
    },
    leadingIcon: {
      marginRight: spacing.sm,
    },
    input: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      paddingVertical: 10,
    },
    eyeButton: {
      padding: 4,
      marginLeft: spacing.xs,
    },
    inputError: {
      borderColor: colors.error,
    },
    error: {
      color: colors.error,
      fontSize: 12,
      marginTop: spacing.xs,
    },
  });
}
