import type { PublicStatsDto } from '../types/api';
import { swrCache } from './cache';
import { apiClient } from './client';

const STATS_CACHE_KEY = 'public_stats';

export async function getPublicStats(): Promise<PublicStatsDto> {
  // Check SWR cache first
  const cached = await swrCache.get<PublicStatsDto>(STATS_CACHE_KEY);
  if (cached.data && !cached.isStale) {
    return cached.data;
  }

  try {
    const { data } = await apiClient.get<PublicStatsDto>('/stats');
    await swrCache.set(STATS_CACHE_KEY, data, 10 * 60 * 1000); // 10m TTL
    return data;
  } catch (err) {
    if (cached.data) {
      return cached.data; // Serve stale on error
    }
    throw err;
  }
}
