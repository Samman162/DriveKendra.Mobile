import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Appearance } from 'react-native';

import { darkColors, lightColors, type ThemeColors } from './colors';

const STORAGE_KEY = 'app-theme';

export type ThemeMode = 'light' | 'dark';

type ThemeContextValue = {
  isDark: boolean;
  mode: ThemeMode;
  colors: ThemeColors;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemIsDark(): boolean {
  return Appearance.getColorScheme() === 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(systemIsDark);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (cancelled) return;
        if (saved === 'dark') setIsDark(true);
        else if (saved === 'light') setIsDark(false);
      })
      .catch(() => {
        /* keep system default */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: boolean) => {
    void AsyncStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
  }, []);

  const setMode = useCallback(
    (mode: ThemeMode) => {
      const next = mode === 'dark';
      setIsDark(next);
      persist(next);
    },
    [persist],
  );

  const toggle = useCallback(() => {
    setIsDark((current) => {
      const next = !current;
      persist(next);
      return next;
    });
    void Haptics.selectionAsync();
  }, [persist]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      isDark,
      mode: isDark ? 'dark' : 'light',
      colors: isDark ? darkColors : lightColors,
      toggle,
      setMode,
    }),
    [isDark, setMode, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return context;
}
