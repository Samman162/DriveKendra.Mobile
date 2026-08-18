import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import type { ThemeColors } from './colors';
import { useTheme } from './ThemeProvider';

type StyleFactory<T> = (colors: ThemeColors) => T;

/**
 * Cache for memoizing compiled stylesheets across renders.
 * Keyed by factory function and theme mode ('light' | 'dark').
 */
const styleSheetCache = new WeakMap<StyleFactory<any>, { light?: any; dark?: any }>();

export function useThemedStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: StyleFactory<T>,
): T {
  const { colors, isDark } = useTheme();
  const themeKey = isDark ? 'dark' : 'light';

  return useMemo(() => {
    let factoryCache = styleSheetCache.get(factory);
    if (!factoryCache) {
      factoryCache = {};
      styleSheetCache.set(factory, factoryCache);
    }

    if (!factoryCache[themeKey]) {
      factoryCache[themeKey] = factory(colors);
    }

    return factoryCache[themeKey];
  }, [colors, isDark, factory, themeKey]);
}
