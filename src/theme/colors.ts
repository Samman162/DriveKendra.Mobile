export type ThemeColors = {
  background: string;
  navy: string;
  navySoft: string;
  surface: string;
  elevated: string;
  accent: string;
  accentSoft: string;
  highlight: string;
  success: string;
  successSoft: string;
  error: string;
  errorSoft: string;
  text: string;
  muted: string;
  subtle: string;
  border: string;
  overlay: string;
  onNavy: string;
  onAccent: string;
  tabBar: string;
  tabInactive: string;
  shadow: string;
};

export const lightColors: ThemeColors = {
  background: '#F8FAFC',
  navy: '#083344',
  navySoft: '#0E4057',
  surface: '#FFFFFF',
  elevated: '#F0F9FF',
  accent: '#0284C7',
  accentSoft: 'rgba(2, 132, 199, 0.12)',
  highlight: '#0EA5E9',
  success: '#059669',
  successSoft: 'rgba(5, 150, 105, 0.12)',
  error: '#DC2626',
  errorSoft: 'rgba(220, 38, 38, 0.1)',
  text: '#051A24',
  muted: '#334E68',
  subtle: '#627D98',
  border: '#BAE6FD',
  overlay: 'rgba(5, 26, 36, 0.65)',
  onNavy: '#F0F9FF',
  onAccent: '#FFFFFF',
  tabBar: '#051A24',
  tabInactive: '#94A3B8',
  shadow: 'rgba(5, 26, 36, 0.08)',
};

export const darkColors: ThemeColors = {
  background: '#08151D',
  navy: '#051A24',
  navySoft: '#0B212D',
  surface: '#0B212D',
  elevated: '#0E2A3A',
  accent: '#38BDF8',
  accentSoft: 'rgba(56, 189, 248, 0.16)',
  highlight: '#0EA5E9',
  success: '#34D399',
  successSoft: 'rgba(16, 185, 129, 0.15)',
  error: '#EF4444',
  errorSoft: 'rgba(239, 68, 68, 0.12)',
  text: '#F0F9FF',
  muted: '#BAE6FD',
  subtle: '#94A3B8',
  border: '#164E63',
  overlay: 'rgba(5, 26, 36, 0.78)',
  onNavy: '#F0F9FF',
  onAccent: '#051A24',
  tabBar: '#051A24',
  tabInactive: '#64748B',
  shadow: 'rgba(0, 0, 0, 0.5)',
};

/** Default export kept for any leftover static imports during the migration. */
export const colors = lightColors;

export type ColorName = keyof ThemeColors;
