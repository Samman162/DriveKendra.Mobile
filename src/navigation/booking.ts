import type { BookParams } from './types';

export interface NavigationWithBookingModal {
  navigate: (screen: string, params?: unknown) => void;
  getParent?: () => { navigate: (screen: string, params?: unknown) => void } | undefined;
}

/**
 * Universal navigation helper to trigger the booking engine modal dialog from any screen.
 */
export function navigateToBook(
  navigation: NavigationWithBookingModal,
  params: BookParams,
) {
  const root = navigation.getParent?.() ?? navigation;
  root.navigate('BookingModal', { ...params, intentId: Date.now() });
}

export function formatNprAmount(value: number): string {
  return `NPR ${value.toLocaleString('en-IN')}`;
}
