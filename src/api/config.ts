import Constants from 'expo-constants';

export type AppExtra = {
  apiUrl: string;
  hubUrl: string;
  tusUrl: string;
  adminApiKey: string;
};

const DEFAULTS: AppExtra = {
  apiUrl: 'https://carrental-api-x74e.onrender.com/api',
  hubUrl: 'https://carrental-api-x74e.onrender.com/hubs/notifications',
  tusUrl: 'https://carrental-api-x74e.onrender.com/files',
  adminApiKey: '',
};

export function getExtra(): AppExtra {
  const extra = (Constants.expoConfig?.extra ?? {}) as Partial<AppExtra>;
  return {
    apiUrl: extra.apiUrl || process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULTS.apiUrl,
    hubUrl: extra.hubUrl || process.env.EXPO_PUBLIC_SIGNALR_URL || DEFAULTS.hubUrl,
    tusUrl: extra.tusUrl || process.env.EXPO_PUBLIC_TUS_URL || DEFAULTS.tusUrl,
    adminApiKey:
      extra.adminApiKey || process.env.EXPO_PUBLIC_ADMIN_API_KEY || DEFAULTS.adminApiKey,
  };
}

export function hasAdminApiKey(): boolean {
  return getExtra().adminApiKey.trim().length > 0;
}
