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
  background: '#F1F5F9',
  navy: '#0F172A',
  navySoft: '#1E293B',
  surface: '#FFFFFF',
  elevated: '#F8FAFC',
  accent: '#D97706',
  accentSoft: 'rgba(217, 119, 6, 0.12)',
  highlight: '#F59E0B',
  success: '#059669',
  successSoft: 'rgba(5, 150, 105, 0.12)',
  error: '#DC2626',
  errorSoft: 'rgba(220, 38, 38, 0.1)',
  text: '#0F172A',
  muted: '#475569',
  subtle: '#64748B',
  border: '#E2E8F0',
  overlay: 'rgba(15, 23, 42, 0.55)',
  onNavy: '#F8FAFC',
  onAccent: '#FFFFFF',
  tabBar: '#0F172A',
  tabInactive: '#94A3B8',
  shadow: 'rgba(15, 23, 42, 0.08)',
};

export const darkColors: ThemeColors = {
  background: '#0F172A',
  navy: '#090D16',
  navySoft: '#1E293B',
  surface: '#1E293B',
  elevated: '#0B1220',
  accent: '#F59E0B',
  accentSoft: 'rgba(245, 158, 11, 0.16)',
  highlight: '#F59E0B',
  success: '#34D399',
  successSoft: 'rgba(16, 185, 129, 0.15)',
  error: '#EF4444',
  errorSoft: 'rgba(239, 68, 68, 0.12)',
  text: '#F8FAFC',
  muted: '#CBD5E1',
  subtle: '#94A3B8',
  border: '#334155',
  overlay: 'rgba(9, 13, 22, 0.72)',
  onNavy: '#F8FAFC',
  onAccent: '#0F172A',
  tabBar: '#090D16',
  tabInactive: '#64748B',
  shadow: 'rgba(0, 0, 0, 0.35)',
};

/** Default export kept for any leftover static imports during the migration. */
export const colors = lightColors;

export type ColorName = keyof ThemeColors;
