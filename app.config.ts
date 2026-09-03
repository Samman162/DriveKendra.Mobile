import type { ExpoConfig, ConfigContext } from 'expo/config';

const DEFAULT_API = 'http://localhost:8787/api';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Drive Kendra',
  slug: 'drive-kendra-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  backgroundColor: '#F1F5F9',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.drivekendra.app',
  },
  android: {
    package: 'com.drivekendra.app',
    adaptiveIcon: {
      backgroundColor: '#0F172A',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-status-bar',
    '@react-native-community/datetimepicker',
    'expo-dev-client',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#FFFFFF',
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
      },
    ],
  ],
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API,
    eas: {
      projectId: '2696ad3b-d955-4a7c-8fd5-79a17a0b5b91',
    },
  },
});
