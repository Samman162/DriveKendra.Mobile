import { Moon, Sun } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';

type ThemeToggleProps = {
  variant?: 'onNavy' | 'onSurface';
};

export function ThemeToggle({ variant = 'onNavy' }: ThemeToggleProps) {
  const { isDark, toggle, colors } = useTheme();
  const onNavy = variant === 'onNavy';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onPress={toggle}
      style={[
        styles.btn,
        {
          backgroundColor: onNavy ? 'rgba(255,255,255,0.12)' : colors.accentSoft,
          borderColor: onNavy ? 'rgba(255,255,255,0.16)' : colors.border,
        },
      ]}
    >
      {isDark ? (
        <Sun color={onNavy ? colors.highlight : colors.accent} size={18} />
      ) : (
        <Moon color={onNavy ? colors.onNavy : colors.navy} size={18} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
