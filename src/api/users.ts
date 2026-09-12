import { apiClient } from './client';
import type { CustomerNotification } from '../types/api';

export interface RegisterPushTokenPayload {
  pushToken: string;
  userId?: number;
  customerId?: number;
  phoneNumber?: string;
  email?: string;
  devicePlatform?: 'ios' | 'android' | 'web';
  deviceType?: string;
  deviceName?: string;
}

export interface RegisterPushTokenResponse {
  success: boolean;
  message: string;
}

/**
 * Register or update the customer's Expo push token on the backend server.
 */
export async function registerPushToken(
  payload: RegisterPushTokenPayload,
): Promise<RegisterPushTokenResponse> {
  try {
    const { data } = await apiClient.post<RegisterPushTokenResponse>(
      '/users/push-token',
      payload,
    );
    return data;
  } catch (error) {
    console.warn('[PushToken] Failed to register token with backend:', error);
    return { success: false, message: 'Push token registration failed' };
  }
}

export interface UpdateUserProfilePayload {
  userId?: string | number;
  fullName?: string;
  avatarUrl?: string;
  phone?: string;
  email?: string;
}

export interface UpdateUserProfileResponse {
  success: boolean;
  message: string;
}

/**
 * Update the customer profile details on the backend database.
 */
export async function updateUserProfile(
  payload: UpdateUserProfilePayload,
): Promise<UpdateUserProfileResponse> {
  try {
    const { data } = await apiClient.put<UpdateUserProfileResponse>(
      '/users/profile',
      payload,
    );
    return data;
  } catch (error) {
    console.warn('[Users] Failed to update profile with backend:', error);
    return { success: false, message: 'Profile update failed' };
  }
}

/**
 * Fetch customer notifications by userId or phoneNumber
 */
export async function getUserNotifications(params?: {
  userId?: number;
  phoneNumber?: string;
}): Promise<CustomerNotification[]> {
  try {
    const { data } = await apiClient.get<{ notifications: CustomerNotification[] }>(
      '/users/notifications',
      { params },
    );
    return data.notifications || [];
  } catch (error) {
    console.warn('[Users] Failed to fetch notifications:', error);
    return [];
  }
}

/**
 * Mark customer notification as read
 */
export async function markNotificationAsRead(
  notificationId: number,
): Promise<{ success: boolean; message?: string }> {
  try {
    const { data } = await apiClient.patch<{ success: boolean; message?: string }>(
      `/users/notifications/${notificationId}/read`,
    );
    return data;
  } catch (error) {
    console.warn('[Users] Failed to mark notification read:', error);
    return { success: false };
  }
}



