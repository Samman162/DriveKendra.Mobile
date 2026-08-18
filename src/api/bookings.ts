import type { ApiMessageResponse, BookingEntryDto } from '../types/api';
import { apiClient } from './client';
import { offlineQueue, initOfflineQueueSync } from './offlineQueue';

/**
 * Generate a standard RFC4122 v4 UUID for request idempotency
 */
export function generateIdempotencyKey(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Initialize background sync listener with idempotency preservation
initOfflineQueueSync(async (payload: BookingEntryDto, idempotencyKey?: string) => {
  const key = idempotencyKey || generateIdempotencyKey();
  const { data } = await apiClient.post<ApiMessageResponse>('/bookings', payload, {
    headers: {
      'X-Idempotency-Key': key,
    },
  });
  return data;
});

export async function submitBooking(
  payload: BookingEntryDto,
  customIdempotencyKey?: string,
): Promise<ApiMessageResponse> {
  const idempotencyKey = customIdempotencyKey || generateIdempotencyKey();

  try {
    const { data } = await apiClient.post<ApiMessageResponse>('/bookings', payload, {
      headers: {
        'X-Idempotency-Key': idempotencyKey,
      },
    });
    return data;
  } catch (error: any) {
    // If it's a network disconnect / timeout, enqueue offline with original idempotency key
    const isNetworkError =
      !error.response ||
      error.code === 'ECONNABORTED' ||
      error.message?.includes('Network Error') ||
      error.message?.includes('Network request failed');

    if (isNetworkError) {
      await offlineQueue.enqueue(payload, idempotencyKey);
      return {
        message:
          'You are currently offline. Your reservation has been safely saved and will be submitted automatically when your connection is restored.',
      };
    }
    throw error;
  }
}
