import { type ComponentProps, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ThemeColors } from '../../theme/colors';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { spacing } from '../../theme/spacing';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  refreshControl?: ComponentProps<typeof ScrollView>['refreshControl'];
  navy?: boolean;
  padded?: boolean;
};

export function Screen({
  children,
  scroll = true,
  contentContainerStyle,
  refreshControl,
  navy = false,
  padded = true,
}: ScreenProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <SafeAreaView style={[styles.safe, navy && styles.navy]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[padded && styles.content, contentContainerStyle]}
            refreshControl={refreshControl}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[padded && styles.content, styles.flex, contentContainerStyle]}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    navy: {
      backgroundColor: colors.navy,
    },
    flex: {
      flex: 1,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: 40,
    },
  });
}
