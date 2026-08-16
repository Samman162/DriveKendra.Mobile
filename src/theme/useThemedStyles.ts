import { useMemo } from 'react';

import type { ThemeColors } from './colors';
import { useTheme } from './ThemeProvider';

export function useThemedStyles<T>(factory: (colors: ThemeColors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [colors, factory]);
}
