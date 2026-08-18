import type { BookParams } from './types';

export function navigateToBook(
  navigation: {
    navigate: (name: 'Book', params?: BookParams) => void;
    getParent?: () => { navigate: (name: 'Book', params?: BookParams) => void } | undefined;
  },
  params: BookParams,
) {
  const tab = navigation.getParent?.() ?? navigation;
  tab.navigate('Book', { ...params, intentId: Date.now() });
}

export function formatNprAmount(value: number): string {
  return `NPR ${value.toLocaleString('en-IN')}`;
}
