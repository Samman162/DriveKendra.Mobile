import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types/auth';

const isNative = typeof Platform !== 'undefined' && Platform?.OS !== 'web';

export const SECURE_STORAGE_KEYS = {
  ACCESS_TOKEN: 'drivekendra_jwt_access_token',
  REFRESH_TOKEN: 'drivekendra_jwt_refresh_token',
  USER_META: 'drivekendra_user_meta',
  BIOMETRIC_ENABLED: 'drivekendra_biometric_enabled',
} as const;

/**
 * Hardware-backed secure storage manager.
 * Uses iOS Keychain / Android KeyStore with encryption on native devices,
 * and falls back safely to prefixed storage on web/unsupported platforms.
 */
export const secureStorage = {
  /**
   * Store a secure key-value string in hardware-backed storage
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (isNative) {
        await SecureStore.setItemAsync(key, value, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
        });
      } else {
        await AsyncStorage.setItem(`@sec_${key}`, value);
      }
    } catch (e) {
      console.warn(`[SecureStore] Write error for "${key}", falling back:`, e);
      await AsyncStorage.setItem(`@sec_${key}`, value);
    }
  },

  /**
   * Retrieve a secure key-value string from hardware-backed storage
   */
  async getItem(key: string): Promise<string | null> {
    try {
      if (isNative) {
        return await SecureStore.getItemAsync(key);
      }
      return await AsyncStorage.getItem(`@sec_${key}`);
    } catch (e) {
      console.warn(`[SecureStore] Read error for "${key}", falling back:`, e);
      return await AsyncStorage.getItem(`@sec_${key}`);
    }
  },

  /**
   * Remove a key from secure storage
   */
  async removeItem(key: string): Promise<void> {
    try {
      if (isNative) {
        await SecureStore.deleteItemAsync(key);
      } else {
        await AsyncStorage.removeItem(`@sec_${key}`);
      }
    } catch (e) {
      console.warn(`[SecureStore] Delete error for "${key}":`, e);
      await AsyncStorage.removeItem(`@sec_${key}`);
    }
  },

  // =========================================================================
  // TYPED CREDENTIAL & SESSION HELPERS
  // =========================================================================

  /**
   * Get hardware-secured JWT access token
   */
  async getAccessToken(): Promise<string | null> {
    return await this.getItem(SECURE_STORAGE_KEYS.ACCESS_TOKEN);
  },

  /**
   * Set hardware-secured JWT access token
   */
  async setAccessToken(token: string): Promise<void> {
    await this.setItem(SECURE_STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  /**
   * Get hardware-secured JWT refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    return await this.getItem(SECURE_STORAGE_KEYS.REFRESH_TOKEN);
  },

  /**
   * Set hardware-secured JWT refresh token
   */
  async setRefreshToken(refreshToken: string): Promise<void> {
    await this.setItem(SECURE_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  },

  /**
   * Get encrypted user session metadata
   */
  async getUserData(): Promise<User | null> {
    const raw = await this.getItem(SECURE_STORAGE_KEYS.USER_META);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * Set encrypted user session metadata
   */
  async setUserData(user: User): Promise<void> {
    await this.setItem(SECURE_STORAGE_KEYS.USER_META, JSON.stringify(user));
  },

  /**
   * Check if biometric unlock preference is enabled
   */
  async getBiometricEnabled(): Promise<boolean> {
    const raw = await this.getItem(SECURE_STORAGE_KEYS.BIOMETRIC_ENABLED);
    return raw === 'true';
  },

  /**
   * Update biometric unlock preference
   */
  async setBiometricEnabled(enabled: boolean): Promise<void> {
    await this.setItem(SECURE_STORAGE_KEYS.BIOMETRIC_ENABLED, enabled ? 'true' : 'false');
  },

  /**
   * Atomically clear all authentication tokens and customer session data on logout
   */
  async clearAuthCredentials(): Promise<void> {
    await Promise.all([
      this.removeItem(SECURE_STORAGE_KEYS.ACCESS_TOKEN),
      this.removeItem(SECURE_STORAGE_KEYS.REFRESH_TOKEN),
      this.removeItem(SECURE_STORAGE_KEYS.USER_META),
    ]);
  },
};
