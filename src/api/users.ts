import { apiClient } from './client';

export interface RegisterPushTokenPayload {
  pushToken: string;
  customerId?: number;
  phoneNumber?: string;
  email?: string;
  devicePlatform?: 'ios' | 'android' | 'web';
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

