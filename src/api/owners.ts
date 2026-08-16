import type { ApiMessageResponse, CreateOwnerRequestDto } from '../types/api';

import { apiClient } from './client';

export async function submitOwnerRequest(
  payload: CreateOwnerRequestDto,
): Promise<ApiMessageResponse> {
  const { data } = await apiClient.post<ApiMessageResponse>('/PublicOwners', payload);
  return data;
}
