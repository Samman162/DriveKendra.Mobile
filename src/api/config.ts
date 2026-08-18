import Constants from 'expo-constants';

const DEFAULT_API = 'http://localhost:8787/api';

export function getApiBaseUrl(): string {
  const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string };
  return extra.apiUrl || process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API;
}
