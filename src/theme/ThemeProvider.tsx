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
import { Appearance, type ColorSchemeName } from 'react-native';

import { darkColors, lightColors, type ThemeColors } from './colors';

const STORAGE_PREF_KEY = 'app-theme-preference';
const LEGACY_STORAGE_KEY = 'app-theme';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ThemeMode = 'light' | 'dark';

type ThemeContextValue = {
  isDark: boolean;
  mode: ThemeMode;
  preference: ThemePreference;
  colors: ThemeColors;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(() => Appearance.getColorScheme() ?? 'light');

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_PREF_KEY)
      .then((saved) => {
        if (cancelled) return;
        if (saved === 'dark' || saved === 'light' || saved === 'system') {
          setPreferenceState(saved as ThemePreference);
        } else {
          // Check legacy key
          AsyncStorage.getItem(LEGACY_STORAGE_KEY).then((legacy) => {
            if (cancelled) return;
            if (legacy === 'dark' || legacy === 'light') {
              setPreferenceState(legacy as ThemePreference);
            }
          });
        }
      })
      .catch(() => {
        /* keep system default */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => subscription.remove();
  }, []);

  const isDark = useMemo(() => {
    if (preference === 'dark') return true;
    if (preference === 'light') return false;
    return systemScheme === 'dark';
  }, [preference, systemScheme]);

  const setPreference = useCallback((nextPref: ThemePreference) => {
    setPreferenceState(nextPref);
    void AsyncStorage.setItem(STORAGE_PREF_KEY, nextPref);
    void AsyncStorage.setItem(LEGACY_STORAGE_KEY, nextPref === 'dark' ? 'dark' : 'light');
    void Haptics.selectionAsync();
  }, []);

  const setMode = useCallback(
    (mode: ThemeMode) => {
      setPreference(mode);
    },
    [setPreference],
  );

  const toggle = useCallback(() => {
    setPreference(isDark ? 'light' : 'dark');
  }, [isDark, setPreference]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      isDark,
      mode: isDark ? 'dark' : 'light',
      preference,
      colors: isDark ? darkColors : lightColors,
      toggle,
      setMode,
      setPreference,
    }),
    [isDark, preference, setMode, setPreference, toggle],
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

