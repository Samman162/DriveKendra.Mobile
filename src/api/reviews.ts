import type { CreateReviewDto, PublicReviewDto } from '../types/api';

import { apiClient } from './client';

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
  const { data } = await apiClient.get<RawReview[]>('/PublicReviews');
  return Array.isArray(data) ? data.map(normalizeReview) : [];
}

export async function submitReview(payload: CreateReviewDto): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/PublicReviews', payload);
  return data;
}
