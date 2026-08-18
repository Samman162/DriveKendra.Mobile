import { useCallback, useEffect, useRef, useState } from 'react';

import { swrCache } from '../api/cache';

type UseCachedDataOptions<T> = {
  key: string;
  fetcher: () => Promise<T>;
  initialData?: T;
  ttlMs?: number; // default 5 minutes
};

export function useCachedData<T>({
  key,
  fetcher,
  initialData,
  ttlMs = 5 * 60 * 1000,
}: UseCachedDataOptions<T>) {
  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(!initialData);
  const [isRevalidating, setIsRevalidating] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const revalidate = useCallback(async () => {
    setIsRevalidating(true);
    try {
      const fresh = await fetcherRef.current();
      setData(fresh);
      setError(null);
      await swrCache.set(key, fresh, ttlMs);
    } catch (e: any) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsRevalidating(false);
      setIsLoading(false);
    }
  }, [key, ttlMs]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const cached = await swrCache.get<T>(key);
      if (!isMounted) return;

      if (cached.data !== null) {
        setData(cached.data);
        setIsLoading(false);

        // If data is stale, revalidate in the background
        if (cached.isStale) {
          void revalidate();
        }
      } else {
        // No cache, fetch immediately
        void revalidate();
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [key, revalidate]);

  return {
    data,
    isLoading,
    isRevalidating,
    error,
    refresh: revalidate,
  };
}
