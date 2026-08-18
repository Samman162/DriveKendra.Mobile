import type { PublicStatsDto } from '../types/api';

import { apiClient } from './client';

export async function getPublicStats(): Promise<PublicStatsDto> {
  const { data } = await apiClient.get<PublicStatsDto>('/stats');
  return data;
}
