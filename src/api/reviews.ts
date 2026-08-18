import type { CreateReviewDto, PublicReviewDto } from '../types/api';
import { swrCache } from './cache';
import { apiClient } from './client';

const REVIEWS_CACHE_KEY = 'approved_reviews';

type RawReview = {
  customer_name?: string;
  customerName?: string;
  rating?: number;
  comment?: string;
  trip_title?: string;
  tripTitle?: string;
  created_at?: string;
  createdAt?: string;
};

function normalizeReview(item: RawReview): PublicReviewDto {
  return {
    customer_name: item.customer_name || item.customerName || 'Traveler',
    rating: Number(item.rating) || 0,
    comment: item.comment || '',
    trip_title: item.trip_title || item.tripTitle || null,
    created_at: item.created_at || item.createdAt,
  };
}

export async function getApprovedReviews(): Promise<PublicReviewDto[]> {
  const cached = await swrCache.get<PublicReviewDto[]>(REVIEWS_CACHE_KEY);
  if (cached.data && !cached.isStale) {
    return cached.data;
  }

  try {
    const { data } = await apiClient.get<RawReview[]>('/reviews');
    const normalized = Array.isArray(data) ? data.map(normalizeReview) : [];
    await swrCache.set(REVIEWS_CACHE_KEY, normalized, 5 * 60 * 1000); // 5m TTL
    return normalized;
  } catch (err) {
    if (cached.data) {
      return cached.data;
    }
    throw err;
  }
}

export async function submitReview(payload: CreateReviewDto): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/reviews', payload);
  await swrCache.invalidate(REVIEWS_CACHE_KEY);
  return data;
}
