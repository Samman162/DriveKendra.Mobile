export const colors = {
  background: '#0F172A',
  surface: '#1E293B',
  elevated: '#334155',
  accent: '#F59E0B',
  highlight: '#38BDF8',
  success: '#10B981',
  error: '#EF4444',
  text: '#F8FAFC',
  muted: '#94A3B8',
  subtle: '#64748B',
  border: '#334155',
  overlay: 'rgba(15, 23, 42, 0.78)',
} as const;

export type ColorName = keyof typeof colors;
