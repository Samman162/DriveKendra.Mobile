import type { NotificationDto } from '../types/api';

import { apiClient } from './client';
import { hasAdminApiKey } from './config';

export async function getRecentNotifications(limit = 20): Promise<NotificationDto[]> {
  if (!hasAdminApiKey()) {
    return [];
  }

  const { data } = await apiClient.get<NotificationDto[]>('/Notifications/recent', {
    params: { limit },
  });
  return Array.isArray(data) ? data : [];
}

export async function markNotificationRead(id: number): Promise<void> {
  if (!hasAdminApiKey()) {
    return;
  }
  await apiClient.put(`/Notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  if (!hasAdminApiKey()) {
    return;
  }
  await apiClient.put('/Notifications/read-all');
}
