import type { ApiMessageResponse, BookingEntryDto } from '../types/api';

import { apiClient } from './client';

export async function submitBooking(payload: BookingEntryDto): Promise<ApiMessageResponse> {
  const { data } = await apiClient.post<ApiMessageResponse>('/bookings', payload);
  return data;
}
