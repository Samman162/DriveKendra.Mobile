import AsyncStorage from '@react-native-async-storage/async-storage';

type CacheEntry<T> = {
  data: T;
  cachedAt: number;
  ttlMs: number;
};

const memoryCache = new Map<string, CacheEntry<any>>();

export const swrCache = {
  async get<T>(key: string): Promise<{ data: T | null; isStale: boolean }> {
    const now = Date.now();

    // 1. Check in-memory cache first for sub-millisecond retrieval
    const mem = memoryCache.get(key);
    if (mem) {
      const isStale = now - mem.cachedAt > mem.ttlMs;
      return { data: mem.data as T, isStale };
    }

    // 2. Fall back to persistent AsyncStorage
    try {
      const raw = await AsyncStorage.getItem(`@swr_${key}`);
      if (raw) {
        const parsed: CacheEntry<T> = JSON.parse(raw);
        memoryCache.set(key, parsed);
        const isStale = now - parsed.cachedAt > parsed.ttlMs;
        return { data: parsed.data, isStale };
      }
    } catch (e) {
      console.warn(`[SWRCache] Read error for key "${key}":`, e);
    }

    return { data: null, isStale: true };
  },

  async set<T>(key: string, data: T, ttlMs = 5 * 60 * 1000): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      cachedAt: Date.now(),
      ttlMs,
    };

    memoryCache.set(key, entry);

    try {
      await AsyncStorage.setItem(`@swr_${key}`, JSON.stringify(entry));
    } catch (e) {
      console.warn(`[SWRCache] Write error for key "${key}":`, e);
    }
  },

  async invalidate(key: string): Promise<void> {
    memoryCache.delete(key);
    try {
      await AsyncStorage.removeItem(`@swr_${key}`);
    } catch (e) {
      console.warn(`[SWRCache] Invalidate error for key "${key}":`, e);
    }
  },
};
