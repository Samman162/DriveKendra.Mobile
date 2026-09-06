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
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'Allow Drive Kendra to use your location for vehicle pickup, drop-off, and emergency SOS assistance.',
      NSPhotoLibraryUsageDescription:
        'Allow Drive Kendra to access your photos to upload driver license and identity verification documents.',
      NSCameraUsageDescription:
        'Allow Drive Kendra to access your camera to capture driver license and identity documents.',
      NSFaceIDUsageDescription:
        'Allow Drive Kendra to use Face ID for fast and secure biometric login.',
    },
  },
  android: {
    package: 'com.drivekendra.app',
    adaptiveIcon: {
      backgroundColor: '#0F172A',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'CAMERA',
      'READ_MEDIA_IMAGES',
      'READ_EXTERNAL_STORAGE',
      'VIBRATE',
      'USE_BIOMETRIC',
      'USE_FINGERPRINT',
    ],
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
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Allow Drive Kendra to use your location for vehicle pickup, drop-off, and emergency SOS assistance.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'Allow Drive Kendra to access your photos to upload driver license and identity verification documents.',
        cameraPermission:
          'Allow Drive Kendra to access your camera to capture driver license and identity documents.',
        microphonePermission: false,
      },
    ],
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
