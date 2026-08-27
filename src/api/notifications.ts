import { apiClient } from './client';
import type { InAppNotificationDto } from '../types/api';

/**
 * Fetch all notifications for a specific user ID
 */
export async function getUserNotifications(userId: string | number): Promise<InAppNotificationDto[]> {
  try {
    const { data } = await apiClient.get<{ notifications: InAppNotificationDto[] }>('/notifications', {
      params: { userId },
    });
    return data.notifications || [];
  } catch (error) {
    console.warn('[NotificationsApi] Failed to fetch notifications:', error);
    return [];
  }
}

/**
 * Mark a single in-app notification as read
 */
export async function markNotificationAsRead(notificationId: number | string): Promise<boolean> {
  try {
    await apiClient.patch(`/notifications/${notificationId}/read`);
    return true;
  } catch (error) {
    console.warn('[NotificationsApi] Failed to mark notification as read:', error);
    return false;
  }
}
