import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_LOCATIONS_KEY = '@drivekendra_recent_locations_v1';
const MAX_RECENT_ITEMS = 8;

export interface RecentLocationItem {
  id: string;
  name: string;
  secondaryText?: string;
  timestamp: number;
}

/**
 * Retrieves the list of recent location searches from AsyncStorage.
 */
export async function getRecentLocations(): Promise<RecentLocationItem[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_LOCATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('[RecentSearchesStorage] Failed to read recents:', error);
    return [];
  }
}

/**
 * Adds a new location to the top of recent searches, deduplicating existing ones.
 */
export async function addRecentLocation(
  name: string,
  secondaryText?: string,
): Promise<RecentLocationItem[]> {
  const trimmed = name.trim();
  if (!trimmed) return [];

  try {
    const current = await getRecentLocations();
    const normalizedNew = trimmed.toLowerCase().replace(/,\s*nepal$/i, '').trim();

    // Filter out duplicate
    const filtered = current.filter(
      (item) => item.name.toLowerCase().replace(/,\s*nepal$/i, '').trim() !== normalizedNew,
    );

    const newItem: RecentLocationItem = {
      id: `recent_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed,
      secondaryText: secondaryText || 'Recent Search',
      timestamp: Date.now(),
    };

    const updated = [newItem, ...filtered].slice(0, MAX_RECENT_ITEMS);
    await AsyncStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.warn('[RecentSearchesStorage] Failed to save recent:', error);
    return [];
  }
}

/**
 * Clears all recent location searches.
 */
export async function clearRecentLocations(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RECENT_LOCATIONS_KEY);
  } catch (error) {
    console.warn('[RecentSearchesStorage] Failed to clear recents:', error);
  }
}

/**
 * Removes a single recent location by its ID.
 */
export async function removeRecentLocation(id: string): Promise<RecentLocationItem[]> {
  try {
    const current = await getRecentLocations();
    const updated = current.filter((item) => item.id !== id);
    await AsyncStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.warn('[RecentSearchesStorage] Failed to remove recent item:', error);
    return [];
  }
}
